import "react-router";

declare module "react-router" {
  interface AppLoadContext {
    CMS_BASE_URL: string;
    CMS_MEDIA_URL: string;
  }
}
