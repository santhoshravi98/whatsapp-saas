terraform {
  required_version = ">= 1.6.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 2.0"
    }
    # Cloudflare provider is added back when you enable R2 media storage.
    # See terraform/cloudflare.tf and set create_r2_bucket = true.
  }

  # ────────────────────────────────────────────────────────────────────────
  # For solo dev: local state is fine. For a team, uncomment one of these.
  # ────────────────────────────────────────────────────────────────────────
  #
  # backend "remote" {
  #   organization = "your-tf-org"
  #   workspaces { name = "wapi" }
  # }
  #
  # backend "s3" {
  #   bucket = "your-tf-state"
  #   key    = "wapi/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "vercel" {
  api_token = var.vercel_api_token
  team      = var.vercel_team_id != "" ? var.vercel_team_id : null
}

