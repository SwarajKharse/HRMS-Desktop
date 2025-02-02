import { useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { FiSettings, FiSearch } from "react-icons/fi"
import { BiBuildingHouse, BiTime, BiWallet, BiGroup, BiCog, BiMoney } from "react-icons/bi"
import { MdLocationOn, MdPayments, MdSchedule, MdAlternateEmail } from "react-icons/md"
import Tilt from "react-parallax-tilt"

function Settings() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const services = [
    {
      id: "organization",
      name: "Organization Settings",
      description: "Manage your organization structure and policies",
      icon: BiGroup,
      color: "bg-purple-500",
      category: "organization",
      link: `/settings/organization`,
    },
    {
      id: "leave-tracker",
      name: "Leave Tracker",
      description: "Configure leave policies and tracking",
      icon: MdSchedule,
      color: "bg-green-500",
      category: "attendance",
      link: "/settings/leave-tracker",
    },
    {
      id: "attendance-settings",
      name: "Attendance Settings",
      description: "Set up attendance rules and policies",
      icon: BiTime,
      color: "bg-blue-500",
      category: "attendance",
      link: "/settings/attendance-settings",
    },
    {
      id: "holiday",
      name: "Holiday Settings",
      description: "Manage company holidays and events",
      icon: MdAlternateEmail,
      color: "bg-yellow-500",
      category: "attendance",
      link: "/settings/holiday",
    },
    {
      id: "geoFencing",
      name: "Geo Fencing Settings",
      description: "Configure location-based attendance",
      icon: MdLocationOn,
      color: "bg-red-500",
      category: "location",
      link: "/settings/geoFencing",
    },
    {
      id: "payroll-settings",
      name: "Payroll Settings",
      description: "Configure salary and payment rules",
      icon: MdPayments,
      color: "bg-emerald-500",
      category: "payroll",
      link: "/settings/payroll-settings",
    },
    {
      id: "employee-payroll-settings",
      name: "Employee Payroll Settings",
      description: "Manage individual employee compensation",
      icon: BiMoney,
      color: "bg-pink-500",
      category: "payroll",
      link: "/settings/employee-payroll-settings",
    },
  ]

  const categories = [
    { id: "all", name: "All Settings", icon: BiCog },
    { id: "organization", name: "Organization", icon: BiBuildingHouse },
    { id: "attendance", name: "Attendance", icon: BiTime },
    { id: "location", name: "Location", icon: MdLocationOn },
    { id: "payroll", name: "Payroll", icon: BiWallet },
  ]

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory === "all" || service.category === selectedCategory),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <FiSettings className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
              >
                Safety Saarthi
              </motion.h1>
              <p className="text-gray-500 font-medium">System Settings & Configuration</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search and Categories */}
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative max-w-2xl mx-auto"
        >
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all duration-300"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-2 justify-center"
        >
          {categories.map((category) => (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                selectedCategory === category.id
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <category.icon className="w-4 h-4" />
              {category.name}
            </motion.button>
          ))}
        </motion.div>

        {/* Services Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          <AnimatePresence>
            {filteredServices.map((service) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={2000}>
                  <Link to={service.link} className="block h-full">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 ${service.color} rounded-xl shadow-lg`}>
                          <service.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h3>
                          <p className="text-sm text-gray-500 leading-relaxed">{service.description}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Tilt>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

export default Settings;