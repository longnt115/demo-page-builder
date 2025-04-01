import React, { useEffect, useState } from "react";

import { useEditor, useNode } from "@craftjs/core";
import { FieldSelector } from "components/editor/Base/FieldSelector";
import { ToolbarItem, ToolbarSection } from "../../editor";
import { useCollectionsContext } from "../Collections/CollectionsContext";

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

  // Danh sách các toán tử so sánh
  const operatorOptions = [
    { value: "equals", label: "Bằng (=)" },
    { value: "notEquals", label: "Không bằng (≠)" },
    { value: "contains", label: "Chứa" },
    { value: "startsWith", label: "Bắt đầu với" },
    { value: "endsWith", label: "Kết thúc với" },
    { value: "greaterThan", label: "Lớn hơn (>)" },
    { value: "lessThan", label: "Nhỏ hơn (<)" },
    { value: "isEmpty", label: "Rỗng" },
    { value: "isNotEmpty", label: "Không rỗng" },
    { value: "isTrue", label: "Là True" },
    { value: "isFalse", label: "Là False" },
  ];

  // Xác định xem có cần hiển thị trường nhập giá trị không
  const needsValueInput = React.useMemo(() => {
    const noValueOperators = ["isEmpty", "isNotEmpty", "isTrue", "isFalse"];
    return !noValueOperators.includes(props.conditionOperator || "");
  }, [props.conditionOperator]);

  return (
    <React.Fragment>
      {isInsideCollections && (
        <>
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

          {/* Section mới cho Conditional Rendering */}
          <ToolbarSection
            title="Điều kiện hiển thị"
            props={[
              "enableCondition",
              "conditionField",
              "conditionOperator",
              "conditionValue",
              "conditionNegate",
            ]}
            summary={({ enableCondition }: any) => {
              return enableCondition ? "Đã kích hoạt" : "Không kích hoạt";
            }}
          >
            <ToolbarItem
              propKey="enableCondition"
              type="checkbox"
              label="Bật điều kiện hiển thị"
            />

            {props.enableCondition && (
              <>
                <ToolbarItem
                  propKey="conditionField"
                  type="select"
                  label="Trường dữ liệu"
                >
                  {availableFields?.length > 0 && (
                    <FieldSelector fields={availableFields} />
                  )}
                </ToolbarItem>

                <ToolbarItem
                  propKey="conditionOperator"
                  type="select"
                  label="Toán tử so sánh"
                >
                  {operatorOptions.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </ToolbarItem>

                {needsValueInput && (
                  <ToolbarItem
                    propKey="conditionValue"
                    type="text"
                    label="Giá trị so sánh"
                    full={true}
                  />
                )}

                <ToolbarItem
                  propKey="conditionNegate"
                  type="checkbox"
                  label="Đảo ngược điều kiện"
                />

                <div
                  style={{
                    fontSize: "12px",
                    marginTop: "8px",
                    padding: "8px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                    color: "#666",
                  }}
                >
                  Thành phần này sẽ {props.conditionNegate ? "ẩn" : "hiển thị"}{" "}
                  khi điều kiện
                  {props.conditionNegate ? "thỏa mãn" : "không thỏa mãn"}.
                </div>
              </>
            )}
          </ToolbarSection>
        </>
      )}

      <ToolbarSection title="Image Source">
        {!props.useDataBinding && (
          <ToolbarItem
            full={true}
            propKey="src"
            type="text"
            label="URL ảnh"
            {...(props.useDataBinding && { disabled: true })}
          />
        )}
        <ToolbarItem
          full={true}
          propKey="alt"
          type="text"
          label="Mô tả ảnh (alt)"
        />
      </ToolbarSection>

      <ToolbarSection
        title="Border"
        props={["borderRadius", "borderWidth", "borderColor"]}
        summary={({ borderRadius, borderWidth, borderColor }: any) => {
          // Sử dụng borderColor trong summary để tránh lỗi "không sử dụng"
          const borderColorStr = borderColor
            ? `rgba(${Object.values(borderColor)})`
            : "transparent";
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
      <ToolbarSection
        title="Styles"
        props={["width", "height", "zIndex", "opacity", "position"]}
      >
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
        <ToolbarItem
          full={true}
          propKey="objectFit"
          type="select"
          label="Kiểu hiển thị"
        >
          <FieldSelector
            fields={["cover", "contain", "fill", "none", "scale-down"]}
            noUse={false}
          />
        </ToolbarItem>
        <ToolbarItem full={true} propKey="zIndex" type="text" label="Z-index" />
        <ToolbarItem
          full={true}
          propKey="opacity"
          type="text"
          label="Opacity"
        />
        <ToolbarItem
          full={true}
          propKey="position"
          type="select"
          label="Position"
        >
          <FieldSelector
            fields={["relative", "static", "fixed", "absolute", "sticky"]}
            noUse={false}
          />
        </ToolbarItem>
      </ToolbarSection>
    </React.Fragment>
  );
};
