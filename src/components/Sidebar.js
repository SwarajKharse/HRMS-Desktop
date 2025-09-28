import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  HiHome, 
  HiUsers, 
  HiCalendar, 
  HiClock, 
  HiCog, 
  HiChartPie, 
  HiCash, 
  HiArchive,
  HiDocumentAdd,
  HiViewList 
} from 'react-icons/hi';
import { HiOutlineBuildingStorefront, HiMiniShoppingBag  } from "react-icons/hi2";
import { GrProjects } from "react-icons/gr";
import { usePermissions } from "../contexts/PermissionsContext"
import { RiProductHuntLine } from "react-icons/ri";


import { FaUsers } from "react-icons/fa";
import { useEffect } from 'react';

function Sidebar({logo}) {
  const location = useLocation();
  const { permissions } = usePermissions();
  
  const [navItems, setNavItems] = useState([
    { icon: HiHome, label: 'Home', path: '/' }
  ]);

  useEffect(() => {
    const updatedNavItems = [
      { icon: HiHome, label: 'Home', path: '/' }
    ];
    if (permissions?.webReports) {
      updatedNavItems.push({ icon: HiChartPie, label: 'Reports', path: '/reports' });
    }
    if (permissions?.webOnboarding) {
      updatedNavItems.push({ icon: FaUsers, label: 'Onboarding', path: '/onboarding' });
    }
    if (permissions?.webLeave) {
      updatedNavItems.push({ icon: HiArchive, label: 'Leave Tracker', path: '/leave-tracker' });
    }
    if (permissions?.webAttendance) {
      updatedNavItems.push({ icon: HiCalendar, label: 'Attendance', path: '/attendance' });
    }
    if (permissions?.webPayroll) {
      updatedNavItems.push({ icon: HiCash, label: 'Payroll', path: '/payroll' });
    }

    if (permissions?.webAddLeads) {
      updatedNavItems.push({ icon: HiDocumentAdd, label: 'Add New Lead', path: '/add-lead' });
    }

    if (permissions?.webLeadsListing) {
      updatedNavItems.push({ icon: HiViewList, label: 'Leads', path: '/leads' });
    }

    if (permissions?.webProject) {
      updatedNavItems.push({ icon: GrProjects, label: 'Projects', path: '/projects' });
    }

    if (permissions?.webStore) {
      updatedNavItems.push({ icon: HiOutlineBuildingStorefront, label: 'Store', path: '/store' });
    }

    if (permissions?.webPurchase) {
      updatedNavItems.push({ icon: HiMiniShoppingBag, label: 'Purchase', path: '/purchase' });
    }

    if (permissions?.webProductManagement) {
      updatedNavItems.push({ icon: RiProductHuntLine, label: 'Product Management', path: '/product-management' });
    }

    if (permissions?.webAccounts) {
      updatedNavItems.push({ icon: RiProductHuntLine, label: 'Accounts', path: '/accounts' });
    }

    if (permissions?.webFinance) {
      updatedNavItems.push({ icon: RiProductHuntLine, label: 'Finance', path: '/finance' });
    }
    setNavItems(updatedNavItems);
  }, [permissions]);

  
  const sidebarVariants = {
    initial: {
      width: "100px",
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const navContainerVariants = {
    initial: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const menuItemVariants = {
    initial: {
      height: "72px",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const iconVariants = {
    initial: {
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const labelVariants = {
    initial: {
      y: 2,
      opacity: 0.7,
      fontSize: "11px",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <motion.div 
      variants={sidebarVariants}
      initial="initial"
      animate="initial"
      className="flex h-screen flex-col bg-gradient-to-b from-[#1E293B] to-[#0F172A] shadow-lg"
    >
      <div className="flex flex-col flex-1">
        <div className="relative min-h-[64px] border-b border-gray-700 flex items-center justify-center">
          {logo ? (
            <img src={logo} alt="logo" className="h-16 w-16" />
          ) : (
            <div className="flex items-center justify-center rounded-full bg-gray-300 text-gray-800 h-16 w-16">
              <span className="text-xl font-semibold">LOGO</span>
            </div>
          )}
        </div>

        <motion.nav 
          variants={navContainerVariants}
          initial="initial"
          animate="initial"
          className="flex-1 py-2 space-y-1 overflow-y-auto scrollbar-hide"
          style={{
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            '::-webkit-scrollbar': { display: 'none' }
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <motion.div
                key={item.path}
                variants={menuItemVariants}
                className="px-2"
              >
                <Link
                  to={item.path}
                  className={`w-full h-[60px] flex flex-col items-center justify-center rounded-lg
                    transition-colors duration-200 overflow-hidden
                    ${isActive 
                      ? 'bg-[#334155] text-white shadow-md' 
                      : 'text-gray-400 hover:bg-[#334155]/50 hover:text-gray-200'}`}
                >
                  <motion.div
                    variants={iconVariants}
                    className="mb-1"
                  >
                    <item.icon className="h-5 w-5" />
                  </motion.div>
                  <motion.span
                    variants={labelVariants}
                    className="text-center w-full px-1 truncate font-medium text-[11px]"
                  >
                    {item.label}
                  </motion.span>
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>
      </div>
    </motion.div>
  );
}

export default Sidebar;