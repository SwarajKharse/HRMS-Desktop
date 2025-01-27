import * as faceapi from "face-api.js"

let modelsLoaded = false

export const initializeFaceDetection = async () => {
  if (modelsLoaded) return

  const MODEL_URL = "/models"

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])
    modelsLoaded = true
    return true
  } catch (error) {
    console.error("Error loading face detection models:", error)
    throw new Error("Failed to load face detection models")
  }
}

export const detectFace = async (imageElement) => {
  if (!modelsLoaded) {
    await initializeFaceDetection()
  }

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 512,
    scoreThreshold: 0.5,
  })

  try {
    const detection = await faceapi.detectSingleFace(imageElement, options)
    return !!detection
  } catch (error) {
    console.error("Error detecting face:", error)
    throw new Error("Face detection failed")
  }
}