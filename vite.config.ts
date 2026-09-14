// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// Publishable Supabase connection details for the existing Lovable Cloud
// backend. These are NOT secrets — they are the anon/publishable values the
// browser needs to talk to Supabase, and RLS enforces all access. They are
// baked in as build-time fallbacks because deployment uploaders (e.g. the
// Vercel CLI) skip .env files, leaving the production bundle without them.
// Environment variables with the same names always take precedence.
const SUPABASE_URL_FALLBACK = "https://zuivljcbyjckkrqyiznr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY_FALLBACK =
  "sb_publishable_cBVNA2usrq2H713DbLQBuA_21I9cJSu";

export default defineConfig(({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ??
    env.VITE_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    env.SUPABASE_URL ??
    SUPABASE_URL_FALLBACK;
  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    env.SUPABASE_PUBLISHABLE_KEY ??
    SUPABASE_PUBLISHABLE_KEY_FALLBACK;

  return {
    tanstackStart: {
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      // nitro/vite builds from this
      server: { entry: "server" },
    },
    vite: {
      // maplibre-gl ships its own web worker; pre-bundling drops the worker chunk
      optimizeDeps: { exclude: ["maplibre-gl"] },
      define: {
        "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
        "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY":
          JSON.stringify(supabaseKey),
      },
    },
  };
});
