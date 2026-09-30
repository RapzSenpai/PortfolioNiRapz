import js from "@eslint/js"
import prettier from "eslint-config-prettier"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    // shadcn components export their cva variant maps alongside the
    // component, which react-refresh flags. The rule is wrong for this
    // directory, not for any one file: every generated component with
    // variants trips it, and `shadcn add` overwrites local edits.
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  // Must stay last. Turns off every stylistic rule so Prettier owns
  // formatting and ESLint owns correctness. Anything added after this
  // line would reintroduce the conflict it exists to prevent.
  prettier,
])
