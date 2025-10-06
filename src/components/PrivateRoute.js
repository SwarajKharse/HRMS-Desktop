import { Navigate, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"

function PrivateRoute({ children }) {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem("jwtToken")

    if (!token) {
      setIsAuthenticated(false)
      setIsChecking(false)
      return
    }

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      const isExpired = payload.exp * 1000 < Date.now()

      if (isExpired) {
        // Token is expired, clear localStorage
        localStorage.removeItem("jwtToken")
        localStorage.removeItem("deviceId")
        localStorage.removeItem("user")
        setIsAuthenticated(false)
      } else {
        setIsAuthenticated(true)
      }
    } catch (error) {
      // Invalid token format
      localStorage.removeItem("jwtToken")
      localStorage.removeItem("deviceId")
      localStorage.removeItem("user")
      setIsAuthenticated(false)
    }

    setIsChecking(false)
  }, [])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}

export default PrivateRoute;