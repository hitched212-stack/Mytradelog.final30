import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { BottomNav } from './BottomNav';
import { PageTransition } from './PageTransition';
import { useState, useEffect } from 'react';

export function AppLayout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  // Listen for storage changes to sync sidebar state across pages
  useEffect(() => {
    const handleStorageChange = () => {
      setIsCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
    };

    // Custom event for same-tab updates
    window.addEventListener('sidebar-toggle', handleStorageChange);
    // Storage event for cross-tab updates
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('sidebar-toggle', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden w-full">
      <Sidebar />
      {/* Spacer for floating sidebar - only on desktop (sidebar width + margins) */}
      <div className={`hidden md:block flex-shrink-0 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? 'w-[88px]' : 'w-[280px]'}`} />
      <div className="flex-1 flex flex-col relative min-w-0 w-full" style={{ zIndex: 2 }}>
        <MobileHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full pb-24 md:pb-0">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
