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
      id: "leave",
      name: "Leave Settings",
      description: "Configure leave policies and tracking",
      icon: MdSchedule,
      color: "bg-green-500",
      category: "attendance",
      link: "/settings/leave",
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
      id: "tds-slabs",
      name: "TDS Slab Settings",
      description: "Configure tax deduction slabs",
      icon: BiMoney,
      color: "bg-emerald-500",
      category: "payroll",
      link: "/settings/tds-slabs",
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
    <div className="p-6 space-y-8">
      {/* Search and Categories */}
      <div className="flex flex-col gap-8">
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