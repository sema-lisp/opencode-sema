import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

if (process.env.OPENCODE_NO_THEME_COPY) {
  process.exit(0);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const themeSource = join(__dirname, "..", "themes", "sema.json");
const themeDir = join(homedir(), ".config", "opencode", "themes");
const themeDest = join(themeDir, "sema.json");

if (!existsSync(themeDest)) {
  mkdirSync(themeDir, { recursive: true });
  copyFileSync(themeSource, themeDest);
  console.log("opencode-sema: installed Sema theme to ~/.config/opencode/themes/sema.json");
}
