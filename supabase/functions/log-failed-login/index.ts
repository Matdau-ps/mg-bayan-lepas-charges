import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@^2/cors";

const ALLOWED_ORIGINS = new Set([
  "https://minty-green.github.io",
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const origin = req.headers.get("origin") || "";
  if (!ALLOWED_ORIGINS.has(origin)) {
    return json({ error: "Origin not allowed" }, 403);
  }

  let body: { email?: unknown; reason?: unknown };

  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const email =
    typeof body.email === "string"
      ? body.email.trim().toLowerCase().slice(0, 254)
      : "";

  const reason =
    typeof body.reason === "string"
      ? body.reason.trim().slice(0, 180)
      : "Authentication failed";

  // Keep the endpoint limited to plausible email-shaped values.
  if (!email || !email.includes("@") || email.length < 5) {
    return json({ error: "Invalid email" }, 400);
  }

  // Use the server-side secret key. It never goes to the browser.
  const secretKeys = JSON.parse(
    Deno.env.get("SUPABASE_SECRET_KEYS") || "{}",
  );
  const secretKey =
    secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!secretKey) {
    console.error("No Supabase server secret is available.");
    return json({ error: "Server configuration error" }, 500);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    secretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  // Basic database-backed throttling by attempted email.
  // This is deliberately conservative: no more than 10 stored failures for
  // the same email address in a rolling 10-minute period.
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { count, error: countError } = await admin
    .from("login_activity")
    .select("id", { count: "exact", head: true })
    .eq("result", "FAILED")
    .eq("attempted_email", email)
    .gte("created_at", since);

  if (countError) {
    console.error("Throttle check failed:", countError.message);
    return json({ error: "Could not record activity" }, 500);
  }

  if ((count || 0) >= 10) {
    // Return success so the public endpoint does not reveal throttle details.
    return json({ ok: true });
  }

  const { error } = await admin
    .from("login_activity")
    .insert({
      attempted_email: email,
      user_id: null,
      result: "FAILED",
      failure_reason: reason || "Authentication failed",
    });

  if (error) {
    console.error("Failed login insert error:", error.message);
    return json({ error: "Could not record activity" }, 500);
  }

  return json({ ok: true });
});
