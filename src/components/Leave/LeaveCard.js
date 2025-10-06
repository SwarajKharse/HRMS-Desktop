import { motion } from "framer-motion"

function LeaveCard({ title, icon, color, available, balance }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} className={`${color} rounded-lg p-4 space-y-2`}>
      <div className="flex items-center justify-between">
        <div className="p-2 bg-white rounded-lg">{icon}</div>
      </div>
      <h3 className="font-medium text-gray-900">{title}</h3>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Available</span>
        <span className="font-medium text-gray-900">{available}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Balance</span>
        <span className="font-medium text-gray-900">{balance}</span>
      </div>
    </motion.div>
  )
}

export default LeaveCard;