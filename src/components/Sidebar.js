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
  HiArchive 
} from 'react-icons/hi';

import { FaUsers } from "react-icons/fa";

function Sidebar() {
  const location = useLocation();
  
  const navItems = [
    { icon: HiHome, label: 'Home', path: '/' },
    { icon: HiChartPie, label: 'Reports', path: '/reports' },
    { icon: FaUsers, label: 'Onboarding', path: '/onboarding' },
    { icon: HiArchive, label: 'Leave Tracker', path: '/leave-tracker' },
    { icon: HiCalendar, label: 'Attendance', path: '/attendance' },
    { icon: HiCash, label: 'Payroll', path: '/payroll' },
  ];

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
          <motion.h1
            variants={labelVariants}
            initial="initial"
            animate="initial"
            className="text-gray-200 font-medium text-base tracking-wide"
          >
            <img src="/logo.png" alt="logo" className="h-16 w-16">
            </img>
          </motion.h1>
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