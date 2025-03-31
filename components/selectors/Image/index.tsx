import React, { useEffect, useRef, useState } from "react";

import { useEditor, useNode } from "@craftjs/core";
import { useCollectionsContext } from "../Collections/CollectionsContext";
import { ImageSettings } from "./ImageSettings";
import { CSSProperties } from 'react';
export type ImageProps = {
  src: string;
  alt: string;
  position: CSSProperties['position'];
  zIndex: number;
  opacity: number;
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
  enableCondition?: boolean;
  conditionField?: string;
  conditionOperator?: "equals" | "notEquals" | "contains" | "startsWith" | "endsWith" | "greaterThan" | "lessThan" | "isEmpty" | "isNotEmpty" | "isTrue" | "isFalse";
  conditionValue?: string;
  conditionNegate?: boolean;
};

export const Image = ({
  src,
  alt,
  position,
  zIndex,
  opacity,
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
  enableCondition,
  conditionField,
  conditionOperator,
  conditionValue,
  conditionNegate,
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

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (collectionsContext?.fields) {
      actions.setProp(
        id,
        (props: any) => (props.availableFields = collectionsContext.fields)
      );
    }
  }, [actions, collectionsContext?.fields, id]);

  useEffect(() => {
    if (containerRef.current) {
      connect(containerRef.current);
    }
  }, [connect, containerRef]);

  const checkCondition = React.useCallback(() => {
    if (!enableCondition || !collectionsContext || !conditionField) {
      return true;
    }

    const itemValue = collectionsContext.item[conditionField];

    let result = false;

    switch (conditionOperator) {
      case "equals":
        result = String(itemValue) === conditionValue;
        break;
      case "notEquals":
        result = String(itemValue) !== conditionValue;
        break;
      case "contains":
        result = String(itemValue).includes(conditionValue || "");
        break;
      case "startsWith":
        result = String(itemValue).startsWith(conditionValue || "");
        break;
      case "endsWith":
        result = String(itemValue).endsWith(conditionValue || "");
        break;
      case "greaterThan":
        result = Number(itemValue) > Number(conditionValue);
        break;
      case "lessThan":
        result = Number(itemValue) < Number(conditionValue);
        break;
      case "isEmpty":
        result = !itemValue || String(itemValue).trim() === "";
        break;
      case "isNotEmpty":
        result = !!itemValue && String(itemValue).trim() !== "";
        break;
      case "isTrue":
        result = Boolean(itemValue) === true;
        break;
      case "isFalse":
        result = Boolean(itemValue) === false;
        break;
      default:
        result = true;
    }

    return conditionNegate ? !result : result;
  }, [
    enableCondition,
    collectionsContext,
    conditionField,
    conditionOperator,
    conditionValue,
    conditionNegate
  ]);

  const shouldRender = checkCondition();

  const handleError = () => {
    setHasError(true);
  };

  const handleLoad = () => {
    setHasError(false);
  };

  const imageUrl = React.useMemo(() => {
    handleLoad();
    if (useDataBinding && field && collectionsContext?.item) {
      return collectionsContext.item[field] || src;
    }
    return src;
  }, [useDataBinding, field, collectionsContext?.item, src]);


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
    position: position || 'relative',
    overflow: "hidden" as const,
    zIndex: zIndex || 0,
    opacity: opacity || 1,
  };

  const imageStyle = {
    width: "100%",
    height: "100%",
    objectFit,
    position: "absolute" as const,
    top: 0,
    left: 0,
    display: "block",
  };

  if (!shouldRender && !enabled) return null;

  return (
    <div ref={containerRef} style={containerStyle}>
      {!imageUrl || hasError || (!shouldRender && enabled) ? (
        <div
          style={{
            color: "#888",
            fontSize: "14px",
            textAlign: "center",
            padding: "10px",
            zIndex: 1,
          }}
        >
          {!shouldRender && enabled && "Ảnh bị ẩn (điều kiện không thỏa mãn)"}
          {hasError && "Lỗi tải ảnh"}
          {!imageUrl && "Chưa có ảnh"}
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
    enableCondition: false,
    conditionField: "",
    conditionOperator: "equals",
    conditionValue: "",
    conditionNegate: false,
  },
  related: {
    toolbar: ImageSettings,
  },
};
