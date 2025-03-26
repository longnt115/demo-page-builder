import React, { useEffect } from 'react';

type TemplatePreviewProps = {
  templateData: string | null;
};

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ templateData }) => {
  // Chỉ hiển thị JSON đã được format đẹp hơn
  if (!templateData) {
    return <div className="p-4 text-center text-gray-500">Không có dữ liệu template</div>;
  }

  // Format JSON để dễ đọc
  let formattedJSON = '';
  try {
    formattedJSON = JSON.stringify(JSON.parse(templateData), null, 2);
  } catch (error) {
    console.error('Lỗi khi parse JSON:', error);
    formattedJSON = 'Lỗi định dạng JSON';
  }

  return (
    <div className="template-preview-container w-full h-full">
      <div className="p-4 bg-white rounded shadow-sm">
        <h3 className="font-semibold text-lg mb-2">Nội dung Template</h3>
        <p className="text-gray-500 mb-4 text-sm">
          Vì lí do kỹ thuật, chỉ có thể xem trước nội dung JSON của template. 
          Để xem trước giao diện, vui lòng chọn "Sử dụng" để tải template vào page builder.
        </p>
        <pre className="bg-gray-50 p-4 rounded text-sm text-gray-700 overflow-auto max-h-[400px]">
          {formattedJSON}
        </pre>
      </div>
    </div>
  );
};
