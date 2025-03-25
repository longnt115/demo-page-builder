import { useEditor, useNode } from '@craftjs/core';
import React, { useEffect, useState } from 'react';

import { ToolbarItem, ToolbarSection } from '../../editor';
import { useCollectionsContext } from '../Collections/CollectionsContext';

// Component để hiển thị các option field trong select
const FieldSelector: React.FC<{
  fields: string[];
}> = ({ fields }) => (
  <>
    <option value="">Không sử dụng</option>
    {fields.map((field) => (
      <option key={field} value={field}>
        {field}
      </option>
    ))}
  </>
);

// Component để đảm bảo hiển thị các ToolbarItems
const SettingsEnhancer = ({ children }) => {
  useEffect(() => {
    // Thêm CSS để ghi đè lên các style có thể ngăn ToolbarItem hiển thị
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      /* Force hiển thị các ToolbarItem */
      .craftjs-settings {
        display: block !important;
        visibility: visible !important;
      }
      .craftjs-settings * {
        display: block;
        visibility: visible !important;
      }
      .craftjs-settings .MuiGrid-item {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      .craftjs-settings .mb-2 {
        display: block !important;
        margin-bottom: 0.5rem !important;
      }
      .craftjs-settings input, 
      .craftjs-settings select,
      .craftjs-settings label {
        display: block !important;
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  return <>{children}</>;
};

export const CustomCardContent1Settings = () => {
  const { showVoucher, useDataBinding, fields } = useNode((node) => {
    return {
      showVoucher: node.data.props.showVoucher,
      useDataBinding: node.data.props.useDataBinding,
      fields: node.data.props.availableFields,
    };
  });

  const { id } = useNode();
  const { nodes } = useEditor((state) => ({
    nodes: state.nodes,
  }));

  // Kiểm tra xem component có nằm trong Collections không
  const collectionsContext = useCollectionsContext();

  const [availableFields, setAvailableFields] = useState<string[]>([]);

  // Kiểm tra chi tiết xem component có nằm trong Collections không
  const isInsideCollections = React.useMemo(() => {
    // Reset debug state
    const newDebugState = {
      contextDetection: false,
      idDetection: false,
      customPropDetection: false,
      finalResult: false,
    };

    // Phương pháp 1: Kiểm tra context
    if (
      collectionsContext &&
      collectionsContext.index !== undefined &&
      collectionsContext.index !== -1
    ) {
      newDebugState.contextDetection = true;
    }

    // Phương pháp 2: Kiểm tra parent node ID pattern
    try {
      const currentNode = nodes[id];
      if (currentNode && currentNode.data && currentNode.data.parent) {
        const parentId = currentNode.data.parent;
        if (parentId && parentId.includes('-item-')) {
          newDebugState.idDetection = true;
        }

        // Phương pháp 3: Kiểm tra custom props
        const parentNode = nodes[parentId];
        if (parentNode && parentNode.data && parentNode.data.custom) {
          const custom = parentNode.data.custom;
          const isItemContainer =
            custom.displayName?.includes('item') ||
            custom.displayName?.includes('product') ||
            Object.keys(custom).some(
              (key) => key === 'item' || key === 'product'
            );

          if (isItemContainer) {
            newDebugState.customPropDetection = true;
          }
        }
      }
    } catch (err) {
      console.error('Error in ID detection:', err);
    }

    // Kết quả cuối cùng: sử dụng bất kỳ phương pháp nào phát hiện thành công
    const result =
      newDebugState.contextDetection ||
      newDebugState.idDetection ||
      newDebugState.customPropDetection;

    newDebugState.finalResult = result;

    // Force always return true during development to verify UI
    // Uncomment line below to force showing Collections options
    // return true;

    return result;
  }, [collectionsContext, id, nodes]);

  // Cập nhật availableFields khi có thay đổi từ context
  useEffect(() => {
    if (isInsideCollections) {
      setAvailableFields(fields);
    }
  }, [fields, isInsideCollections]);

  // Fix hiển thị UI thông qua DOM manipulation
  useEffect(() => {
    if (!isInsideCollections) return;
    const interval = setInterval(() => {
      try {
        // Tìm tất cả các phần tử settings
        const settingsPanel = document.querySelector('.craftjs-settings');
        if (settingsPanel) {
          // Tìm các ToolbarItem trong settings và đảm bảo chúng hiển thị
          const toolbarItems = settingsPanel.querySelectorAll('.MuiGrid-item');
          if (toolbarItems.length > 0) {
            toolbarItems.forEach((item) => {
              (item as HTMLElement).style.display = 'block';
              (item as HTMLElement).style.visibility = 'visible';
              (item as HTMLElement).style.opacity = '1';
            });

            // Đảm bảo input và select elements cũng hiển thị và có thể tương tác
            const inputs = settingsPanel.querySelectorAll('input, select');
            inputs.forEach((input) => {
              (input as HTMLElement).style.pointerEvents = 'auto';
              (input as HTMLElement).style.display = 'block';
            });

            // Sau khi đã áp dụng fixes, ngừng interval
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Error fixing UI display:', err);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isInsideCollections]);

  return (
    <SettingsEnhancer>
      {isInsideCollections && (
        <ToolbarSection title="Data Binding">
          <ToolbarItem
            propKey="useDataBinding"
            type="checkbox"
            label="Sử dụng dữ liệu từ Collections"
          />
        </ToolbarSection>
      )}

      <ToolbarSection title="Product Image">
        <ToolbarItem
          full={true}
          propKey="imageUrl"
          type={useDataBinding ? 'select' : 'text'}
          label="Image URL"
        >
          {useDataBinding && <FieldSelector fields={availableFields} />}
        </ToolbarItem>
      </ToolbarSection>
      <ToolbarSection title="Product Details">
        <ToolbarItem
          full={true}
          propKey="title"
          type={useDataBinding ? 'select' : 'text'}
          label="Product Title"
        >
          {useDataBinding && <FieldSelector fields={availableFields} />}
        </ToolbarItem>
        <ToolbarItem
          propKey="originalPrice"
          type={useDataBinding ? 'select' : 'number'}
          label="Original Price"
        >
          {useDataBinding && <FieldSelector fields={availableFields} />}
        </ToolbarItem>
        <ToolbarItem
          propKey="discountedPrice"
          type={useDataBinding ? 'select' : 'number'}
          label="Discounted Price"
        >
          {useDataBinding && <FieldSelector fields={availableFields} />}
        </ToolbarItem>
      </ToolbarSection>
      <ToolbarSection title="Voucher">
        <ToolbarItem
          propKey="showVoucher"
          type="checkbox"
          label="Show Voucher"
        />
        {showVoucher && (
          <ToolbarItem
            propKey="voucherCode"
            type={useDataBinding ? 'select' : 'text'}
            label="Voucher Code"
          >
            {useDataBinding && <FieldSelector fields={availableFields} />}
          </ToolbarItem>
        )}
      </ToolbarSection>
    </SettingsEnhancer>
  );
};
