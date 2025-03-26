import { Editor } from "@craftjs/core";
import { createTheme, ThemeProvider } from "@mui/material";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { TemplatePreview } from "components/TemplatePreview";
import { RenderNode } from "../components/editor";
import {
  Collections,
  Container,
  CustomCardContent1,
  Text,
} from "../components/selectors";
import { Button } from "../components/selectors/Button";
import { Custom1, OnlyButtons } from "../components/selectors/Custom1";
import { Custom2, Custom2VideoDrop } from "../components/selectors/Custom2";
import { Custom3, Custom3BtnDrop } from "../components/selectors/Custom3";
import { Video } from "../components/selectors/Video";

const theme = createTheme({
  typography: {
    fontFamily: [
      "acumin-pro",
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
  },
});

const TemplatesPage = () => {
  const [templates, setTemplates] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Lấy danh sách templates từ localStorage khi component mount
    const savedTemplates = localStorage.getItem("craftjs-templates");
    if (savedTemplates) {
      try {
        const templateList = JSON.parse(savedTemplates);
        setTemplates(templateList);
      } catch (e) {
        console.error("Lỗi khi tải templates:", e);
      }
    }
  }, []);

  // Xem chi tiết một template
  const viewTemplate = (templateName: string) => {
    try {
      const json = localStorage.getItem(`craftjs-template-${templateName}`);
      if (json) {
        setTemplateContent(json);
        setSelectedTemplate(templateName);
      }
    } catch (e) {
      console.error("Lỗi khi tải template:", e);
      alert("Có lỗi khi tải template");
    }
  };

  // Xóa template
  const deleteTemplate = (templateName: string) => {
    if (
      window.confirm(`Bạn có chắc chắn muốn xóa template "${templateName}"?`)
    ) {
      localStorage.removeItem(`craftjs-template-${templateName}`);
      const newTemplates = templates.filter((t) => t !== templateName);
      setTemplates(newTemplates);
      localStorage.setItem("craftjs-templates", JSON.stringify(newTemplates));

      if (selectedTemplate === templateName) {
        setSelectedTemplate(null);
        setTemplateContent(null);
      }
    }
  };

  // Xuất nội dung template dướidạng file JSON
  const exportTemplate = (templateName: string) => {
    try {
      const json = localStorage.getItem(`craftjs-template-${templateName}`);
      if (json) {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${templateName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Lỗi khi xuất template:", e);
      alert("Có lỗi khi xuất template");
    }
  };

  // Xem preview của template
  const previewTemplate = (templateName: string) => {
    const json = localStorage.getItem(`craftjs-template-${templateName}`);
    if (json) {
      setTemplateContent(json);
      setSelectedTemplate(templateName);
      setPreviewMode(true);
    }
  };

  // Sử dụng template trong page builder
  const useTemplate = (templateName: string) => {
    router.push({
      pathname: "/",
      query: { template: templateName },
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen bg-gray-100">
        <NextSeo
          title="Quản lý Templates | Page Builder"
          description="Quản lý các templates đã lưu trong Page Builder"
        />

        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">
              Quản lý Templates
            </h1>
            <Link
              href="/"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Quay lại Page Builder
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-4 py-8">
          {templates.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <h2 className="text-xl text-gray-600 mb-4">
                Chưa có template nào được lưu
              </h2>
              <Link
                href="/"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Tạo template mới
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Danh sách templates */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">
                  Templates đã lưu
                </h2>
                <ul className="divide-y divide-gray-200">
                  {templates.map((template) => (
                    <li key={template} className="py-3">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => viewTemplate(template)}
                          className={`text-left font-medium ${
                            selectedTemplate === template
                              ? "text-blue-600"
                              : "text-gray-700"
                          } hover:text-blue-600`}
                        >
                          {template}
                        </button>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => previewTemplate(template)}
                            className="text-blue-500 hover:text-blue-700 text-sm"
                            title="Xem trước"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => useTemplate(template)}
                            className="text-green-500 hover:text-green-700 text-sm"
                            title="Sử dụng template này"
                          >
                            Sử dụng
                          </button>
                          <button
                            onClick={() => exportTemplate(template)}
                            className="text-orange-500 hover:text-orange-700 text-sm"
                            title="Xuất template"
                          >
                            Xuất
                          </button>
                          <button
                            onClick={() => deleteTemplate(template)}
                            className="text-red-500 hover:text-red-700 text-sm"
                            title="Xóa template"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Chi tiết template */}
              <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-6">
                {selectedTemplate ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-800">
                        Template: {selectedTemplate}
                      </h2>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setPreviewMode(!previewMode)}
                          className={`px-3 py-1 rounded text-sm ${
                            previewMode
                              ? "bg-gray-200 text-gray-800"
                              : "bg-blue-500 text-white hover:bg-blue-600"
                          }`}
                        >
                          {previewMode ? "JSON" : "Xem trước"}
                        </button>
                        <button
                          onClick={() => useTemplate(selectedTemplate)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Sử dụng
                        </button>
                      </div>
                    </div>

                    {previewMode ? (
                      <div className="border rounded-lg p-4 bg-gray-50 h-[600px] overflow-auto">
                        <Editor
                          resolver={{
                            Container,
                            Text,
                            Custom1,
                            Custom2,
                            Custom2VideoDrop,
                            Custom3,
                            Custom3BtnDrop,
                            OnlyButtons,
                            Button,
                            Video,
                            CustomCardContent1,
                            Collections,
                          }}
                          enabled={false}
                          onRender={RenderNode}
                        >
                          <div className="craftjs-preview-wrapper w-full h-full">
                            <TemplatePreview templateData={templateContent} />
                          </div>
                        </Editor>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 bg-gray-50 h-[600px] overflow-auto">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {templateContent
                            ? JSON.stringify(
                                JSON.parse(templateContent),
                                null,
                                2
                              )
                            : ""}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[600px]">
                    <p className="text-gray-500 mb-4">
                      Chọn một template để xem chi tiết
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
};

export default TemplatesPage;
