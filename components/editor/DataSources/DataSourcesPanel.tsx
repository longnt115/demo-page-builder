import React from 'react';
import { DataSourcesManager } from './DataSourcesManager';
import { DataSourcesProvider } from './DataSourcesContext';

export const DataSourcesPanel: React.FC = () => {
  return (
    <DataSourcesProvider>
      <div className="h-full overflow-auto">
        <DataSourcesManager />
      </div>
    </DataSourcesProvider>
  );
};
