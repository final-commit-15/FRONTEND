import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initializeAuth } from "./store/authStore";
import { registerSW } from "virtual:pwa-register";

import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProviderProvider } from "./context/ProviderContext";
import { ToastProvider } from "./components/feedback/ToastProvider";
import "./index.css";

const queryClient = new QueryClient();

initializeAuth();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      if (confirm('New content available. Reload?')) {
        window.location.reload();
      }
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ProviderProvider>
          <App />
          <ToastProvider />
        </ProviderProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);