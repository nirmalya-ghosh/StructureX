import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "..", "StructureX", "frontend");
const output = join(root, "dist");
const staticOutput = join(output, "static");

await rm(output, { recursive: true, force: true });
await mkdir(staticOutput, { recursive: true });

await cp(join(source, "index.html"), join(output, "index.html"));
await cp(join(source, "auth.html"), join(output, "auth.html"));

const files = await readdir(source, { withFileTypes: true });
for (const file of files) {
  if (!file.isFile() || file.name.endsWith(".html")) {
    continue;
  }

  await cp(join(source, file.name), join(staticOutput, file.name));
}
