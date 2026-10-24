// Builds the static site and copies it to ../king (the folder GitHub Pages serves).
import { spawnSync } from "node:child_process";
import { cpSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, "..");
const target = resolve(app, "..", "king");

const r = spawnSync("npx", ["next", "build"], { cwd: app, stdio: "inherit", shell: true, env: { ...process.env, PAGES: "1" } });
if (r.status !== 0) process.exit(r.status ?? 1);

rmSync(target, { recursive: true, force: true });
cpSync(resolve(app, "out"), target, { recursive: true });
writeFileSync(resolve(target, ".nojekyll"), "");
console.log(`\nPublished to ${target}\nLive at https://a-hazzard.github.io/orbit-royale/king/ once merged to main.`);
