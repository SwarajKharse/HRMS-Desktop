import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { authService } from "../../services/authService";
import { attendanceService } from "../../services/attendanceService";
import { FiCheck, FiX, FiLoader, FiClock, FiCamera, FiAlertCircle } from "react-icons/fi";

const AttendanceKiosk = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [recognizedUser, setRecognizedUser] = useState(null);
  const [punchTime, setPunchTime] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [dialogData, setDialogData] = useState({});

  const videoWidth = 640;
  const videoHeight = 480;

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Error loading face-api models:", err);
      }
    };
    loadModels();

    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (isCameraOn && modelsLoaded) {
      startVideo();
    } else {
      stopCamera();
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [isCameraOn, modelsLoaded]);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: videoWidth, height: videoHeight },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        videoRef.current.onloadedmetadata = () => {
          beginFaceDetection();
        };
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const beginFaceDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !modelsLoaded || !isCameraOn || isProcessing) {
        return;
      }

      try {
        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 512,
          scoreThreshold: 0.5,
        });

        const detection = await faceapi.detectSingleFace(videoRef.current, options);

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        const displaySize = { width: videoWidth, height: videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          const resized = faceapi.resizeResults(detection, displaySize);
          faceapi.draw.drawDetections(canvas, [resized]);
          setFaceDetected(true);
        } else {
          setFaceDetected(false);
        }
      } catch (err) {
        console.error("Error during detection:", err);
        setFaceDetected(false);
      }
    }, 500);
  };

  const processAttendance = async () => {
    setIsProcessing(true);
    try {
      const dataUrl = await captureImage();
      if (!dataUrl) throw new Error("Failed to capture image");

      const base64String = dataUrl.split(",")[1];
      if (!base64String) {
        throw new Error("No base64 data found in captured image.");
      }

      const result = attendanceService.markKioskAttendance(selectedAction, JSON.stringify({
        orgId: authService.getUser().orgId,
        image: base64String,
      }));

      if (result.status === "success") {
        setRecognizedUser(result.fullName || result.empId);
        setPunchTime(result.message || new Date().toLocaleTimeString());
        setShowDialog(true);
        setDialogData({ status: "success", message: result.message });
      } else if (["already_checked_in", "already_checked_out", "no_checkin", "no_match"].includes(result.status)) {
        setRecognizedUser(null);
        setPunchTime("");
        setShowDialog(true);
        setDialogData({ status: result.status, message: result.message });
      }

      setIsProcessing(false);
      return false;
    } catch (err) {
      console.error("Error processing attendance:", err);
      setIsProcessing(false);
      setShowDialog(true);
      setDialogData({ 
        status: "error", 
        message: "An error occurred while processing attendance. Please try again." 
      });
      return false;
    }
  };

  const captureImage = async () => {
    if (!videoRef.current) return null;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL("image/jpeg");
  };

  const stopCamera = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsProcessing(false);
    setSelectedAction(null);
    setFaceDetected(false);
    setDialogData({});
  };

  const handleCheckIn = () => {
    setSelectedAction("check-in");
    setIsCameraOn(true);
  };

  const handleCheckOut = () => {
    setSelectedAction("check-out");
    setIsCameraOn(true);
  };

  const handleEndSession = () => {
    setIsCameraOn(false);
    setShowDialog(false);
    setRecognizedUser(null);
    setDialogData({});
    window.location.reload();
  };

  const handleDialogConfirm = () => {
    setShowDialog(false);
    setRecognizedUser(null);
    setIsProcessing(false);
    setFaceDetected(false);
    setDialogData({});
  };

  const getDialogContent = () => {
    const dialogStyles = {
      success: {
        icon: <FiCheck className="w-12 h-12 text-green-500" />,
        title: "Success",
        titleColor: "text-green-600",
        buttonColor: "bg-green-500 hover:bg-green-600"
      },
      already_checked_in: {
        icon: <FiClock className="w-12 h-12 text-yellow-500" />,
        title: "Already Checked In",
        titleColor: "text-yellow-600",
        buttonColor: "bg-yellow-500 hover:bg-yellow-600"
      },
      already_checked_out: {
        icon: <FiClock className="w-12 h-12 text-yellow-500" />,
        title: "Already Checked Out",
        titleColor: "text-yellow-600",
        buttonColor: "bg-yellow-500 hover:bg-yellow-600"
      },
      no_checkin: {
        icon: <FiAlertCircle className="w-12 h-12 text-red-500" />,
        title: "No Check-in Record",
        titleColor: "text-red-600",
        buttonColor: "bg-red-500 hover:bg-red-600"
      },
      no_match: {
        icon: <FiX className="w-12 h-12 text-red-500" />,
        title: "No Match Found",
        titleColor: "text-red-600",
        buttonColor: "bg-red-500 hover:bg-red-600"
      },
      error: {
        icon: <FiAlertCircle className="w-12 h-12 text-red-500" />,
        title: "Error",
        titleColor: "text-red-600",
        buttonColor: "bg-red-500 hover:bg-red-600"
      }
    };

    const style = dialogStyles[dialogData.status || "success"];

    return (
      <div className="text-center">
        <div className="mb-4 flex justify-center">{style.icon}</div>
        <h2 className={`text-2xl font-bold mb-2 ${style.titleColor}`}>{style.title}</h2>
        {dialogData.status === "success" ? (
          <>
            <p className="text-lg mb-2">
              {selectedAction === "check-in" ? "Check-In" : "Check-Out"} Successful
            </p>
            <p className="text-gray-600 mb-4">
              <span className="font-semibold">{recognizedUser}</span>
              <br />
              {punchTime}
            </p>
          </>
        ) : (
          <p className="text-gray-600 mb-4">{dialogData.message}</p>
        )}
        <button
          onClick={handleDialogConfirm}
          className={`px-6 py-2 rounded-lg text-white transition-colors ${style.buttonColor}`}
        >
          OK
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center p-8 min-h-screen bg-gray-50">
      {!isCameraOn && (
        <div className="mb-8 space-x-6">
          <button
            onClick={handleCheckIn}
            className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl"
          >
            Check-In
          </button>
          <button
            onClick={handleCheckOut}
            className="bg-yellow-500 text-white px-8 py-3 rounded-lg hover:bg-yellow-600 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl"
          >
            Check-Out
          </button>
        </div>
      )}

      {isCameraOn && (
        <div className="w-full max-w-4xl">
          <div className="text-2xl font-bold mb-6 text-center text-gray-800">
            {selectedAction === "check-in" ? "Check-In Mode" : "Check-Out Mode"}
          </div>

          <div className="relative mb-6">
            <div className="rounded-xl overflow-hidden shadow-2xl">
              <video
                ref={videoRef}
                width={videoWidth}
                height={videoHeight}
                className="rounded-lg"
                autoPlay
                muted
              />
              <canvas
                ref={canvasRef}
                width={videoWidth}
                height={videoHeight}
                className="absolute top-0 left-0"
              />
            </div>

            {isProcessing ? (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
                <FiLoader className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-gray-700">Marking attendance...</span>
              </div>
            ) : (
              faceDetected && (
                <button
                  onClick={processAttendance}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                           bg-green-500 text-white px-6 py-3 rounded-lg 
                           hover:bg-green-600 transition-colors shadow-lg
                           flex items-center space-x-2"
                >
                  <FiCamera className="w-5 h-5" />
                  <span>Capture Image</span>
                </button>
              )
            )}
          </div>

          <div className="text-center">
            <button
              onClick={handleEndSession}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors shadow-lg"
            >
              END SESSION
            </button>
          </div>
        </div>
      )}

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
            {getDialogContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceKiosk;