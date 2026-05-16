// ─── Project meta ────────────────────────────────────────────────────────────
variable "project_name" {
  description = "Name used for the Vercel project and tags."
  type        = string
  default     = "wapi"
}

variable "app_base_url" {
  description = "Public URL where the app is served. Used by QStash to call back into the worker route."
  type        = string
}

// ─── Vercel ──────────────────────────────────────────────────────────────────
variable "vercel_api_token" {
  description = "Vercel personal or team access token. https://vercel.com/account/tokens"
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Vercel team id. Leave empty for a personal account."
  type        = string
  default     = ""
}

variable "git_repository" {
  description = "GitHub repo in 'owner/name' form. Leave empty to skip git linking and deploy via CLI only."
  type        = string
  default     = ""
}

// ─── Cloudflare (R2) ─────────────────────────────────────────────────────────
variable "cloudflare_api_token" {
  description = "Cloudflare API token with R2 Edit permission. Leave empty to skip R2 provisioning."
  type        = string
  default     = ""
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account id. Required if creating R2 bucket."
  type        = string
  default     = ""
}

variable "create_r2_bucket" {
  description = "Whether to create an R2 bucket for WhatsApp media."
  type        = bool
  default     = false
}

// ─── Secrets — pushed into Vercel as env vars ────────────────────────────────
// Sensitive. Place in terraform.tfvars (gitignored) or pull from a secrets manager.

variable "meta_app_secret" {
  type      = string
  sensitive = true
}
variable "meta_verify_token" {
  type      = string
  sensitive = true
}
variable "meta_phone_number_id" {
  type = string
}
variable "meta_access_token" {
  type      = string
  sensitive = true
}
variable "meta_graph_api_version" {
  type    = string
  default = "v21.0"
}

variable "supabase_url" {
  type = string
}
variable "supabase_service_role_key" {
  type      = string
  sensitive = true
}
variable "supabase_anon_key" {
  type      = string
  sensitive = true
}

variable "qstash_token" {
  type      = string
  sensitive = true
}
variable "qstash_current_signing_key" {
  type      = string
  sensitive = true
}
variable "qstash_next_signing_key" {
  type      = string
  sensitive = true
}

variable "anthropic_api_key" {
  type      = string
  sensitive = true
}
variable "anthropic_model" {
  type    = string
  default = "claude-haiku-4-5-20251001"
}

variable "sentry_dsn" {
  type    = string
  default = ""
}
