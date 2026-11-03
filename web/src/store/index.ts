import { configureStore } from "@reduxjs/toolkit";
import { uiReducer } from "./uiSlice";

// The single Redux store. Each feature of client state adds one reducer here.
// configureStore also wires up Redux DevTools and development-time checks (e.g. it warns if
// non-serialisable values or accidental mutations sneak into state).
export const store = configureStore({
  reducer: { ui: uiReducer },
});

// Types derived from the store, used by the typed hooks in store/hooks.ts.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
