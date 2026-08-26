import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { FiX } from "react-icons/fi";
import { attendanceService } from "../../services/attendanceService";

function getPositionPromise(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

// Self-contained check-in / check-out action: fetches today's attendance,
// drives the camera + location capture flow, and submits the punch.
// Shared between the Home "Today's Status" card and the Attendance page
// so both stay in sync on the same logic.
function PunchAction({ employee, onAttendanceChange }) {
  const [todaysAttendance, setTodaysAttendance] = useState({});
  const [processing, setProcessing] = useState(false);
  const [punchError, setPunchError] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const bestPositionRef = useRef(null);
  const locationPromiseRef = useRef(null);

  // Camera modal state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraPhase, setCameraPhase] = useState("live"); // "live" | "review"
  const [capturedPhoto, setCapturedPhoto] = useState(null); // { blob, previewUrl }
  const [cameraError, setCameraError] = useState(null);
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    fetchTodaysAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee]);

  const fetchTodaysAttendance = async () => {
    try {
      const response = await attendanceService.getTodayAttendance(employee.id);
      setTodaysAttendance(response);
      onAttendanceChange?.(response);
    } catch (error) {
      console.error("Failed to fetch today's attendance", error);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Opens the camera exactly once per modal session; cleans up the stream
  // whenever the modal closes OR this component unmounts.
  useEffect(() => {
    if (!cameraOpen) return;

    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        if (!cancelled) {
          setCameraError("Camera access was denied or unavailable. Please allow camera access and try again.");
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopCameraStream();
    };
  }, [cameraOpen, cameraAttempt]);

  const updateBestPosition = (position) => {
    if (!bestPositionRef.current || position.coords.accuracy < bestPositionRef.current.coords.accuracy) {
      bestPositionRef.current = position;
      setLocationAccuracy(position.coords.accuracy);
    }
  };

  const acquireLocation = async () => {
    const lowAccuracyPosition = await getPositionPromise({
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000,
    });
    updateBestPosition(lowAccuracyPosition);

    // Best-effort refinement; if it resolves before we submit, we use it.
    getPositionPromise({ enableHighAccuracy: true, timeout: 30000 })
      .then(updateBestPosition)
      .catch(() => {});

    return lowAccuracyPosition;
  };

  const resetCapturedPhoto = () => {
    setCapturedPhoto((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  };

  const closeCameraModal = () => {
    stopCameraStream();
    resetCapturedPhoto();
    setCameraOpen(false);
    setCameraPhase("live");
    setCameraError(null);
  };

  // Tapping Check In / Check Out: start location resolution in the
  // background immediately, and open the camera modal without waiting on it.
  const openCheckInFlow = () => {
    setPunchError(null);
    setCameraError(null);
    setLocationAccuracy(null);
    bestPositionRef.current = null;

    const locationPromise = acquireLocation();
    locationPromise.catch(() => {}); // avoid unhandled rejection if the user cancels before we await it
    locationPromiseRef.current = locationPromise;

    resetCapturedPhoto();
    setCameraPhase("live");
    setCameraOpen(true);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    // Draw the raw (unmirrored) video frame - the CSS mirror is display-only.
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError("Failed to capture photo. Please try again.");
        return;
      }
      const previewUrl = URL.createObjectURL(blob);
      setCapturedPhoto({ blob, previewUrl });
      setCameraPhase("review");
    }, "image/jpeg", 0.9);
  };

  const handleRetake = () => {
    resetCapturedPhoto();
    setCameraPhase("live");
  };

  const handleRetryCamera = () => {
    setCameraError(null);
    setCameraAttempt((n) => n + 1);
  };

  const handleUsePhoto = async () => {
    if (!capturedPhoto) return;

    const photoBlob = capturedPhoto.blob;
    const action = todaysAttendance.checkIn ? "checkOut" : "checkIn";

    // The photo is captured; close the camera and free it before we submit.
    closeCameraModal();

    setProcessing(true);
    setPunchError(null);

    try {
      await locationPromiseRef.current;
    } catch (error) {
      setPunchError("Unable to get your location. Please enable location services and try again.");
      setProcessing(false);
      return;
    }

    try {
      const { latitude, longitude } = bestPositionRef.current.coords;
      const address = `${latitude}, ${longitude}`;
      const timeStr = format(new Date(), "HH:mm:ss");

      if (action === "checkIn") {
        await attendanceService.checkIn(employee.id, timeStr, latitude, longitude, address);
      } else {
        await attendanceService.checkOut(employee.id, timeStr, latitude, longitude, address);
      }

      try {
        await attendanceService.uploadAttendanceImage(
          employee.id,
          photoBlob,
          action === "checkIn" ? "check-in" : "check-out"
        );
      } catch (uploadError) {
        // Punch already succeeded; a failed photo upload is not a punch failure.
        console.error("Attendance photo upload failed after successful punch", uploadError);
      }

      await fetchTodaysAttendance();
    } catch (error) {
      const status = error.status;
      if (status === 403) {
        setPunchError(error.message || "You are outside the allowed location.");
      } else if (status === 409) {
        setPunchError(action === "checkIn" ? "Already checked in for today." : "Already checked out for today.");
        await fetchTodaysAttendance();
      } else if (status === 404) {
        setPunchError("No check-in found for today.");
      } else {
        setPunchError(error.message || "Something went wrong. Please try again.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const attendanceComplete = Boolean(todaysAttendance.checkIn) && Boolean(todaysAttendance.checkOut);
  const punchButtonLabel = todaysAttendance.checkIn ? "Check Out" : "Check In";

  return (
    <>
      {attendanceComplete ? (
        <div className="text-center text-green-700 font-semibold bg-green-50 rounded-lg py-3">
          Completed for today
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={openCheckInFlow}
            disabled={processing}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg text-lg transition-colors"
          >
            {processing && (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {processing ? "Processing..." : punchButtonLabel}
          </button>
          {processing && locationAccuracy != null && (
            <div className="text-center text-sm text-gray-500 mt-2">
              Location accuracy: ~{Math.round(locationAccuracy)}m
            </div>
          )}
          {punchError && (
            <div className="mt-3 text-center text-sm text-red-600 bg-red-50 rounded-lg py-2 px-3">
              {punchError}
            </div>
          )}
        </div>
      )}

      {/* Camera modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex justify-end p-3">
            <button
              type="button"
              onClick={closeCameraModal}
              aria-label="Close camera"
              className="text-white bg-black/40 rounded-full min-w-[48px] min-h-[48px] flex items-center justify-center text-2xl"
            >
              <FiX />
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />

            {cameraPhase === "review" && capturedPhoto && (
              <img
                src={capturedPhoto.previewUrl}
                alt="Captured preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {cameraError && (
              <div className="absolute top-4 left-4 right-4 bg-red-600/90 text-white text-sm rounded-lg p-3">
                {cameraError}
              </div>
            )}
          </div>

          <div className="p-4 bg-black/80 flex flex-col gap-3">
            {locationAccuracy != null && (
              <div className="text-center text-sm text-gray-300">
                Location accuracy: ~{Math.round(locationAccuracy)}m
              </div>
            )}

            {cameraError ? (
              <button
                type="button"
                onClick={handleRetryCamera}
                className="w-full min-h-[48px] bg-white text-gray-900 font-semibold py-3 rounded-lg text-lg"
              >
                Retry Camera
              </button>
            ) : cameraPhase === "live" ? (
              <button
                type="button"
                onClick={handleCapture}
                className="w-full min-h-[48px] bg-white text-gray-900 font-semibold py-3 rounded-lg text-lg"
              >
                Capture
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 min-h-[48px] bg-gray-700 text-white font-semibold py-3 rounded-lg text-lg"
                >
                  Retake
                </button>
                <button
                  type="button"
                  onClick={handleUsePhoto}
                  className="flex-1 min-h-[48px] bg-blue-600 text-white font-semibold py-3 rounded-lg text-lg"
                >
                  Use this photo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default PunchAction;
