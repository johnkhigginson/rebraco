import "react-router";
import { createRequestHandler } from "@react-router/express";
import express from "express";

declare module "react-router" {
  interface AppLoadContext {
    CMS_BASE_URL: string;
    CMS_MEDIA_URL: string;
  }
}

export const app = express();

app.use(
  createRequestHandler({
    // @ts-expect-error - virtual module resolved by Vite
    build: () => import("virtual:react-router/server-build"),
    getLoadContext() {
      return {
        CMS_BASE_URL: process.env.CMS_BASE_URL || "https://localhost:44339",
        CMS_MEDIA_URL: process.env.CMS_MEDIA_URL || process.env.CMS_BASE_URL || "https://localhost:44339",
      };
    },
  })
);
