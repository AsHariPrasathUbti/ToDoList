export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type UserRole = 'Admin' | 'User';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWithStats extends User {
  total_assigned: number;
  completed_assigned: number;
  pending_assigned: number;
  in_progress_assigned: number;
}

export interface TaskAssignment {
  id: number;
  task_id: number;
  user_id: number;
  user?: {
    id: number;
    username: string;
    name: string;
    email: string;
    role: string;
  };
  status: TaskStatus;
  assigned_at: string;
  completed_at?: string | null;
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  assignments: TaskAssignment[];
  user_assignment?: TaskAssignment | null;
  my_status?: TaskStatus | null;
}

export interface PaginationMetadata {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface TaskListResponse {
  items: Task[];
  pagination: PaginationMetadata;
}

export interface AdminDashboardStats {
  total_tasks: number;
  total_users: number;
  pending_assignments: number;
  in_progress_assignments: number;
  completed_assignments: number;
  overdue_assignments: number;
  overall_completion_percentage: number;
  recent_tasks: Task[];
}

export interface UserDashboardStats {
  total_assigned_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  due_today_tasks: number;
  personal_completion_percentage: number;
  recent_tasks: Task[];
}

export interface UserSummaryStats {
  user: User;
  total_assigned: number;
  completed: number;
  in_progress: number;
  pending: number;
  overdue: number;
  completion_percentage: number;
  tasks: Task[];
}

export interface TaskFilterParams {
  search?: string;
  status?: string;
  priority?: string;
  assigned_user_id?: number;
  due_date?: string;
  overdue?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface TaskFormData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  assigned_user_ids?: number[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
