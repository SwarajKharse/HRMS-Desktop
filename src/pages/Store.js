"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import NewProjects from "../components/StoreManagement/NewProjects"
import StoreMaterialRequisitions from "../components/StoreManagement/StoreMaterialRequisitions"
import StoreInchargeMaterialRequisitionNew from "../components/StoreManagement/StoreIncharge/StoreInchargeMaterialRequisitionNew"
import DeliveryChallan from "../components/StoreManagement/DeliveryChallan"
import { GrWorkshop } from "react-icons/gr"
import { useAuth } from "../contexts/AuthContext"
import { TbTruckDelivery } from "react-icons/tb"

function Projects() {
  const { employee } = useAuth()
  const tabsContainerRef = useRef(null)
  const activeTabRef = useRef(null)

  const [activeMainTab, setActiveMainTab] = useState("StoreManager")

  const allTabs = [
    { id: "new-projects", label: "New Projects", icon: GrWorkshop, component: NewProjects },
    { id: "mtr", label: "Material Requisitions", icon: GrWorkshop, component: StoreMaterialRequisitions },
    { id: "dc-qty-list-store-manager", label: "DC Quantities", icon: TbTruckDelivery, component: DeliveryChallan },
    { id: "store-incharge-mtr", label: "My Material Requisitions", icon: GrWorkshop, component: StoreInchargeMaterialRequisitionNew },
  ]

  const designation = employee?.designation?.name?.replace(/\s+/g, "-").toLowerCase() || ""

  const isManagement = () => designation.includes("director") || designation.includes("vice-president")
  const isManager = () => designation.includes("store-manager")
  const isSubordinate = () => designation.includes("store-incharge")

  const shouldShowMainTabs = () => isManagement() || isManager()

  const getAvailableMainTabs = () => {
    if (isManagement() || isManager()) return ["StoreManager", "StoreIncharge"]
    return []
  }

  const getAvailableTabs = () => {
    if (!employee) return []
    if (shouldShowMainTabs()) {
      if (activeMainTab === "StoreManager") return [allTabs[0], allTabs[1], allTabs[2]]
      if (activeMainTab === "StoreIncharge") return [allTabs[3], allTabs[2]]
    }
    if (isSubordinate()) return [allTabs[3], allTabs[2]]
    return []
  }

  const availableTabs = getAvailableTabs()
  const validTabIds = availableTabs.map((tab) => tab.id)
  const availableMainTabs = getAvailableMainTabs()

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTab = sessionStorage.getItem("storeActiveTab")
      return validTabIds.includes(savedTab) ? savedTab : validTabIds[0]
    }
    return validTabIds[0]
  })

  useEffect(() => {
    sessionStorage.setItem("storeActiveTab", activeTab)
  }, [activeTab])

  useEffect(() => {
    if (!validTabIds.includes(activeTab)) setActiveTab(validTabIds[0])
  }, [validTabIds, activeTab])

  useEffect(() => {
    if (shouldShowMainTabs()) setActiveTab(validTabIds[0])
  }, [activeMainTab])

  useEffect(() => {
    if (shouldShowMainTabs() && !availableMainTabs.includes(activeMainTab)) {
      setActiveMainTab(availableMainTabs[0])
    }
  }, [availableMainTabs, activeMainTab])

  useEffect(() => {
    if (activeTabRef.current && tabsContainerRef.current) {
      const container = tabsContainerRef.current
      const activeElement = activeTabRef.current
      const scrollLeft = activeElement.offsetLeft - container.offsetWidth / 2 + activeElement.offsetWidth / 2
      container.scrollTo({ left: scrollLeft, behavior: "smooth" })
    }
  }, [activeTab])

  const handleTabClick = (tabId) => setActiveTab(tabId)
  const handleMainTabClick = (tabName) => setActiveMainTab(tabName)

  const mainTabLabels = {
    StoreManager: "Store Manager",
    StoreIncharge: "Store Incharge",
  }

  return (
    <div className="flex flex-col gap-6">
      {shouldShowMainTabs() && (
        <div className="border-b border-gray-200 w-full bg-gray-50">
          <div className="overflow-x-auto scrollbar-hide">
            <nav className="flex min-w-max">
              {availableMainTabs.map((mt) => (
                <button
                  key={mt}
                  onClick={() => handleMainTabClick(mt)}
                  className={`py-3 sm:py-4 px-4 sm:px-8 border-b-2 font-medium text-sm sm:text-base flex items-center transition-colors duration-200 whitespace-nowrap
                    ${activeMainTab === mt
                      ? "border-red-600 text-red-700 bg-red-50"
                      : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
                    }`}
                >
                  <span className="font-semibold">{mainTabLabels[mt]}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200 w-full">
        <div ref={tabsContainerRef} className="overflow-x-auto scrollbar-hide pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
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
                    ${isActive ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="ml-2 whitespace-nowrap">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }} className="w-full">
          {availableTabs.map((tab) => activeTab === tab.id && <tab.component key={tab.id} />)}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default Projects