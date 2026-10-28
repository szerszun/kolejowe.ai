import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "maplibre-gl/dist/maplibre-gl.css";
import "./index.css";
import { I18nProvider } from "./i18n/I18nContext";
import App from "./App.tsx";
import { initMonitoring, reportError } from "./lib/monitoring";

initMonitoring();

createRoot(document.getElementById("root")!, {
  // React 19 sends render errors here instead of to window.onerror, so Sentry's global
  // handlers would never see them. Passing these replaces React's default console
  // logging, hence the console.error.
  onUncaughtError: (error, info) => {
    console.error(error, info.componentStack);
    reportError(error);
  },
  onCaughtError: (error, info) => {
    console.error(error, info.componentStack);
    reportError(error);
  },
}).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <App />
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
);
