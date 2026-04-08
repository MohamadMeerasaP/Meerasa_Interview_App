"use client"

import React, { useContext } from "react"
import { useNavigate } from "react-router-dom"
import { UserContext } from "../context/userContext"

export default function LandingPage() {
  const { user } = useContext(UserContext)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white text-center px-6">

      <h1 className="text-4xl font-bold mb-4">
        Meerasa Interview Prep 🚀
      </h1>

      <p className="text-gray-600 mb-6 max-w-md">
        Practice curated interview questions, track your progress,
        and crack your dream job.
      </p>

      <button
        onClick={() => navigate(user ? "/" : "/login")}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg"
      >
        {user ? "Continue Practice" : "Get Started"}
      </button>
    </div>
  )
}