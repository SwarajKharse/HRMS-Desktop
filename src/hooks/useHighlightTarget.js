import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"

const HIGHLIGHT_PARAM = "highlight"
const HIGHLIGHT_DURATION_MS = 2500

// Shared by any page that can be a notification click-through destination.
// Reads ?highlight=<domId> from the URL, scrolls to + pulses that element, then
// strips the param so refresh/back-nav doesn't re-trigger it.
export function useHighlightTarget() {
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const targetId = searchParams.get(HIGHLIGHT_PARAM)
    if (!targetId) return

    const timers = []
    const scrollTimer = setTimeout(() => {
      // Query by data-attribute (not id): pages that render separate desktop/mobile
      // layouts simultaneously (hidden via CSS, not unmounted) may have more than
      // one element for the same logical target — only the visible one(s) matter.
      const elements = document.querySelectorAll(`[data-highlight-id="${CSS.escape(targetId)}"]`)
      let scrolled = false
      elements.forEach((el) => {
        if (!scrolled && el.offsetParent !== null) {
          el.scrollIntoView({ behavior: "smooth", block: "center" })
          scrolled = true
        }
        el.classList.add("notif-highlight")
        timers.push(setTimeout(() => el.classList.remove("notif-highlight"), HIGHLIGHT_DURATION_MS))
      })
    }, 100)
    timers.push(scrollTimer)

    const next = new URLSearchParams(searchParams)
    next.delete(HIGHLIGHT_PARAM)
    setSearchParams(next, { replace: true })

    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
