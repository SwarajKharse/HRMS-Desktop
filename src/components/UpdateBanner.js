import { useUpdateAvailable } from "../hooks/useUpdateAvailable";

// Non-blocking, dismiss-free-by-tap banner - never auto-reloads, since a
// forced reload mid check-in would destroy a captured photo/pending location.
function UpdateBanner() {
  const updateAvailable = useUpdateAvailable();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center px-4 pb-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg px-4 py-3">
        <span>A new version of the app is available.</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-md whitespace-nowrap"
        >
          Reload
        </button>
      </div>
    </div>
  );
}

export default UpdateBanner;
