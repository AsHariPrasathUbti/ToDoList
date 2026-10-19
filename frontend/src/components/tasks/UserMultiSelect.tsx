import React, { useState } from 'react';
import { UserWithStats } from '../../types';
import { Search, X, Check } from 'lucide-react';

interface UserMultiSelectProps {
  users: UserWithStats[];
  selectedUserIds: number[];
  onChange: (ids: number[]) => void;
}

export const UserMultiSelect: React.FC<UserMultiSelectProps> = ({
  users,
  selectedUserIds,
  onChange,
}) => {
  const [search, setSearch] = useState('');

  // Exclude Admin from task assignment
  const assignableUsers = users.filter((u) => u.role !== 'Admin');

  const toggleUser = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  const removeUser = (userId: number) => {
    onChange(selectedUserIds.filter((id) => id !== userId));
  };

  const areAllSelected =
    assignableUsers.length > 0 &&
    assignableUsers.every((u) => selectedUserIds.includes(u.id));

  const handleToggleSelectAll = () => {
    if (areAllSelected) {
      onChange([]);
    } else {
      onChange(assignableUsers.map((u) => u.id));
    }
  };

  const filteredUsers = assignableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUsers = assignableUsers.filter((u) => selectedUserIds.includes(u.id));

  return (
    <div className="space-y-2">
      {/* Selection Header with Select All */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-400">
          Assign Team Members ({selectedUserIds.length} of {assignableUsers.length} selected)
        </span>
        {assignableUsers.length > 0 && (
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline cursor-pointer"
          >
            {areAllSelected ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Selected Users Chips */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          {selectedUsers.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            >
              <span>{u.name} ({u.username})</span>
              <button
                type="button"
                onClick={() => removeUser(u.id)}
                className="hover:text-blue-900 dark:hover:text-white cursor-pointer"
                aria-label={`Remove ${u.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* User Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search team members by name or username..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Users Checklist Box */}
      <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            No team members found
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isSelected = selectedUserIds.includes(u.id);
            return (
              <div
                key={u.id}
                onClick={() => toggleUser(u.id)}
                className={`flex items-center justify-between p-2.5 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                  isSelected ? 'bg-blue-50/70 dark:bg-blue-950/40' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {u.name} <span className="font-normal text-slate-400">(@{u.username})</span>
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{u.role}</p>
                  </div>
                </div>

                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
