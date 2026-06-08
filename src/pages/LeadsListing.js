"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import UnAssignedLeads from "../components/Leads/UnAssignedLeads"
import SSEAssignedLeads from "../components/Leads/SSEAssignedLeads"
import AssignLeadsToBDM from "../components/Leads/AssignLeadsToBDM"
import SSENewLeads from "../components/Leads/SSENewLeads"
import BDMAssignedFieldVisit from "../components/Leads/BDMAssignedFieldVisit"
import SSEWonLeads from "../components/Leads/SSEWonLeads"
import SSEInProgressLeads from "../components/Leads/SSEInProgressLeads"
import SalesTLWonLeads from "../components/Leads/SalesTLWonLeads"
import UpdateMasterTables from "../components/Leads/UpdateMasterTables"
import BDMLeadsCreatedByMe from "../components/Leads/BDMLeadsCreatedByMe"
import { MdFiberNew, MdEngineering, MdManageAccounts } from "react-icons/md"
import { GrWorkshop } from "react-icons/gr"
import { RiProgress3Line } from "react-icons/ri"
import { BiWon } from "react-icons/bi"
import { VscEditSession } from "react-icons/vsc"
import { FaCreativeCommonsBy } from "react-icons/fa6"
import { useAuth } from "../contexts/AuthContext"

function LeadsListing() {
  const { employee } = useAuth()
  const tabsContainerRef = useRef(null)
  const activeTabRef = useRef(null)

  // Add state for main tab selection
  const [activeMainTab, setActiveMainTab] = useState("SalesTL")

  // Define all available tabs
  const allTabs = [
    { id: "unassigned-leads", label: "UnAssigned Leads", icon: MdFiberNew, component: UnAssignedLeads },
    { id: "sse-assigned-leads", label: "SSE Assigned Leads", icon: MdEngineering, component: SSEAssignedLeads },
    { id: "assign-leads-bdm", label: "Assign Leads To BDM", icon: MdManageAccounts, component: AssignLeadsToBDM },
    { id: "see-new-leads", label: "New Leads", icon: MdFiberNew, component: SSENewLeads },
    { id: "sse-inprocess-leads", label: "In Process Leads", icon: RiProgress3Line, component: SSEInProgressLeads },
    { id: "sse-won-leads", label: "Won/Lost Leads", icon: BiWon, component: SSEWonLeads },
    {
      id: "bdm-assigned-field-visit",
      label: "Assigned Field Visit",
      icon: GrWorkshop,
      component: BDMAssignedFieldVisit,
    },
    { id: "salestl-won-leads", label: "Won/Lost Leads", icon: BiWon, component: SalesTLWonLeads },
    {
      id: "salestl-update-master-table",
      label: "Update Options",
      icon: VscEditSession,
      component: UpdateMasterTables,
    },
    {
      id: "bdm-leads-by-me",
      label: "Leads Created By Me",
      icon: FaCreativeCommonsBy,
      component: BDMLeadsCreatedByMe,
    },
  ]

  // Check if user is a super admin (employee IDs 1, 5, 6)
  const isSuperAdmin = () => {
    if (!employee || !employee.id) return false
    return [2, 3, 1].includes(employee.id)
  }

  // Check if user has a leadership role
  const isLeadershipRole = () => {
    if (!employee || !employee.designation || !employee.designation.name) return false

    const designation = employee.designation.name.replace(/\s+/g, "-").toLowerCase()
    return (
      designation.includes("sales-team-lead") ||
      designation.includes("techno-commercial-head") ||
      designation.includes("sales-manager")
    )
  }

  // Check if main tabs should be visible
  const shouldShowMainTabs = () => {
    return isSuperAdmin() || isLeadershipRole()
  }

  // Get available main tabs based on role
  const getAvailableMainTabs = () => {
    if (isSuperAdmin()) {
      return ["SalesTL", "SSE", "BDM"]
    } else if (isLeadershipRole()) {
      return ["SalesTL", "SSE"]
    }
    return []
  }

  // Get available tabs based on designation and main tab selection
  const getAvailableTabs = () => {
    if (!employee) return [allTabs[0]] // Default to unassigned leads if no employee

    const designation = employee?.designation?.name?.replace(/\s+/g, "-").toLowerCase() || ""

    // For users with main tabs, return tabs based on main tab selection
    if (shouldShowMainTabs()) {
      if (activeMainTab === "SalesTL" && isSuperAdmin()) {
        return [allTabs[0], allTabs[1], allTabs[2], allTabs[7], allTabs[8]]
      } else if (activeMainTab === "SalesTL" && !isSuperAdmin()) {
        return [allTabs[0], allTabs[1], allTabs[2], allTabs[7]]
      }else if (activeMainTab === "SSE") {
        return [allTabs[3], allTabs[4], allTabs[5]]
      } else if (activeMainTab === "BDM") {
        return [allTabs[6], allTabs[9]]
      }
    }

    // For other roles without main tabs, keep the existing logic
    if (designation.includes("director")) {
      return allTabs // Admin/Manager can see all tabs
    } else if (designation.includes("sales-support-engineer") || designation.includes("engineer")) {
      return [allTabs[3], allTabs[4], allTabs[5]] // SSE can see unassigned and SSE assigned
    } else if (designation.includes("bdm") || designation.includes("business") || designation.includes("development")) {
      return [allTabs[6], allTabs[9]] // BDM can see unassigned and BDM assigned
    } else {
      return [allTabs[0]] // Default to just unassigned leads
    }
  }

  const availableTabs = getAvailableTabs()
  const validTabIds = availableTabs.map((tab) => tab.id)
  const availableMainTabs = getAvailableMainTabs()

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

  // Reset active tab when main tab changes for users with main tabs
  useEffect(() => {
    if (shouldShowMainTabs()) {
      setActiveTab(validTabIds[0])
    }
  }, [activeMainTab])

  // Ensure active main tab is valid for current user
  useEffect(() => {
    if (shouldShowMainTabs() && !availableMainTabs.includes(activeMainTab)) {
      setActiveMainTab(availableMainTabs[0])
    }
  }, [availableMainTabs, activeMainTab])

  // Scroll active tab into view when it changes
  useEffect(() => {
    if (activeTabRef.current && tabsContainerRef.current) {
      const container = tabsContainerRef.current
      const activeElement = activeTabRef.current

      // Calculate position to scroll to
      const scrollLeft = activeElement.offsetLeft - container.offsetWidth / 2 + activeElement.offsetWidth / 2

      // Smooth scroll to the active tab
      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      })
    }
  }, [activeTab])

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
  }

  const handleMainTabClick = (tabName) => {
    setActiveMainTab(tabName)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Main Tabs - Only visible for super admins and leadership roles */}
      {shouldShowMainTabs() && (
        <div className="border-b border-gray-200 w-full bg-gray-50">
          <div className="overflow-x-auto scrollbar-hide">
            <nav className="flex min-w-max">
              {availableMainTabs.includes("SalesTL") && (
                <button
                  onClick={() => handleMainTabClick("SalesTL")}
                  className={`py-3 sm:py-4 px-4 sm:px-8 border-b-2 font-medium text-sm sm:text-base flex items-center transition-colors duration-200 whitespace-nowrap
                    ${
                      activeMainTab === "SalesTL"
                        ? "border-red-600 text-red-700 bg-red-50"
                        : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
                    }`}
                >
                  <span className="font-semibold">Sales Team Lead</span>
                </button>
              )}
              {availableMainTabs.includes("SSE") && (
                <button
                  onClick={() => handleMainTabClick("SSE")}
                  className={`py-3 sm:py-4 px-4 sm:px-8 border-b-2 font-medium text-sm sm:text-base flex items-center transition-colors duration-200 whitespace-nowrap
                    ${
                      activeMainTab === "SSE"
                        ? "border-red-600 text-red-700 bg-red-50"
                        : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
                    }`}
                >
                  <span className="font-semibold">Site Support Engineer(SSE)</span>
                </button>
              )}
              {availableMainTabs.includes("BDM") && (
                <button
                  onClick={() => handleMainTabClick("BDM")}
                  className={`py-3 sm:py-4 px-4 sm:px-8 border-b-2 font-medium text-sm sm:text-base flex items-center transition-colors duration-200 whitespace-nowrap
                    ${
                      activeMainTab === "BDM"
                        ? "border-red-600 text-red-700 bg-red-50"
                        : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
                    }`}
                >
                  <span className="font-semibold">Business Development Manager</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="border-b border-gray-200 w-full">
        <div
          ref={tabsContainerRef}
          className="overflow-x-auto scrollbar-hide pb-1"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <nav className="flex min-w-max">
            {availableTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  ref={isActive ? activeTabRef : null}
                  onClick={() => handleTabClick(tab.id)}
                  className={`py-3 px-3 sm:px-4 border-b-2 font-medium text-sm flex items-center transition-colors duration-200
                    ${
                      isActive
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="ml-2 whitespace-nowrap">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          {availableTabs.map((tab) => activeTab === tab.id && <tab.component key={tab.id} />)}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default LeadsListing
