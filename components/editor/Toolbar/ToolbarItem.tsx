import { useNode } from '@craftjs/core';
import {
  Checkbox,
  FormControlLabel,
  Grid,
  RadioGroup,
  Slider,
} from '@mui/material';
import * as React from 'react';

import { ToolbarDropdown } from './ToolbarDropdown';
import { ToolbarTextInput } from './ToolbarTextInput';

export type ToolbarItemProps = {
  prefix?: string;
  label?: string;
  full?: boolean;
  propKey?: string;
  index?: number;
  children?: React.ReactNode;
  type: string;
  onChange?: (value: any) => any;
};

export const ToolbarItem = ({
  full = false,
  propKey,
  type,
  onChange,
  index,
  ...props
}: ToolbarItemProps) => {
  const {
    actions: { setProp },
    propValue,
  } = useNode((node) => ({
    propValue: node.data.props[propKey],
  }));

  const value = Array.isArray(propValue) ? propValue[index] : propValue;

  return (
    <Grid item xs={full ? 12 : 6}>
      <div className="mb-2">
        {['text', 'color', 'bg', 'number'].includes(type) ? (
          <ToolbarTextInput
            {...props}
            type={type}
            value={value}
            onChange={(value) => {
              setProp((props: any) => {
                if (Array.isArray(propValue)) {
                  props[propKey][index] = onChange ? onChange(value) : value;
                } else {
                  props[propKey] = onChange ? onChange(value) : value;
                }
              }, 500);
            }}
          />
        ) : type === 'slider' ? (
          <>
            {props.label ? (
              <h4 className="text-sm text-light-gray-2">{props.label}</h4>
            ) : null}
            <Slider
              sx={{
                color: '#3880ff',
                height: 2,
                padding: '5px 0',
                width: '100%',
                '& .MuiSlider-track': {
                  height: 2,
                },
                '& .MuiSlider-thumb': {
                  height: 12,
                  width: 12,
                },
              }}
              value={parseInt(value) || 0}
              onChange={(
                event: Event,
                newValue: number | number[],
                activeThumb: number
              ) => {
                setProp((props: any) => {
                  const valueToUse =
                    typeof newValue === 'number' ? newValue : newValue[0];
                  if (Array.isArray(propValue)) {
                    props[propKey][index] = onChange
                      ? onChange(valueToUse)
                      : valueToUse;
                  } else {
                    props[propKey] = onChange
                      ? onChange(valueToUse)
                      : valueToUse;
                  }
                }, 1000);
              }}
            />
          </>
        ) : type === 'radio' ? (
          <>
            {props.label ? (
              <h4 className="text-sm text-light-gray-2">{props.label}</h4>
            ) : null}
            <RadioGroup
              value={value || 0}
              onChange={(e) => {
                const value = e.target.value;
                setProp((props: any) => {
                  props[propKey] = onChange ? onChange(value) : value;
                });
              }}
            >
              {props.children}
            </RadioGroup>
          </>
        ) : type === 'select' ? (
          <>
            {props.label ? (
              <h4 className="text-sm text-light-gray-2">{props.label}</h4>
            ) : null}
            <ToolbarDropdown
              value={value || ''}
              onChange={(value) =>
                setProp(
                  (props: any) =>
                    (props[propKey] = onChange ? onChange(value) : value)
                )
              }
              {...props}
            />
          </>
        ) : type === 'checkbox' ? (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setProp((props: any) => {
                    props[propKey] = onChange ? onChange(newValue) : newValue;
                  });
                }}
                sx={{
                  color: '#3880ff',
                  '&.Mui-checked': {
                    color: '#3880ff',
                  },
                }}
              />
            }
            label={props.label || ''}
            sx={{
              display: 'flex',
              marginLeft: '-9px',
              '.MuiFormControlLabel-label': {
                fontSize: '14px',
                color: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          />
        ) : null}
      </div>
    </Grid>
  );
};

// Thêm phương thức static setter để sử dụng trong CollectionsSettings
ToolbarItem.setter = function (propKey: string) {
  return (value: any) => {
    // Truy cập đối tượng window để lấy trạng thái của editor
    const editorWindow = window as any;

    // Kiểm tra xem editor đã được khởi tạo chưa
    if (editorWindow.craftjs && editorWindow.craftjs.editor) {
      const { query, actions } = editorWindow.craftjs.editor;
      const selectedNodeId = query.getEvent('selected').first();

      if (selectedNodeId) {
        actions.setProp(selectedNodeId, (props: any) => {
          props[propKey] = value;
        });
      }
    }
  };
};
