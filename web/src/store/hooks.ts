import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./index";

// Use these instead of the plain react-redux hooks: they know our state/dispatch types, so
// `useAppSelector((s) => s.ui.mobileNavOpen)` is autocompleted and type-checked.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
