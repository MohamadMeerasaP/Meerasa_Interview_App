"use client"

import React, { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { UserContext } from "../context/userContext"
import "./navbar.css"

export default function Navbar() {
  const { user } = useContext(UserContext)
  const navigate  = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  // ── extract display name ──────────────────────────
  // tries: display_name → full_name → email prefix → "User"
  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name     ||
    user?.email?.split("@")[0]         ||
    "User"

  // ── logout handler ────────────────────────────────
  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    setLoggingOut(false)
    navigate("/login")
  }

  return (
    <nav className="navbar">
      {/* ── brand ── */}
      <div className="navbar-brand" onClick={() => navigate("/")}>
        <span className="navbar-brand-dot" />
        <span className="navbar-brand-name">Meerasa's Prep</span>
      </div>

      {/* ── right side ── */}
      <div className="navbar-right">
        {user && (
          <>
            {/* greeting */}
            <div className="navbar-greeting">
              <span className="navbar-greeting-hello">Hello,</span>
              <span className="navbar-greeting-name">{displayName}</span>
            </div>

            {/* divider */}
            <span className="navbar-divider" />

            {/* logout button */}
            <button
              className={`navbar-logout${loggingOut ? " logging-out" : ""}`}
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign out"
              aria-label="Sign out"
            >
              {loggingOut ? (
                <span className="navbar-spinner" />
              ) : (
                /* power-off icon */
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3v9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6.34 6.34a9 9 0 1 0 11.32 0"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </>
        )}
      </div>
    </nav>
  )
}