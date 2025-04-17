import * as Sentry from "@sentry/react";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const isProduction = window.location.hostname === "www.gangazido.com";

if (isProduction) {
  Sentry.init({
    dsn: "https://3cf3be6e70f8e27208fe64b361fe341d@o4509066231611392.ingest.us.sentry.io/4509066245636096",
    environment: "production",
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
    sendDefaultPii: true,
  });
} else {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DEV_DSN_ZUSTAND,
    environment: "development",
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
  });

}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={<p>에러가 발생했습니다. 잠시 후 다시 시도해주세요.</p>}
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
