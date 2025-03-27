import React, { useEffect, useRef, useState } from "react";

import { useEditor, useNode } from "@craftjs/core";
import { useCollectionsContext } from "../Collections/CollectionsContext";
import { ImageSettings } from "./ImageSettings";

export type ImageProps = {
  src: string;
  alt: string;
  width: string;
  height: string;
  objectFit: "cover" | "contain" | "fill" | "none" | "scale-down";
  borderRadius: number;
  borderWidth: number;
  borderColor: Record<"r" | "g" | "b" | "a", string>;
  shadow: number;
  margin: [string, string, string, string];
  useDataBinding?: boolean;
  field?: string;
  availableFields?: string[];
};

// Hàm serialize an toàn để tránh lỗi khi lưu trang
const safeSerialize = (obj: any): any => {
  if (!obj || typeof obj !== "object") return obj;

  // Xử lý array
  if (Array.isArray(obj)) {
    return obj.map((item) => safeSerialize(item));
  }

  // Xử lý object
  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Bỏ qua các giá trị có thể gây lỗi khi serialize
      if (
        obj[key] !== undefined &&
        obj[key] !== null &&
        typeof obj[key] !== "function" &&
        typeof obj[key] !== "symbol" &&
        !(obj[key] instanceof Element) &&
        !(obj[key] instanceof HTMLElement)
      ) {
        try {
          // Thử kiểm tra xem có serialize được không
          JSON.stringify(obj[key]);
          result[key] = safeSerialize(obj[key]);
        } catch (e) {
          // Nếu lỗi khi serialize, chuyển thành string an toàn
          result[key] = `[Không thể serialize: ${typeof obj[key]}]`;
        }
      }
    }
  }
  return result;
};

export const Image = ({
  src,
  alt,
  width,
  height,
  objectFit,
  borderRadius,
  borderWidth,
  borderColor,
  shadow,
  margin,
  useDataBinding,
  field,
}: Partial<ImageProps>) => {
  const {
    connectors: { connect },
    setProp,
  } = useNode();

  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const { id } = useNode();
  const { actions } = useEditor();
  const collectionsContext = useCollectionsContext();
  const [hasError, setHasError] = useState(false);

  // Tạo refs cho div bao bọc
  const containerRef = useRef<HTMLDivElement>(null);

  // Cập nhật danh sách các trường có sẵn từ context Collections
  useEffect(() => {
    if (collectionsContext?.fields) {
      actions.setProp(
        id,
        (props: any) => (props.availableFields = collectionsContext.fields)
      );
    }
  }, [actions, collectionsContext?.fields, id]);

  // Kết nối ref với connect của Craft.js
  useEffect(() => {
    if (containerRef.current) {
      connect(containerRef.current);
    }
  }, [connect, containerRef]);

  // Lấy URL ảnh từ dữ liệu Collections nếu được kích hoạt
  const imageUrl = React.useMemo(() => {
    if (useDataBinding && field && collectionsContext?.item) {
      return collectionsContext.item[field] || src;
    }
    return src;
  }, [useDataBinding, field, collectionsContext?.item, src]);

  // Xử lý sự kiện lỗi khi tải ảnh
  const handleError = () => {
    setHasError(true);
  };

  // Xử lý khi ảnh tải thành công
  const handleLoad = () => {
    setHasError(false);
  };

  // Tạo các style chung cho container
  const containerStyle = {
    width: width === "auto" ? "100%" : `${width}px`,
    height: height === "auto" ? "auto" : `${height}px`,
    minHeight: "120px",
    backgroundColor: !imageUrl || hasError ? "#f0f0f0" : "transparent",
    border: `${borderWidth}px solid rgba(${Object.values(borderColor)})`,
    borderRadius: `${borderRadius}px`,
    margin: `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`,
    boxShadow: `0px 0px 10px rgba(0,0,0,${(shadow || 0) / 100})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative" as const,
    overflow: "hidden" as const,
  };

  // Tạo style cho ảnh
  const imageStyle = {
    width: "100%",
    height: "100%",
    objectFit,
    position: "absolute" as const,
    top: 0,
    left: 0,
    display: "block",
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      {(!imageUrl || hasError) ? (
        <div
          style={{
            color: "#888",
            fontSize: "14px",
            textAlign: "center",
            padding: "10px",
            zIndex: 1,
          }}
        >
          {hasError ? "Lỗi tải ảnh" : "Chưa có ảnh"}
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={alt}
          onError={handleError}
          onLoad={handleLoad}
          style={imageStyle}
        />
      )}
    </div>
  );
};

// Thêm hàm toJSON để đảm bảo serialize an toàn
(Image as any).toJSON = function () {
  return safeSerialize(this);
};

Image.craft = {
  displayName: "Image",
  props: {
    src: "",
    alt: "Image description",
    width: "auto",
    height: "auto",
    objectFit: "cover",
    borderRadius: 0,
    borderWidth: 0,
    borderColor: { r: 0, g: 0, b: 0, a: 1 },
    shadow: 0,
    margin: [0, 0, 0, 0],
    useDataBinding: false,
    field: "",
    availableFields: [],
  },
  related: {
    toolbar: ImageSettings,
  },
};
