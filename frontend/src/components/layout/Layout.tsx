import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { TaskModal } from '../tasks/TaskModal';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenTaskModal={() => setIsTaskModalOpen(true)}
      />

      {/* Main Container offset by sidebar width on large screens */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Navbar
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenTaskModal={() => setIsTaskModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ openTaskModal: () => setIsTaskModalOpen(true) }} />
        </main>
      </div>

      {/* Global Task Creation Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={() => {
          setIsTaskModalOpen(false);
          // Dispatch a refresh event so active views re-query data
          window.dispatchEvent(new Event('tasks:refresh'));
        }}
      />
    </div>
  );
};
