import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminDashboardPage } from './admin/AdminDashboardPage';
import { UserDashboardPage } from './user/UserDashboardPage';

export const DashboardPage: React.FC = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboardPage /> : <UserDashboardPage />;
};
