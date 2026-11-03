import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import UnAuthenticatedLayout from "@/layouts/UnAuthenticatedLayout";
import NotFound from "@/pages/NotFound";

// ALL ROUTES LIVE HERE. The URL decides which component renders (not a state variable), so every page has a real,
// bookmarkable, back-button-friendly address. Nesting <Route>s = nesting layouts: a <Route> without a `path` is a
// "layout route" - it contributes a wrapper (guard + shell) but no URL segment, and draws its children where its
// layout renders <Outlet />.
//
// Adding a page = one `lazy(...)` line + one <Route> line below. The right guard and layout apply automatically.

// REACT.LAZY - "load this page's code only when it is first needed".
//   A normal `import Orders from "./pages/Orders"` puts the page's code into the single JavaScript file every
//   visitor downloads on first load. With lazy(), the bundler cuts each page into its own small file, and the
//   browser fetches it the first time the user opens that page. `lazy` takes a function returning `import(...)`
//   (a promise of the module) and requires the page to be a DEFAULT export, which every page is.
//   WHY IT MATTERS AS THE APP GROWS: without it, the first load (even just the login screen) downloads the code of
//   every page, and gets slower with each page you add.
//   WHAT IT NEEDS: a <Suspense fallback> above the lazy components, shown while a page downloads. The layouts
//   provide it. (Small, always-needed pieces like NotFound and the layouts stay as normal imports.)
//   IF YOU PREFER SIMPLE: replace a `lazy(() => import(x))` line with a normal `import X from x`. Nothing else changes.
const Login = lazy(() => import("@/pages/login/Login"));
const Register = lazy(() => import("@/pages/register/Register"));
const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const OrdersList = lazy(() => import("@/pages/orders/OrdersList"));
const CreateOrder = lazy(() => import("@/pages/orders/CreateOrder"));
const EditOrder = lazy(() => import("@/pages/orders/EditOrder"));

export default function App() {
  return (
    // ErrorBoundary: a crash anywhere below shows a "reload" screen instead of a blank page.
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Logged-OUT pages: centred card. Logged-in users are redirected away from these. */}
          <Route element={<UnAuthenticatedLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>

          {/* Logged-IN pages: header + footer. Logged-out visitors are redirected to /login. */}
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            {/* Nested route: "orders" + index = /orders, "new" = /orders/new, ":id/edit" = /orders/7/edit
                (:id is a URL parameter). React Router ranks the literal "new" above ":id", so "new" is never
                mistaken for an order id. */}
            <Route path="orders">
              <Route index element={<OrdersList />} />
              <Route path="new" element={<CreateOrder />} />
              <Route path=":id/edit" element={<EditOrder />} />
            </Route>
          </Route>

          {/* Anything that matched nothing above. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
