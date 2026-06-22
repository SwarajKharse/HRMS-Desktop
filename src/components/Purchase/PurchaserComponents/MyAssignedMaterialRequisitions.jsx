"use client"
import { useState, useEffect } from "react"
import MaterialRequisitionPurchase from "../MaterialRequisitionPurchase"
import { projectService } from "../../../services/projectService"
import { useAuth } from "../../../contexts/AuthContext"

export default function MyAssignedMaterialRequisitions() {
  const { user } = useAuth()
  const [assignedProjectIds, setAssignedProjectIds] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAssignedProjects = async () => {
      try {
        const data = await projectService.getPurchaserAssignedProjects(user?.userId)
        const list = Array.isArray(data) ? data : (data?.content || [])
        setAssignedProjectIds(list.map((p) => p.id ?? p.projectId))
      } catch (e) {
        setAssignedProjectIds([])
      } finally {
        setLoading(false)
      }
    }
    if (user?.userId) fetchAssignedProjects()
  }, [user])

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading your projects...</div>
  }

  return <MaterialRequisitionPurchase assignedProjectIds={assignedProjectIds} mode="purchaser" />
}