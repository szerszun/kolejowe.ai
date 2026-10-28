/**
 * Visitor analytics through Umami Cloud (cloud.umami.is), switched on only when
 * VITE_UMAMI_WEBSITE_ID is set at build time (Render's static-site env vars, see
 * render.yaml) -- local dev and CI builds never load it. Umami sets no cookies and stores
 * no IP addresses, so there's no consent banner to show. Its script follows React
 * Router's navigations itself (it watches the History API), so nothing here needs to
 * report page views.
 */
const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;

export const UMAMI_SCRIPT_URL = "https://cloud.umami.is/script.js";

export function initAnalytics(): void {
  if (!websiteId) return;
  const script = document.createElement("script");
  script.defer = true;
  script.src = UMAMI_SCRIPT_URL;
  script.dataset.websiteId = websiteId;
  document.head.appendChild(script);
}
