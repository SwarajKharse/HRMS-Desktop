import { useState, useEffect, useCallback, useRef } from "react";
import { BUILD_VERSION } from "../version";

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

// Polls /version.json (written by the build pipeline) and flags when it
// diverges from the version this bundle was built with. Needed because the
// Android WebView shell keeps a loaded bundle in memory indefinitely - a
// user who never force-closes the app never picks up a redeploy otherwise.
export function useUpdateAvailable() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const checkingRef = useRef(false);

  const checkForUpdate = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    try {
      const response = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      if (data && data.version && data.version !== BUILD_VERSION) {
        setUpdateAvailable(true);
      }
    } catch (error) {
      // Missing file, network failure, invalid JSON, etc. - never disrupt the app.
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    checkForUpdate();

    const intervalId = setInterval(checkForUpdate, CHECK_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdate();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkForUpdate]);

  return updateAvailable;
}

export default useUpdateAvailable;
