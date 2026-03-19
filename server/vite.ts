// server/src/vite-setup.ts

import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger, type ViteDevServer } from "vite";
import type { Server } from "http";
const nanoid = () => Math.random().toString(36).slice(2);
import { fileURLToPath } from "url";

// Derive __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vite’s built-in logger (we’ll override error to exit on failure)
const viteLogger = createLogger();

/**
 * Simple timestamped logger
 */
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Mount Vite’s dev middleware into our Express app.
 * @param app  Your Express application
 * @param server  The underlying HTTP server (for HMR websocket)
 */
export async function setupVite(app: Express, server: Server) {
  const vite = (await createViteServer({
    // point Vite at your client directory
    root: path.resolve(__dirname, "../client"),
    configFile: false,
    logLevel: "info",
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true,
    },
    appType: "custom",
    customLogger: {
      ...viteLogger,
      error: (msg, opts) => {
        viteLogger.error(msg, opts);
        process.exit(1);
      },
    },
  })) as ViteDevServer;

  // use Vite’s own middleware
  app.use(vite.middlewares);

  // For any other route, serve the transformed index.html
  app.use("*", async (req, res, next) => {
    try {
      const indexPath = path.resolve(__dirname, "../client/index.html");
      let template = await fs.promises.readFile(indexPath, "utf-8");
      // append a cache-busting query so HMR reloads your main.tsx import
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).type("text/html").send(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

/**
 * Serve a production build from /server/public
 */
export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(`Build directory not found: ${distPath}. Please build the client first.`);
  }

  // Static assets
  app.use(express.static(distPath));

  // SPA fallback: always serve index.html
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
