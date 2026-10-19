import apiClient from './axios';
import { AdminDashboardStats, UserDashboardStats, UserSummaryStats } from '../types';

export const dashboardApi = {
  getAdminStats: async (): Promise<AdminDashboardStats> => {
    const res = await apiClient.get<AdminDashboardStats>('/dashboard/admin-stats');
    return res.data;
  },

  getUserStats: async (): Promise<UserDashboardStats> => {
    const res = await apiClient.get<UserDashboardStats>('/dashboard/user-stats');
    return res.data;
  },

  getUserSummary: async (userId: number): Promise<UserSummaryStats> => {
    const res = await apiClient.get<UserSummaryStats>(`/dashboard/user-summary/${userId}`);
    return res.data;
  },
};
