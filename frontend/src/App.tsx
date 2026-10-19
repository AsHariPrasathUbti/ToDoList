import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicRoute } from './routes/PublicRoute';
import { RoleBasedRoute } from './routes/RoleBasedRoute';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminTasksPage } from './pages/admin/AdminTasksPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminDatabasePage } from './pages/admin/AdminDatabasePage';
import { UserDashboardPage } from './pages/user/UserDashboardPage';
import { UserTasksPage } from './pages/user/UserTasksPage';
import { SettingsPage } from './pages/SettingsPage';
import { ToastContainer } from './components/common/ToastContainer';
import { Loader2 } from 'lucide-react';

// The index page displays the login form for unauthenticated users, or redirects authenticated users to their respective role dashboard
const IndexOrLoginPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'Admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  }

  return <LoginPage />;
};

const TasksRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={user.role === 'Admin' ? '/admin/tasks' : '/user/tasks'} replace />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ToastContainer />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Index page acts as login page for unauthenticated users */}
              <Route path="/" element={<IndexOrLoginPage />} />
              <Route path="/login" element={<IndexOrLoginPage />} />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />

              {/* Protected App Routes wrapped inside the Layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Admin Role-Based Routes */}
                <Route
                  path="admin/dashboard"
                  element={
                    <RoleBasedRoute allowedRoles={['Admin']}>
                      <AdminDashboardPage />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="admin/tasks"
                  element={
                    <RoleBasedRoute allowedRoles={['Admin']}>
                      <AdminTasksPage />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="admin/users"
                  element={
                    <RoleBasedRoute allowedRoles={['Admin']}>
                      <AdminUsersPage />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="admin/database"
                  element={
                    <RoleBasedRoute allowedRoles={['Admin']}>
                      <AdminDatabasePage />
                    </RoleBasedRoute>
                  }
                />

                {/* User Role-Based Routes */}
                <Route
                  path="user/dashboard"
                  element={
                    <RoleBasedRoute allowedRoles={['User']}>
                      <UserDashboardPage />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="user/tasks"
                  element={
                    <RoleBasedRoute allowedRoles={['User']}>
                      <UserTasksPage />
                    </RoleBasedRoute>
                  }
                />

                {/* Shared & Navigation Redirects */}
                <Route path="settings" element={<SettingsPage />} />
                <Route path="dashboard" element={<TasksRedirect />} />
                <Route path="tasks" element={<TasksRedirect />} />
                <Route path="today" element={<TasksRedirect />} />
                <Route path="upcoming" element={<TasksRedirect />} />
                <Route path="completed" element={<TasksRedirect />} />
              </Route>

              {/* Global Catch-all: Route to index/login */}
              <Route path="*" element={<IndexOrLoginPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
