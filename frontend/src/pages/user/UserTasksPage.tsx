import React, { useEffect, useState, useCallback } from 'react';
import { taskApi } from '../../api/taskApi';
import { useAuth } from '../../contexts/AuthContext';
import { Task, TaskFilterParams, PaginationMetadata, TaskStatus } from '../../types';
import { UserTaskDetailModal } from '../../components/tasks/UserTaskDetailModal';
import { getPriorityBadgeStyle, getStatusBadgeStyle } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import {
  Calendar,
  Search,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  AlertCircle,
} from 'lucide-react';

export const UserTasksPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  const [filters, setFilters] = useState<TaskFilterParams>({
    sort_by: 'due_date',
    sort_order: 'asc',
    page: 1,
    page_size: 9,
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await taskApi.getTasks(filters);
      setTasks(data.items);
      setPagination(data.pagination);
    } catch {
      showToast('Failed to load your assigned tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    fetchTasks();

    const handleRefresh = () => fetchTasks();
    window.addEventListener('tasks:refresh', handleRefresh);
    return () => window.removeEventListener('tasks:refresh', handleRefresh);
  }, [fetchTasks]);

  const handleFilterChange = (newFilters: Partial<TaskFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleStatusChange = async (taskId: number, nextStatus: TaskStatus) => {
    if (!user) return;
    try {
      setUpdatingTaskId(taskId);
      await taskApi.updateAssignmentStatus(taskId, user.id, nextStatus);
      showToast(`Status updated to "${nextStatus}"!`, 'success');
      setSelectedTask((prev) => {
        if (!prev || prev.id !== taskId) return prev;
        return {
          ...prev,
          assignments: prev.assignments.map((a) =>
            a.user_id === user.id ? { ...a, status: nextStatus } : a
          ),
          user_assignment:
            prev.user_assignment && prev.user_assignment.user_id === user.id
              ? { ...prev.user_assignment, status: nextStatus }
              : prev.user_assignment,
        };
      });
      fetchTasks();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Failed to update assignment status';
      showToast(errorMsg, 'error');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            My Assigned Tasks
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review work assigned to you by administrators and update your progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Refresh Deliverables"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            placeholder="Search your assigned tasks..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white"
          />
        </div>

        {/* Filter selects */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
            aria-label="Filter by Status"
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Priority */}
          <select
            value={filters.priority || ''}
            onChange={(e) => handleFilterChange({ priority: e.target.value || undefined })}
            aria-label="Filter by Priority"
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Sort By */}
          <select
            value={filters.sort_by || 'due_date'}
            onChange={(e) => handleFilterChange({ sort_by: e.target.value })}
            aria-label="Sort by"
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="due_date">Due Date</option>
            <option value="priority">Priority</option>
            <option value="created_at">Recently Assigned</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading your assignments...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center p-8">
          <ClipboardList className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No tasks found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            {filters.search || filters.status || filters.priority
              ? 'No assigned tasks match your current filter criteria.'
              : 'You have no tasks assigned to you right now.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const myAssignment = task.assignments?.find((a) => a.user_id === user?.id);
            const myStatus: TaskStatus = myAssignment?.status || 'Pending';
            const priorityClass = getPriorityBadgeStyle(task.priority);
            const statusClass = getStatusBadgeStyle(myStatus);
            const isUpdating = updatingTaskId === task.id;

            const isOverdue =
              task.due_date &&
              new Date(task.due_date) < new Date() &&
              myStatus !== 'Completed';

            return (
              <div
                key={task.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border ${
                  isOverdue
                    ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20'
                    : 'border-slate-200 dark:border-slate-800'
                } p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4`}
              >
                {/* Left: Task Details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${priorityClass}`}
                    >
                      {task.priority}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusClass}`}
                    >
                      {myStatus}
                    </span>
                    {isOverdue && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                        <AlertCircle className="w-3 h-3" />
                        Overdue
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => setSelectedTask(task)}
                    className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                  >
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                    </span>
                    {myAssignment?.assigned_at && (
                      <span>
                        Assigned on {new Date(myAssignment.assigned_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Status Change Dropdown & Actions */}
                <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Your Status:</span>
                    <select
                      value={myStatus}
                      disabled={isUpdating}
                      onChange={(e) =>
                        handleStatusChange(
                          task.id,
                          e.target.value as TaskStatus
                        )
                      }
                      aria-label="Change Task Status"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setSelectedTask(task)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title="View Task Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-sm">
          <p className="text-xs text-slate-500">
            Showing Page <span className="font-bold text-slate-900 dark:text-white">{pagination.page}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-white">{pagination.total_pages}</span> ({pagination.total} tasks)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters((p) => ({ ...p, page: (p.page || 1) - 1 }))}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFilters((p) => ({ ...p, page: (p.page || 1) + 1 }))}
              disabled={pagination.page >= pagination.total_pages}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Task Inspection Modal */}
      <UserTaskDetailModal
        task={selectedTask}
        currentUserId={user?.id || 0}
        onClose={() => setSelectedTask(null)}
        onUpdateStatus={async (taskId, status) => {
          await handleStatusChange(taskId, status);
        }}
      />
    </div>
  );
};
