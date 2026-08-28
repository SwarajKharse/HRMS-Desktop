import { useState, useEffect, useCallback } from "react"
import { projectService } from "../services/projectService"

// Shared progress-lock polling + guard logic for PM/SE pages. A project "locks" once its SE
// has an unfilled progress backlog (yesterday or earlier) — this only gates requisition
// creation and PM approve/reject, not view-only pages like BOQ viewing, DC History, Summary.
export function useProgressLock(userId) {
  const [lockStatusMap, setLockStatusMap] = useState(() => new Map())
  const [lockPopup, setLockPopup] = useState(null) // { project, needsApproval, overrideActive, oldestUnfilledDate }

  useEffect(() => {
    if (!userId) return
    const fetchLockStatus = () => {
      projectService.getProgressLockStatus(userId)
        .then((statuses) => {
          const map = new Map()
          ;(Array.isArray(statuses) ? statuses : []).forEach((s) => map.set(s.projectId, s))
          setLockStatusMap(map)
        })
        .catch((err) => console.error("Failed to load progress lock status:", err))
    }
    fetchLockStatus()
    const interval = setInterval(fetchLockStatus, 60000)
    return () => clearInterval(interval)
  }, [userId])

  // `project` may be a full project object (needs at least `.id`) or a bare id.
  const getLockStatus = useCallback((project) => {
    const projectId = typeof project === "object" && project !== null ? project.id : project
    return lockStatusMap.get(projectId) || null
  }, [lockStatusMap])

  const openLockPopup = useCallback((project) => {
    const projectId = typeof project === "object" && project !== null ? project.id : project
    const status = lockStatusMap.get(projectId)
    setLockPopup({
      project: typeof project === "object" && project !== null ? project : { id: projectId },
      needsApproval: status?.needsApproval,
      overrideActive: status?.overrideActive,
      oldestUnfilledDate: status?.oldestUnfilledDate,
    })
  }, [lockStatusMap])

  // Returns an onClick handler: if the project is locked, opens the popup instead of running action.
  const guardLock = useCallback((project, action) => (e) => {
    const status = getLockStatus(project)
    if (status && status.locked) {
      if (e && e.stopPropagation) e.stopPropagation()
      openLockPopup(project)
      return
    }
    action(e)
  }, [getLockStatus, openLockPopup])

  return { lockStatusMap, getLockStatus, lockPopup, setLockPopup, openLockPopup, guardLock }
}
