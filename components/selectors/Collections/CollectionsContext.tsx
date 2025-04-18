import React, { createContext, useContext } from 'react';

// Định nghĩa kiểu dữ liệu cho Context
interface CollectionsContextType {
  item: any;
  index: number;
  itemVariable: string;
  fields: string[];
  isLoading?: boolean;
  error?: string | null;
}

// Tạo context với giá trị mặc định
export const CollectionsContext = createContext<CollectionsContextType>({
  item: {},  
  index: -1,
  itemVariable: 'item',
  fields: [
    'title',
    'imageUrl',
    'originalPrice',
    'discountedPrice',
    'voucherCode',
  ],
  isLoading: false,
  error: null,
});

// Hook để sử dụng dữ liệu từ context
export const useCollectionsContext = () => {
  return useContext(CollectionsContext);
};

// Provider component để cung cấp context cho các thành phần con
export const CollectionsProvider: React.FC<{
  children: React.ReactNode;
  value: CollectionsContextType;
}> = ({ children, value }) => {
  return (
    <CollectionsContext.Provider value={value}>
      {children}
    </CollectionsContext.Provider>
  );
};
