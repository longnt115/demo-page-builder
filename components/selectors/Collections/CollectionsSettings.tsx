import { useNode } from '@craftjs/core';
import { FormControlLabel, Radio, Switch } from '@mui/material';
import { useEffect, useState } from 'react';

import { ToolbarItem, ToolbarSection } from '../../editor';

export const CollectionsSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  // Log props để kiểm tra
  useEffect(() => {
    console.log("Current props:", props);
  }, [props]);

  const [dataInput, setDataInput] = useState('');
  const [dataFields, setDataFields] = useState<string[]>([]);
  const [apiTestStatus, setApiTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiTestError, setApiTestError] = useState<string | null>(null);
  const [apiTestResult, setApiTestResult] = useState<any | null>(null);
  const [apiUrl, setApiUrl] = useState('');

  // Đồng bộ giá trị apiUrl từ props
  useEffect(() => {
    if (props.apiUrl) {
      setApiUrl(props.apiUrl);
    }
  }, [props.apiUrl]);

  const [apiRefreshInterval, setApiRefreshInterval] = useState(0);

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

  // Kiểm tra API
  const handleTestApi = async () => {
    // Sử dụng biến local apiUrl hoặc ưu tiên giá trị từ input
    const currentApiUrl = apiUrl || props.apiUrl || '';
    console.log("Đang kiểm tra API:", currentApiUrl);
    
    if (!currentApiUrl) {
      setApiTestError('Vui lòng nhập URL API');
      setApiTestStatus('error');
      return;
    }

    setApiTestStatus('loading');
    setApiTestError(null);
    setApiTestResult(null);

    try {
      // Sử dụng proxy hoặc CORS nếu cần thiết
      const response = await fetch(currentApiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API trả về lỗi: ${response.status}`);
      }

      const result = await response.json();
      console.log("Kết quả API:", result);
      
      // Lấy dữ liệu theo đường dẫn
      let fetchedData = result;
      if (props.apiDataPath) {
        const paths = props.apiDataPath.split('.');
        for (const path of paths) {
          if (fetchedData && path in fetchedData) {
            fetchedData = fetchedData[path];
          } else {
            throw new Error(`Không tìm thấy đường dẫn '${props.apiDataPath}' trong dữ liệu API`);
          }
        }
      }
      
      if (!Array.isArray(fetchedData)) {
        throw new Error('Dữ liệu không phải dạng mảng');
      }

      console.log("Dữ liệu đã xử lý:", fetchedData);
      setApiTestResult(fetchedData);
      setApiTestStatus('success');

      // Tự động cập nhật fields nếu có dữ liệu
      if (fetchedData.length > 0) {
        const extractedFields = Object.keys(fetchedData[0]);
        setDataFields(extractedFields);
        setProp((props) => (props.fields = extractedFields));
      }
    } catch (err: any) {
      console.error("Lỗi API:", err);
      setApiTestError(err.message || 'Lỗi khi tải dữ liệu từ API');
      setApiTestStatus('error');
    }
  };

  // Áp dụng kết quả API test vào dữ liệu
  const handleApplyApiTestResult = () => {
    if (apiTestResult && Array.isArray(apiTestResult)) {
      setProp((props) => (props.data = apiTestResult));
      setProp((props) => (props.apiEnabled = true));
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

            {/* Thêm phần cấu hình API */}
            <div className="block w-full mt-3 mb-4 p-3 border border-gray-300 rounded-md bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Dữ liệu từ API</p>
                <FormControlLabel
                  control={
                    <Switch
                      checked={props.apiEnabled || false}
                      onChange={(_, checked) => {
                        setProp((props) => (props.apiEnabled = checked));
                      }}
                      size="small"
                    />
                  }
                  label="Bật"
                />
              </div>

              {/* Thay ToolbarItem bằng input thông thường để debug */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">URL API</label>
                <input 
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={apiUrl}
                  onChange={(e) => {
                    setApiUrl(e.target.value);
                    setProp((props) => (props.apiUrl = e.target.value));
                  }}
                  placeholder="https://example.com/api/data"
                />
              </div>
              
              <ToolbarItem 
                propKey="apiDataPath" 
                type="text" 
                label="Đường dẫn dữ liệu" 
              />
              
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <ToolbarItem 
                    propKey="apiRefreshInterval" 
                    type="number" 
                    label="Làm mới (ms)" 
                  />
                </div>
                <div className="mt-5">
                  <button 
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => handleTestApi()}
                    disabled={apiTestStatus === 'loading'}
                  >
                    {apiTestStatus === 'loading' ? 'Đang kiểm tra...' : 'Kiểm tra API'}
                  </button>
                </div>
              </div>

              {apiTestStatus === 'error' && (
                <div className="mt-2 p-2 text-red-500 bg-red-50 rounded text-xs">
                  <div className="font-semibold">Lỗi:</div>
                  <div>{apiTestError}</div>
                </div>
              )}

              {apiTestStatus === 'success' && (
                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-green-600 font-medium">✓ API hoạt động</p>
                    <button 
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      onClick={handleApplyApiTestResult}
                    >
                      Áp dụng dữ liệu
                    </button>
                  </div>
                  {apiTestResult && apiTestResult.length > 0 && (
                    <div className="mt-1 bg-white p-2 rounded border text-xs max-h-20 overflow-auto">
                      <pre className="whitespace-pre-wrap break-all">
                        {JSON.stringify(apiTestResult[0], null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

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
