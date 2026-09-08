import compression from "compression";
import express from "express";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
import { createRequestHandler } from "@react-router/express";

const DEVELOPMENT = process.env.NODE_ENV === "development";
const PORT = Number.parseInt(process.env.PORT || "3000");
const CMS_URL = process.env.CMS_BASE_URL || "https://localhost:44339";

const app = express();
// Only compress in dev — in production IIS/ARR handles compression.
// Double-compression causes 502 errors in the browser.
if (DEVELOPMENT) app.use(compression());
app.disable("x-powered-by");

// Proxy Umbraco API, custom API, and media to the .NET backend.
// Use pathFilter (not Express mount) so the full URL path is preserved.
app.use(
  createProxyMiddleware({
    target: CMS_URL,
    changeOrigin: true,
    secure: false,
    pathFilter: ["/umbraco", "/api", "/media"],
  })
);

if (DEVELOPMENT) {
  const vite = await import("vite");
  const viteDevServer = await vite.createServer({
    server: { middlewareMode: true },
  });
  app.use(viteDevServer.middlewares);
  app.use(async (req, res, next) => {
    try {
      const source = await viteDevServer.ssrLoadModule("./server/app.ts");
      return await source.app(req, res, next);
    } catch (error) {
      if (error instanceof Error) viteDevServer.ssrFixStacktrace(error);
      next(error);
    }
  });
} else {
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
  app.use(express.static("build/client", { maxAge: "1h" }));
  app.use(morgan("tiny"));
  app.use(
    createRequestHandler({
      build: () => import("./build/server/index.js"),
      getLoadContext() {
        return {
          CMS_BASE_URL: CMS_URL,
          CMS_MEDIA_URL: process.env.CMS_MEDIA_URL || CMS_URL,
        };
      },
    })
  );
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
