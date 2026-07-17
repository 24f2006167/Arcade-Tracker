/**
 * Converts a badge title into a URL-safe slug.
 * e.g. "Build Infrastructure with Terraform on Google Cloud" → "build-infrastructure-with-terraform-on-google-cloud"
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function unslugify(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
