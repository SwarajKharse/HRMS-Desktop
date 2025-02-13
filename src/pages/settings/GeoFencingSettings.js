import { useState, useEffect } from "react";
import GeoFencing from "../../components/GeoFences/GeoFencing";
import EmployeeList from "../../components/GeoFences/EmployeeList";

const VALID_TABS = ["geoFences", "employee-list"]

function GeoFencingSettings() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTab = sessionStorage.getItem("geoFencingTab")
      return VALID_TABS.includes(savedTab) ? savedTab : "geoFences"
    }
    return "geoFences"
  });

  useEffect(() => {
    sessionStorage.setItem("geoFencingTab", activeTab)
  }, [activeTab]);

  const tabs = [
    { id: "geoFences", label: "Geo Fences" },
    { id: "employee-list", label: "Employee List" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="settings__content">
        {activeTab === "geoFences" ? <GeoFencing /> : <EmployeeList />}
      </div>
    </div>
  );
}

export default GeoFencingSettings;