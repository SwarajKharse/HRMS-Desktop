// Extracts a human-readable message from a failed axios/fetch call, regardless of how the
// backend shaped the error body (plain string, {message}, {error}, {msg}, {errors: [...]}) —
// and regardless of whether the caller re-threw the raw axios error or just the unwrapped
// response body (a common pattern in this codebase: `throw error.response?.data || error.message`).
// Falls back to a caller-supplied message only when nothing usable came back from the server.
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback

  // Either a real axios error (read its response body) or an already-unwrapped body
  // thrown directly by a service (some services throw `error.response?.data` as-is).
  const data = error.response ? error.response.data : error

  if (typeof data === "string" && data.trim()) return data
  if (data && typeof data === "object") {
    if (typeof data.message === "string" && data.message.trim()) return data.message
    if (typeof data.error === "string" && data.error.trim()) return data.error
    if (typeof data.msg === "string" && data.msg.trim()) return data.msg
    if (Array.isArray(data.errors) && data.errors.length) return data.errors.join(", ")
  }

  // Axios sets `.request` when a request was made but no response came back at all.
  if (error.request && !error.response) {
    return "Network error — please check your connection and try again."
  }

  if (typeof error.message === "string" && error.message.trim()) return error.message
  return fallback
}
