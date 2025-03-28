import { Element, useNode } from "@craftjs/core";
import React, { useCallback, useEffect, useState } from "react";

import { CollectionsSettings } from "./CollectionsSettings";

import { Container } from "../Container";
import { Resizer } from "../Resizer";
import { CollectionsProvider } from "./CollectionsContext";

export type CollectionsProps = {
  background: Record<"r" | "g" | "b" | "a", number>;
  color: Record<"r" | "g" | "b" | "a", number>;
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
  layout: "grid" | "list" | "flex" | "custom";
  renderMode: "columns" | "data";
  gridGap: string;
  itemsPerRow: number;
  fields: string[];
  // Thuộc tính cho nguồn dữ liệu
  dataSource: "static" | "api" | "json";
  // Thuộc tính cho API
  apiUrl: string;
  apiEnabled: boolean;
  apiDataPath: string;
  apiRefreshInterval: number;
  // Thuộc tính cho JSON
  jsonData: string;
  jsonDataPath: string;
};

const defaultProps = {
  background: { r: 255, g: 255, b: 255, a: 1 },
  color: { r: 0, g: 0, b: 0, a: 1 },
  padding: ["20", "20", "20", "20"],
  margin: ["0", "0", "0", "0"],
  shadow: 0,
  radius: 0,
  width: "100%",
  height: "auto",
  columns: 3,
  // Giá trị mặc định cho thuộc tính mới
  data: [],
  itemVariable: "item",
  layout: "grid" as const,
  renderMode: "columns" as const,
  gridGap: "16px",
  itemsPerRow: 3,
  fields: [],
  // Nguồn dữ liệu mặc định
  dataSource: "static" as const,
  // Giá trị mặc định cho API
  apiUrl: "",
  apiEnabled: false,
  apiDataPath: "data",
  apiRefreshInterval: 0,
  // Giá trị mặc định cho JSON
  jsonData: "",
  jsonDataPath: "data",
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
    dataSource,
    apiUrl,
    apiEnabled,
    apiDataPath,
    apiRefreshInterval,
    jsonData,
    jsonDataPath,
  } = props;

  // State cho dữ liệu API
  const [apiData, setApiData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State cho dữ liệu JSON
  const [jsonDataLoaded, setJsonDataLoaded] = useState<any[]>([]);
  const [jsonDataError, setJsonDataError] = useState<string | null>(null);

  // Using useNode to connect to the Craft.js system
  const {
    id,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
  }));

  // Hàm fetch dữ liệu từ API
  const fetchData = useCallback(async () => {
    if (!apiEnabled || !apiUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API trả về lỗi: ${response.status}`);
      }

      const result = await response.json();

      // Lấy dữ liệu theo đường dẫn
      let fetchedData = result;
      if (apiDataPath) {
        const paths = apiDataPath.split(".");
        for (const path of paths) {
          fetchedData = fetchedData?.[path];
          if (!fetchedData) break;
        }
      }

      if (Array.isArray(fetchedData)) {
        setApiData(fetchedData);
        // Cập nhật trường dữ liệu nếu có
        if (fetchedData.length > 0) {
          const newFields = Object.keys(fetchedData[0]);
          setProp((p) => (p.fields = newFields));
        }
      } else {
        throw new Error("Dữ liệu không phải dạng mảng");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải dữ liệu từ API");
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, apiEnabled, apiDataPath, setProp]);

  // Hàm tải dữ liệu từ JSON
  const loadJsonData = useCallback(() => {
    if (!jsonData) return;

    try {
      const jsonDataParsed = JSON.parse(jsonData);

      // Lấy dữ liệu theo đường dẫn
      let jsonDataLoaded = jsonDataParsed;
      if (jsonDataPath) {
        const paths = jsonDataPath.split(".");
        for (const path of paths) {
          jsonDataLoaded = jsonDataLoaded?.[path];
          if (!jsonDataLoaded) break;
        }
      }

      if (Array.isArray(jsonDataLoaded)) {
        setJsonDataLoaded(jsonDataLoaded);
        // Cập nhật trường dữ liệu nếu có
        if (jsonDataLoaded.length > 0) {
          const newFields = Object.keys(jsonDataLoaded[0]);
          setProp((p) => (p.fields = newFields));
        }
      } else {
        throw new Error("Dữ liệu không phải dạng mảng");
      }
    } catch (err: any) {
      setJsonDataError(err.message || "Lỗi khi tải dữ liệu từ JSON");
    }
  }, [jsonData, jsonDataPath, setProp]);

  // Thiết lập fetch API và interval refresh
  useEffect(() => {
    if (apiEnabled) {
      fetchData();

      if (apiRefreshInterval && apiRefreshInterval > 0) {
        const interval = setInterval(fetchData, apiRefreshInterval);
        return () => clearInterval(interval);
      }
    } else if (dataSource === "json") {
      loadJsonData();
    }
  }, [fetchData, apiEnabled, apiRefreshInterval, loadJsonData, dataSource]);

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
          padding={["10", "10", "10", "10"]}
          custom={{ displayName: `Column ${i + 1}` }}
        ></Element>
      );
    }

    console.log(columnElements);

    return columnElements;
  };

  // Render data items
  const renderDataItems = () => {
    // Dùng dữ liệu từ nguồn dữ liệu được chọn
    let displayData;
    switch (dataSource) {
      case "api":
        displayData = apiData;
        break;
      case "json":
        displayData = jsonDataLoaded;
        break;
      default:
        displayData = data;
    }

    if (
      !displayData ||
      !Array.isArray(displayData) ||
      displayData.length === 0
    ) {
      // Hiển thị trạng thái loading nếu đang tải
      if (apiEnabled && isLoading) {
        return (
          <div className="w-full p-4 text-center text-gray-500">
            <div className="animate-pulse">Đang tải dữ liệu...</div>
          </div>
        );
      }

      // Hiển thị lỗi nếu có
      if (apiEnabled && error) {
        return (
          <div className="w-full p-4 text-center text-red-500">
            <div className="mb-2">❌ Lỗi khi tải dữ liệu</div>
            <div className="text-xs">{error}</div>
          </div>
        );
      }

      if (dataSource === "json" && jsonDataError) {
        return (
          <div className="w-full p-4 text-center text-red-500">
            <div className="mb-2">❌ Lỗi khi tải dữ liệu từ JSON</div>
            <div className="text-xs">{jsonDataError}</div>
          </div>
        );
      }

      // Fallback: Hiển thị một mục mẫu nếu không có dữ liệu
      return (
        <Element
          key="sample-item"
          id={`${id}-sample-item`}
          canvas
          is={Container}
          custom={{
            displayName: `${itemVariable} (Sample)`,
            border: "1px dashed #ddd",
          }}
          padding={["10", "10", "10", "10"]}
        ></Element>
      );
    }

    // Hiển thị danh sách dữ liệu thực tế
    return displayData.map((item, index) => (
      <CollectionsProvider
        key={`${id}-item-${index}`}
        value={{
          item,
          index,
          itemVariable,
          fields: fields || Object.keys(item) || [],
          isLoading,
          error,
        }}
      >
        <Element
          canvas
          id={`${id}-item-${index}`}
          key={`item-${index}`}
          is={Container}
          padding={["10", "10", "10", "10"]}
          custom={{ displayName: `${itemVariable}` }}
        ></Element>
      </CollectionsProvider>
    ));
  };

  // Xác định kiểu bố cục
  const getLayoutStyle = () => {
    if (renderMode === "columns") {
      return {
        display: "flex",
        flexDirection: "row" as const,
      };
    }

    switch (layout) {
      case "list":
        return {
          display: "flex",
          flexDirection: "column" as const,
          gap: gridGap,
        };
      case "flex":
        return {
          display: "flex",
          flexDirection: "row" as const,
          flexWrap: "wrap" as const,
          gap: gridGap,
        };
      case "grid":
      default:
        return {
          display: "grid",
          gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
          gap: gridGap,
        };
    }
  };

  return (
    <Resizer
      propKey={{ width: "width", height: "height" }}
      style={{
        background: `rgba(${Object.values(background)})`,
        color: `rgba(${Object.values(color)})`,
        padding: `${padding[0]}px ${padding[1]}px ${padding[2]}px ${padding[3]}px`,
        margin: `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`,
        boxShadow:
          shadow === 0
            ? "none"
            : `0px 3px 100px ${shadow}px rgba(0, 0, 0, 0.13)`,
        borderRadius: `${radius}px`,
        ...getLayoutStyle(),
      }}
    >
      {renderMode === "columns" ? renderColumns() : renderDataItems()}
    </Resizer>
  );
};

Collections.craft = {
  displayName: "Collections",
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
