import React, { useState, useEffect } from 'react';
import { TaskFilterParams } from '../../types';
import {
  Search,
  X,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List,
  Download,
} from 'lucide-react';

interface TaskFiltersBarProps {
  filters: TaskFilterParams;
  onFilterChange: (newFilters: Partial<TaskFilterParams>) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onExportCsv?: () => void;
}

export const TaskFiltersBar: React.FC<TaskFiltersBarProps> = ({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  onExportCsv,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (filters.search || '')) {
        onFilterChange({ search: searchTerm.trim() ? searchTerm.trim() : undefined, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, filters.search, onFilterChange]);

  const clearSearch = () => {
    setSearchTerm('');
    onFilterChange({ search: undefined, page: 1 });
  };

  return (
    <div className="flex flex-col gap-3.5 mb-6">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks by title or description..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode & CSV Export */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              title="Export all tasks to CSV"
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          {/* Grid / List layout toggle */}
          <div className="flex items-center p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <button
              onClick={() => onViewModeChange('grid')}
              title="Grid view"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              title="List view"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-medium mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Status Filter */}
        <select
          value={filters.status || ''}
          onChange={(e) => onFilterChange({ status: e.target.value || undefined, page: 1 })}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority || ''}
          onChange={(e) => onFilterChange({ priority: e.target.value || undefined, page: 1 })}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>

        {/* Sort Select */}
        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={`${filters.sort_by || 'created_at'}:${filters.sort_order || 'desc'}`}
            onChange={(e) => {
              const [sort_by, sort_order] = e.target.value.split(':');
              onFilterChange({ sort_by, sort_order: sort_order as 'asc' | 'desc', page: 1 });
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="created_at:desc">Newest First</option>
            <option value="created_at:asc">Oldest First</option>
            <option value="due_date:asc">Due Date (Earliest)</option>
            <option value="due_date:desc">Due Date (Latest)</option>
            <option value="priority:desc">Priority</option>
            <option value="updated_at:desc">Recently Updated</option>
          </select>
        </div>
      </div>
    </div>
  );
};
