"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import NewProjects from "../components/StoreManagement/NewProjects"
import MaterialRequisitions from "../components/StoreManagement/MaterialRequisitions"
import { GrWorkshop } from "react-icons/gr"
import { useAuth } from "../contexts/AuthContext"

function Projects() {
  const { employee } = useAuth()
  const tabsContainerRef = useRef(null)
  const activeTabRef = useRef(null)

  // Define available tabs based on employee designation
  const getAvailableTabs = () => {
    const allTabs = [
      {
        id: "new-projects",
        label: "New Projects",
        icon: GrWorkshop,
        component: NewProjects,
      },
      {
        id: "mtr",
        label: "MaterialRequisitions",
        icon: GrWorkshop,
        component: MaterialRequisitions,
      }
    ]

    if (!employee) return [allTabs[0]] // Default to unassigned leads if no employee
    const designation = employee.designation.name.replace(/\s+/g, "-").toLowerCase() || ""

    // Filter tabs based on designation
   /*  if (designation.includes("director")) {
      return allTabs // Admin/Manager can see all tabs
    } else if (designation.includes("sales-team-leader") || designation.includes("leader")) {
      return [allTabs[0], allTabs[1], allTabs[2], allTabs[7], allTabs[8]] // BDM can see unassigned and BDM assigne
    } else if (designation.includes("sales-support-engineer") || designation.includes("engineer")) {
      return [allTabs[3], allTabs[4], allTabs[5]] // SSE can see unassigned and SSE assigned
    } else if (designation.includes("bdm") || designation.includes("business") || designation.includes("development")) {
      return [allTabs[6]] // BDM can see unassigned and BDM assigned
    } else {
      return [allTabs[0]] // Default to just unassigned leads
    } */
    
    return allTabs
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

  return (
    <div className="flex flex-col gap-6">
      {/* Navigation Tabs - Now with horizontal scrolling */}
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

export default Projects
