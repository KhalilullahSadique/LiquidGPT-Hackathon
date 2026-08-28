import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const SERVER_ONLY_KEYS = ["GEMINI_API_KEY", "OPENROUTER_API_KEY", "ALLOWED_ORIGINS"];

/**
 * Vercel runs everything in `api/` as a serverless function in production, but `vite dev`
 * does not — without this, /api/chat 404s locally and the app only works once deployed.
 * This mounts the exact same handler on the dev server, so local and production run
 * identical code.
 */
const devApiPlugin = (env) => ({
  name: "liquidgpt-dev-api",
  apply: "serve",
  configureServer(server) {
    // These have no VITE_ prefix, so Vite never exposes them to the browser. Loading them
    // here makes them visible to the handler, which runs in Node.
    for (const key of SERVER_ONLY_KEYS) {
      if (env[key]) process.env[key] = env[key];
    }

    server.middlewares.use("/api/chat", async (req, res, next) => {
      try {
        const { default: handler } = await server.ssrLoadModule("/api/chat.js");
        await handler(req, res);
      } catch (error) {
        server.config.logger.error(`[api/chat] ${error?.stack ?? error}`);
        next(error);
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  // The empty prefix loads every variable from .env, not just the VITE_ ones.
  const env = loadEnv(mode, process.cwd(), "");
  return { plugins: [react(), tailwindcss(), devApiPlugin(env)] };
});
