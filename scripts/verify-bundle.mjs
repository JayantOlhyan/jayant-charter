import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const staticDir = path.join(root, ".next", "static");
const publicDir = path.join(root, "public");

const FORBIDDEN_BUNDLE_PATTERNS = [/\bsumit\b/i, /\btransworld\b/i];
const FORBIDDEN_PUBLIC_EXTENSIONS = [".blend", ".blend1", ".zip"];

const violations = [];

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, callback);
    } else {
      callback(full);
    }
  }
}

// 1. Ensure no source Blender files or raw handoff ZIPs exist in public/
walk(publicDir, (file) => {
  const lower = file.toLowerCase();
  for (const ext of FORBIDDEN_PUBLIC_EXTENSIONS) {
    if (lower.endsWith(ext)) {
      violations.push(`Forbidden source/archive file in public/: ${path.relative(root, file)}`);
    }
  }
});

// 2. Scan client-delivered .next/static JS/CSS chunks for private internal names or source maps
walk(staticDir, (file) => {
  if (file.endsWith(".map")) {
    violations.push(`Client source map found in production static output: ${path.relative(root, file)}`);
    return;
  }
  if (file.endsWith(".js") || file.endsWith(".css")) {
    const content = fs.readFileSync(file, "utf8");
    for (const pattern of FORBIDDEN_BUNDLE_PATTERNS) {
      if (pattern.test(content)) {
        violations.push(`Forbidden private term (${pattern}) leaked in client chunk: ${path.relative(root, file)}`);
      }
    }
  }
});

if (violations.length > 0) {
  console.error("Production bundle verification FAILED:");
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log("Production bundle verification PASSED (zero private leakage, zero source maps, zero source archives in public/).");
