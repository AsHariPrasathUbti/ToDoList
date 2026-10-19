import apiClient from './axios';
import { Task, TaskListResponse, TaskFilterParams, TaskFormData, TaskStatus } from '../types';

export const taskApi = {
  getTasks: async (params?: TaskFilterParams): Promise<TaskListResponse> => {
    const res = await apiClient.get<TaskListResponse>('/tasks/', { params });
    return res.data;
  },

  getTask: async (id: number): Promise<Task> => {
    const res = await apiClient.get<Task>(`/tasks/${id}`);
    return res.data;
  },

  createTask: async (data: TaskFormData): Promise<Task> => {
    const res = await apiClient.post<Task>('/tasks/', data);
    return res.data;
  },

  updateTask: async (id: number, data: Partial<TaskFormData>): Promise<Task> => {
    const res = await apiClient.put<Task>(`/tasks/${id}`, data);
    return res.data;
  },

  updateTaskAssignments: async (id: number, assigned_user_ids: number[]): Promise<Task> => {
    const res = await apiClient.patch<Task>(`/tasks/${id}/assignments`, { assigned_user_ids });
    return res.data;
  },

  updateAssignmentStatus: async (taskId: number, userId: number, status: TaskStatus): Promise<Task> => {
    const res = await apiClient.patch<Task>(`/tasks/${taskId}/assignments/${userId}/status`, { status });
    return res.data;
  },

  deleteTask: async (id: number): Promise<{ message: string; id: number }> => {
    const res = await apiClient.delete<{ message: string; id: number }>(`/tasks/${id}`);
    return res.data;
  },

  exportCsv: async (): Promise<void> => {
    const res = await apiClient.get('/tasks/export/csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
