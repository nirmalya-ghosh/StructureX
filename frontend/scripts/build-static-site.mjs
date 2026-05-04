import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "dist");
const staticOutput = join(output, "static");

await rm(output, { recursive: true, force: true });
await mkdir(staticOutput, { recursive: true });

const files = await readdir(root, { withFileTypes: true });
for (const file of files) {
  if (!file.isFile()) {
    continue;
  }

  const destination = file.name.endsWith(".html") ? output : staticOutput;
  await cp(join(root, file.name), join(destination, file.name));
}
