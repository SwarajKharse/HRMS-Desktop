import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { format, addDays, subDays } from "date-fns"
import { leaveReportService } from "../../services/leaveReportService"
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

function DailyLeaveStatus() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [leaveData, setLeaveData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchLeaveData()
  }, [selectedDate]);

  const fetchLeaveData = async () => {
    try {
      setLoading(true)
      const data = await leaveReportService.getDailyLeaveStatus(selectedDate)
      setLeaveData(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1))
  }

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1))
  }

  const leaveDistribution = leaveData.reduce((acc, leave) => {
    acc[leave.leaveTypeName] = (acc[leave.leaveTypeName] || 0) + 1
    return acc
  }, {})

  const pieChartData = Object.entries(leaveDistribution).map(([type, count]) => ({
    name: type,
    value: count,
  }))

  const COLORS = ["#FF9F43", "#7367F0", "#28C76F", "#EA5455"]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6 rounded-xl bg-red-50 border border-red-100">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Centered Date Navigation */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-xl shadow-sm border border-blue-100">
          <button
            onClick={handlePreviousDay}
            className="p-1 rounded-lg hover:bg-white/80 transition-colors duration-200"
          >
            <FiChevronLeft className="w-4 h-4 text-blue-600" />
          </button>

          <h2 className="text-sm font-medium text-gray-800">{format(selectedDate, "dd MMM yyyy")}</h2>

          <button onClick={handleNextDay} className="p-1 rounded-lg hover:bg-white/80 transition-colors duration-200">
            <FiChevronRight className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leave Requests Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaveData.map((leave, index) => (
                    <motion.tr
                      key={leave.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {leave.profilePhotoUrl ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
                              src={leave.profilePhotoUrl || "/placeholder.svg"}
                              alt={leave.firstName}
                            />
                          ) : (
                            <span className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-medium text-sm border-2 border-white shadow-sm">
                              {leave.firstName[0]}
                              {leave.lastName[0]}
                            </span>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {leave.firstName} {leave.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                          {leave.leaveTypeName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{leave.leaveCategory}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{leave.reason}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Leave Distribution Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 text-center mb-6">Leave Distribution</h3>
          <div className="flex justify-center items-center h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DailyLeaveStatus;