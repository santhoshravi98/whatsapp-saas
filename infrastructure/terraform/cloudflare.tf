// ─── Cloudflare R2 bucket (disabled by default) ──────────────────────────
//
// To enable WhatsApp media storage:
//   1. Add the cloudflare provider back to providers.tf:
//        cloudflare = { source = "cloudflare/cloudflare", version = "~> 4.40" }
//      and re-add the provider block with `api_token = var.cloudflare_api_token`.
//   2. Set `create_r2_bucket = true` in terraform.tfvars.
//   3. Uncomment the resource below.
//
// resource "cloudflare_r2_bucket" "media" {
//   count      = var.create_r2_bucket ? 1 : 0
//   account_id = var.cloudflare_account_id
//   name       = "${var.project_name}-media"
//   location   = "ENAM"
// }
