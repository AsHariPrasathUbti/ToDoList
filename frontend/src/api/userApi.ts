import apiClient from './axios';
import { User, UserWithStats, UserRole } from '../types';

export interface CreateUserPayload {
  username: string;
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: UserRole;
  is_active?: boolean;
  password?: string;
}

export const userApi = {
  getUsers: async (): Promise<UserWithStats[]> => {
    const res = await apiClient.get<UserWithStats[]>('/users/');
    return res.data;
  },

  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const res = await apiClient.post<User>('/users/', payload);
    return res.data;
  },

  getUser: async (id: number): Promise<User> => {
    const res = await apiClient.get<User>(`/users/${id}`);
    return res.data;
  },

  updateUser: async (id: number, payload: UpdateUserPayload): Promise<User> => {
    const res = await apiClient.patch<User>(`/users/${id}`, payload);
    return res.data;
  },

  toggleUserActive: async (id: number, is_active: boolean): Promise<User> => {
    const res = await apiClient.patch<User>(`/users/${id}/active`, { is_active });
    return res.data;
  },
};
