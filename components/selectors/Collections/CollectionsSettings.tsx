import { FormControlLabel, Radio } from "@mui/material";
import { useEffect, useState } from "react";

import { useNode } from "@craftjs/core";
import axios from "axios";
import { FieldSelector } from "components/editor/Base/FieldSelector";
import { ToolbarItem, ToolbarSection } from "../../editor";

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

  const [dataInput, setDataInput] = useState("");
  const [jsonDataInput, setJsonDataInput] = useState("");
  const [dataFields, setDataFields] = useState<string[]>([]);
  const [apiTestStatus, setApiTestStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [apiTestError, setApiTestError] = useState<string | null>(null);
  const [apiTestResult, setApiTestResult] = useState<any | null>(null);
  const [apiUrl, setApiUrl] = useState("");
  const [jsonDataPath, setJsonDataPath] = useState("data");
  const [apiMethod, setApiMethod] = useState("GET");
  const [apiBody, setApiBody] = useState("");

  // Đồng bộ giá trị từ props
  useEffect(() => {
    if (props.apiUrl) {
      setApiUrl(props.apiUrl);
    }
    if (props.jsonDataPath) {
      setJsonDataPath(props.jsonDataPath);
    }
    if (props.jsonData) {
      setJsonDataInput(props.jsonData);
    }
  }, [props.apiUrl, props.jsonDataPath, props.jsonData]);

  const [apiRefreshInterval, setApiRefreshInterval] = useState(0);

  // Cập nhật danh sách trường dữ liệu khi dữ liệu thay đổi
  useEffect(() => {
    if (props.data && props.data.length > 0) {
      const firstItem = props.data[0];
      if (firstItem && typeof firstItem === "object") {
        setDataFields(Object.keys(firstItem));
      }
    }
  }, [props.data]);

  // Hàm tạo dữ liệu mẫu
  const getSampleDataJson = () => {
    return JSON.stringify(
      [
        {
          title: "Tiêu đề mục 1",
          description: "Mô tả chi tiết cho mục 1",
          imageUrl: "https://via.placeholder.com/150",
          price: 100000,
        },
        {
          title: "Tiêu đề mục 2",
          description: "Mô tả chi tiết cho mục 2",
          imageUrl: "https://via.placeholder.com/150",
          price: 200000,
        },
        {
          title: "Tiêu đề mục 3",
          description: "Mô tả chi tiết cho mục 3",
          imageUrl: "https://via.placeholder.com/150",
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
      setProp((props) => (props.dataSource = "static"));
      setProp((props) => (props.renderMode = "columns")); // Chuyển sang chế độ hiển thị cột
      if (parsedData && parsedData.length > 0) {
        const extractedFields = Object.keys(parsedData[0]);
        setDataFields(extractedFields);
        setProp((props) => (props.fields = extractedFields));
      }
    } catch (e) {
      alert("Lỗi: JSON không hợp lệ");
    }
  };

  const handleApplyJsonData = () => {
    try {
      // Chỉ lưu chuỗi JSON vào thuộc tính jsonData
      setProp((props) => (props.jsonData = jsonDataInput));
      setProp((props) => (props.jsonDataPath = jsonDataPath));
      setProp((props) => (props.dataSource = "json"));

      // Kiểm tra JSON để hiển thị các trường
      const parsedData = JSON.parse(jsonDataInput);
      let dataToUse = parsedData;

      // Áp dụng đường dẫn nếu có
      if (jsonDataPath) {
        const paths = jsonDataPath.split(".");
        for (const path of paths) {
          if (dataToUse && path in dataToUse) {
            dataToUse = dataToUse[path];
          } else {
            throw new Error(
              `Không tìm thấy đường dẫn '${jsonDataPath}' trong dữ liệu JSON`
            );
          }
        }
      }

      if (Array.isArray(dataToUse) && dataToUse.length > 0) {
        const extractedFields = Object.keys(dataToUse[0]);
        setDataFields(extractedFields);
        setProp((props) => (props.fields = extractedFields));
      }
    } catch (e: any) {
      alert(`Lỗi: ${e.message || "JSON không hợp lệ"}`);
    }
  };

  // Kiểm tra API
  const handleTestApi = async () => {
    // Sử dụng biến local apiUrl hoặc ưu tiên giá trị từ input
    const currentApiUrl = apiUrl || props.apiUrl || "";
    console.log("Đang kiểm tra API:", currentApiUrl);

    if (!currentApiUrl) {
      setApiTestError("Vui lòng nhập URL API");
      setApiTestStatus("error");
      return;
    }

    setApiTestStatus("loading");
    setApiTestError(null);
    setApiTestResult(null);

    try {
      // Sử dụng proxy hoặc CORS nếu cần thiết
      let response = null;
      const headers = {
        Accept: "application/json",
      };

      if (apiMethod === "POST") {
        response = await axios.post(
          "https://vnshop.vnpaytest.vn/api/channels/CH1021/products",
          apiBody,
          {
            headers: {
              "Access-Control-Allow-Origin": true,
            },
          }
        );
      } else {
        response = await axios.get(currentApiUrl, {
          headers,
        });
      }

      if (response.status !== 200) {
        throw new Error(`API trả về lỗi: ${response.status}`);
      }

      const result = await response.data;
      console.log("Kết quả API:", result);

      // Lấy dữ liệu theo đường dẫn
      let fetchedData = result;
      if (props.apiDataPath) {
        const paths = props.apiDataPath.split(".");
        for (const path of paths) {
          if (fetchedData && path in fetchedData) {
            fetchedData = fetchedData[path];
          } else {
            throw new Error(
              `Không tìm thấy đường dẫn '${props.apiDataPath}' trong dữ liệu API`
            );
          }
        }
      }

      if (!Array.isArray(fetchedData)) {
        throw new Error("Dữ liệu không phải dạng mảng");
      }

      console.log("Dữ liệu đã xử lý:", fetchedData);
      setApiTestResult(fetchedData);
      setApiTestStatus("success");

      // Tự động cập nhật fields nếu có dữ liệu
      if (fetchedData.length > 0) {
        const extractedFields = Object.keys(fetchedData[0]);
        setDataFields(extractedFields);
        setProp((props) => (props.fields = extractedFields));
      }
    } catch (err: any) {
      console.error("Lỗi API:", err);
      setApiTestError(err.message || "Lỗi khi tải dữ liệu từ API");
      setApiTestStatus("error");
    }
  };

  // Áp dụng kết quả API test vào dữ liệu
  const handleApplyApiTestResult = () => {
    if (apiTestResult && Array.isArray(apiTestResult)) {
      setProp((props) => (props.apiUrl = apiUrl));
      setProp((props) => (props.apiEnabled = true));
      setProp((props) => (props.dataSource = "api"));
    }
  };

  return (
    <div>
      <ToolbarSection title="Kiểu hiển thị" props={["renderMode"]}>
        <ToolbarItem propKey="renderMode" type="radio" label="Chế độ hiển thị">
          <FormControlLabel
            value="columns"
            control={<Radio />}
            label="Cột cố định"
          />
          <FormControlLabel
            value="dynamic"
            control={<Radio />}
            label="Dữ liệu (Động)"
          />
        </ToolbarItem>
        {props.renderMode === "columns" ? (
          <div>
            <ToolbarItem
              propKey="dataSource"
              type="radio"
              label="Nguồn dữ liệu"
            >
              <FormControlLabel
                value="static"
                control={<Radio />}
                label="Dữ liệu tĩnh"
              />
            </ToolbarItem>

            {props.dataSource === "static" && (
              <div>
                <p style={{ fontSize: "12px", marginTop: "10px" }}>
                  Nhập dữ liệu mẫu (dạng JSON):
                </p>
                <textarea
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  placeholder={getSampleDataJson()}
                  rows={6}
                  style={{
                    width: "100%",
                    marginBottom: "10px",
                    fontFamily: "monospace",
                    fontSize: "12px",
                  }}
                />
                <button
                  onClick={handleApplyData}
                  style={{
                    backgroundColor: "#2196f3",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Áp dụng
                </button>
              </div>
            )}

            {dataFields.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ fontSize: "12px", margin: "5px 0" }}>
                  Các trường dữ liệu có sẵn:
                </p>
                <div
                  style={{
                    fontSize: "12px",
                    backgroundColor: "#f5f5f5",
                    padding: "5px",
                    borderRadius: "4px",
                  }}
                >
                  {dataFields.map((field) => (
                    <span
                      key={field}
                      style={{
                        display: "inline-block",
                        margin: "2px",
                        padding: "2px 5px",
                        backgroundColor: "#e0e0e0",
                        borderRadius: "3px",
                      }}
                    >
                      {`${props.itemVariable}.${field}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <ToolbarItem
              propKey="dataSource"
              type="radio"
              label="Nguồn dữ liệu"
            >
              <FormControlLabel
                value="json"
                control={<Radio />}
                label="Dữ liệu JSON"
              />
              <FormControlLabel
                value="api"
                control={<Radio />}
                label="Dữ liệu từ API"
              />
            </ToolbarItem>

            {props.dataSource === "json" && (
              <div>
                <p style={{ fontSize: "12px", marginTop: "10px" }}>
                  Nhập chuỗi JSON:
                </p>
                <textarea
                  value={jsonDataInput}
                  onChange={(e) => setJsonDataInput(e.target.value)}
                  placeholder={getSampleDataJson()}
                  rows={6}
                  style={{
                    width: "100%",
                    marginBottom: "10px",
                    fontFamily: "monospace",
                    fontSize: "12px",
                  }}
                />
                <p style={{ fontSize: "12px", marginTop: "5px" }}>
                  Đường dẫn truy cập dữ liệu (JSON Path):
                </p>
                <input
                  value={jsonDataPath}
                  onChange={(e) => setJsonDataPath(e.target.value)}
                  placeholder="data"
                  style={{
                    width: "100%",
                    marginBottom: "10px",
                    padding: "5px",
                  }}
                />
                <button
                  onClick={handleApplyJsonData}
                  style={{
                    backgroundColor: "#2196f3",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Áp dụng JSON
                </button>
              </div>
            )}

            {props.dataSource === "api" && (
              <div>
                <p style={{ fontSize: "12px", marginTop: "10px" }}>
                  Cấu hình API:
                </p>
                <input
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="URL API"
                  style={{
                    width: "100%",
                    marginBottom: "10px",
                    padding: "5px",
                  }}
                />
                <ToolbarItem
                  propKey="apiDataPath"
                  type="text"
                  label="Đường dẫn dữ liệu"
                />
                <ToolbarItem
                  type="select"
                  label="Phương thức"
                  propKey="apiMethod"
                  onChange={(value) => {
                    setApiMethod(value);
                    setApiBody("");
                  }}
                >
                  <FieldSelector noUse={false} fields={["GET", "POST"]} />
                </ToolbarItem>
                {apiMethod === "POST" && (
                  <textarea
                    value={apiBody}
                    onChange={(e) => setApiBody(e.target.value)}
                    placeholder="Body"
                    style={{
                      width: "100%",
                      marginBottom: "10px",
                      padding: "5px",
                    }}
                  />
                )}

                <div style={{ display: "flex", marginBottom: "10px" }}>
                  <button
                    onClick={handleTestApi}
                    style={{
                      backgroundColor: "#ff9800",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      marginRight: "10px",
                    }}
                    disabled={apiTestStatus === "loading"}
                  >
                    {apiTestStatus === "loading"
                      ? "Đang tải..."
                      : "Kiểm tra API"}
                  </button>

                  <button
                    onClick={handleApplyApiTestResult}
                    style={{
                      backgroundColor: "#4caf50",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                    disabled={apiTestStatus !== "success" || !apiTestResult}
                  >
                    Áp dụng
                  </button>
                </div>

                {apiTestStatus === "error" && (
                  <div
                    style={{
                      color: "red",
                      fontSize: "12px",
                      marginBottom: "10px",
                    }}
                  >
                    {apiTestError}
                  </div>
                )}

                {apiTestStatus === "success" && (
                  <div
                    style={{
                      color: "green",
                      fontSize: "12px",
                      marginBottom: "10px",
                    }}
                  >
                    API trả về {apiTestResult?.length || 0} mục dữ liệu.
                  </div>
                )}

                <ToolbarItem
                  propKey="apiRefreshInterval"
                  type="slider"
                  label="Thời gian làm mới (giây)"
                  onChange={(value: number) => {
                    setProp((props) => {
                      props.apiRefreshInterval = value;
                    });
                    return value;
                  }}
                />
              </div>
            )}
          </div>
        )}
      </ToolbarSection>

      <ToolbarSection
        title="Bố cục"
        props={[
          "layout",
          "background",
          "color",
          "padding",
          "margin",
          "shadow",
          "radius",
        ]}
      >
        <ToolbarItem propKey="layout" type="radio" label="Hiển thị">
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

        <ToolbarItem propKey="gridGap" type="text" label="Khoảng cách (gap)" />

        {props.layout === "grid" && (
          <ToolbarItem
            propKey="itemsPerRow"
            type="slider"
            label="Số mục mỗi hàng"
            onChange={(value: number) => {
              return Math.max(1, value);
            }}
          />
        )}

        <ToolbarItem
          propKey="itemVariable"
          type="text"
          label="Tên biến mục (dùng trong code)"
          onChange={(value: string) => {
            return value || "item";
          }}
        />

        <ToolbarItem propKey="background" type="color" label="Màu nền" />
        <ToolbarItem propKey="color" type="color" label="Màu chữ" />
        <ToolbarItem propKey="padding" type="padding" label="Padding" />
        <ToolbarItem propKey="margin" type="margin" label="Margin" />
        <ToolbarItem propKey="shadow" type="slider" label="Bóng đổ" />
        <ToolbarItem propKey="radius" type="slider" label="Bo góc" />
      </ToolbarSection>
    </div>
  );
};
