import React, { useEffect, useState, useMemo } from 'react';
import { userApi } from '../../api/userApi';
import { UserWithStats } from '../../types';
import { CreateUserModal } from '../../components/users/CreateUserModal';
import { UserSummaryModal } from '../../components/users/UserSummaryModal';
import { getRoleBadgeStyle } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  Activity,
  UserCheck,
  UserX,
  Eye,
  RefreshCw,
  Loader2,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Admin' | 'User'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [summaryUser, setSummaryUser] = useState<UserWithStats | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);

  const { showToast } = useToast();

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await userApi.getUsers();
      setUsers(data);
    } catch {
      showToast('Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleActive = async (user: UserWithStats) => {
    try {
      setTogglingUserId(user.id);
      const updated = await userApi.toggleUserActive(user.id, !user.is_active);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: updated.is_active } : u))
      );
      showToast(
        `User @${user.username} is now ${updated.is_active ? 'active' : 'deactivated'}`,
        'success'
      );
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Failed to update user status';
      showToast(errorMsg, 'error');
    } finally {
      setTogglingUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && u.is_active) ||
        (statusFilter === 'Inactive' && !u.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const totalMembers = users.length;
  const activeMembers = users.filter((u) => u.is_active).length;
  const adminCount = users.filter((u) => u.role === 'Admin').length;
  const userCount = users.filter((u) => u.role === 'User').length;

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            User Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your team accounts, inspect task allocations, and assign roles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadUsers}
            disabled={isLoading}
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all hover:shadow-lg active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Create User
          </button>
        </div>
      </div>

      {/* Mini Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalMembers}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeMembers}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Admins</p>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{adminCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Members</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{userCount}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, username, or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'All' | 'Admin' | 'User')}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admins</option>
            <option value="User">Regular Users</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive')}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Loading user accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">No users found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery ? 'Try adjusting your search criteria' : 'Click "Create User" to add team members'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Account Status</th>
                  <th className="px-6 py-3.5">Task Deliverables</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredUsers.map((u) => {
                  const roleStyle = getRoleBadgeStyle(u.role);
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Name & Username */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              {u.name}
                              {u.role === 'Admin' && (
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              )}
                            </p>
                            <p className="text-xs text-slate-400">@{u.username} • {u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${roleStyle}`}
                        >
                          {u.role === 'Admin' ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : (
                            <UserIcon className="w-3 h-3" />
                          )}
                          {u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Deactivated
                          </span>
                        )}
                      </td>

                      {/* Tasks Stats */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300"
                            title="Total Assigned Tasks"
                          >
                            <span className="font-bold text-slate-900 dark:text-white">
                              {u.total_assigned}
                            </span>{' '}
                            total
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span
                            className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"
                            title="Completed Tasks"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {u.completed_assigned}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
                            title="In Progress Tasks"
                          >
                            <Activity className="w-3 h-3" />
                            {u.in_progress_assigned}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"
                            title="Pending Tasks"
                          >
                            <Clock className="w-3 h-3" />
                            {u.pending_assigned}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSummaryUser(u)}
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="View User Summary"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleActive(u)}
                            disabled={togglingUserId === u.id}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.is_active
                                ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                            title={u.is_active ? 'Deactivate User' : 'Activate User'}
                          >
                            {togglingUserId === u.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : u.is_active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadUsers}
      />

      <UserSummaryModal
        user={summaryUser}
        onClose={() => setSummaryUser(null)}
      />
    </div>
  );
};
