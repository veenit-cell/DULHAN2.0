import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavigationBar from './components/NavigationBar.tsx';
import Home from './pages/Home.tsx';
import AboutUs from './pages/AboutUs.tsx';
import Dashboard from './pages/Dashboard.tsx';
import BankLogin from './pages/BankLogin.tsx';
import BankRegister from './pages/BankRegister.tsx';
import BankWorkspace from './pages/BankWorkspace.tsx';
import SatarkFooter from './components/SatarkFooter.tsx';
import Preloader from './components/Preloader.tsx';
import SmoothScroll from './components/SmoothScroll.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
// @ts-ignore
import { neonCursor } from 'cursor-effects';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem('satark_token');
  const userRole = localStorage.getItem('user_role') || 'analyst';

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="min-h-screen"
      >
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/login" element={<BankLogin />} />
          <Route path="/register" element={<BankRegister />} />

          {/* Protected Routes */}
          <Route path="/bank-workspace" element={
            <ProtectedRoute allowedRoles={['analyst', 'supervisor', 'admin']}>
              <BankWorkspace />
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['analyst', 'supervisor', 'admin']}>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/bank-workspace');

  useEffect(() => {
  }, []);

  return (
    <div id="app">
      {!isDashboard && <NavigationBar />}
      <main className={!isDashboard ? "pt-24 min-h-screen px-4 md:px-8 relative" : "h-screen w-full overflow-hidden relative"}>
        <AnimatedRoutes />
      </main>
      {!isDashboard && <SatarkFooter />}
    </div>
  );
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <Preloader key="preloader" />}
      </AnimatePresence>
      <SmoothScroll>
        <Router>
            <AppContent />
        </Router>
      </SmoothScroll>
    </>
  );
}

export default App;
