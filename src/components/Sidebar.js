import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers, 
  FiUmbrella, 
  FiCalendar, 
  FiClock,
  FiMoreHorizontal,
  FiSettings,
  FiPieChart
} from 'react-icons/fi';

function Sidebar() {
  const location = useLocation();
  
  const navItems = [
    { icon: FiHome, label: 'Home', path: '/' },
    { icon: FiUsers, label: 'Onboarding', path: '/onboarding' },
    { icon: FiUmbrella, label: 'Leave Tracker', path: '/leave-tracker' },
    { icon: FiCalendar, label: 'Attendance', path: '/attendance' },
    { icon: FiCalendar, label: 'Payroll', path: '/payroll' },
    { icon: FiClock, label: 'Time Tracker', path: '/time-tracker' },
    { icon: FiMoreHorizontal, label: 'More', path: '#' },
    { icon: FiSettings, label: 'Operations', path: '/operations' },
    { icon: FiPieChart, label: 'Reports', path: '/reports' },
  ];

  const sidebarVariants = {
    initial: {
      width: "80px",
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
      height: "64px",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const iconVariants = {
    initial: {
      scale: 1.1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const labelVariants = {
    initial: {
      y: 4,
      opacity: 0.7,
      fontSize: "10px",
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
      className="flex h-screen flex-col bg-[#1a237e] shadow-lg"
    >
      <div className="flex flex-col flex-1">
        <div className="relative min-h-[64px] border-b border-white/10 flex items-center justify-center">
          <motion.h1
            variants={labelVariants}
            initial="initial"
            animate="initial"
            className="text-white/90 font-semibold absolute"
          >
            HRMS
          </motion.h1>
        </div>

        <motion.nav 
          variants={navContainerVariants}
          initial="initial"
          animate="initial"
          className="flex-1 p-3 space-y-2"
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <motion.div
                key={item.path}
                variants={menuItemVariants}
                className={`w-full relative overflow-hidden rounded-md ${
                  isActive ? 'bg-white/10' : ''
                }`}
              >
                <Link
                  to={item.path}
                  className={`w-full h-full flex items-center justify-center px-2 py-3
                    text-white/80 hover:text-white transition-colors duration-200
                    ${isActive ? 'text-white' : ''}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      variants={iconVariants}
                    >
                      <item.icon className="h-5 w-5" />
                    </motion.div>
                    <motion.span
                      variants={labelVariants}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  </div>
                </Link>
                
                {isActive && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute top-0 h-full bg-white"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </motion.nav>
      </div>
    </motion.div>
  );
}

export default Sidebar;