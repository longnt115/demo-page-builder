import { QueryMethods } from "@craftjs/core";
import { QueryCallbacksFor } from "@craftjs/utils";
import { Node } from "@craftjs/core";

// Lưu trạng thái trước đó của từng Collections component
let collectionsState: Record<string, any> = {};

// Dùng để xác định xem ChangeNode đã chạy trước đó chưa
let hasInitialized = false;

// Đảm bảo không gọi quá nhiều lần trong thời gian ngắn
let lastProcessedTime = 0;
const THROTTLE_TIME = 100; // 100ms

// Hàm để lấy thông tin hữu ích từ node mà không gặp lỗi circular reference
const getNodeInfo = (node: any) => {
  if (!node) return null;
  
  try {
    // Lấy thông tin từ node.data một cách an toàn
    const data = node.data || {};
    const props = data.props || {};
    const custom = data.custom || {};

    // Cố gắng lấy dữ liệu từ các thuộc tính quan trọng
    const result: any = {
      id: node.id,
      displayName: props.displayName || data.displayName,
      // Thông tin quan trọng cho Collections
      mode: props.mode,              // Cột cố định hoặc Dữ liệu động
      dataSource: props.dataSource,  // Loại nguồn dữ liệu
      parent: data.parent,           // Node cha
      nodeType: data.type,           // Loại node
      updatedAt: Date.now(),         // Thời điểm cập nhật
    };

    // Thêm thông tin về dữ liệu tùy theo dataSource
    if (props.data) result.data = JSON.stringify(props.data);
    if (props.jsonData) result.jsonData = props.jsonData;
    if (props.apiUrl) result.apiUrl = props.apiUrl;
    if (props.itemVariable) result.itemVariable = props.itemVariable;
    if (props.columns) result.columns = JSON.stringify(props.columns);
    
    // Thêm thông tin về cấu trúc nội dung
    if (data.nodes && Array.isArray(data.nodes)) {
      result.childrenCount = data.nodes.length;
      result.childrenIds = [...data.nodes];
    }
    
    // Thêm thông tin về linkedNodes nếu có
    if (data.linkedNodes) {
      result.linkedNodesCount = Object.keys(data.linkedNodes).length;
      result.linkedNodeIds = Object.keys(data.linkedNodes);
    }

    return result;
  } catch (error) {
    console.error("Error extracting node info:", error);
    return { id: node.id, error: "Failed to extract node info" };
  }
};

// Hàm so sánh sâu 2 đối tượng
const deepCompare = (obj1: any, obj2: any): {isChanged: boolean, changes: string[]} => {
  // Kết quả so sánh
  const result = {
    isChanged: false,
    changes: [] as string[]
  };
  
  // So sánh dựa trên thuộc tính
  if (!obj1 || !obj2) {
    result.isChanged = obj1 !== obj2;
    if (result.isChanged) result.changes.push('object_exists');
    return result;
  }
  
  // Lấy danh sách các thuộc tính để so sánh (bỏ qua updatedAt và functions)
  const sourceObjectProps = Object.keys(obj1).filter(k => 
    k !== 'updatedAt' && typeof obj1[k] !== 'function'
  );
  
  // Kiểm tra từng thuộc tính
  sourceObjectProps.forEach(key => {
    const val1 = obj1[key];
    const val2 = obj2[key];
    
    // Nếu thuộc tính không tồn tại ở đối tượng 2
    if (!(key in obj2)) {
      result.isChanged = true;
      result.changes.push(`property_missing: ${key}`);
      // Không return ở đây - tiếp tục kiểm tra các thuộc tính khác
    }
    // Thuộc tính tồn tại trong cả hai đối tượng
    else {
      // So sánh mảng
      if (Array.isArray(val1) && Array.isArray(val2)) {
        if (val1.length !== val2.length) {
          result.isChanged = true;
          result.changes.push(`array_length: ${key} (${val1.length} → ${val2.length})`);
        } else {
          // So sánh nội dung mảng
          for (let i = 0; i < val1.length; i++) {
            const itemVal1 = val1[i];
            const itemVal2 = val2[i];
            if (typeof itemVal1 === 'object' && itemVal1 !== null && 
                typeof itemVal2 === 'object' && itemVal2 !== null) {
              const nestedResult = deepCompare(itemVal1, itemVal2);
              if (nestedResult.isChanged) {
                result.isChanged = true;
                result.changes.push(`array_item[${i}]: ${key} (${nestedResult.changes.join(', ')})`);
              }
            } else if (itemVal1 !== itemVal2) {
              result.isChanged = true;
              result.changes.push(`array_item[${i}]: ${key} (${itemVal1} → ${itemVal2})`);
            }
          }
        }
      }
      // So sánh đối tượng
      else if (typeof val1 === 'object' && typeof val2 === 'object' && 
              val1 !== null && val2 !== null) {
        const nestedResult = deepCompare(val1, val2);
        if (nestedResult.isChanged) {
          result.isChanged = true;
          result.changes.push(`nested: ${key} (${nestedResult.changes.join(', ')})`);
        }
      }
      // So sánh giá trị nguyên thủy
      else if (val1 !== val2) {
        result.isChanged = true;
        result.changes.push(`value: ${key} (${val1} → ${val2})`);
      }
    }
  });
  
  // Kiểm tra thuộc tính mới trong obj2 mà không có trong obj1
  const targetObjectProps = Object.keys(obj2).filter(k => 
    k !== 'updatedAt' && typeof obj2[k] !== 'function'
  );
  
  targetObjectProps.forEach(key => {
    if (!sourceObjectProps.includes(key)) {
      result.isChanged = true;
      result.changes.push(`new_property: ${key}`);
    }
  });
  
  return result;
};

// Kiểm tra xem có phải Collections component không
const isCollectionsComponent = (node: any): boolean => {
  try {
    return (
      (node?.data?.props?.displayName === "Collections") ||
      (node?.data?.name === "Collections") ||
      (node?.data?.displayName === "Collections")
    );
  } catch (error) {
    return false;
  }
};

// Hàm phát hiện thay đổi trong Collections
export const ChangeNode = (query: QueryCallbacksFor<typeof QueryMethods>) => {
  // Thêm một dấu hiệu để phòng trường hợp onNodesChange được gọi nhiều lần
  const timeNow = Date.now();
  
  // Hạn chế tần suất gọi
  if (timeNow - lastProcessedTime < THROTTLE_TIME) {
    return;
  }
  lastProcessedTime = timeNow;
  
  let changesDetected = false;
  
  try {
    const currentNodes = query.getNodes();
    
    // Log total node count (debug)
    console.log(`Total nodes: ${Object.keys(currentNodes).length}`);
    
    // Lọc các Collections node
    const collectionsEntries = Object.entries(currentNodes).filter(
      ([id, node]) => isCollectionsComponent(node)
    );
    
    // Log collections found (debug)
    console.log(`Found collections: ${collectionsEntries.length}`);
    
    // Danh sách ID các Collections hiện tại
    const currentCollectionIds = collectionsEntries.map(([id]) => id);
    
    // Danh sách ID Collections đã lưu trước đó
    const savedCollectionIds = Object.keys(collectionsState);
    
    // Phát hiện Collections mới được thêm vào
    const newCollections = currentCollectionIds.filter(id => !savedCollectionIds.includes(id));
    
    // Phát hiện Collections bị xóa
    const removedCollections = savedCollectionIds.filter(id => !currentCollectionIds.includes(id));
    
    // Thông báo Collections mới
    if (newCollections.length > 0 && hasInitialized) {
      console.log(`[${timeNow}] New Collections added:`, newCollections);
      changesDetected = true;
    }
    
    // Thông báo Collections bị xóa
    if (removedCollections.length > 0) {
      console.log(`[${timeNow}] Collections removed:`, removedCollections);
      // Xóa Collections khỏi state
      removedCollections.forEach(id => {
        delete collectionsState[id];
      });
      changesDetected = true;
    }
    
    // Kiểm tra thay đổi trong từng Collections hiện tại
    collectionsEntries.forEach(([id, node]) => {
      try {
        // Lấy thông tin hiện tại và trước đó
        const currentInfo = getNodeInfo(node);
        const previousInfo = collectionsState[id];
        
        // Debug để xem thông tin node
        console.log(`Checking collection ${id}:`, 
          currentInfo ? `Found data, mode: ${currentInfo.mode}` : 'No data'
        );
        
        // Nếu là Collections mới hoặc đã thay đổi
        if (!previousInfo) {
          // Collections mới, lưu thông tin
          collectionsState[id] = currentInfo;
          if (hasInitialized) {
            console.log(`[${timeNow}] New Collections detected:`, { id, info: currentInfo });
            changesDetected = true;
          }
        } else {
          // So sánh thay đổi
          const comparison = deepCompare(previousInfo, currentInfo);
          
          if (comparison.isChanged) {
            console.log(`[${timeNow}] Collections ${id} changed`);
            console.log('   Changes detected:', comparison.changes);
            
            // Phân tích các thay đổi cụ thể
            if (previousInfo.mode !== currentInfo.mode) {
              console.log(`   Mode changed: ${previousInfo.mode} -> ${currentInfo.mode}`);
            }
            
            if (previousInfo.dataSource !== currentInfo.dataSource) {
              console.log(`   Data source changed: ${previousInfo.dataSource} -> ${currentInfo.dataSource}`);
            }
            
            // Các thay đổi về dữ liệu
            ['data', 'jsonData', 'apiUrl', 'itemVariable'].forEach(prop => {
              if (previousInfo[prop] !== currentInfo[prop]) {
                console.log(`   ${prop} changed: ${previousInfo[prop]} -> ${currentInfo[prop]}`);
              }
            });
            
            // Thay đổi về cấu trúc con
            if (JSON.stringify(previousInfo.childrenIds) !== JSON.stringify(currentInfo.childrenIds)) {
              console.log(`   Children structure changed`);
            }
            
            // Cập nhật thông tin Collections
            collectionsState[id] = currentInfo;
            changesDetected = true;
          }
        }
      } catch (error) {
        console.error(`Error processing collection ${id}:`, error);
      }
    });
    
    // Ghi nhận đã hoàn thành khởi tạo sau lần chạy đầu tiên
    if (!hasInitialized) {
      hasInitialized = true;
      console.log(`[${timeNow}] Initialized Collections monitoring:`, 
        Object.keys(collectionsState).length > 0 
          ? Object.keys(collectionsState) 
          : "No Collections found");
    }
    
    // Tóm tắt các thay đổi
    if (changesDetected) {
      console.log(`[${timeNow}] Updated Collections state with ${Object.keys(collectionsState).length} components`);
      
      // Ở đây bạn có thể thực hiện các hành động bổ sung khi phát hiện thay đổi
      // Ví dụ: cập nhật state, trigger sự kiện, v.v.
    }
    
  } catch (error) {
    console.error(`[${timeNow}] Error in ChangeNode:`, error);
  }
};
