import { useState, useEffect } from "react";
import { roleBasedPermissionService } from "../../services/roleBasedPermissionService";
import { Switch } from "@headlessui/react";
import { RiUserSettingsLine, RiShieldUserLine } from "react-icons/ri";
import { authService } from "../../services/authService";

const RoleBasedSettings = () => {
  const [view, setView] = useState("organization"); // "organization" or "individual"
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [savingEmployeeId, setSavingEmployeeId] = useState(null);
  const orgId = authService.getUser()?.orgId;

  // Group permissions by category for better organization
  const permissionGroups = {
    app: {
      title: "Mobile App Permissions",
      permissions: [
        { key: "appClients", label: "Clients" },
        { key: "appSurveys", label: "Surveys" },
        { key: "appForms", label: "Forms" },
        { key: "appAmc", label: "AMC" },
        { key: "appLeave", label: "Leave" },
        { key: "appAcceptLeave", label: "Accept Leave" },
        { key: "appAttendance", label: "Attendance" },
        { key: "appHolidays", label: "Holidays" },
        { key: "appPayroll", label: "Payroll"},
        { key: "appProfile", label: "Profile" },
      ],
    },
    webSurvey: {
      title: "Web Survey Permissions",
      permissions: [
        { key: "webDashboard", label: "Dashboard" },
        { key: "webSurveys", label: "Surveys" },
        { key: "webEditSurveys", label: "Edit Surveys" },
        { key: "webDocuments", label: "Documents" },
        { key: "webFillAndEditDocuments", label: "Fill & Edit Documents" },
        { key: "webAmc", label: "AMC" },
        { key: "webFillAndEditAmc", label: "Fill & Edit AMC" },
        { key: "webNbc", label: "NBC" },
      ],
    },
    webHRMS:{
      title: "Web HRMS Permissions",
      permissions: [
        { key: "webSettings", label: "Settings" },
        { key: "webOnboarding", label: "Onboarding" },
        { key: "webReports", label: "Reports" },
        { key: "webLeave", label: "Leave" },
        { key: "webAcceptLeave", label: "Accept Leave" },
        { key: "webHrOptions", label: "HR Options" },
        { key: "webAttendance", label: "Attendance" },
        { key: "webPayroll", label: "Payroll" },
        { key: "webProfile", label: "Profile" },
      ],
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [orgId]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data = await roleBasedPermissionService.getByOrgId(orgId);
      setPermissions(data);
      if(selectedEmployee) {
        setSelectedEmployee(data.find(p => p.employee.id === selectedEmployee.employee.id));
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (employeeId, permissionKey, value) => {
    try {
      setSavingEmployeeId(employeeId);
      const employeePermission = permissions.find(
        (p) => p.employee.id === employeeId
      );
      if (!employeePermission) return;

      const updatedPermission = {
        ...employeePermission,
        [permissionKey]: value,
      };

      await roleBasedPermissionService.updatePermission(updatedPermission);
      
      // Update local state
      setPermissions(
        permissions.map((p) =>
          p.employee.id === employeeId ? { ...p, [permissionKey]: value } : p
        )
      );
      
      // Also update the selected employee (if open)
      if (
        selectedEmployee &&
        selectedEmployee.employee.id === employeeId
      ) {
        setSelectedEmployee({ ...selectedEmployee, [permissionKey]: value });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEmployeeId(null);
    }
  };

  const handleAllowAll = async (employeeId) => {
    try {
      setSavingEmployeeId(employeeId);
      await roleBasedPermissionService.allowAllPermissions(employeeId);
      // Update local state for that employee: set all permissions to true
      setPermissions(
        permissions.map((p) => {
          if (p.employee.id === employeeId) {
            const updated = { ...p };
            Object.values(permissionGroups).forEach((group) => {
              group.permissions.forEach(({ key }) => {
                updated[key] = true;
              });
            });
            if (
              selectedEmployee &&
              selectedEmployee.employee.id === employeeId
            ) {
              setSelectedEmployee(updated);
            }
            return updated;
          }
          return p;
        })
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEmployeeId(null);
    }
  };

  const handleResetPermissions = async (employeeId) => {
    try {
      setSavingEmployeeId(employeeId);
      await roleBasedPermissionService.resetPermissions(employeeId);
      // Re-fetch all permissions to get the reset values
      await fetchPermissions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEmployeeId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        <p className="font-medium">Error loading permissions</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Role-Based Access Control
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView("organization")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              view === "organization"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <RiShieldUserLine className="w-5 h-5" />
            Organization View
          </button>
          <button
            onClick={() => setView("individual")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              view === "individual"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <RiUserSettingsLine className="w-5 h-5" />
            Individual View
          </button>
        </div>
      </div>

      {view === "organization" ? (
        // Organization View
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-indigo-50">
              <tr>
                <th
                  rowSpan="2"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider sticky left-0 bg-indigo-50 z-10"
                >
                  Employee
                </th>
                {Object.values(permissionGroups).map((group) => (
                  <th
                    key={group.title}
                    colSpan={group.permissions.length}
                    className="text-center text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    {group.title}
                  </th>
                ))}
                <th
                  rowSpan="2"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider sticky right-0 bg-indigo-50 z-10"
                >
                  Actions
                </th>
              </tr>
              <tr>
                {Object.values(permissionGroups).map((group) =>
                  group.permissions.map(({ key, label }) => (
                    <th
                      key={key}
                      className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider"
                    >
                      {label}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permissions.map((permission) => (
                <tr key={permission.employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 h-10 w-10">
                        {permission.employee.profilePhotoUrl ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={permission.employee.profilePhotoUrl || "/placeholder.svg"}
                            alt=""
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {permission.employee.firstName?.[0]}
                              {permission.employee.lastName?.[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {permission.employee.firstName} {permission.employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {permission.employee.employeeCode}
                        </div>
                      </div>
                    </div>
                  </td>
                  {Object.values(permissionGroups).map((group) =>
                    group.permissions.map(({ key }) => (
                      <td key={key} className="px-6 py-4 whitespace-nowrap text-center">
                        <Switch
                          checked={permission[key]}
                          onChange={(value) =>
                            handlePermissionChange(permission.employee.id, key, value)
                          }
                          className={`${
                            permission[key] ? "bg-indigo-600" : "bg-gray-300"
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              permission[key] ? "translate-x-6" : "translate-x-1"
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </td>
                    ))
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-center sticky right-0 bg-white z-10">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleAllowAll(permission.employee.id)}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                        disabled={savingEmployeeId === permission.employee.id}
                      >
                        Allow All
                      </button>
                      <button
                        onClick={() => handleResetPermissions(permission.employee.id)}
                        className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        disabled={savingEmployeeId === permission.employee.id}
                      >
                        Reset
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Individual View
        <div className="grid gap-6">
          {/* Employee Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {permissions.map((permission) => (
              <div
                key={permission.employee.id}
                onClick={() => setSelectedEmployee(permission)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedEmployee?.employee.id === permission.employee.id
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 hover:border-indigo-500"
                }`}
              >
                <div className="flex items-center gap-4">
                  {permission.employee.profilePhotoUrl ? (
                    <img
                      className="h-12 w-12 rounded-full"
                      src={permission.employee.profilePhotoUrl || "/placeholder.svg"}
                      alt=""
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {permission.employee.firstName?.[0]}
                        {permission.employee.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-800">
                      {permission.employee.firstName} {permission.employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {permission.employee.employeeCode}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Permission Settings for Selected Employee */}
          {selectedEmployee && (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-800">
                  Permissions for {selectedEmployee.employee.firstName} {selectedEmployee.employee.lastName}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAllowAll(selectedEmployee.employee.id)}
                    className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
                    disabled={savingEmployeeId === selectedEmployee.employee.id}
                  >
                    Allow All
                  </button>
                  <button
                    onClick={() => handleResetPermissions(selectedEmployee.employee.id)}
                    className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600"
                    disabled={savingEmployeeId === selectedEmployee.employee.id}
                  >
                    Reset
                  </button>
                </div>
              </div>
              {Object.entries(permissionGroups).map(([groupKey, group]) => (
                <div key={groupKey} className="space-y-4">
                  <h4 className="font-medium text-gray-700">{group.title}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.permissions.map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                        <Switch
                          checked={selectedEmployee[key]}
                          onChange={(value) =>
                            handlePermissionChange(selectedEmployee.employee.id, key, value)
                          }
                          className={`${
                            selectedEmployee[key] ? "bg-indigo-600" : "bg-gray-300"
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              selectedEmployee[key] ? "translate-x-6" : "translate-x-1"
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoleBasedSettings;