import React, { useEffect, useState } from "react";

import { useEditor, useNode } from "@craftjs/core";
import { FieldSelector } from "components/editor/Base/FieldSelector";
import { capitalize, weightDescription } from "../../../utils/text";
import { ToolbarItem, ToolbarSection } from "../../editor";
import { ToolbarRadio } from "../../editor/Toolbar/ToolbarRadio";
import { useCollectionsContext } from "../Collections/CollectionsContext";

export const TextSettings = () => {
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
        if (parentId && parentId.includes("-item-")) {
          newDebugState.idDetection = true;
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
            newDebugState.customPropDetection = true;
          }
        }
      }
    } catch (err) {
      console.error("Error in ID detection:", err);
    }

    // Kết quả cuối cùng: sử dụng bất kỳ phương pháp nào phát hiện thành công
    const result =
      newDebugState.contextDetection ||
      newDebugState.idDetection ||
      newDebugState.customPropDetection;

    newDebugState.finalResult = result;

    return result;
  }, [collectionsContext, id, nodes]);

  useEffect(() => {
    if (isInsideCollections) {
      setAvailableFields(fields);
    }
  }, [fields, isInsideCollections]);

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
            <ToolbarItem propKey="field" type="select" label="Original Price">
              {availableFields?.length && (
                <FieldSelector fields={availableFields} />
              )}
            </ToolbarItem>
          )}
        </ToolbarSection>
      )}

      <ToolbarSection
        title="Typography"
        props={["fontSize", "fontWeight", "textAlign"]}
        summary={({ fontSize, fontWeight, textAlign }: any) => {
          return `${fontSize || ""}, ${weightDescription(
            parseInt(fontWeight)
          )}, ${capitalize(textAlign)}`;
        }}
      >
        <ToolbarItem
          full={true}
          propKey="text"
          type="text"
          label="Text"
          {...(props.useDataBinding && { disabled: true })}
        />
        <ToolbarItem
          full={true}
          propKey="fontSize"
          type="slider"
          label="Font Size"
        />
        <ToolbarItem propKey="textAlign" type="radio" label="Align">
          <ToolbarRadio value="left" label="Left" />
          <ToolbarRadio value="center" label="Center" />
          <ToolbarRadio value="right" label="Right" />
        </ToolbarItem>
        <ToolbarItem propKey="fontWeight" type="radio" label="Weight">
          <ToolbarRadio value="400" label="Regular" />
          <ToolbarRadio value="500" label="Medium" />
          <ToolbarRadio value="700" label="Bold" />
        </ToolbarItem>
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
        <ToolbarItem propKey="margin" index={0} type="slider" label="Top" />
        <ToolbarItem propKey="margin" index={1} type="slider" label="Right" />
        <ToolbarItem propKey="margin" index={2} type="slider" label="Bottom" />
        <ToolbarItem propKey="margin" index={3} type="slider" label="Left" />
      </ToolbarSection>
      <ToolbarSection
        title="Appearance"
        props={["color", "shadow"]}
        summary={({ color, shadow }: any) => {
          return (
            <div className="fletext-right">
              <p
                style={{
                  color: color && `rgba(${Object.values(color)})`,
                  textShadow: `0px 0px 2px rgba(0, 0, 0, ${shadow / 100})`,
                }}
                className="text-white text-right"
              >
                T
              </p>
            </div>
          );
        }}
      >
        <ToolbarItem full={true} propKey="color" type="color" label="Text" />
        <ToolbarItem
          full={true}
          propKey="shadow"
          type="slider"
          label="Shadow"
        />
      </ToolbarSection>
    </React.Fragment>
  );
};
