import { useEditor } from '@craftjs/core';
import { Tooltip } from '@mui/material';
import cx from 'classnames';
import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';

import Checkmark from '../../../public/icons/check.svg';
import Customize from '../../../public/icons/customize.svg';
import RedoSvg from '../../../public/icons/toolbox/redo.svg';
import UndoSvg from '../../../public/icons/toolbox/undo.svg';

const HeaderDiv = styled.div`
  width: 100%;
  height: 45px;
  z-index: 99999;
  position: relative;
  padding: 0px 10px;
  background: #d4d4d4;
  display: flex;
`;

const Btn = styled.a`
  display: flex;
  align-items: center;
  padding: 5px 15px;
  border-radius: 3px;
  color: #fff;
  font-size: 13px;
  margin-left: 10px;
  svg {
    margin-right: 6px;
    width: 12px;
    height: 12px;
    fill: #fff;
    opacity: 0.9;
  }
`;

const Item = styled.a<{ disabled?: boolean }>`
  margin-right: 10px;
  cursor: pointer;
  svg {
    width: 20px;
    height: 20px;
    fill: #707070;
  }
  ${(props) =>
    props.disabled &&
    `
    opacity:0.5;
    cursor: not-allowed;
  `}
`;

export const Header = () => {
  const { enabled, canUndo, canRedo, actions, query } = useEditor((state, query) => ({
    enabled: state.options.enabled,
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }));

  const [saved, setSaved] = useState(false);
  const [templates, setTemplates] = useState<string[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);

  // Lấy danh sách template đã lưu khi component mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('craftjs-templates');
    if (savedTemplates) {
      try {
        const templateList = JSON.parse(savedTemplates);
        setTemplates(templateList);
      } catch (e) {
        console.error('Lỗi khi tải templates:', e);
      }
    }
  }, []);

  // Lưu trạng thái hiện tại
  const handleSave = () => {
    try {
      // Lấy trạng thái hiện tại của editor và xử lý an toàn
      let json;
      try {
        json = query.serialize();
      } catch (serializeError) {
        console.error('Lỗi khi serialize:', serializeError);
        
        // Thử phương pháp khác: sử dụng cách bảo vệ với JSON replacer function
        const getCircularReplacer = () => {
          const seen = new WeakSet();
          return (key, value) => {
            // Bỏ qua các thuộc tính bắt đầu bằng "_"
            if (key.startsWith('_')) return undefined;
            
            // Xử lý circular references
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) {
                return '[Circular]';
              }
              seen.add(value);
            }
            return value;
          };
        };
        
        try {
          // Lấy state của editor và thử serialize thủ công
          const editorState = query.getState();
          
          // Xóa các thuộc tính không cần thiết có thể gây lỗi
          const safeState = {
            nodes: editorState.nodes,
            events: {
              selected: editorState.events.selected,
              hovered: editorState.events.hovered,
            }
          };
          
          json = JSON.stringify(safeState, getCircularReplacer());
        } catch (fallbackError) {
          throw new Error(`Không thể lưu trang: ${fallbackError instanceof Error ? fallbackError.message : 'Lỗi không xác định'}`);
        }
      }
      
      // Nhập tên template
      const templateName = window.prompt('Nhập tên để lưu template:', currentTemplate || 'My Template');
      if (!templateName) return;
      
      // Lưu template hiện tại
      localStorage.setItem(`craftjs-template-${templateName}`, json);
      
      // Cập nhật danh sách template
      let templateList = [...templates];
      if (!templateList.includes(templateName)) {
        templateList.push(templateName);
        setTemplates(templateList);
      }
      
      // Lưu danh sách template
      localStorage.setItem('craftjs-templates', JSON.stringify(templateList));
      
      setCurrentTemplate(templateName);
      setSaved(true);
      
      // Reset trạng thái saved sau 2 giây
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Lỗi khi lưu template:', e);
      alert('Có lỗi khi lưu template. Chi tiết: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  // Tải template đã lưu
  const handleLoad = (templateName: string) => {
    try {
      const json = localStorage.getItem(`craftjs-template-${templateName}`);
      if (json) {
        try {
          actions.deserialize(json);
          setCurrentTemplate(templateName);
          setShowTemplates(false);
        } catch (deserializeError: any) {
          console.error('Lỗi khi deserialize:', deserializeError);
          alert(`Không thể tải template "${templateName}". Template có thể bị hỏng hoặc không tương thích. Chi tiết: ${deserializeError.message}`);
        }
      }
    } catch (e: any) {
      console.error('Lỗi khi tải template:', e);
      alert('Có lỗi khi tải template. Chi tiết: ' + (e.message));
    }
  };

  // Xóa template
  const handleDelete = (templateName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Bạn có chắc chắn muốn xóa template "${templateName}"?`)) {
      localStorage.removeItem(`craftjs-template-${templateName}`);
      const newTemplates = templates.filter(t => t !== templateName);
      setTemplates(newTemplates);
      localStorage.setItem('craftjs-templates', JSON.stringify(newTemplates));
      
      if (currentTemplate === templateName) {
        setCurrentTemplate('');
      }
    }
  };

  return (
    <HeaderDiv className="header text-white transition w-full">
      <div className="items-center flex w-full px-4 justify-end">
        {enabled && (
          <div className="flex-1 flex">
            <Tooltip title="Undo" placement="bottom">
              <Item disabled={!canUndo} onClick={() => actions.history.undo()}>
                <UndoSvg />
              </Item>
            </Tooltip>
            <Tooltip title="Redo" placement="bottom">
              <Item disabled={!canRedo} onClick={() => actions.history.redo()}>
                <RedoSvg />
              </Item>
            </Tooltip>
            
            {/* Nút tải template */}
            <div className="relative">
              <Tooltip title="Tải trang" placement="bottom">
                <Item onClick={() => setShowTemplates(!showTemplates)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                </Item>
              </Tooltip>
              
              {/* Danh sách template */}
              {showTemplates && templates.length > 0 && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-300 rounded shadow-lg z-50">
                  {templates.map(template => (
                    <div 
                      key={template}
                      onClick={() => handleLoad(template)}
                      className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <span className="text-gray-800 text-sm truncate flex-1">
                        {template}
                      </span>
                      <button
                        onClick={(e) => handleDelete(template, e)}
                        className="text-red-500 hover:text-red-700 text-xs ml-2"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Thông báo không có template */}
              {showTemplates && templates.length === 0 && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-300 rounded shadow-lg z-50 p-4">
                  <span className="text-gray-600 text-sm">Chưa có template nào được lưu</span>
                </div>
              )}
            </div>
            
            {/* Thông báo đã lưu */}
            {saved && (
              <span className="ml-2 text-green-600 text-sm">Đã lưu!</span>
            )}
          </div>
        )}
        <div className="flex">
          {enabled && (
            <Btn
              className="bg-blue-500 hover:bg-blue-600"
              onClick={handleSave}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="#fff">
                <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/>
              </svg>
              Lưu trang
            </Btn>
          )}
          <Btn
            className={cx([
              'transition cursor-pointer',
              {
                'bg-green-400': enabled,
                'bg-primary': !enabled,
              },
            ])}
            onClick={() => {
              actions.setOptions((options) => (options.enabled = !enabled));
            }}
          >
            {enabled ? (
              <Checkmark viewBox="-3 -3 20 20" />
            ) : (
              <Customize viewBox="2 0 16 16" />
            )}
            {enabled ? 'Finish Editing' : 'Edit'}
          </Btn>
        </div>
      </div>
    </HeaderDiv>
  );
};
