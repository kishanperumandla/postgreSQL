import { createSlice } from "@reduxjs/toolkit";

// REDUX = CLIENT/UI STATE ONLY. Nothing that comes from the API belongs here: orders and the logged-in
// user live in the TanStack Query cache, which already handles caching, refetching and invalidation.
// Copying server data into Redux creates two sources of truth that drift apart.
//
// What is genuinely client-only and shared between distant components? Whether the mobile nav menu is
// open: the toggle button (Header) and the links that close it (Navbar) both need it. That is the whole
// slice for now. It is intentionally tiny - this is the pattern; add UI preferences (theme, table density...)
// here as the app grows. If it stays this small, plain useState/Context would also have been enough.
type UiState = {
  mobileNavOpen: boolean;
};

const initialState: UiState = { mobileNavOpen: false };

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // Redux Toolkit uses Immer, so "mutating" `state` here is safe: it produces a new immutable state.
    toggleMobileNav(state) {
      state.mobileNavOpen = !state.mobileNavOpen;
    },
    closeMobileNav(state) {
      state.mobileNavOpen = false;
    },
  },
});

export const { toggleMobileNav, closeMobileNav } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
