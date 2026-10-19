import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardApi } from '../../api/dashboardApi';
import { taskApi } from '../../api/taskApi';
import { UserDashboardStats, Task, TaskStatus } from '../../types';
import { UserTaskDetailModal } from '../../components/tasks/UserTaskDetailModal';
import { getPriorityBadgeStyle, getStatusBadgeStyle } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import {
  CheckCircle2,
  Clock,
  Activity,
  AlertTriangle,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Loader2,
  ClipboardList,
  Eye,
  Check,
} from 'lucide-react';

export const UserDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState<UserDashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, tasksData] = await Promise.all([
        dashboardApi.getUserStats(),
        taskApi.getTasks({ page: 1, page_size: 6, sort_by: 'updated_at', sort_order: 'desc' }),
      ]);
      setStats(statsData);
      setRecentTasks(tasksData.items);
    } catch {
      showToast('Failed to load dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleRefresh = () => fetchDashboardData();
    window.addEventListener('tasks:refresh', handleRefresh);
    return () => window.removeEventListener('tasks:refresh', handleRefresh);
  }, []);

  const handleQuickStatusChange = async (taskId: number, nextStatus: TaskStatus) => {
    if (!user) return;
    try {
      setUpdatingTaskId(taskId);
      await taskApi.updateAssignmentStatus(taskId, user.id, nextStatus);
      showToast(`Status updated to "${nextStatus}"`, 'success');
      fetchDashboardData();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Failed to update assignment status';
      showToast(errorMsg, 'error');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading your personalized workspace...</p>
      </div>
    );
  }

  const completionRate = stats?.personal_completion_percentage || 0;

  return (
    <div className="space-y-6 animate-enter">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>Welcome back, {user?.name || 'Member'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Here&apos;s your personal task breakdown
          </h1>
          <p className="text-blue-100 text-sm mt-2 leading-relaxed">
            Stay on top of your deliverables. You have{' '}
            <span className="font-bold text-white underline decoration-blue-300">
              {stats?.pending_tasks || 0} pending
            </span>{' '}
            and{' '}
            <span className="font-bold text-white underline decoration-amber-300">
              {stats?.in_progress_tasks || 0} in progress
            </span>{' '}
            tasks assigned to you.
          </p>
        </div>

        {/* Decorative Circle */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Tasks */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats?.total_assigned_tasks || 0}
          </p>
        </div>

        {/* Pending */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending</span>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-2">
            {stats?.pending_tasks || 0}
          </p>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">In Progress</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {stats?.in_progress_tasks || 0}
          </p>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Completed</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {stats?.completed_tasks || 0}
          </p>
        </div>

        {/* Due Today */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Due Today</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {stats?.due_today_tasks || 0}
          </p>
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Overdue</span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {stats?.overdue_tasks || 0}
          </p>
        </div>
      </div>

      {/* Progress & Deadlines Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Completion Progress Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Personal Completion Rate
              </h2>
              <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                {completionRate}%
              </span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden mb-4">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, completionRate)}%` }}
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {stats?.completed_tasks || 0} of {stats?.total_assigned_tasks || 0} tasks finished.
              Update task status in real time to keep your completion score up to date.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Keep up the good work!</span>
            <Link
              to="/user/tasks"
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
            >
              Go to My Tasks <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Recently Assigned Deliverables */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Recent Deliverables
            </h2>
            <Link
              to="/user/tasks"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No tasks currently assigned to you.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentTasks.slice(0, 4).map((task) => {
                const priorityClass = getPriorityBadgeStyle(task.priority);
                const userAssignment = task.assignments?.find((a) => a.user_id === user?.id);
                const myStatus: TaskStatus = userAssignment?.status || task.status;
                const statusClass = getStatusBadgeStyle(myStatus);

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          task.priority === 'Urgent'
                            ? 'bg-rose-500'
                            : task.priority === 'High'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'None'}</span>
                          <span>•</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${priorityClass}`}>
                            {task.priority}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${statusClass}`}>
                        {myStatus}
                      </span>
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recently Updated Deliverables Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Work on Your Deliverables
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Quickly update your progress with 1-click status switches
            </p>
          </div>
          <Link
            to="/user/tasks"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            See all tasks <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No tasks assigned yet</p>
            <p className="text-xs text-slate-400 mt-1">Your manager will assign tasks to you shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTasks.map((task) => {
              const myAssignment = task.assignments?.find((a) => a.user_id === user?.id);
              const myStatus: TaskStatus = myAssignment?.status || 'Pending';
              const priorityClass = getPriorityBadgeStyle(task.priority);
              const statusClass = getStatusBadgeStyle(myStatus);
              const isUpdating = updatingTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityClass}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}`}>
                        {myStatus}
                      </span>
                    </div>

                    <h3
                      onClick={() => setSelectedTask(task)}
                      className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 line-clamp-1"
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                    </span>

                    {/* Quick status button toggles */}
                    <div className="flex items-center gap-1">
                      {myStatus !== 'In Progress' && (
                        <button
                          onClick={() => handleQuickStatusChange(task.id, 'In Progress')}
                          disabled={isUpdating}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 hover:bg-amber-100 transition-colors"
                          title="Set to In Progress"
                        >
                          Start
                        </button>
                      )}
                      {myStatus !== 'Completed' ? (
                        <button
                          onClick={() => handleQuickStatusChange(task.id, 'Completed')}
                          disabled={isUpdating}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                          title="Mark Completed"
                        >
                          <Check className="w-3 h-3" />
                          Done
                        </button>
                      ) : (
                        <button
                          onClick={() => handleQuickStatusChange(task.id, 'Pending')}
                          disabled={isUpdating}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 transition-colors"
                          title="Reopen Task"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Inspection & Status Modal */}
      <UserTaskDetailModal
        task={selectedTask}
        currentUserId={user?.id || 0}
        onClose={() => setSelectedTask(null)}
        onUpdateStatus={async (taskId, status) => {
          await handleQuickStatusChange(taskId, status);
        }}
      />
    </div>
  );
};
