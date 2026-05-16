output "vercel_project_id" {
  value       = vercel_project.wapi.id
  description = "Vercel project id."
}

output "vercel_project_name" {
  value       = vercel_project.wapi.name
  description = "Vercel project name."
}

// R2 bucket output is added back when R2 is enabled — see cloudflare.tf.
