import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminTasksPage } from './admin/AdminTasksPage';
import { UserTasksPage } from './user/UserTasksPage';

export const TasksPage: React.FC = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminTasksPage /> : <UserTasksPage />;
};
