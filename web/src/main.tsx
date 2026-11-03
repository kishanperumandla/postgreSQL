import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import App from "./App.tsx";
import QueryDevtools from "./components/QueryDevtools.tsx";
import AuthProvider from "./contexts/authContext.tsx";
import { queryClient } from "./lib/queryClient.ts";
import { store } from "./store";
// The ONE global stylesheet entry (Sass). Imported once here; never add other global CSS files.
import "./styles/styles.scss";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("#root element not found in index.html");

// PROVIDERS - each one makes something available to every component below it, without passing props down.
// ORDER MATTERS: a provider can only use providers ABOVE it. AuthProvider calls useQuery, so it must sit inside
// QueryClientProvider; <App /> uses all of them.
//   Redux Provider      -> UI state (store/)
//   QueryClientProvider -> server data cache (lib/queryClient.ts)
//   AuthProvider        -> "who is logged in" (contexts/authContext.tsx)
// StrictMode (development only) deliberately renders components twice to expose side-effect bugs early.
createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
        {/* The container every toast.success()/toast.error() renders into. Mounted once. */}
        <Toaster position="top-right" richColors closeButton />
        <QueryDevtools />
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
);
