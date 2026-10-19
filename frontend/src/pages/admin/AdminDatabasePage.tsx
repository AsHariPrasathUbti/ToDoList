import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { databaseApi, TableMeta, ColumnMeta } from '../../api/databaseApi';
import { useToast } from '../../contexts/ToastContext';
import { RecordModal } from '../../components/database/RecordModal';
import { DeleteRecordModal } from '../../components/database/DeleteRecordModal';
import { RowDetailModal } from '../../components/database/RowDetailModal';
import { SqlQueryModal } from '../../components/database/SqlQueryModal';
import {
  Database,
  Table as TableIcon,
  Search,
  Plus,
  RefreshCw,
  Terminal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Eye,
  Key,
  Info,
  Layers,
  Users,
  CheckSquare,
  Link as LinkIcon,
  HardDrive,
} from 'lucide-react';

export const AdminDatabasePage: React.FC = () => {
  const { showToast } = useToast();

  const [tables, setTables] = useState<TableMeta[]>([]);
  const [activeTable, setActiveTable] = useState<string>('');
  const [dbType, setDbType] = useState<string>('sqlite');
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(true);

  // Table rows state
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<ColumnMeta[]>([]);
  const [primaryKeys, setPrimaryKeys] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoadingRows, setIsLoadingRows] = useState<boolean>(false);

  // Schema view toggle
  const [showSchema, setShowSchema] = useState<boolean>(false);

  // Modals state
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [recordModalMode, setRecordModalMode] = useState<'create' | 'edit'>('create');
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<Record<string, unknown> | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [rowToInspect, setRowToInspect] = useState<Record<string, unknown> | null>(null);

  const [sqlModalOpen, setSqlModalOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load all tables
  const loadTables = useCallback(async (preserveActive = true) => {
    setIsLoadingTables(true);
    try {
      const data = await databaseApi.getTables();
      setTables(data.tables);
      setDbType(data.database_type);
      if (!preserveActive || !activeTable || !data.tables.some((t) => t.name === activeTable)) {
        if (data.tables.length > 0) {
          // Default to 'users' if present, otherwise first table
          const defaultTbl = data.tables.find((t) => t.name === 'users') || data.tables[0];
          setActiveTable(defaultTbl.name);
        }
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load database tables', 'error');
    } finally {
      setIsLoadingTables(false);
    }
  }, [activeTable, showToast]);

  useEffect(() => {
    loadTables(false);
  }, []);

  // Load rows for active table
  const loadRows = useCallback(async () => {
    if (!activeTable) return;
    setIsLoadingRows(true);
    try {
      const res = await databaseApi.getTableRows(activeTable, {
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
        search: debouncedSearch || undefined,
      });
      setRows(res.rows);
      setColumns(res.columns);
      setPrimaryKeys(res.primary_keys);
      setTotalRows(res.total_rows);
      setTotalPages(res.total_pages);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : `Failed to load rows for ${activeTable}`, 'error');
    } finally {
      setIsLoadingRows(false);
    }
  }, [activeTable, page, pageSize, sortBy, sortOrder, debouncedSearch, showToast]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const activeMeta = useMemo(() => {
    return tables.find((t) => t.name === activeTable);
  }, [tables, activeTable]);

  const totalDbRecords = useMemo(() => {
    return tables.reduce((acc, t) => acc + (t.row_count || 0), 0);
  }, [tables]);

  const handleSort = (colName: string) => {
    if (sortBy === colName) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(colName);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const getPkValue = (row: Record<string, unknown>): string | number => {
    const pkCol = primaryKeys[0] || 'id';
    return (row[pkCol] as string | number) ?? 'unknown';
  };

  const handleOpenCreate = () => {
    setSelectedRow(null);
    setRecordModalMode('create');
    setRecordModalOpen(true);
  };

  const handleOpenEdit = (row: Record<string, unknown>) => {
    setSelectedRow(row);
    setRecordModalMode('edit');
    setRecordModalOpen(true);
  };

  const handleSaveRecord = async (payload: Record<string, unknown>) => {
    if (recordModalMode === 'create') {
      await databaseApi.createRow(activeTable, payload);
      showToast(`Record inserted into ${activeTable} successfully`, 'success');
    } else if (selectedRow) {
      const pkVal = getPkValue(selectedRow);
      await databaseApi.updateRow(activeTable, pkVal, payload);
      showToast(`Record ${pkVal} updated in ${activeTable} successfully`, 'success');
    }
    loadRows();
    loadTables(true);
  };

  const handleDeleteRecord = async () => {
    if (!rowToDelete) return;
    const pkVal = getPkValue(rowToDelete);
    await databaseApi.deleteRow(activeTable, pkVal);
    showToast(`Record ${pkVal} deleted from ${activeTable}`, 'success');
    loadRows();
    loadTables(true);
  };

  const getTableIcon = (name: string) => {
    switch (name) {
      case 'users':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'tasks':
        return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      case 'task_assignments':
        return <LinkIcon className="w-4 h-4 text-indigo-500" />;
      default:
        return <Layers className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-enter pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                <span>Database Manager</span>
                <span className="font-mono text-xs uppercase px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                  {dbType}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Inspect database tables, manage records with CRUD operations, and execute raw queries
              </p>
            </div>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              loadTables(true);
              loadRows();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRows ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setSqlModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors shadow-sm cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>SQL Console</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Insert Record</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Total Tables</span>
            <TableIcon className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {tables.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Total DB Records</span>
            <HardDrive className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {totalDbRecords}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Active Table</span>
            <Database className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono truncate">
            {activeTable || 'None'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Filtered Rows</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {totalRows}
          </div>
        </div>
      </div>

      {/* Main Container: Sidebar for Tables + Main Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table Selector (Pills / Sidebar) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Database Tables</span>
            <span className="font-mono text-[10px]">{tables.length}</span>
          </div>

          <div className="space-y-1.5 pt-1">
            {isLoadingTables ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading tables...</div>
            ) : (
              tables.map((t) => {
                const isActive = t.name === activeTable;
                return (
                  <button
                    key={t.name}
                    onClick={() => {
                      setActiveTable(t.name);
                      setPage(1);
                      setSearch('');
                      setSortBy(undefined);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {getTableIcon(t.name)}
                      <span className="font-mono truncate">{t.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t.row_count}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Table Records Grid & Controls */}
        <div className="lg:col-span-9 space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${activeTable}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                onClick={() => setShowSchema(!showSchema)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  showSchema
                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>{showSchema ? 'Hide Schema' : 'View Schema'}</span>
              </button>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              >
                <option value={10}>10 rows</option>
                <option value={15}>15 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
              </select>
            </div>
          </div>

          {/* Schema Viewer Accordion */}
          {showSchema && activeMeta && (
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 animate-enter">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-500" />
                  Table Schema Definition: <code className="font-mono text-blue-600 dark:text-blue-400">{activeTable}</code>
                </span>
                <span className="font-mono text-slate-500">{activeMeta.columns.length} columns</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5 text-slate-700 dark:text-slate-300">Column Name</th>
                      <th className="p-2.5 text-slate-700 dark:text-slate-300">Data Type</th>
                      <th className="p-2.5 text-slate-700 dark:text-slate-300">Primary Key</th>
                      <th className="p-2.5 text-slate-700 dark:text-slate-300">Nullable</th>
                      <th className="p-2.5 text-slate-700 dark:text-slate-300">Default Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeMeta.columns.map((c) => (
                      <tr key={c.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {c.primary_key && <Key className="w-3.5 h-3.5 text-amber-500" />}
                          <span>{c.name}</span>
                        </td>
                        <td className="p-2.5 text-blue-600 dark:text-blue-400">{c.type}</td>
                        <td className="p-2.5">
                          {c.primary_key ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold">
                              YES (PK)
                            </span>
                          ) : (
                            <span className="text-slate-400">NO</span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">
                          {c.nullable ? 'NULLABLE' : 'NOT NULL'}
                        </td>
                        <td className="p-2.5 text-slate-500 dark:text-slate-400">
                          {c.default || <span className="italic text-slate-400">none</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table Data Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto min-h-[350px]">
              {isLoadingRows ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs">Fetching records from {activeTable}...</span>
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-2">
                  <Database className="w-10 h-10 stroke-1 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    No records found
                  </p>
                  <p className="text-xs text-slate-400">
                    {debouncedSearch
                      ? `No matching rows in '${activeTable}' for "${debouncedSearch}".`
                      : `The '${activeTable}' table is currently empty.`}
                  </p>
                  <button
                    onClick={handleOpenCreate}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 hover:bg-blue-100 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insert First Record</span>
                  </button>
                </div>
              ) : (
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] w-24">
                        Actions
                      </th>
                      {columns.map((col) => {
                        const isSorted = sortBy === col.name;
                        const isPk = primaryKeys.includes(col.name) || col.primary_key;
                        return (
                          <th
                            key={col.name}
                            onClick={() => handleSort(col.name)}
                            className="p-3 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                          >
                            <div className="flex items-center gap-1.5">
                              {isPk && <Key className="w-3 h-3 text-amber-500" />}
                              <span>{col.name}</span>
                              {isSorted ? (
                                sortOrder === 'asc' ? (
                                  <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                ) : (
                                  <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 hover:opacity-100" />
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                          {/* Row Actions */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setRowToInspect(row);
                                  setDetailModalOpen(true);
                                }}
                                title="Inspect Record"
                                className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(row)}
                                title="Edit Record"
                                className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setRowToDelete(row);
                                  setDeleteModalOpen(true);
                                }}
                                title="Delete Record"
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Data cells */}
                          {columns.map((col) => {
                            const val = row[col.name];
                            const isPk = primaryKeys.includes(col.name) || col.primary_key;

                            return (
                              <td
                                key={col.name}
                                className="p-3 text-slate-800 dark:text-slate-200 max-w-xs truncate"
                              >
                                {val === null || val === undefined ? (
                                  <span className="text-slate-400 italic">null</span>
                                ) : typeof val === 'boolean' ? (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                      val
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                  >
                                    {val ? 'TRUE' : 'FALSE'}
                                  </span>
                                ) : isPk ? (
                                  <span className="font-bold text-amber-600 dark:text-amber-400">
                                    {String(val)}
                                  </span>
                                ) : col.name.toLowerCase().includes('date') || col.name.toLowerCase().endsWith('_at') ? (
                                  <span title={String(val)} className="text-slate-700 dark:text-slate-300">
                                    {String(val).split('T')[0].split(' ')[0]}
                                  </span>
                                ) : (
                                  <span title={String(val)}>{String(val)}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="font-mono">
                Showing{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {rows.length > 0 ? (page - 1) * pageSize + 1 : 0}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {Math.min(page * pageSize, totalRows)}
                </span>{' '}
                of <span className="font-semibold text-slate-800 dark:text-slate-200">{totalRows}</span> records
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoadingRows}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="font-mono text-xs px-2">
                  Page <span className="font-semibold text-slate-800 dark:text-slate-200">{page}</span> / {totalPages}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoadingRows}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CRUD Modals */}
      <RecordModal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        onSave={handleSaveRecord}
        tableName={activeTable}
        columns={columns}
        primaryKeys={primaryKeys}
        initialData={selectedRow}
        mode={recordModalMode}
      />

      <DeleteRecordModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setRowToDelete(null);
        }}
        onConfirm={handleDeleteRecord}
        tableName={activeTable}
        recordIdentifier={rowToDelete ? String(getPkValue(rowToDelete)) : ''}
      />

      <RowDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setRowToInspect(null);
        }}
        tableName={activeTable}
        row={rowToInspect}
      />

      <SqlQueryModal
        isOpen={sqlModalOpen}
        onClose={() => setSqlModalOpen(false)}
        activeTableName={activeTable}
        onRefreshNeeded={() => {
          loadRows();
          loadTables(true);
        }}
      />
    </div>
  );
};
export default AdminDatabasePage;
