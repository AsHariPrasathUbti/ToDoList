import React from 'react';
import { Task, TaskStatus } from '../../types';
import { getStatusBadgeStyle, getPriorityBadgeStyle, formatDisplayDate } from '../../utils/formatters';
import { Calendar, Check, Edit2, Trash2, AlertCircle, Users } from 'lucide-react';

interface TaskCardProps {
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

export const TaskCard: React.FC<TaskCardProps> = ({
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

  // Assignment progress calculation
  const totalAssigned = task.assignments ? task.assignments.length : 0;
  const completedAssigned = task.assignments
    ? task.assignments.filter((a) => a.status === 'Completed').length
    : 0;

  return (
    <div
      onClick={() => onViewDetails?.(task)}
      className={`group relative flex flex-col justify-between p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-200 card-hover cursor-pointer ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-md'
          : isCompleted
          ? 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-900/40 opacity-85'
          : 'border-slate-200 dark:border-slate-800 shadow-xs'
      }`}
    >
      <div>
        {/* Top Badges & Actions */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected || false}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect(task.id);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                aria-label={`Select task ${task.title}`}
              />
            )}

            {/* Status Badge */}
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(
                isAdmin ? task.status : myStatus
              )}`}
            >
              {isAdmin ? `Overall: ${task.status}` : `My Status: ${myStatus}`}
            </span>

            {/* Priority Badge */}
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPriorityBadgeStyle(
                task.priority
              )}`}
            >
              {task.priority}
            </span>
          </div>

          {/* Admin Edit & Delete Buttons */}
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

        {/* Task Title & User Completion Checkbox */}
        <div className="flex items-start gap-3 mb-2">
          {!isAdmin && onUpdateStatus && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const nextStatus: TaskStatus = myStatus === 'Completed' ? 'In Progress' : 'Completed';
                onUpdateStatus(task.id, nextStatus);
              }}
              title={myStatus === 'Completed' ? 'Reopen task' : 'Mark as complete'}
              className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                myStatus === 'Completed'
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 bg-white dark:bg-slate-800'
              }`}
              aria-label="Toggle task status"
            >
              {myStatus === 'Completed' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          )}

          <h3
            className={`text-base font-semibold text-slate-800 dark:text-slate-100 leading-snug break-words ${
              isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
            }`}
          >
            {task.title}
          </h3>
        </div>

        {/* Description snippet */}
        {task.description && (
          <p
            className={`text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed ${
              !isAdmin ? 'pl-8' : ''
            }`}
          >
            {task.description}
          </p>
        )}

        {/* Assigned Users Summary */}
        {isAdmin && totalAssigned > 0 && (
          <div className="mb-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                <Users className="w-3 h-3 text-blue-500" />
                <span>{completedAssigned} of {totalAssigned} completed</span>
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {Math.round((completedAssigned / totalAssigned) * 100)}%
              </span>
            </div>
            {/* Miniature progress bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${(completedAssigned / totalAssigned) * 100}%` }}
              />
            </div>
            {/* User pills */}
            <div className="flex flex-wrap gap-1 pt-1">
              {task.assignments.map((a) => (
                <span
                  key={a.id}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${getStatusBadgeStyle(a.status)}`}
                >
                  {a.user?.name || `User #${a.user_id}`}: {a.status}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info: Due Date & Status Selector for User */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
          {task.due_date ? (
            <div
              className={`flex items-center gap-1 font-medium ${
                !isCompleted && isOverdue
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : !isCompleted && isToday
                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {!isCompleted && isOverdue ? (
                <AlertCircle className="w-3.5 h-3.5" />
              ) : (
                <Calendar className="w-3.5 h-3.5" />
              )}
              <span>{dueDateText}</span>
              {!isCompleted && isOverdue && <span className="text-[10px] uppercase font-bold">(Overdue)</span>}
              {!isCompleted && isToday && <span className="text-[10px] uppercase font-bold">(Today)</span>}
            </div>
          ) : (
            <span className="italic">No due date</span>
          )}
        </div>

        {/* Regular User quick status change */}
        {!isAdmin && onUpdateStatus && (
          <div onClick={(e) => e.stopPropagation()}>
            <select
              value={myStatus}
              onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
