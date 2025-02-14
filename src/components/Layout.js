import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { fetchEmployee } from '../services/api';

function Layout({ children }) {

  const { user } = useAuth(); // Add this line
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const getUserData = async () => {
      try {
        if (user?.sub) {
          const data = await fetchEmployee(user.sub);
          console.log('User data:', data);
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    getUserData();
  }, [user]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* We use Tailwind’s responsive classes (using hidden md:block) so that the <Sidebar /> is only rendered on medium/large screens. (The rest of your layout remains unchanged.) */}
      <div className="hidden md:block">
        <Sidebar logo={userData?.org?.logoUrl} />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar userData={userData} />
        <motion.main 
          className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

export default Layout;