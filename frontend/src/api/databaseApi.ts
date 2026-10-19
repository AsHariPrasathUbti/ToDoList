import apiClient from './axios';

export interface ColumnMeta {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
  default: string | null;
  autoincrement: boolean;
}

export interface ForeignKeyMeta {
  constrained_columns: string[];
  referred_table: string;
  referred_columns: string[];
}

export interface TableMeta {
  name: string;
  row_count: number;
  columns: ColumnMeta[];
  primary_keys: string[];
  foreign_keys: ForeignKeyMeta[];
}

export interface TablesResponse {
  tables: TableMeta[];
  database_type: string;
  total_tables: number;
}

export interface TableRowsResponse {
  table_name: string;
  primary_keys: string[];
  columns: ColumnMeta[];
  rows: Record<string, unknown>[];
  page: number;
  page_size: number;
  total_rows: number;
  total_pages: number;
}

export interface SqlQueryResult {
  success: boolean;
  is_select: boolean;
  columns?: string[];
  rows?: Record<string, unknown>[];
  total_returned?: number;
  rows_affected?: number;
  execution_ms: number;
  message?: string;
}

export const databaseApi = {
  getTables: async (): Promise<TablesResponse> => {
    const response = await apiClient.get<TablesResponse>('/admin/database/tables');
    return response.data;
  },

  getTableRows: async (
    tableName: string,
    params: {
      page?: number;
      page_size?: number;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
      search?: string;
    } = {}
  ): Promise<TableRowsResponse> => {
    const response = await apiClient.get<TableRowsResponse>(`/admin/database/tables/${tableName}/rows`, {
      params,
    });
    return response.data;
  },

  createRow: async (
    tableName: string,
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/admin/database/tables/${tableName}/rows`,
      payload
    );
    return response.data;
  },

  updateRow: async (
    tableName: string,
    rowId: string | number,
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put<{ success: boolean; message: string }>(
      `/admin/database/tables/${tableName}/rows/${encodeURIComponent(String(rowId))}`,
      payload
    );
    return response.data;
  },

  deleteRow: async (
    tableName: string,
    rowId: string | number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/admin/database/tables/${tableName}/rows/${encodeURIComponent(String(rowId))}`
    );
    return response.data;
  },

  executeQuery: async (query: string): Promise<SqlQueryResult> => {
    const response = await apiClient.post<SqlQueryResult>('/admin/database/query', { query });
    return response.data;
  },
};
