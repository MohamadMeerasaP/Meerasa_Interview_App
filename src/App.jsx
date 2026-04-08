import React from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import InterviewSetsApp from "./components/InterviewSetsApp"
import LandingPage from "./pages/LandingPage"

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

        </Routes>
      </BrowserRouter>
    </UserProvider>
  )
}