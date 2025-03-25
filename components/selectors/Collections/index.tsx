import { Element, useNode } from '@craftjs/core';
import React from 'react';

import { CollectionsProvider } from './CollectionsContext';
import { CollectionsSettings } from './CollectionsSettings';

import { Container } from '../Container';
import { Resizer } from '../Resizer';

export type CollectionsProps = {
  background: Record<'r' | 'g' | 'b' | 'a', number>;
  color: Record<'r' | 'g' | 'b' | 'a', number>;
  padding: string[];
  margin: string[];
  width: string;
  height: string;
  shadow: number;
  radius: number;
  columns: number;
  children: React.ReactNode;
  // Thuộc tính mới cho data binding
  data: any[];
  itemVariable: string;
  layout: 'grid' | 'list' | 'flex' | 'custom';
  renderMode: 'columns' | 'data';
  gridGap: string;
  itemsPerRow: number;
  fields: string[];
};

const defaultProps = {
  background: { r: 255, g: 255, b: 255, a: 1 },
  color: { r: 0, g: 0, b: 0, a: 1 },
  padding: ['20', '20', '20', '20'],
  margin: ['0', '0', '0', '0'],
  shadow: 0,
  radius: 0,
  width: '100%',
  height: 'auto',
  columns: 3,
  // Giá trị mặc định cho thuộc tính mới
  data: [],
  itemVariable: 'item',
  layout: 'grid' as const,
  renderMode: 'columns' as const,
  gridGap: '16px',
  itemsPerRow: 3,
  fields: [],
};

export const Collections = (props: Partial<CollectionsProps>) => {
  props = {
    ...defaultProps,
    ...props,
  };

  const {
    background,
    color,
    padding,
    margin,
    shadow,
    radius,
    columns,
    children,
    data,
    itemVariable,
    layout,
    renderMode,
    gridGap,
    itemsPerRow,
    fields,
  } = props;

  // Using useNode to connect to the Craft.js system
  const { id } = useNode();

  // Render columns (legacy mode)
  const renderColumns = () => {
    const columnElements = [];
    const columnWidth = `${100 / columns}%`;

    for (let i = 0; i < columns; i++) {
      columnElements.push(
        <Element
          key={`column-${i}`}
          id={`${id}-column-${i}`}
          canvas
          is={Container}
          width={columnWidth}
          height="100%"
          padding={['10', '10', '10', '10']}
          custom={{ displayName: `Column ${i + 1}` }}
        >
          {i === 0 && children}
        </Element>
      );
    }

    return columnElements;
  };

  // Render data items
  const renderDataItems = () => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      // Fallback: Hiển thị một mục mẫu nếu không có dữ liệu
      return (
        <CollectionsProvider
          value={{
            item: { sample: 'Sample Data' },
            index: 0,
            itemVariable,
            fields: fields || [],
          }}
        >
          <Element
            key="sample-item"
            id={`${id}-sample-item`}
            canvas
            is={Container}
            custom={{
              displayName: `${itemVariable} (Sample)`,
              border: '1px dashed #ddd',
            }}
            padding={['10', '10', '10', '10']}
          >
            {children}
          </Element>
        </CollectionsProvider>
      );
    }

    // Hiển thị danh sách dữ liệu thực tế
    return data.map((item, index) => (
      <CollectionsProvider
        key={`${id}-item-${index}`}
        value={{
          item,
          index,
          itemVariable,
          fields: fields || Object.keys(item) || [],
        }}
      >
        <Element
          id={`${id}-item-${index}`}
          canvas
          is={Container}
          padding={['10', '10', '10', '10']}
          custom={{
            displayName: `${itemVariable} ${index + 1}`,
            [itemVariable]: item, // Lưu dữ liệu mục vào thuộc tính tùy chỉnh
            border: '1px dashed #ddd',
          }}
        >
          {children}
        </Element>
      </CollectionsProvider>
    ));
  };

  // Xác định kiểu bố cục
  const getLayoutStyle = () => {
    if (renderMode === 'columns') {
      return {
        display: 'flex',
        flexDirection: 'row' as const,
      };
    }

    switch (layout) {
      case 'list':
        return {
          display: 'flex',
          flexDirection: 'column' as const,
          gap: gridGap,
        };
      case 'flex':
        return {
          display: 'flex',
          flexDirection: 'row' as const,
          flexWrap: 'wrap' as const,
          gap: gridGap,
        };
      case 'grid':
      default:
        return {
          display: 'grid',
          gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
          gap: gridGap,
        };
    }
  };

  return (
    <Resizer
      propKey={{ width: 'width', height: 'height' }}
      style={{
        background: `rgba(${Object.values(background)})`,
        color: `rgba(${Object.values(color)})`,
        padding: `${padding[0]}px ${padding[1]}px ${padding[2]}px ${padding[3]}px`,
        margin: `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`,
        boxShadow:
          shadow === 0
            ? 'none'
            : `0px 3px 100px ${shadow}px rgba(0, 0, 0, 0.13)`,
        borderRadius: `${radius}px`,
        ...getLayoutStyle(),
      }}
    >
      {renderMode === 'columns' ? renderColumns() : renderDataItems()}
    </Resizer>
  );
};

Collections.craft = {
  displayName: 'Collections',
  props: defaultProps,
  rules: {
    canDrag: () => true,
    // Chỉ cho phép kéo vào khi destination là một Element
    canMoveIn: (incoming) => {
      // Cho phép kéo vào
      if (incoming.length > 1) {
        // Không cho phép kéo nhiều component vào cùng lúc
        return false;
      }
      return true;
    },
    // Luôn cho phép kéo thả, việc thay thế component sẽ do Craft.js xử lý
    shouldDropElement: () => {
      return true;
    },
    isDroppable: () => true, // Khai báo Collections có thể nhận thả
  },
  related: {
    toolbar: CollectionsSettings,
  },
};
