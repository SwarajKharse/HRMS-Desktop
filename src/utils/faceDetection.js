let faceapi = null
let modelsLoaded = false

const loadFaceapi = async () => {
  if (!faceapi) {
    faceapi = await import("face-api.js")
  }
  return faceapi
}

export const initializeFaceDetection = async () => {
  if (modelsLoaded) return
  const MODEL_URL = "/models"
  try {
    const fa = await loadFaceapi()
    await Promise.all([
      fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      fa.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
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
  const fa = await loadFaceapi()
  const options = new fa.TinyFaceDetectorOptions({
    inputSize: 512,
    scoreThreshold: 0.5,
  })
  try {
    const detection = await fa.detectSingleFace(imageElement, options)
    return !!detection
  } catch (error) {
    console.error("Error detecting face:", error)
    throw new Error("Face detection failed")
  }
}