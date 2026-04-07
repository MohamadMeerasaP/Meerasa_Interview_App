import React from "react";
import InterviewSetsApp from "./components/InterviewSetsApp";
import { UserProvider } from "./context/userContext";

export default function App() {
  return (
    <UserProvider>
      <InterviewSetsApp />
    </UserProvider>
  );
}