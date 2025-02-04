// Utility function to clear all tab-related storage
export const clearTabStorage = () => {
    localStorage.removeItem("activeTab")
    localStorage.removeItem("reportsActiveTab")
    localStorage.removeItem("leaveTrackerActiveTab")
    localStorage.removeItem("attendanceActiveTab")
    localStorage.removeItem("orgSettingsActiveTab")
}  