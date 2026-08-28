"use client"

import NewProjects from "../NewProjects"

// Purchaser view of the Projects page — same tiles as the Purchase Manager,
// but limited to projects assigned to the logged-in purchaser.
function MyAssignedProjects() {
  return <NewProjects assignedOnly />
}

export default MyAssignedProjects
