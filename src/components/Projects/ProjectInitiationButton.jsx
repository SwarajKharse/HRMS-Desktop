"use client"

function ProjectInitiationButton({ project, onClick }) {
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
