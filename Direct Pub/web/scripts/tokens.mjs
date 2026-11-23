// Génère src/styles/tokens.css depuis replica/design/tokens.json et tokens.dark.json.
// Source unique des valeurs : ne jamais modifier tokens.css à la main.
// Usage : npm run tokens (lancé aussi avant dev et build).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const load = (f) => JSON.parse(readFileSync(resolve(root, "../replica/design", f), "utf8"));
const light = load("tokens.json");
const dark = load("tokens.dark.json");

const colorVars = (c) => Object.entries(c).map(([k, v]) => `  --dp-${k}: ${v};`).join("\n");
const px = (n) => `${n / 16}rem`;

const out = [];
out.push("/* Généré par scripts/tokens.mjs depuis replica/design/tokens*.json. Ne pas modifier. */");
out.push(`:root {\n${colorVars(light.color)}\n  color-scheme: light;\n}`);
out.push(`:root[data-theme="dark"] {\n${colorVars(dark.color)}\n  color-scheme: dark;\n}`);
out.push(`@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${colorVars(dark.color).replace(/^/gm, "  ")}\n    color-scheme: dark;\n  }\n}`);

const theme = [];
for (const k of Object.keys(light.color)) theme.push(`  --color-${k}: var(--dp-${k});`);
theme.push(`  --font-sans: var(--font-geist-sans), ${light.font.sans};`);
theme.push(`  --font-mono: var(--font-geist-mono), ${light.font.mono};`);
for (const [k, t] of Object.entries(light.type)) {
  theme.push(`  --text-${k}: ${px(t.size)};`);
  theme.push(`  --text-${k}--line-height: ${px(t.line)};`);
  theme.push(`  --text-${k}--font-weight: ${t.weight};`);
}
theme.push(`  --spacing: 0.25rem;`);
for (const [k, v] of Object.entries(light.radius)) theme.push(`  --radius-${k}: ${v === 999 ? "9999px" : px(v)};`);
for (const [k, v] of Object.entries(light.shadow)) theme.push(`  --shadow-${k}: ${v};`);
theme.push(`  --ease-dp: ${light.motion.ease};`);
theme.push(`  --duration-fast: ${light.motion.fast};`);
theme.push(`  --duration-base: ${light.motion.base};`);
for (const [k, v] of Object.entries(light.layout.breakpoints)) theme.push(`  --breakpoint-${k}: ${px(v)};`);
for (const k of ["header", "sidebar", "sidebar-collapsed", "content-max", "drawer", "modal-sm", "modal-md", "modal-lg"])
  theme.push(`  --size-${k}: ${px(light.layout[k])};`);
out.push(`@theme inline {\n${theme.join("\n")}\n}`);

writeFileSync(resolve(root, "src/styles/tokens.css"), out.join("\n\n") + "\n");
console.log("tokens.css généré");
