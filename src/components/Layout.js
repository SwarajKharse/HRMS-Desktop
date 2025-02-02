import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { motion } from 'framer-motion';

function Layout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* We use Tailwind’s responsive classes (using hidden md:block) so that the <Sidebar /> is only rendered on medium/large screens. (The rest of your layout remains unchanged.) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
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