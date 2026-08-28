import { FiImage } from "react-icons/fi"

// Matches "lat, lng" style coordinate strings (raw GPS captures). Older rows
// from the retired Flutter app store a reverse-geocoded address instead -
// those must never be treated as coordinates or linked to a map.
const COORDINATE_PATTERN = /^-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?$/

export function LocationDisplay({ location }) {
  if (!location || !location.trim()) {
    return <span className="text-gray-400">-</span>
  }

  const trimmed = location.trim()

  if (COORDINATE_PATTERN.test(trimmed)) {
    const [lat, lng] = trimmed.split(",").map((part) => part.trim())
    return (
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline break-all"
      >
        {trimmed}
      </a>
    )
  }

  return <span className="text-gray-700 break-words">{trimmed}</span>
}

export function PhotoThumbnail({ url, alt, onClick }) {
  if (!url) {
    return (
      <div className="w-16 h-16 shrink-0 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
        <FiImage className="w-6 h-6" />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <img src={url} alt={alt} className="w-full h-full object-cover" />
    </button>
  )
}
