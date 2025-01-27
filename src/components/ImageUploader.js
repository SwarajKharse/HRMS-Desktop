import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiUpload, FiX, FiCheck, FiLoader } from "react-icons/fi"
import { detectFace } from "../utils/faceDetection"

const MAX_FILE_SIZE = 1024 * 2048 // 1MB in bytes

function ImageUploader({ onImageSelect, currentImage }) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [preview, setPreview] = useState(currentImage || "")
  const fileInputRef = useRef(null)

  const validateImage = async (file) => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("Image size must be less than 1MB")
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image")
    }

    // Create image element for face detection
    const image = new Image()
    const imageUrl = URL.createObjectURL(file)

    try {
      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
        image.src = imageUrl
      })

      // Detect face in the image
      const hasFace = await detectFace(image)
      if (!hasFace) {
        throw new Error("No face detected in the image")
      }

      return imageUrl
    } catch (error) {
      URL.revokeObjectURL(imageUrl)
      throw error
    }
  }

  const handleFile = async (file) => {
    setError("")
    setIsProcessing(true)

    try {
      const imageUrl = await validateImage(file)
      setPreview(imageUrl)
      const reader = new FileReader()

      reader.onload = (e) => {
        onImageSelect(e.target.result)
      }

      reader.readAsDataURL(file)
    } catch (err) {
      setError(err.message)
      setPreview("")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      await handleFile(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInput = async (e) => {
    const file = e.target.files[0]
    if (file) {
      await handleFile(file)
    }
  }

  const handleRemoveImage = () => {
    setPreview("")
    onImageSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Profile Photo
        <span className="text-xs text-gray-500 ml-2">(Max size: 1MB, must contain a face)</span>
      </label>

      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          ${error ? "border-red-500 bg-red-50" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileInput} />

        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-4"
            >
              <FiLoader className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="mt-2 text-sm text-gray-600">Processing image...</p>
            </motion.div>
          ) : preview ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative group"
            >
              <img src={preview || "/placeholder.svg"} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveImage()
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FiX className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-4"
            >
              <FiUpload className="w-8 h-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">Drag and drop an image here, or click to select</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-500">
          {error}
        </motion.p>
      )}
    </div>
  )
}

export default ImageUploader;