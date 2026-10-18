export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="loading-shell">
      {/* The label gives assistive technology a name for the visual spinner. */}
      <div className="spinner" aria-label="Loading" />
      <p>{message}</p>
    </div>
  )
}
