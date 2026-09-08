import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { OpenAPI } from "./api/umbraco";
import "./index.css";

// Set API base for client-side ContentService calls (blog pagination, etc.)
OpenAPI.BASE = import.meta.env.VITE_CMS_BASE_URL || "";

hydrateRoot(
  document,
  <StrictMode>
    <HydratedRouter />
  </StrictMode>
);
