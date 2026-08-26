import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { FiCheckCircle, FiClock, FiCalendar } from "react-icons/fi";
import { attendanceService } from "../../services/attendanceService";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

async function capturePhoto() {
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    const video = document.createElement("video");
    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    await video.play();
    await new Promise((resolve) => {
      if (video.readyState >= 2) resolve();
      else video.onloadedmetadata = () => resolve();
    });

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to capture photo"))), "image/jpeg", 0.9);
    });
    return blob;
  } finally {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }
}

function getPositionPromise(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function Activities({ employee }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaysAttendance, setTodaysAttendance] = useState({});
  const [processing, setProcessing] = useState(false);
  const [punchError, setPunchError] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const bestPositionRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTodaysAttendance();
  }, [employee]);

  const fetchTodaysAttendance = async () => {
    try {
      const response = await attendanceService.getTodayAttendance(employee.id);
      setTodaysAttendance(response);
    } catch (error) {
      console.error("Failed to fetch today's attendance", error);
    }
  };

  const getValue = (value, defaultValue = "NA") => {
    if (value === null || value === undefined || value === "") {
      return defaultValue;
    }
    return value;
  };

  // Format time without seconds
  const formatTime = (time) => {
    if (!time) return "--:--";
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

  // Total hours worked - only computable once both check-in and check-out exist
  const getTotalHoursDisplay = () => {
    if (!todaysAttendance.checkIn) return "—";
    if (!todaysAttendance.checkOut) return "In progress";

    const toMinutes = (t) => {
      const [h, m] = String(t).split(":").map(Number);
      return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
    };

    const start = toMinutes(todaysAttendance.checkIn);
    const end = toMinutes(todaysAttendance.checkOut);
    if (start === null || end === null || end < start) return "—";

    const total = end - start;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };

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

  const handlePunch = async () => {
    if (processing) return;
    setProcessing(true);
    setPunchError(null);
    setLocationAccuracy(null);
    bestPositionRef.current = null;

    const action = todaysAttendance.checkIn ? "checkOut" : "checkIn";

    let photoBlob;
    try {
      photoBlob = await capturePhoto();
    } catch (error) {
      setPunchError("Camera access was denied or unavailable. Please allow camera access and try again.");
      setProcessing(false);
      return;
    }

    try {
      await acquireLocation();
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
    <div className="flex flex-col gap-6">
      {/* Greeting Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {getGreeting()}, {getValue(employee?.firstName)}!
            </h2>
            <p className="text-gray-600 mt-1">Have a productive day!</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{format(currentTime, "HH:mm")}</div>
            <div className="text-gray-600">{format(currentTime, "EEEE, MMMM d, yyyy")}</div>
          </div>
        </div>
      </div>

      {/* Check In/Out Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Today's Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Check In</div>
            <div className="text-lg font-semibold mt-1">
              {formatTime(todaysAttendance.checkIn)}
            </div>
            <div className="flex items-center gap-1 text-gray-500 mt-1">
              <FiCheckCircle className="w-4 h-4" />
              <span className="text-sm">
                {todaysAttendance.checkIn ? "Checked In" : "Pending"}
              </span>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Check Out</div>
            <div className="text-lg font-semibold mt-1">
              {formatTime(todaysAttendance.checkOut)}
            </div>
            <div className="flex items-center gap-1 text-gray-500 mt-1">
              <FiClock className="w-4 h-4" />
              <span className="text-sm">
                {todaysAttendance.checkOut ? "Checked Out" : "Pending"}
              </span>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Total Hours</div>
            <div className="text-lg font-semibold mt-1">
              {getTotalHoursDisplay()}
            </div>
            <div className="flex items-center gap-1 text-blue-600 mt-1">
              <FiCalendar className="w-4 h-4" />
              <span className="text-sm">Today</span>
            </div>
          </div>
        </div>

        {attendanceComplete ? (
          <div className="mt-6 text-center text-green-700 font-semibold bg-green-50 rounded-lg py-3">
            Completed for today
          </div>
        ) : (
          <div className="mt-6">
            <button
              type="button"
              onClick={handlePunch}
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
      </div>

      {/* Attendance Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Attendance Status</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">Status</div>
          <div className="text-lg font-semibold mt-1">
            {todaysAttendance.status || "No status available"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Activities;
