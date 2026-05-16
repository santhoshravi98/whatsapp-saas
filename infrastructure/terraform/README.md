# Terraform — WAPI infrastructure

Manages everything that **can** be managed as code. Some services do not have
mature Terraform providers; those are documented as manual steps.

## What is in Terraform

- **Vercel** project, domain, and environment variables (production + preview).
- **Cloudflare R2** bucket (optional, for WhatsApp media). Comment out if unused.

## What is NOT in Terraform

| Service                  | Why                                              | How to provision                                    |
|--------------------------|--------------------------------------------------|-----------------------------------------------------|
| Meta WhatsApp Business   | No Terraform provider                            | See [../docs/setup-meta.md](../docs/setup-meta.md)  |
| Supabase project         | Requires paid org for provider; free tier is UI  | https://supabase.com — copy URL + service role key  |
| Upstash QStash           | No Terraform resource for QStash specifically    | https://console.upstash.com/qstash — copy tokens    |
| Anthropic API key        | Issued in console only                           | https://console.anthropic.com                       |
| Sentry project           | Has a provider but not worth the overhead for one project | https://sentry.io — copy DSN          |

Once you've provisioned the manual pieces and have all the secrets, put them
in `terraform.tfvars` (copy from `terraform.tfvars.example`) and run:

```bash
terraform init
terraform apply
```

Terraform pushes those secrets into Vercel as environment variables so the
deployed app can read them. `terraform.tfvars` is gitignored — keep it local
or store it in a secrets manager (1Password, Doppler, AWS SSM).

## State

State is local by default. For team use, switch to a remote backend (Terraform
Cloud, S3, or Supabase storage) — see [providers.tf](providers.tf).
