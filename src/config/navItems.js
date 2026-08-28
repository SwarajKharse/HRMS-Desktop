import { HiHome, HiChartPie, HiArchive, HiCalendar, HiCash, HiDocumentAdd, HiViewList } from "react-icons/hi";
import { HiOutlineBuildingStorefront, HiMiniShoppingBag } from "react-icons/hi2";
import { GrProjects } from "react-icons/gr";
import { FaUsers } from "react-icons/fa";
import { RiProductHuntLine, RiMoneyRupeeCircleLine } from "react-icons/ri";
import { MdOutlineAccountBalance } from "react-icons/md";

// Single source of truth for the permission-gated navigation modules.
// Sidebar.js, Navbar.js (mobile dropdown), and the mobile home tile grid
// all render from this same list so they never drift out of sync.
export function getNavItems(permissions) {
  const navItems = [{ icon: HiHome, label: "Home", path: "/" }];

  if (permissions?.webReports) {
    navItems.push({ icon: HiChartPie, label: "Reports", path: "/reports" });
  }
  if (permissions?.webOnboarding) {
    navItems.push({ icon: FaUsers, label: "Onboarding", path: "/onboarding" });
  }
  if (permissions?.webLeave) {
    navItems.push({ icon: HiArchive, label: "Leave Tracker", path: "/leave-tracker" });
  }
  if (permissions?.webAttendance) {
    navItems.push({ icon: HiCalendar, label: "Attendance", path: "/attendance" });
  }
  if (permissions?.webPayroll) {
    navItems.push({ icon: HiCash, label: "Payroll", path: "/payroll" });
  }
  if (permissions?.webAddLeads) {
    navItems.push({ icon: HiDocumentAdd, label: "Add New Lead", path: "/add-lead" });
  }
  if (permissions?.webLeadsListing) {
    navItems.push({ icon: HiViewList, label: "Leads", path: "/leads" });
  }
  if (permissions?.webProject) {
    navItems.push({ icon: GrProjects, label: "Projects", path: "/projects" });
  }
  if (permissions?.webStore) {
    navItems.push({ icon: HiOutlineBuildingStorefront, label: "Store", path: "/store" });
  }
  if (permissions?.webPurchase) {
    navItems.push({ icon: HiMiniShoppingBag, label: "Purchase", path: "/purchase" });
  }
  if (permissions?.webProductManagement) {
    navItems.push({ icon: RiProductHuntLine, label: "Product Management", path: "/product-management" });
  }
  if (permissions?.webAccounts) {
    navItems.push({ icon: MdOutlineAccountBalance, label: "Accounts", path: "/accounts" });
  }
  if (permissions?.webFinance) {
    navItems.push({ icon: RiMoneyRupeeCircleLine, label: "Finance", path: "/finance" });
  }

  return navItems;
}
