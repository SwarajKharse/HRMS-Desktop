"use client"

import { useState } from "react"
import ProjectInitiation from "./ProjectInitiation"
import ProjectInitiationButton from "./ProjectInitiationButton"

function ProjectInitiationIntegration({ project }) {
  const [showInitiationModal, setShowInitiationModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)

  const handleOpenInitiationModal = (e) => {
    e.stopPropagation()
    setShowInitiationModal(true)
  }

  const handleCloseInitiationModal = () => {
    setShowInitiationModal(false)
  }

  const handleSaveInitiationPlan = (planData) => {
    setSuccessMessage("Project initiation plan saved successfully!")
    setShowInitiationModal(false)

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null)
    }, 3000)
  }

  return (
    <>
      <ProjectInitiationButton project={project} onClick={handleOpenInitiationModal} />

      {showInitiationModal && (
        <ProjectInitiation project={project} onClose={handleCloseInitiationModal} onSave={handleSaveInitiationPlan} />
      )}

      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-50 text-green-600 p-3 rounded-lg border border-green-100 shadow-md z-50">
          {successMessage}
        </div>
      )}
    </>
  )
}

export default ProjectInitiationIntegration
