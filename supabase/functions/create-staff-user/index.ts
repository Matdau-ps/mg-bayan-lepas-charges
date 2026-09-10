// Supabase Edge Function: create-staff-user
// Lets a branch admin create a staff login for THEIR branch only,
// without ever exposing the service_role key to the browser.
//
// Deploy with the Supabase CLI:
//   supabase functions deploy create-staff-user
//
// Called from the app like:
//   const { data, error } = await sb.functions.invoke('create-staff-user', {
//     body: { email, password, full_name, branch_id /* super_admin only */ }
//   })

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization') ?? ''

    // Client scoped to the CALLER's own token — used only to verify who they are
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: caller }, error: authErr } = await callerClient.auth.getUser()
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    // Admin client — only ever used server-side, never sent to the browser
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: callerProfile, error: profileErr } = await adminClient
      .from('profiles')
      .select('role, branch_id')
      .eq('id', caller.id)
      .single()

    if (profileErr || !callerProfile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 403 })
    }

    const isSuperAdmin = callerProfile.role === 'super_admin'
    const isBranchAdmin = callerProfile.role === 'admin'

    if (!isSuperAdmin && !isBranchAdmin) {
      return new Response(JSON.stringify({ error: 'Only admins can add staff' }), { status: 403 })
    }

    const body = await req.json()
    const { email, password, full_name, role } = body

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400 })
    }

    // A branch admin can ONLY create users in their own branch,
    // regardless of what branch_id they pass in the request.
    // Super admin may target any branch by passing branch_id explicitly.
    const targetBranchId = isSuperAdmin
      ? (body.branch_id ?? callerProfile.branch_id)
      : callerProfile.branch_id

    const targetRole = isSuperAdmin ? (role ?? 'staff') : 'staff' // branch admins can't mint other admins

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message ?? 'Could not create user' }), { status: 400 })
    }

    const { error: insertErr } = await adminClient.from('profiles').insert({
      id: created.user.id,
      role: targetRole,
      branch_id: targetBranchId,
      full_name: full_name ?? null,
      password_setup_complete: true
    })

    if (insertErr) {
      // Roll back the auth user so we don't leave an orphaned login
      await adminClient.auth.admin.deleteUser(created.user.id)
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 400 })
    }

    return new Response(JSON.stringify({ ok: true, user_id: created.user.id }), { status: 200 })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
})
