import React, { useContext } from "react"
import { Navigate } from "react-router-dom"
import { UserContext } from "../context/userContext"

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(UserContext)

  // Wait until session restore completes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  // Only redirect AFTER loading completes
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}