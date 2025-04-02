import React, { useState } from "react";
import { HttpMethod, useDataSources } from "./DataSourcesContext";

export const DataSourcesManager: React.FC = () => {
  const {
    dataSources,
    addDataSource,
    updateDataSource,
    removeDataSource,
    refreshDataSource,
  } = useDataSources();

  // State cho data source đang được chỉnh sửa
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"static" | "json" | "api">("static");

  // State cho dữ liệu tĩnh
  const [staticData, setStaticData] = useState("[]");

  // State cho dữ liệu JSON
  const [jsonData, setJsonData] = useState("");
  const [jsonDataPath, setJsonDataPath] = useState("data");

  // State cho dữ liệu API
  const [apiUrl, setApiUrl] = useState("");
  const [apiDataPath, setApiDataPath] = useState("data");
  const [apiRefreshInterval, setApiRefreshInterval] = useState(0);
  const [apiMethod, setApiMethod] = useState<HttpMethod>("GET");
  const [apiHeaders, setApiHeaders] = useState("{}");
  const [apiBody, setApiBody] = useState("");

  // Reset form để thêm mới
  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setType("static");
    setStaticData("[]");
    setJsonData("");
    setJsonDataPath("data");
    setApiUrl("");
    setApiDataPath("data");
    setApiRefreshInterval(0);
    setApiMethod("GET");
    setApiHeaders("{}");
    setApiBody("");
  };

  // Load dữ liệu vào form để chỉnh sửa
  const editDataSource = (id: string) => {
    const dataSource = dataSources[id];
    if (!dataSource) return;

    setEditingId(id);
    setName(dataSource.name);
    setDescription(dataSource.description || "");
    setType(dataSource.type);

    // Kiểm tra và load dữ liệu theo từng loại
    if (dataSource.type === "static") {
      setStaticData(JSON.stringify(dataSource.data || [], null, 2));
    } else if (dataSource.type === "json") {
      setJsonData(dataSource.jsonData || "");
      setJsonDataPath(dataSource.jsonDataPath || "data");
    } else if (dataSource.type === "api") {
      setApiUrl(dataSource.apiUrl || "");
      setApiDataPath(dataSource.apiDataPath || "data");
      setApiRefreshInterval(dataSource.apiRefreshInterval || 0);
      setApiMethod(dataSource.apiMethod || "GET");
      setApiHeaders(JSON.stringify(dataSource.apiHeaders || {}, null, 2));
      setApiBody(dataSource.apiBody || "");
    }
  };

  // Xử lý lưu data source
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Cập nhật data source đã có
        updateDataSource(editingId, {
          name,
          description,
          type,
          ...(type === "static" && { data: JSON.parse(staticData) }),
          ...(type === "json" && { jsonData, jsonDataPath }),
          ...(type === "api" && {
            apiUrl,
            apiDataPath,
            apiRefreshInterval,
            apiMethod,
            apiHeaders: JSON.parse(apiHeaders),
            apiBody,
          }),
        });

        // Refresh data source sau khi cập nhật
        refreshDataSource(editingId);
      } else {
        // Thêm data source mới
        addDataSource({
          name,
          description,
          type,
          data: [],
          fields: [],
          lastUpdated: Date.now(),
          ...(type === "static" && { data: JSON.parse(staticData) }),
          ...(type === "json" && { jsonData, jsonDataPath }),
          ...(type === "api" && {
            apiUrl,
            apiDataPath,
            apiRefreshInterval,
            apiMethod,
            apiHeaders: JSON.parse(apiHeaders),
            apiBody,
          }),
        });
      }

      resetForm();
    } catch (error) {
      console.error("Error saving data source:", error);
      alert(`Lỗi khi lưu nguồn dữ liệu: ${error}`);
    }
  };

  // Render form theo loại data source
  const renderFormByType = () => {
    switch (type) {
      case "static":
        return (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Dữ liệu (JSON)
            </label>
            <textarea
              value={staticData}
              onChange={(e) => setStaticData(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              rows={8}
              placeholder='[{"id": 1, "name": "Item 1"}, {"id": 2, "name": "Item 2"}]'
            />
          </div>
        );

      case "json":
        return (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Dữ liệu JSON
            </label>
            <textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              rows={8}
              placeholder='{"data": [{"id": 1, "name": "Item 1"}, {"id": 2, "name": "Item 2"}]}'
            />

            <label className="block text-sm font-medium text-gray-700 mt-2">
              JSON Path (truy cập vào mảng dữ liệu)
            </label>
            <input
              type="text"
              value={jsonDataPath}
              onChange={(e) => setJsonDataPath(e.target.value)}
              placeholder="data"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
        );

      case "api":
        return (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              API URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.example.com/data"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />

            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700">
                HTTP Method
              </label>
              <select
                value={apiMethod}
                onChange={(e) => setApiMethod(e.target.value as HttpMethod)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <label className="block text-sm font-medium text-gray-700 mt-2">
              API Data Path (truy cập vào mảng dữ liệu)
            </label>
            <input
              type="text"
              value={apiDataPath}
              onChange={(e) => setApiDataPath(e.target.value)}
              placeholder="data"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />

            <label className="block text-sm font-medium text-gray-700 mt-2">
              API Headers (JSON)
            </label>
            <textarea
              value={apiHeaders}
              onChange={(e) => setApiHeaders(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              rows={3}
              placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
            />

            {(apiMethod === "POST" || apiMethod === "PUT") && (
              <>
                <label className="block text-sm font-medium text-gray-700 mt-2">
                  API Body
                </label>
                <textarea
                  value={apiBody}
                  onChange={(e) => setApiBody(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  rows={4}
                  placeholder='{"key": "value"}'
                />
              </>
            )}

            <label className="block text-sm font-medium text-gray-700 mt-2">
              Thời gian tự động làm mới (ms, 0 = không làm mới)
            </label>
            <input
              type="number"
              value={apiRefreshInterval}
              onChange={(e) =>
                setApiRefreshInterval(parseInt(e.target.value) || 0)
              }
              placeholder="0"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Render danh sách data sources
  const renderDataSources = () => {
    return Object.entries(dataSources).map(([id, dataSource]) => (
      <div key={id} className="border p-4 rounded-md mb-4 bg-white shadow-sm">
        <div className="flex">
          <h3 className="font-bold flex-1">{dataSource.name}</h3>
          <div className="mt-1 text-xs">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-2">
              {dataSource.type}
            </span>
            <span className="text-gray-500">{dataSource.data.length} mục</span>
          </div>
        </div>
        {dataSource.fields.length > 0 && (
          <div className="mt-1 break-words">
            <p className="text-gray-500">Các trường: </p>
            {dataSource.fields.map((field) => (
              <span
                key={field}
                className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded mr-1"
              >
                {field}
              </span>
            ))}
          </div>
        )}
        <div className="flex mt-1 space-x-2">
          <button
            onClick={() => refreshDataSource(id)}
            className="px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
            title="Làm mới dữ liệu"
          >
            🔄
          </button>
          <button
            onClick={() => editDataSource(id)}
            className="px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
            title="Chỉnh sửa"
          >
            ✏️
          </button>
          <button
            onClick={() => {
              if (window.confirm("Bạn có chắc muốn xóa nguồn dữ liệu này?")) {
                removeDataSource(id);
              }
            }}
            className="px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
            title="Xóa"
          >
            🗑️
          </button>
        </div>
        {dataSource.error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            Lỗi: {dataSource.error}
          </div>
        )}
        {dataSource.isLoading && (
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded animate-pulse">
            Đang tải dữ liệu...
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Quản lý Nguồn dữ liệu</h2>

      <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded-md">
        <h3 className="font-medium mb-3">
          {editingId ? "Chỉnh sửa nguồn dữ liệu" : "Thêm nguồn dữ liệu mới"}
        </h3>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Tên nguồn dữ liệu
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Mô tả (tùy chọn)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Loại nguồn dữ liệu
          </label>
          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as "static" | "json" | "api")
            }
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="static">Dữ liệu tĩnh (Static)</option>
            <option value="json">Dữ liệu JSON</option>
            <option value="api">API</option>
          </select>
        </div>

        {renderFormByType()}

        <div className="mt-4 flex space-x-3">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {editingId ? "Cập nhật" : "Thêm mới"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Hủy chỉnh sửa
            </button>
          )}
        </div>
      </form>

      <div className="mt-6">
        <h3 className="font-medium mb-3">Danh sách nguồn dữ liệu</h3>
        {Object.keys(dataSources).length === 0 ? (
          <p className="text-gray-500">Chưa có nguồn dữ liệu nào.</p>
        ) : (
          renderDataSources()
        )}
      </div>
    </div>
  );
};
