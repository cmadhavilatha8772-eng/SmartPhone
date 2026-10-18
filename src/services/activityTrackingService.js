import {
  ensureUserActivityDocument,
  updateUserActivity,
  updateUserForegroundState,
} from './userActivityService'

const ACTIVITY_WRITE_INTERVAL_MS = 30_000

export function trackUserActivity(userId, onError) {
  let active = true
  let ready = false
  let hasPendingInteraction = false
  let lastActivityWrite = 0

  const report = (error) => {
    if (active) onError(error)
  }

  const write = (operation) => {
    operation().then(() => report(null)).catch(report)
  }

  const handleInteraction = () => {
    if (document.hidden) return
    if (!ready) {
      hasPendingInteraction = true
      return
    }

    const now = Date.now()
    if (now - lastActivityWrite < ACTIVITY_WRITE_INTERVAL_MS) return
    lastActivityWrite = now
    write(() => updateUserActivity(userId))
  }

  const handleVisibilityChange = () => {
    if (ready) write(() => updateUserForegroundState(userId, !document.hidden))
  }

  const handlePageHide = () => {
    if (ready) write(() => updateUserForegroundState(userId, false))
  }

  const initialize = async () => {
    try {
      await ensureUserActivityDocument(userId)
      if (!active) return
      await updateUserForegroundState(userId, !document.hidden)
      if (!active) return
      report(null)
      ready = true
      if (hasPendingInteraction && !document.hidden) handleInteraction()
    } catch (error) {
      report(error)
    }
  }

  document.addEventListener('pointerdown', handleInteraction, { passive: true })
  document.addEventListener('keydown', handleInteraction)
  document.addEventListener('touchstart', handleInteraction, { passive: true })
  document.addEventListener('scroll', handleInteraction, { passive: true })
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('pagehide', handlePageHide)
  window.addEventListener('pageshow', handleVisibilityChange)
  initialize()

  return () => {
    active = false
    document.removeEventListener('pointerdown', handleInteraction)
    document.removeEventListener('keydown', handleInteraction)
    document.removeEventListener('touchstart', handleInteraction)
    document.removeEventListener('scroll', handleInteraction)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('pagehide', handlePageHide)
    window.removeEventListener('pageshow', handleVisibilityChange)
  }
}
