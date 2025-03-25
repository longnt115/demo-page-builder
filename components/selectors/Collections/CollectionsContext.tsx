import React, { createContext, useContext } from 'react';

// Định nghĩa kiểu dữ liệu cho Context
interface CollectionsContextType {
  item: any;
  index: number;
  itemVariable: string;
  fields: string[];
}

// Tạo context với giá trị mặc định
export const CollectionsContext = createContext<CollectionsContextType>({
  item: null,
  index: -1,
  itemVariable: 'item',
  fields: [
    'title',
    'imageUrl',
    'originalPrice',
    'discountedPrice',
    'voucherCode',
  ],
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
