let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null
    audioCtx = new AudioContextClass()
  }
  return audioCtx
}

// Browsers only allow an AudioContext to start/resume as a direct result of a user
// gesture (click/keydown/tap) — creating it lazily inside a setInterval poll callback
// gets silently suspended. Call this once from a real gesture handler (see
// NotificationBell's document-level listener) so later automatic playback works.
export function unlockAudio() {
  try {
    const ctx = getAudioContext()
    if (ctx && ctx.state === "suspended") {
      ctx.resume()
    }
  } catch (error) {
    console.error("Error unlocking audio context:", error)
  }
}

// Short two-tone chime synthesized via Web Audio API — no asset file needed.
export function playNotificationSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === "suspended") {
      ctx.resume()
    }

    const now = ctx.currentTime
    const notes = [
      { freq: 880, start: 0, duration: 0.12 },
      { freq: 1318.51, start: 0.1, duration: 0.18 },
    ]

    notes.forEach(({ freq, start, duration }) => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(freq, now + start)
      gain.gain.setValueAtTime(0, now + start)
      gain.gain.linearRampToValueAtTime(0.2, now + start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration)
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start(now + start)
      oscillator.stop(now + start + duration + 0.02)
    })
  } catch (error) {
    console.error("Error playing notification sound:", error)
  }
}
