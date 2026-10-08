export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="loading-shell">
      <div className="spinner" aria-label="Loading" />
      <p>{message}</p>
    </div>
  )
}
