import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type DataSourceType = 'static' | 'json' | 'api';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type DataSource = {
  id: string;              // ID duy nhất của data source
  name: string;            // Tên hiển thị
  type: DataSourceType;    // Loại data source
  description?: string;    // Mô tả
  data: any[];            // Dữ liệu đã được xử lý
  fields: string[];       // Các trường dữ liệu
  lastUpdated: number;    // Thời gian cập nhật cuối
  
  // Các trường cho nguồn dữ liệu JSON
  jsonData?: string;
  jsonDataPath?: string;
  
  // Các trường cho nguồn dữ liệu API
  apiUrl?: string;
  apiDataPath?: string;
  apiRefreshInterval?: number;
  apiMethod?: HttpMethod;
  apiHeaders?: Record<string, string>; // Headers cho API
  apiBody?: string; // Body cho POST, PUT
  
  // Trạng thái
  isLoading?: boolean;
  error?: string | null;
};

type DataSourcesContextType = {
  dataSources: Record<string, DataSource>;
  addDataSource: (dataSource: Omit<DataSource, 'id'>) => string;
  updateDataSource: (id: string, updates: Partial<DataSource>) => void;
  removeDataSource: (id: string) => void;
  getDataSourceById: (id: string) => DataSource | null;
  refreshDataSource: (id: string) => Promise<void>;
};

const DataSourcesContext = createContext<DataSourcesContextType>({
  dataSources: {},
  addDataSource: () => '',
  updateDataSource: () => {},
  removeDataSource: () => {},
  getDataSourceById: () => null,
  refreshDataSource: async () => {},
});

export const useDataSources = () => useContext(DataSourcesContext);

export function DataSourcesProvider({ children }: { children: React.ReactNode }) {
  const [dataSources, setDataSources] = useState<Record<string, DataSource>>({});

  // Thêm data source mới
  const addDataSource = useCallback((dataSource: Omit<DataSource, 'id'>) => {
    const id = `ds-${Date.now()}`;
    const newSource: DataSource = {
      ...dataSource,
      id,
      lastUpdated: Date.now(),
      isLoading: false,
      data: [],
      fields: [],
      apiMethod: dataSource.apiMethod || 'GET', // Default to GET if not specified
      apiHeaders: dataSource.apiHeaders || {},
    };

    setDataSources(prev => ({
      ...prev,
      [id]: newSource,
    }));

    return id;
  }, []);

  // Cập nhật data source
  const updateDataSource = useCallback((id: string, updates: Partial<DataSource>) => {
    setDataSources(prev => {
      if (!prev[id]) return prev;

      return {
        ...prev,
        [id]: {
          ...prev[id],
          ...updates,
          lastUpdated: Date.now(),
        },
      };
    });
  }, []);

  // Xóa data source
  const removeDataSource = useCallback((id: string) => {
    setDataSources(prev => {
      const newSources = { ...prev };
      delete newSources[id];
      return newSources;
    });
  }, []);

  // Lấy data source theo ID
  const getDataSourceById = useCallback((id: string): DataSource | null => {
    return dataSources[id] || null;
  }, [dataSources]);

  // Fetch dữ liệu từ API
  const fetchApiData = useCallback(async (dataSource: DataSource) => {
    if (!dataSource.apiUrl) return [];

    try {
      const response = await fetch(dataSource.apiUrl, {
        method: dataSource.apiMethod || 'GET',
        headers: dataSource.apiHeaders || {},
        body: dataSource.apiMethod !== 'GET' ? dataSource.apiBody : undefined,
      });
      
      if (!response.ok) {
        throw new Error(`API returned error: ${response.status}`);
      }

      const result = await response.json();

      // Lấy dữ liệu từ đường dẫn cụ thể nếu có
      if (dataSource.apiDataPath) {
        const paths = dataSource.apiDataPath.split('.');
        let data = result;
        
        for (const path of paths) {
          if (data && data[path] !== undefined) {
            data = data[path];
          } else {
            console.warn(`Path '${path}' not found in API data`);
            return [];
          }
        }
        
        return Array.isArray(data) ? data : [];
      }

      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching API data:', error);
      updateDataSource(dataSource.id, { error: String(error) });
      return [];
    }
  }, [updateDataSource]);

  // Parse dữ liệu từ JSON
  const parseJsonData = useCallback((dataSource: DataSource) => {
    if (!dataSource.jsonData) return [];

    try {
      const parsedData = JSON.parse(dataSource.jsonData);
      
      // Lấy dữ liệu từ đường dẫn cụ thể nếu có
      if (dataSource.jsonDataPath) {
        const paths = dataSource.jsonDataPath.split('.');
        let data = parsedData;
        
        for (const path of paths) {
          if (data && data[path] !== undefined) {
            data = data[path];
          } else {
            console.warn(`Path '${path}' not found in JSON data`);
            return [];
          }
        }
        
        return Array.isArray(data) ? data : [];
      }

      return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
      console.error('Error parsing JSON data:', error);
      updateDataSource(dataSource.id, { error: String(error) });
      return [];
    }
  }, [updateDataSource]);

  // Refresh dữ liệu cho một data source
  const refreshDataSourceInternal = useCallback(async (id: string) => {
    const dataSource = dataSources[id];
    if (!dataSource) return;

    updateDataSource(id, { isLoading: true, error: null });

    try {
      let newData: any[] = [];
      
      if (dataSource.type === 'api') {
        newData = await fetchApiData(dataSource);
      } else if (dataSource.type === 'json') {
        newData = parseJsonData(dataSource);
      } else if (dataSource.type === 'static') {
        newData = dataSource.data || [];
      }

      // Lấy danh sách trường từ dữ liệu
      const fields = newData.length > 0 ? Object.keys(newData[0]) : [];

      updateDataSource(id, {
        data: newData,
        fields,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error(`Error refreshing data source ${id}:`, error);
      updateDataSource(id, {
        isLoading: false,
        error: String(error),
      });
    }
  }, [dataSources, fetchApiData, parseJsonData, updateDataSource]);

  // Public refresh function
  const refreshDataSource = useCallback(async (id: string) => {
    await refreshDataSourceInternal(id);
  }, [refreshDataSourceInternal]);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedSources = localStorage.getItem('dataSources');
      if (savedSources) {
        setDataSources(JSON.parse(savedSources));
      }
    } catch (error) {
      console.error('Error loading data sources from localStorage:', error);
    }
  }, []);

  // Save to localStorage when changes
  useEffect(() => {
    if (Object.keys(dataSources).length > 0) {
      localStorage.setItem('dataSources', JSON.stringify(dataSources));
    }
  }, [dataSources]);

  // Set up interval refreshers
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    
    Object.values(dataSources).forEach(dataSource => {
      if (
        dataSource.type === 'api' && 
        dataSource.apiRefreshInterval && 
        dataSource.apiRefreshInterval > 0
      ) {
        const interval = setInterval(
          () => refreshDataSourceInternal(dataSource.id),
          dataSource.apiRefreshInterval
        );
        intervals.push(interval);
      }
    });

    // Clean up intervals
    return () => {
      intervals.forEach(clearInterval);
    };
  }, [dataSources, refreshDataSourceInternal]);

  // Khởi tạo/refresh tất cả data sources
  useEffect(() => {
    Object.keys(dataSources).forEach(refreshDataSourceInternal);
  }, []);

  return (
    <DataSourcesContext.Provider
      value={{
        dataSources,
        addDataSource,
        updateDataSource,
        removeDataSource,
        getDataSourceById,
        refreshDataSource,
      }}
    >
      {children}
    </DataSourcesContext.Provider>
  );
}
