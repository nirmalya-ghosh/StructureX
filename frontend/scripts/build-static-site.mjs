import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "dist");
const staticOutput = join(output, "static");
const staticFiles = ["app.js", "index.css", "auth.js", "auth.css"];

await rm(output, { recursive: true, force: true });
await mkdir(staticOutput, { recursive: true });

await cp(join(root, "index.html"), join(output, "index.html"));
await cp(join(root, "auth.html"), join(output, "auth.html"));

for (const file of staticFiles) {
  await cp(join(root, file), join(staticOutput, file));
}
