import React, { useEffect, useState, useCallback } from 'react';
import { taskApi } from '../../api/taskApi';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import { Task, TaskFilterParams, PaginationMetadata, UserWithStats } from '../../types';
import { TaskCard } from '../../components/tasks/TaskCard';
import { TaskRow } from '../../components/tasks/TaskRow';
import { TaskModal } from '../../components/tasks/TaskModal';
import { DeleteConfirmModal } from '../../components/tasks/DeleteConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Plus,
  Search,
  LayoutGrid,
  List,
  RefreshCw,
  Trash2,
} from 'lucide-react';

export const AdminTasksPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [filters, setFilters] = useState<TaskFilterParams>({
    sort_by: 'created_at',
    sort_order: 'desc',
    page: 1,
    page_size: 9,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk task selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Load registered users for assignment filter dropdown (excluding Admin)
  useEffect(() => {
    userApi
      .getUsers()
      .then((data) => setUsers(data.filter((u) => u.role !== 'Admin')))
      .catch(() => {});
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await taskApi.getTasks(filters);
      setTasks(data.items);
      setPagination(data.pagination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve tasks';
      showToast(msg, 'error');
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

  const isAllSelected = tasks.length > 0 && tasks.every((t) => selectedTaskIds.includes(t.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map((t) => t.id));
    }
  };

  const handleToggleSelectTask = (taskId: number) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    try {
      await taskApi.deleteTask(deletingTask.id);
      showToast('Task deleted successfully', 'success');
      setSelectedTaskIds((prev) => prev.filter((id) => id !== deletingTask.id));
      setDeletingTask(null);
      fetchTasks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete task';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedTaskIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedTaskIds.map((id) => taskApi.deleteTask(id)));
      showToast(`${selectedTaskIds.length} tasks deleted successfully`, 'success');
      setSelectedTaskIds([]);
      setIsBulkDeleteOpen(false);
      fetchTasks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete selected tasks';
      showToast(msg, 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-enter">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Team Task Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, assign, inspect progress, and manage tasks across all team members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all hover:shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              placeholder="Search by title or description..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Assignee */}
            <div className="relative">
              <select
                value={filters.assigned_user_id || ''}
                onChange={(e) =>
                  handleFilterChange({
                    assigned_user_id: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                aria-label="Filter by Assigned User"
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Assignees</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (@{u.username})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
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

            {/* Priority Filter */}
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

            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selection & Bulk Actions Toolbar */}
      {!loading && tasks.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-xs text-slate-700 dark:text-slate-200 select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>
                Select All Tasks ({selectedTaskIds.length} of {tasks.length} selected)
              </span>
            </label>
            {selectedTaskIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTaskIds([])}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer"
              >
                Clear Selection
              </button>
            )}
          </div>

          {selectedTaskIds.length > 0 && (
            <button
              type="button"
              onClick={() => setIsBulkDeleteOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-rose-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedTaskIds.length})</span>
            </button>
          )}
        </div>
      )}

      {/* Tasks Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Fetching team tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center p-8">
          <ClipboardList className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No tasks found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            No tasks match the active filters. Clear search or click &quot;Create Task&quot; to assign
            work to your team.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Create Task Now
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isAdmin={true}
              currentUserId={user?.id || 0}
              isSelected={selectedTaskIds.includes(task.id)}
              onToggleSelect={handleToggleSelectTask}
              onEdit={(t) => setEditingTask(t)}
              onDelete={(t) => setDeletingTask(t)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              isAdmin={true}
              currentUserId={user?.id || 0}
              isSelected={selectedTaskIds.includes(task.id)}
              onToggleSelect={handleToggleSelectTask}
              onEdit={(t) => setEditingTask(t)}
              onDelete={(t) => setDeletingTask(t)}
            />
          ))}
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

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isCreateOpen || !!editingTask}
        taskToEdit={editingTask}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingTask(null);
        }}
        onSuccess={() => {
          setIsCreateOpen(false);
          setEditingTask(null);
          fetchTasks();
        }}
      />

      {/* Single Task Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingTask}
        taskTitle={deletingTask?.title || ''}
        isDeleting={isDeleting}
        onCancel={() => setDeletingTask(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isBulkDeleteOpen}
        taskTitle=""
        count={selectedTaskIds.length}
        isDeleting={isBulkDeleting}
        onCancel={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
      />
    </div>
  );
};
