"use client"
import { FiPlayCircle } from "react-icons/fi"

function ProjectInitiationButton({ project, onClick, compact }) {
  if (compact) {
    return (
      <button
        className="flex flex-col items-center justify-center gap-0.5 py-2 w-full bg-blue-50 text-blue-700 rounded-lg active:bg-blue-100"
        onClick={onClick}
        title="Project Initiation"
      >
        <FiPlayCircle size={16} />
        <span className="text-[10px] font-medium">Initiation</span>
      </button>
    )
  }
  return (
    <button
      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
      onClick={onClick}
      title="Project Initiation"
    >
      Project Initiation
    </button>
  )
}
export default ProjectInitiationButton