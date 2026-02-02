import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { BottomNav } from './BottomNav';
import { PageTransition } from './PageTransition';
import { useState } from 'react';

export function AppLayout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden w-full">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
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
