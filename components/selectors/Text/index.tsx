import React, { useEffect } from "react";
import ContentEditable from "react-contenteditable";

import { useEditor, useNode } from "@craftjs/core";
import { useCollectionsContext } from "../Collections/CollectionsContext";
import { TextSettings } from "./TextSettings";

export type TextProps = {
  fontSize: string;
  textAlign: string;
  fontWeight: string;
  color: Record<"r" | "g" | "b" | "a", string>;
  shadow: number;
  text: string;
  margin: [string, string, string, string];
  useDataBinding?: boolean;
  field?: string;
};

export const Text = ({
  fontSize,
  textAlign,
  fontWeight,
  color,
  shadow,
  text,
  margin,
  useDataBinding,
  field,
}: Partial<TextProps>) => {
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

  // Cập nhật danh sách các trường có sẵn từ context Collections
  useEffect(() => {
    if (collectionsContext?.fields) {
      actions.setProp(
        id,
        (props: any) => (props.availableFields = collectionsContext.fields)
      );
    }
  }, [actions, collectionsContext?.fields, id]);

  // Lấy nội dung động từ Collections nếu được kích hoạt
  const displayText = React.useMemo(() => {
    if (useDataBinding && field && collectionsContext?.item) {
      return collectionsContext.item[field] || text;
    }
    return text;
  }, [useDataBinding, field, collectionsContext?.item, text]);

  return (
    <ContentEditable
      innerRef={connect}
      html={displayText} // Sử dụng displayText thay vì text
      disabled={!enabled}
      onChange={(e) => {
        setProp((prop) => (prop.text = e.target.value), 500);
      }}
      tagName="h2"
      style={{
        width: "100%",
        margin: `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`,
        color: `rgba(${Object.values(color)})`,
        fontSize: `${fontSize}px`,
        textShadow: `0px 0px 2px rgba(0,0,0,${(shadow || 0) / 100})`,
        fontWeight,
        textAlign,
      }}
    />
  );
};

Text.craft = {
  displayName: "Text",
  props: {
    fontSize: "15",
    textAlign: "left",
    fontWeight: "500",
    color: { r: 92, g: 90, b: 90, a: 1 },
    margin: [0, 0, 0, 0],
    shadow: 0,
    text: "Text",
    useDataBinding: false,
    field: "",
  },
  related: {
    toolbar: TextSettings,
  },
};
