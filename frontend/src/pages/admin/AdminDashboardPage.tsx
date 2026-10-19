import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardApi } from '../../api/dashboardApi';
import { taskApi } from '../../api/taskApi';
import { userApi } from '../../api/userApi';
import { AdminDashboardStats, Task, UserWithStats } from '../../types';
import { StatCard } from '../../components/dashboard/StatCard';
import { ProgressBar } from '../../components/dashboard/ProgressBar';
import { TaskModal } from '../../components/tasks/TaskModal';
import { DeleteConfirmModal } from '../../components/tasks/DeleteConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import { getStatusBadgeStyle, getPriorityBadgeStyle, formatDisplayDate } from '../../utils/formatters';
import {
  ListTodo,
  Users,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Edit2,
  Trash2,
  Search,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';


export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for overview table
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [userFilter, setUserFilter] = useState<number | undefined>(undefined);

  // Modals
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsData, usersData] = await Promise.all([
        dashboardApi.getAdminStats(),
        userApi.getUsers(),
      ]);
      setStats(statsData);
      setUsers(usersData.filter((u) => u.role !== 'Admin'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load admin metrics';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData();

    const handleRefresh = () => fetchDashboardData();
    window.addEventListener('tasks:refresh', handleRefresh);
    return () => window.removeEventListener('tasks:refresh', handleRefresh);
  }, [fetchDashboardData]);

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    try {
      await taskApi.deleteTask(deletingTask.id);
      showToast('Task deleted successfully', 'success');
      setDeletingTask(null);
      fetchDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete task';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter recent tasks for table
  const filteredTasks = (stats?.recent_tasks || []).filter((task) => {
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (statusFilter && task.status !== statusFilter) return false;
    if (priorityFilter && task.priority !== priorityFilter) return false;
    if (userFilter && !task.assignments?.some((a) => a.user_id === userFilter)) return false;
    return true;
  });

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-enter">
      {/* Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md uppercase tracking-wider inline-block mb-3">
            Admin Command Center
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Welcome back, {user?.name || 'Admin'}
          </h2>
          <p className="text-sm text-blue-100 font-normal leading-relaxed">
            Monitor and coordinate cross-departmental task assignments. Total of{' '}
            <span className="font-bold text-white">{stats?.total_tasks ?? 0} tasks</span> distributed across{' '}
            <span className="font-bold text-white">{stats?.total_users ?? 0} active team members</span>.
          </p>
        </div>

        {/* Decorative shapes */}
        <div className="absolute -right-8 -bottom-8 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Key Metrics Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
          Organization Metrics Across All Users
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <StatCard
            label="Total Tasks"
            value={stats?.total_tasks ?? 0}
            icon={ListTodo}
            iconColor="text-blue-600 dark:text-blue-400"
            bgColor="bg-blue-50 dark:bg-blue-950/50"
          />
          <StatCard
            label="Team Users"
            value={stats?.total_users ?? 0}
            icon={Users}
            iconColor="text-indigo-600 dark:text-indigo-400"
            bgColor="bg-indigo-50 dark:bg-indigo-950/50"
          />
          <StatCard
            label="Pending"
            value={stats?.pending_assignments ?? 0}
            icon={Clock}
            iconColor="text-amber-600 dark:text-amber-400"
            bgColor="bg-amber-50 dark:bg-amber-950/50"
          />
          <StatCard
            label="In Progress"
            value={stats?.in_progress_assignments ?? 0}
            icon={Activity}
            iconColor="text-sky-600 dark:text-sky-400"
            bgColor="bg-sky-50 dark:bg-sky-950/50"
          />
          <StatCard
            label="Completed"
            value={stats?.completed_assignments ?? 0}
            icon={CheckCircle2}
            iconColor="text-emerald-600 dark:text-emerald-400"
            bgColor="bg-emerald-50 dark:bg-emerald-950/50"
          />
          <StatCard
            label="Overdue"
            value={stats?.overdue_assignments ?? 0}
            icon={AlertTriangle}
            iconColor="text-rose-600 dark:text-rose-400"
            bgColor="bg-rose-50 dark:bg-rose-950/50"
          />
        </div>
      </div>

      {/* Team Completion Progress Bar */}
      {stats && (
        <ProgressBar
          percentage={stats.overall_completion_percentage}
          total={
            (stats.completed_assignments || 0) +
            (stats.pending_assignments || 0) +
            (stats.in_progress_assignments || 0)
          }
          completed={stats.completed_assignments || 0}
        />
      )}

      {/* Task Overview Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Team Deliverables Overview
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Multi-user assignments with live progress tracking
            </p>
          </div>
          <Link
            to="/admin/tasks"
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline self-start sm:self-auto"
          >
            <span>View All Tasks Table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Filter Controls for Dashboard Table */}
        <div className="flex flex-wrap items-center gap-2.5 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs text-xs">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by title..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={userFilter || ''}
            onChange={(e) => setUserFilter(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="">All Assigned Users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} (@{u.username})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4">Task Title</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Assigned Users</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Progress</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No matching tasks found.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const total = t.assignments?.length || 0;
                  const done = t.assignments?.filter((a) => a.status === 'Completed').length || 0;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  const { text: dueText, isOverdue } = formatDisplayDate(t.due_date);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100 max-w-xs">
                        <p className="truncate">{t.title}</p>
                        {t.description && (
                          <p className="text-[11px] text-slate-400 font-normal truncate">{t.description}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-semibold border text-[10px] ${getPriorityBadgeStyle(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                          {dueText}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {t.assignments && t.assignments.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {t.assignments.map((a) => (
                              <span
                                key={a.id}
                                className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                              >
                                {a.user?.name || `User #${a.user_id}`}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {t.assignments && t.assignments.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {Array.from(new Set(t.assignments.map((a) => a.status))).map((status) => (
                              <span
                                key={status}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${getStatusBadgeStyle(status)}`}
                              >
                                {status}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${getStatusBadgeStyle(t.status)}`}>
                            {t.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                            <span>{done} of {total}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingTask(t)}
                            title="Edit task & reassign users"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingTask(t)}
                            title="Delete task"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {editingTask && (
        <TaskModal
          isOpen={Boolean(editingTask)}
          taskToEdit={editingTask}
          onClose={() => setEditingTask(null)}
          onSuccess={() => {
            setEditingTask(null);
            fetchDashboardData();
          }}
        />
      )}

      {deletingTask && (
        <DeleteConfirmModal
          isOpen={Boolean(deletingTask)}
          taskTitle={deletingTask.title}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </div>
  );
};
