import { readFile, writeFile, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { compile } from "../src/freemarker";
import { Layout } from "../src/layout";
import { SignIn, Otp, ResetPassword, Info } from "../src/pages";
import { BinaryWordmark } from "../src/components";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const library = dirname(require.resolve("@flatwork-ui/react/package.json"));
const assets = resolve(library, "dist/styles/flatwork-saas");
// Keycloak's resource prefix does not change with a ConfigMap rollout. Bust
// cached CSS/JS by content so returning visitors never combine old/new assets.
const assetVersion = createHash('sha256')
  .update(await readFile(resolve(assets, 'flatwork-saas.css')))
  .update(await readFile(resolve(root, 'src/auth.css')))
  .update(await readFile(resolve(root, 'src/auth.js')))
  .digest('hex').slice(0, 12);
for (const [file, element] of Object.entries({
  "template.ftl": <Layout assetVersion={assetVersion} />,
  "login.ftl": <SignIn />,
  "login-otp.ftl": <Otp />,
  "login-reset-password.ftl": <ResetPassword />,
  "info.ftl": <Info />,
  "binary.ftl": <BinaryWordmark />,
})) {
  await writeFile(resolve(root, file), compile(element));
}
// Use the published library stylesheet, not a parallel copy of its components.
// Small authored SVGs match the supplied handoff; its 550KB icon font is unused.
const css = (await readFile(resolve(assets, "flatwork-saas.css"), "utf8"))
  .replace(/@font-face\s*\{[^}]*Material Symbols Rounded[^}]*\}\s*/g, "")
  .replaceAll('./fonts/', '../fonts/');
await writeFile(resolve(root, "flatwork.css"), "/* Generated from @flatwork-ui/react. */\n" + css);
for (const font of ["geist-400", "geist-500", "geist-600", "plex-mono-400"]) {
  await copyFile(resolve(assets, `fonts/${font}.woff2`), resolve(root, `${font}.woff2`));
}
await copyFile(resolve(root, "src/auth.css"), resolve(root, "auth.css"));
await copyFile(resolve(root, "src/auth.js"), resolve(root, "auth.js"));
console.log("Built Flatwork React components → Keycloak templates, CSS, JS and local fonts.");
