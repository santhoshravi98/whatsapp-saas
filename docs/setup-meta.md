# Meta WhatsApp Business — one-time setup

There is no Terraform provider for Meta's developer console. This is the
manual checklist.

## 1. Create the app

1. https://developers.facebook.com/apps → **Create App** → **Business**.
2. Add the **WhatsApp** product to the app.
3. Note the **App ID** and **App Secret** (Settings → Basic).
   → `META_APP_SECRET`.

## 2. Pick a phone number

Meta gives you a free test number by default. For production you need a number
that is not already on WhatsApp consumer, verified via the Business Manager.

From WhatsApp → API Setup, copy the **Phone number ID** (NOT the phone number
itself). → `META_PHONE_NUMBER_ID`.

## 3. Get a permanent access token

The short-lived token in the dashboard expires in ~24h. For production use a
**system user** token:

1. Business Settings → Users → System Users → **Add** (any name, role: Admin).
2. **Assign Assets** → select your WhatsApp Business Account → grant **Full
   control**.
3. **Generate New Token** → select your app → permissions
   `whatsapp_business_messaging` + `whatsapp_business_management`.
4. Choose **Never expire**. Copy the token. → `META_ACCESS_TOKEN`.

## 4. Webhook configuration

1. WhatsApp → Configuration → Webhook → **Edit**.
2. **Callback URL**: `https://<your-app>/api/webhook`
3. **Verify token**: any random string you make up.
   → put the same string in `META_VERIFY_TOKEN`.
4. Click **Verify and save** — Meta will GET your endpoint with `hub.challenge`;
   our handler echoes it back.
5. Under **Webhook fields**, subscribe to **messages** (at minimum).

## 5. Test number recipients

Until you publish the app, only test numbers you've added explicitly can
message your bot. WhatsApp → API Setup → **To** → add recipients.

## 6. Going to production

- Submit the app for review (only needed for advanced permissions; basic
  messaging works without).
- Add real opt-in flows — WhatsApp policy requires user consent before
  business-initiated conversation.
- Move from the test number to a verified business number.
