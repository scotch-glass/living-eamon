import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // ── Wardrobe Engine · boundary enforcement ─────────────────────
  // Outside lib/wardrobe/ and components/Paperdoll/, only the public
  // barrel `lib/wardrobe` is importable — internal modules stay
  // private so consumers can't bind to the pipeline's internals.
  {
    files: ["**/*.{ts,tsx}"],
    ignores: [
      "lib/wardrobe/**",
      "components/Paperdoll/**",
      "app/api/wardrobe/**",
      "app/wardrobe-lab/**",
      "scripts/wardrobe/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/lib/wardrobe/*", "**/lib/wardrobe/**/*"],
              message:
                "Import from the barrel `lib/wardrobe` (via the public API), not from internal modules.",
            },
          ],
        },
      ],
    },
  },
  // Inside lib/wardrobe/: the module must stay decoupled from the
  // rest of the app. No pulling in gameEngine, combatEngine, or
  // the app/ tree — those are consumers, not dependencies.
  {
    files: ["lib/wardrobe/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/lib/gameEngine",
                "**/lib/combatEngine",
                "**/lib/gameState",
                "**/app/**",
              ],
              message:
                "lib/wardrobe/* must not depend on the game engine or app/ tree. Keep it pure + consumable.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
