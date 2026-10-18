import { useEffect, useMemo, useState } from 'react'
import Loading from '../components/Loading'
import { subscribeToUserActivity, USER_ACTIVITY_TIMEOUT_MS } from '../services/userActivityService'

const PAGE_SIZE = 25

const formatTimestamp = (value) => {
  if (!value) return '—'
  const date = value.toDate ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export default function UserActivity() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const unsubscribe = subscribeToUserActivity(
      (nextActivities) => {
        setActivities(nextActivities)
        setLoading(false)
        setError('')
      },
      (snapshotError) => {
        setError(snapshotError.message || 'Unable to load user activity.')
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const pageCount = Math.max(1, Math.ceil(activities.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const currentActivities = useMemo(
    () => activities.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [activities, currentPage],
  )

  if (loading) return <Loading message="Loading user activity..." />

  return (
    <div className="page-stack">
      <section className="panel-card">
        <div className="panel-header">
          <h3>User activity</h3>
          <span className="muted">Online = foreground and active within 5 minutes</span>
        </div>

        {error ? <div className="error-box" role="alert">{error}</div> : null}

        {!error && activities.length === 0 ? (
          <div className="empty-state">No user activity has been recorded yet.</div>
        ) : null}

        {activities.length > 0 ? (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User UID</th>
                    <th>Status</th>
                    <th>Last login</th>
                    <th>Last active</th>
                    <th>Last logout</th>
                    <th>App version</th>
                  </tr>
                </thead>
                <tbody>
                  {currentActivities.map((activity) => {
                    const lastActiveAt = activity.lastActiveAt?.toDate
                      ? activity.lastActiveAt.toDate().getTime()
                      : new Date(activity.lastActiveAt).getTime()
                    const foregroundAt = activity.foregroundAt?.toDate
                      ? activity.foregroundAt.toDate().getTime()
                      : new Date(activity.foregroundAt).getTime()
                    const online =
                      activity.isForeground === true &&
                      Number.isFinite(lastActiveAt) &&
                      Number.isFinite(foregroundAt) &&
                      lastActiveAt >= foregroundAt &&
                      now - lastActiveAt >= 0 &&
                      now - lastActiveAt < USER_ACTIVITY_TIMEOUT_MS

                    return (
                      <tr key={activity.uid}>
                        <td>{activity.uid}</td>
                        <td>
                          <span className={`status-badge ${online ? 'active' : 'inactive'}`}>
                            {online ? 'ONLINE' : 'OFFLINE'}
                          </span>
                        </td>
                        <td>{formatTimestamp(activity.lastLoginAt)}</td>
                        <td>{formatTimestamp(activity.lastActiveAt)}</td>
                        <td>{formatTimestamp(activity.lastLogoutAt)}</td>
                        <td>{activity.appVersion || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="pagination-row">
              <span>
                Showing {currentPage * PAGE_SIZE + 1} - {Math.min((currentPage + 1) * PAGE_SIZE, activities.length)} of {activities.length}
              </span>
              <div className="pagination-buttons">
                <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
                  Previous
                </button>
                <button type="button" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>
                  Next
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  )
}
