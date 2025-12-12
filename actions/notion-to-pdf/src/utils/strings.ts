export function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]+/g, " ")      // replace forbidden with space
    .trim()                              // trim ends
    .replace(/\s+/g, "-")                // collapse any whitespace to single hyphen
    .replace(/-+/g, "-")                 // collapse multiple hyphens
    .replace(/^-|-$/g, "");              // remove leading/trailing hyphens
}


