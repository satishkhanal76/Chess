import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, "js/classes"), path.join(output, "classes"), {
  recursive: true,
});
await cp(path.join(root, "src/index.js"), path.join(output, "index.js"));
