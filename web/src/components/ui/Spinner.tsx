// Small inline loading indicator (CSS in styles/components/_feedback.scss).
// role="status" + aria-label make screen readers announce "Loading" - a purely visual spinner
// would be invisible to them.
export function Spinner() {
  return <span className="spinner" role="status" aria-label="Loading" />;
}

// Centred spinner for whole pages/sections while their first data loads.
export function PageSpinner() {
  return (
    <div className="spinner-page">
      <Spinner />
    </div>
  );
}
