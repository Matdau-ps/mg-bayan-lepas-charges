# Account Settings + Cloudflare Turnstile Setup

The website code is already prepared for:
- Settings tab for all signed-in users
- Change email
- Change password (requires current password)
- Forgot password / password recovery
- Cloudflare Turnstile on login and password-reset requests

## 1. Cloudflare Turnstile

1. Open Cloudflare Dashboard and create a Turnstile widget.
2. Add the hostname: `minty-green.github.io`
3. Copy the **Site Key**.
4. In `index.html`, find:

   `const TURNSTILE_SITE_KEY = 'PASTE_TURNSTILE_SITE_KEY_HERE';`

   Replace only the placeholder with the Site Key.
5. Keep the **Secret Key private**. Never put it in `index.html` or GitHub.

## 2. Supabase CAPTCHA Protection

After the new website file containing your Turnstile Site Key is live:

1. Supabase Dashboard -> Authentication -> Bot and Abuse Protection.
2. Enable CAPTCHA protection.
3. Choose **Cloudflare Turnstile**.
4. Paste the Turnstile **Secret Key** into Supabase and save.

Important: upload the website with the Site Key before enabling CAPTCHA in Supabase. Otherwise login can be blocked because the site cannot send a CAPTCHA token yet.

## 3. Supabase Redirect URL for Forgot Password

In Supabase Authentication URL / Redirect URL settings, make sure this URL is allowed:

`https://minty-green.github.io/Charges/`

The website uses its current page URL when requesting a password reset, so this allows the email recovery link to return to the Charges app.

## 4. Email Changes

The Settings tab uses Supabase Auth `updateUser()` for email changes. With Secure Email Change enabled, Supabase may require confirmation from both the current email and the new email before applying the change.

Your existing database trigger `sync_profile_email()` already synchronizes the confirmed Auth email into `public.profiles`, so no new SQL migration is required.

## 5. Password Changes

The Settings tab requires:
- Current password
- New password
- Confirmation of new password
- Minimum 8 characters in the website UI

The request uses Supabase's `current_password` field so the existing password is verified by Supabase before changing it.

## 6. Recommended Test Order

1. Upload the updated website but leave Supabase CAPTCHA disabled.
2. Log in as Admin and Staff and test Settings -> Change Password.
3. Test Settings -> Change Email using an account you can access.
4. Configure the Turnstile Site Key in `index.html` and upload again.
5. Confirm the Turnstile widget appears on the login page.
6. Enable Cloudflare Turnstile CAPTCHA in Supabase using the Secret Key.
7. Test login.
8. Test Forgot Password and the emailed recovery link.

## Security Note

Only the Turnstile **Site Key** belongs in website code. The **Secret Key** belongs only in Supabase's CAPTCHA configuration.
