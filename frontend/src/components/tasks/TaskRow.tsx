import React from 'react';
import { Task, TaskStatus } from '../../types';
import { getStatusBadgeStyle, getPriorityBadgeStyle, formatDisplayDate } from '../../utils/formatters';
import { Check, Calendar, AlertCircle, Edit2, Trash2, Users } from 'lucide-react';

interface TaskRowProps {
  task: Task;
  isAdmin: boolean;
  currentUserId: number;
  isSelected?: boolean;
  onToggleSelect?: (taskId: number) => void;
  onUpdateStatus?: (taskId: number, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onViewDetails?: (task: Task) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  isAdmin,
  currentUserId,
  isSelected,
  onToggleSelect,
  onUpdateStatus,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  const userAssignment = task.assignments?.find((a) => a.user_id === currentUserId) || task.user_assignment;
  const myStatus: TaskStatus = userAssignment?.status || task.status;
  const isCompleted = isAdmin ? task.status === 'Completed' : myStatus === 'Completed';

  const { text: dueDateText, isOverdue, isToday } = formatDisplayDate(task.due_date);

  const totalAssigned = task.assignments ? task.assignments.length : 0;
  const completedAssigned = task.assignments
    ? task.assignments.filter((a) => a.status === 'Completed').length
    : 0;

  return (
    <div
      onClick={() => onViewDetails?.(task)}
      className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border bg-white dark:bg-slate-900 transition-all duration-150 card-hover cursor-pointer ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-md'
          : isCompleted
          ? 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 opacity-80'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Left: Checkbox + Title + Description */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-4">
        {isAdmin && onToggleSelect && (
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect(task.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
            aria-label={`Select task ${task.title}`}
          />
        )}
        {!isAdmin && onUpdateStatus && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const nextStatus: TaskStatus = myStatus === 'Completed' ? 'In Progress' : 'Completed';
              onUpdateStatus(task.id, nextStatus);
            }}
            title={myStatus === 'Completed' ? 'Reopen task' : 'Mark as complete'}
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
              myStatus === 'Completed'
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 bg-white dark:bg-slate-800'
            }`}
            aria-label="Toggle task completion"
          >
            {myStatus === 'Completed' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>
        )}

        <div className="min-w-0">
          <p
            className={`text-sm font-semibold truncate ${
              isCompleted
                ? 'line-through text-slate-400 dark:text-slate-500'
                : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-md">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Middle & Right: Badges, Assigned Team, Due Date, and Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Status Badge */}
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(
            isAdmin ? task.status : myStatus
          )}`}
        >
          {isAdmin ? task.status : myStatus}
        </span>

        {/* Priority Badge */}
        <span
          className={`hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPriorityBadgeStyle(
            task.priority
          )}`}
        >
          {task.priority}
        </span>

        {/* Admin Assigned Progress Pill */}
        {isAdmin && totalAssigned > 0 && (
          <span className="hidden md:flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Users className="w-3 h-3 text-blue-500" />
            <span>{completedAssigned}/{totalAssigned} done</span>
          </span>
        )}

        {/* Due Date */}
        <div className="hidden lg:flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 w-32">
          {task.due_date ? (
            <span
              className={`flex items-center gap-1 font-medium truncate ${
                !isCompleted && isOverdue
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : !isCompleted && isToday
                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                  : ''
              }`}
            >
              {!isCompleted && isOverdue ? (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Calendar className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">{dueDateText}</span>
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-600 italic">No due date</span>
          )}
        </div>

        {/* User quick status update */}
        {!isAdmin && onUpdateStatus && (
          <div onClick={(e) => e.stopPropagation()}>
            <select
              value={myStatus}
              onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        )}

        {/* Admin Action Buttons */}
        {isAdmin && (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                title="Edit task & assignments"
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Edit task"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(task)}
                title="Delete task"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                aria-label="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
