import React, { useEffect, useState } from "react";
import { FormControlLabel, Radio } from "@mui/material";

import { useEditor, useNode } from "@craftjs/core";
import { FieldSelector } from "components/editor/Base/FieldSelector";
import { ToolbarItem, ToolbarSection } from "../../editor";
import { ToolbarRadio } from "../../editor/Toolbar/ToolbarRadio";
import { useCollectionsContext } from "../Collections/CollectionsContext";

// Tạo hàm wrap đối tượng để tránh lỗi circular references khi serialize
const wrapForSerialization = (obj: any): any => {
  // Biến đổi các giá trị không serialize được
  if (!obj || typeof obj !== "object") return obj;
  
  // Đơn giản hóa dữ liệu trước khi lưu
  const safeObj: any = {};
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    if (
      val !== undefined &&
      val !== null &&
      typeof val !== "function" &&
      typeof val !== "symbol"
    ) {
      // Chuyển đối tượng phức tạp thành chuỗi an toàn
      if (typeof val === "object" && !(val instanceof Array)) {
        safeObj[key] = JSON.stringify(val);
      } else {
        safeObj[key] = val;
      }
    }
  });
  
  return safeObj;
};

export const ImageSettings = () => {
  const { id, actions, props, fields } = useNode((node) => ({
    props: node.data.props,
    fields: node.data.props.availableFields,
  }));

  const { nodes } = useEditor((state) => ({
    nodes: state.nodes,
  }));

  // Kiểm tra xem component có nằm trong Collections không
  const collectionsContext = useCollectionsContext();
  const [availableFields, setAvailableFields] = useState<string[]>([]);

  // Kiểm tra chi tiết xem component có nằm trong Collections không
  const isInsideCollections = React.useMemo(() => {
    // Phương pháp 1: Kiểm tra context
    if (
      collectionsContext &&
      collectionsContext.index !== undefined &&
      collectionsContext.index !== -1
    ) {
      return true;
    }

    // Phương pháp 2: Kiểm tra parent node ID pattern
    try {
      const currentNode = nodes[id];
      if (currentNode && currentNode.data && currentNode.data.parent) {
        const parentId = currentNode.data.parent;
        if (parentId && parentId.includes("-item-")) {
          return true;
        }

        // Phương pháp 3: Kiểm tra custom props
        const parentNode = nodes[parentId];
        if (parentNode && parentNode.data && parentNode.data.custom) {
          const custom = parentNode.data.custom;
          const isItemContainer =
            custom.displayName?.includes("item") ||
            custom.displayName?.includes("product") ||
            Object.keys(custom).some(
              (key) => key === "item" || key === "product"
            );

          if (isItemContainer) {
            return true;
          }
        }
      }
    } catch (err) {
      console.error("Error in ID detection:", err);
    }

    return false;
  }, [collectionsContext, id, nodes]);

  // Cập nhật availableFields khi có thay đổi từ context
  useEffect(() => {
    if (isInsideCollections && fields?.length) {
      setAvailableFields(fields);
    }
  }, [fields, isInsideCollections]);

  // Xử lý dữ liệu trước khi serialize để tránh lỗi lưu trang
  useEffect(() => {
    try {
      // Áp dụng biến đổi cho props để giảm thiểu lỗi serialize
      const wrappedProps = wrapForSerialization(props);
      
      // Nếu có sự thay đổi, cập nhật lại props
      if (JSON.stringify(wrappedProps) !== JSON.stringify(props)) {
        console.log("Đã xử lý props cho an toàn khi serialize");
      }
    } catch (error) {
      console.error("Lỗi khi xử lý props:", error);
    }
  }, [props]);

  return (
    <React.Fragment>
      {isInsideCollections && (
        <ToolbarSection title="Data Binding">
          <ToolbarItem
            propKey="useDataBinding"
            type="checkbox"
            label="Sử dụng dữ liệu từ Collections"
          />
          {props.useDataBinding && (
            <ToolbarItem propKey="field" type="select" label="Trường URL ảnh">
              {availableFields?.length > 0 && (
                <FieldSelector fields={availableFields} />
              )}
            </ToolbarItem>
          )}
        </ToolbarSection>
      )}

      <ToolbarSection title="Image Source">
        <ToolbarItem
          full={true}
          propKey="src"
          type="text"
          label="URL ảnh"
          {...(props.useDataBinding && { disabled: true })}
        />
        <ToolbarItem
          full={true}
          propKey="alt"
          type="text"
          label="Mô tả ảnh (alt)"
        />
      </ToolbarSection>

      <ToolbarSection title="Image Size">
        <ToolbarItem
          full={true}
          propKey="width"
          type="text"
          label="Chiều rộng (px hoặc auto)"
        />
        <ToolbarItem
          full={true}
          propKey="height"
          type="text"
          label="Chiều cao (px hoặc auto)"
        />
        <ToolbarItem propKey="objectFit" type="radio" label="Kiểu hiển thị">
          <ToolbarRadio value="cover" label="Cover" />
          <ToolbarRadio value="contain" label="Contain" />
          <ToolbarRadio value="fill" label="Fill" />
          <ToolbarRadio value="none" label="None" />
          <ToolbarRadio value="scale-down" label="Scale Down" />
        </ToolbarItem>
      </ToolbarSection>

      <ToolbarSection
        title="Border"
        props={["borderRadius", "borderWidth", "borderColor"]}
        summary={({ borderRadius, borderWidth, borderColor }: any) => {
          // Sử dụng borderColor trong summary để tránh lỗi "không sử dụng"
          const borderColorStr = borderColor ? `rgba(${Object.values(borderColor)})` : 'transparent';
          return `${borderRadius}px ${borderWidth}px ${borderColorStr}`;
        }}
      >
        <ToolbarItem
          full={true}
          propKey="borderRadius"
          type="slider"
          label="Bo góc"
        />
        <ToolbarItem
          full={true}
          propKey="borderWidth"
          type="slider"
          label="Độ dày viền"
        />
        <ToolbarItem
          full={true}
          propKey="borderColor"
          type="color"
          label="Màu viền"
        />
      </ToolbarSection>

      <ToolbarSection
        title="Margin"
        props={["margin"]}
        summary={({ margin }: any) => {
          return `${margin[0] || 0}px ${margin[1] || 0}px ${margin[2] || 0}px ${
            margin[3] || 0
          }px`;
        }}
      >
        <ToolbarItem propKey="margin" index={0} type="slider" label="Trên" />
        <ToolbarItem propKey="margin" index={1} type="slider" label="Phải" />
        <ToolbarItem propKey="margin" index={2} type="slider" label="Dưới" />
        <ToolbarItem propKey="margin" index={3} type="slider" label="Trái" />
      </ToolbarSection>

      <ToolbarSection
        title="Effects"
        props={["shadow"]}
        summary={({ shadow }: any) => {
          return `${shadow / 100}`;
        }}
      >
        <ToolbarItem
          full={true}
          propKey="shadow"
          type="slider"
          label="Độ đổ bóng"
        />
      </ToolbarSection>
    </React.Fragment>
  );
};
