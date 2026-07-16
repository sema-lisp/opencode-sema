import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

if (process.env.OPENCODE_NO_THEME_COPY) {
  process.exit(0);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const themeSource = join(__dirname, "..", "themes", "sema.json");

// OpenCode resolves its config dir via xdg-basedir on every OS (Windows/macOS
// included) — i.e. $XDG_CONFIG_HOME/opencode, else ~/.config/opencode. Mirror
// that here so the theme lands where OpenCode actually looks.
const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
const themeDir = join(configHome, "opencode", "themes");
const themeDest = join(themeDir, "sema.json");

// Best-effort: a failed theme copy (read-only $HOME, EACCES, missing HOME)
// must never fail `npm install`. Fall back to the documented manual `cp`.
try {
  if (!existsSync(themeDest)) {
    mkdirSync(themeDir, { recursive: true });
    copyFileSync(themeSource, themeDest);
    console.log(`opencode-sema: installed Sema theme to ${themeDest}`);
  }
} catch (err) {
  console.warn(
    `opencode-sema: could not copy the Sema theme (${err.message}). ` +
      "Copy it manually: cp themes/sema.json ~/.config/opencode/themes/sema.json",
  );
}
