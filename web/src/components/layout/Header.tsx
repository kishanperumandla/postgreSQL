import { Link, NavLink } from "react-router";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeMobileNav, toggleMobileNav } from "@/store/uiSlice";

// Top bar of the logged-in app: brand, navigation, current user and logout.
export function Header() {
  const { user, logout, isLoggingOut } = useAuth();
  const dispatch = useAppDispatch();
  // Reads the Redux UI slice: the one piece of client-only state shared by the toggle and the links.
  const mobileNavOpen = useAppSelector((state) => state.ui.mobileNavOpen);

  return (
    <header className="header">
      <Link to="/dashboard" className="header-brand">
        Orders App
      </Link>

      {/* NavLink = Link that knows if it points at the current page: it adds the `active` class
          (styled in _navbar.scss), so highlighting needs no manual comparison of URLs. */}
      <nav className={`navbar${mobileNavOpen ? " is-open" : ""}`} aria-label="Main">
        <NavLink to="/dashboard" className="navbar-link" onClick={() => dispatch(closeMobileNav())}>
          Dashboard
        </NavLink>
        <NavLink to="/orders" className="navbar-link" onClick={() => dispatch(closeMobileNav())}>
          Orders
        </NavLink>
      </nav>

      <div className="header-actions">
        {user && <span className="header-user">{user.name}</span>}
        <Button variant="secondary" small loading={isLoggingOut} onClick={logout}>
          Log out
        </Button>
        <button
          type="button"
          className="header-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileNavOpen}
          onClick={() => dispatch(toggleMobileNav())}
        >
          Menu
        </button>
      </div>
    </header>
  );
}
