import React from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import InterviewSetsApp from "./components/InterviewSetsApp"
import LandingPage from "./pages/LandingPage"
import Login from "./pages/Login"

import { UserProvider } from "./context/userContext"

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>

          {/* ✅ MAIN APP (unchanged) */}
          <Route path="/" element={<InterviewSetsApp />} />

          {/* ✅ NEW LANDING PAGE */}
          <Route path="/home" element={<LandingPage />} />

          <Route path="/login" element={<Login />} />

        </Routes>
      </BrowserRouter>
    </UserProvider>
  )
}