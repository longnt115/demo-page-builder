import { useNode } from '@craftjs/core';
import { FormControlLabel, Radio } from '@mui/material';
import { useEffect, useState } from 'react';

import { ToolbarItem, ToolbarSection } from '../../editor';

export const CollectionsSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  const [dataInput, setDataInput] = useState('');
  const [dataFields, setDataFields] = useState<string[]>([]);

  // Cập nhật danh sách trường dữ liệu khi dữ liệu thay đổi
  useEffect(() => {
    if (props.data && props.data.length > 0) {
      const firstItem = props.data[0];
      if (firstItem && typeof firstItem === 'object') {
        setDataFields(Object.keys(firstItem));
      }
    }
  }, [props.data]);

  // Hàm tạo dữ liệu mẫu
  const getSampleDataJson = () => {
    return JSON.stringify(
      [
        {
          title: 'Tiêu đề mục 1',
          description: 'Mô tả chi tiết cho mục 1',
          imageUrl: 'https://via.placeholder.com/150',
          price: 100000,
        },
        {
          title: 'Tiêu đề mục 2',
          description: 'Mô tả chi tiết cho mục 2',
          imageUrl: 'https://via.placeholder.com/150',
          price: 200000,
        },
        {
          title: 'Tiêu đề mục 3',
          description: 'Mô tả chi tiết cho mục 3',
          imageUrl: 'https://via.placeholder.com/150',
          price: 300000,
        },
      ],
      null,
      2
    );
  };

  const handleApplyData = () => {
    try {
      const parsedData = JSON.parse(dataInput || getSampleDataJson());
      setProp((props) => (props.data = parsedData));
      if (parsedData && parsedData.length > 0) {
        const extractedFields = Object.keys(parsedData[0]);
        setDataFields(extractedFields);
        setProp((props) => (props.fields = extractedFields));
      }
    } catch (e) {
      alert('Lỗi: JSON không hợp lệ');
    }
  };

  return (
    <div>
      <ToolbarSection title="Kiểu hiển thị" props={['renderMode']}>
        <ToolbarItem propKey="renderMode" type="radio" label="Chế độ hiển thị">
          <FormControlLabel
            value="columns"
            control={<Radio />}
            label="Cột (Cố định)"
          />
          <FormControlLabel
            value="data"
            control={<Radio />}
            label="Dữ liệu (Động)"
          />
        </ToolbarItem>
        {props.renderMode === 'columns' ? (
          <div>
            <ToolbarItem
              propKey="columns"
              type="slider"
              label="Số cột"
              onChange={(value: number) => {
                return Math.max(1, value);
              }}
            />
          </div>
        ) : (
          <div>
            <ToolbarItem propKey="layout" type="radio" label="Bố cục">
              <FormControlLabel value="grid" control={<Radio />} label="Lưới" />
              <FormControlLabel
                value="list"
                control={<Radio />}
                label="Danh sách"
              />
              <FormControlLabel
                value="flex"
                control={<Radio />}
                label="Linh hoạt"
              />
            </ToolbarItem>
            <ToolbarItem propKey="gridGap" type="text" label="Khoảng cách" />
            {props.layout === 'grid' && (
              <ToolbarItem
                propKey="itemsPerRow"
                type="slider"
                label="Items mỗi hàng"
                onChange={(value: number) => {
                  return Math.max(1, value);
                }}
              />
            )}
            <ToolbarItem
              propKey="itemVariable"
              type="text"
              label="Tên biến item"
            />

            <div className="block w-full mt-2 p-3 border border-gray-300 rounded-md">
              <p className="text-sm font-medium mb-2">
                Dữ liệu JSON (mảng các đối tượng)
              </p>
              <textarea
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={dataInput}
                onChange={(e) => setDataInput(e.target.value)}
                placeholder={getSampleDataJson()}
                rows={5}
              />
              <div className="flex items-center mt-2">
                <button
                  className="mr-2 px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setDataInput(getSampleDataJson())}
                >
                  Dùng mẫu
                </button>
                <button
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={handleApplyData}
                >
                  Áp dụng
                </button>
              </div>

              {dataFields.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">
                    Các trường dữ liệu sẵn có:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {dataFields.map((field) => (
                      <div
                        key={field}
                        className="bg-gray-200 text-sm px-2 py-1 rounded"
                      >
                        {field}
                      </div>
                    ))}
                  </div>

                  <p className="text-xs mt-2 text-gray-500">
                    Truy cập dữ liệu bằng: useCollectionsContext().item.
                    {'{trường}'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </ToolbarSection>
      <ToolbarSection title="Kích thước" props={['width', 'height']}>
        <ToolbarItem propKey="width" type="text" label="Rộng" />
        <ToolbarItem propKey="height" type="text" label="Cao" />
      </ToolbarSection>
      <ToolbarSection title="Màu sắc" props={['background', 'color']}>
        <ToolbarItem propKey="background" type="bg" label="Nền" />
        <ToolbarItem propKey="color" type="color" label="Chữ" />
      </ToolbarSection>
      <ToolbarSection title="Viền" props={['shadow', 'radius']}>
        <ToolbarItem propKey="shadow" type="slider" label="Đổ bóng" />
        <ToolbarItem propKey="radius" type="slider" label="Bo tròn" />
      </ToolbarSection>
      <ToolbarSection title="Đệm lề" props={['padding', 'margin']}>
        <ToolbarItem propKey="padding" type="padding" label="Đệm" />
        <ToolbarItem propKey="margin" type="margin" label="Lề" />
      </ToolbarSection>
    </div>
  );
};
