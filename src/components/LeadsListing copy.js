"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import UnAssignedLeads from "../components/Leads/UnAssignedLeads"
import SSEAssignedLeads from "../components/Leads/SSEAssignedLeads"
import AssignLeadsToBDM from "../components/Leads/AssignLeadsToBDM"
import SSENewLeads from "../components/Leads/SSENewLeads"
import BDMAssignedFieldVisit from "../components/Leads/BDMAssignedFieldVisit"

import SSEInProgressLeads from "../components/Leads/SSEInProgressLeads"
import { MdFiberNew, MdEngineering, MdManageAccounts } from "react-icons/md"
import { GrWorkshop } from "react-icons/gr";
import { RiProgress3Line } from "react-icons/ri";
import { useAuth } from "../contexts/AuthContext"

function LeadsListing() {
  const { employee } = useAuth()
  console.log(employee.designation.name)

  // Define available tabs based on employee designation
  const getAvailableTabs = () => {
    const allTabs = [
      { id: "unassigned-leads", label: "UnAssigned Leads", icon: MdFiberNew, component: UnAssignedLeads },
      { id: "sse-assigned-leads", label: "SSE Assigned Leads", icon: MdEngineering, component: SSEAssignedLeads },
      { id: "assign-leads-bdm", label: "Assign Leads To BDM", icon: MdManageAccounts, component: AssignLeadsToBDM },
      { id: "see-new-leads", label: "New Leads", icon: MdFiberNew, component: SSENewLeads },
      { id: "sse-inprocess-leads", label: "In Process Leads", icon: RiProgress3Line, component: SSEInProgressLeads },
      { id: "sse-won-leads", label: "Won Leads", icon: MdManageAccounts, component: AssignLeadsToBDM },
      { id: "bdm-assigned-field-visit", label: "Assigned Field Visit", icon: GrWorkshop, component: BDMAssignedFieldVisit }
    ]

    if (!employee) return [allTabs[0]] // Default to unassigned leads if no employee
    const designation = employee.designation.name.replace(/\s+/g, '-').toLowerCase() || "";

    // Filter tabs based on designation
    if (designation.includes("director")) {
      return allTabs // Admin/Manager can see all tabs
    } else if (designation.includes("sales-team-leader") || designation.includes("leader")){
      return [allTabs[0], allTabs[1], allTabs[2]] // BDM can see unassigned and BDM assigne
    } else if (designation.includes("sales-support-engineer") || designation.includes("engineer")) {
      return [allTabs[3], allTabs[4] , allTabs[5]] // SSE can see unassigned and SSE assigned
    } else if (designation.includes("bdm") || designation.includes("business") || designation.includes("development")) {
      return [allTabs[6]] // BDM can see unassigned and BDM assigned
    } else {
      return [allTabs[0]] // Default to just unassigned leads
    }
  }

  const availableTabs = getAvailableTabs()
  const validTabIds = availableTabs.map((tab) => tab.id)

  // Initialize activeTab from sessionStorage with validation against available tabs
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTab = sessionStorage.getItem("reportsActiveTab")
      return validTabIds.includes(savedTab) ? savedTab : validTabIds[0]
    }
    return validTabIds[0]
  })

  // Update sessionStorage when activeTab changes
  useEffect(() => {
    sessionStorage.setItem("reportsActiveTab", activeTab)
  }, [activeTab])

  // If active tab is not in available tabs (e.g. after role change), reset to first available
  useEffect(() => {
    if (!validTabIds.includes(activeTab)) {
      setActiveTab(validTabIds[0])
    }
  }, [validTabIds, activeTab])

  return (
    <div className="flex flex-col gap-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {availableTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                  ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {availableTabs.map((tab) => activeTab === tab.id && <tab.component key={tab.id} />)}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default LeadsListing

