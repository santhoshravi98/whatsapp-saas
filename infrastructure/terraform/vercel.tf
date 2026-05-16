// ─── Vercel project ──────────────────────────────────────────────────────────
//
// All env vars target "production" and "preview". For local dev, use .env.local
// — Terraform deliberately does NOT manage that file.

resource "vercel_project" "wapi" {
  name      = var.project_name
  framework = "nextjs"

  // Link the git repo if one was provided. Skipping (null) is fine —
  // `vercel` CLI deploys still work without a linked repo.
  git_repository = var.git_repository == "" ? null : {
    type = "github"
    repo = var.git_repository
  }
}

locals {
  // One map → many vercel_project_environment_variable resources.
  // Keep the names identical to .env.example.
  env_vars = {
    APP_BASE_URL                = { value = var.app_base_url,                sensitive = false }
    META_APP_SECRET             = { value = var.meta_app_secret,             sensitive = true  }
    META_VERIFY_TOKEN           = { value = var.meta_verify_token,           sensitive = true  }
    META_PHONE_NUMBER_ID        = { value = var.meta_phone_number_id,        sensitive = false }
    META_ACCESS_TOKEN           = { value = var.meta_access_token,           sensitive = true  }
    META_GRAPH_API_VERSION      = { value = var.meta_graph_api_version,      sensitive = false }
    SUPABASE_URL                = { value = var.supabase_url,                sensitive = false }
    SUPABASE_SERVICE_ROLE_KEY   = { value = var.supabase_service_role_key,   sensitive = true  }
    NEXT_PUBLIC_SUPABASE_URL    = { value = var.supabase_url,                sensitive = false }
    NEXT_PUBLIC_SUPABASE_ANON_KEY = { value = var.supabase_anon_key,         sensitive = true  }
    QSTASH_TOKEN                = { value = var.qstash_token,                sensitive = true  }
    QSTASH_CURRENT_SIGNING_KEY  = { value = var.qstash_current_signing_key,  sensitive = true  }
    QSTASH_NEXT_SIGNING_KEY     = { value = var.qstash_next_signing_key,     sensitive = true  }
    ANTHROPIC_API_KEY           = { value = var.anthropic_api_key,           sensitive = true  }
    ANTHROPIC_MODEL             = { value = var.anthropic_model,             sensitive = false }
    SENTRY_DSN                  = { value = var.sentry_dsn,                  sensitive = true  }
  }
}

resource "vercel_project_environment_variable" "envs" {
  for_each   = local.env_vars
  project_id = vercel_project.wapi.id
  key        = each.key
  value      = each.value.value
  sensitive  = each.value.sensitive
  target     = ["production", "preview"]
}
