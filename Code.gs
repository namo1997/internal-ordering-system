// กำหนดค่าคงที่
const SPREADSHEET_ID = '1k3g208t8UhaRC5Gig5oht7KpUVWTbtWPJmzAVEgYFWU';
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

// ฟังก์ชันหลักสำหรับรับ Request
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

// ฟังก์ชันจัดการ Request
function handleRequest(e) {
  const params = e.parameter;
  const action = params.action;
  
  try {
    let result;
    switch(action) {
      case 'login':
        result = handleLogin(params.username, params.password);
        break;
      case 'getData':
        result = getInitialData();
        break;
      case 'getOrderDates':
        result = getOrderDates();
        break;
      case 'getProducts':
        result = getProducts();
        break;
      case 'addOrder':
        result = addOrder(params.orderData);
        break;
      case 'updateOrder':
        result = updateOrder(params.orderId, params.orderData);
        break;
      case 'deleteOrder':
        result = deleteOrder(params.orderId);
        break;
      case 'addProduct':
        result = addProduct(params.productData);
        break;
      case 'updateProduct':
        result = updateProduct(params.productId, params.productData);
        break;
      case 'deleteProduct':
        result = deleteProduct(params.productId);
        break;
      default:
        result = { error: 'Invalid action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ฟังก์ชัน Authentication
function handleLogin(username, password) {
  const usersSheet = ss.getSheetByName('Users');
  const users = getSheetData(usersSheet);
  
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        department: user.department,
        role: user.role
      }
    };
  }
  
  return { success: false, message: 'Invalid credentials' };
}

// ฟังก์ชันดึงข้อมูลเริ่มต้น
function getInitialData() {
  return {
    users: getSheetData(ss.getSheetByName('Users')),
    departments: getSheetData(ss.getSheetByName('Departments')),
    categories: getSheetData(ss.getSheetByName('Categories')),
    products: getSheetData(ss.getSheetByName('Products')),
    orderDates: getSheetData(ss.getSheetByName('OrderDates')),
    units: getSheetData(ss.getSheetByName('Units'))
  };
}

// ฟังก์ชันจัดการ Orders
function getOrderDates() {
  const orderDatesSheet = ss.getSheetByName('OrderDates');
  return {
    orderDates: getSheetData(orderDatesSheet)
  };
}

function getProducts() {
  const productsSheet = ss.getSheetByName('Products');
  return {
    products: getSheetData(productsSheet)
  };
}

function addOrder(orderDataStr) {
  const orderData = JSON.parse(orderDataStr);
  const ordersSheet = ss.getSheetByName('Orders');
  
  // Generate order ID
  const orderId = Utilities.getUuid();
  
  // Add order items
  orderData.items.forEach(item => {
    ordersSheet.appendRow([
      orderId,
      orderData.userId,
      item.productId,
      item.quantity,
      item.price,
      orderData.orderDate
    ]);
  });
  
  // Update order count
  updateOrderCount(orderData.orderDate);
  
  return { 
    success: true, 
    message: 'เพิ่มออเดอร์เรียบร้อย',
    orderId: orderId 
  };
}

function updateOrder(orderId, orderDataStr) {
  const orderData = JSON.parse(orderDataStr);
  const ordersSheet = ss.getSheetByName('Orders');
  
  // Delete existing order items
  deleteOrderItems(orderId);
  
  // Add new order items
  orderData.items.forEach(item => {
    ordersSheet.appendRow([
      orderId,
      orderData.userId,
      item.productId,
      item.quantity,
      item.price,
      orderData.orderDate
    ]);
  });
  
  return { 
    success: true, 
    message: 'อัพเดทออเดอร์เรียบร้อย' 
  };
}

function deleteOrder(orderId) {
  deleteOrderItems(orderId);
  return { 
    success: true, 
    message: 'ลบออเดอร์เรียบร้อย' 
  };
}

// Utility Functions
function getSheetData(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

function deleteOrderItems(orderId) {
  const ordersSheet = ss.getSheetByName('Orders');
  const orders = getSheetData(ordersSheet);
  const orderItems = orders.filter(o => o.orderId === orderId);
  
  // Delete rows in reverse order to maintain correct indices
  orderItems.reverse().forEach(item => {
    const rowIndex = findRowIndex(ordersSheet, 'orderId', orderId);
    if (rowIndex > 0) {
      ordersSheet.deleteRow(rowIndex);
    }
  });
}

function findRowIndex(sheet, columnName, value) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const columnIndex = headers.indexOf(columnName);
  
  if (columnIndex === -1) return -1;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][columnIndex] === value) {
      return i + 1;
    }
  }
  
  return -1;
}

function updateOrderCount(orderDate) {
  const orderDatesSheet = ss.getSheetByName('OrderDates');
  const orderDates = getSheetData(orderDatesSheet);
  const dateRow = orderDates.find(d => d.date === orderDate);
  
  if (dateRow) {
    const rowIndex = findRowIndex(orderDatesSheet, 'date', orderDate);
    if (rowIndex > 0) {
      const currentCount = dateRow.orderCount || 0;
      orderDatesSheet.getRange(rowIndex, 3).setValue(currentCount + 1);
    }
  }
}

// Web app endpoint
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const params = e.parameter;
  const action = params.action;
  
  try {
    let result;
    switch(action) {
      case 'login':
        result = handleLogin(params.username, params.password);
        break;
      case 'getProducts':
        result = getProducts();
        break;
      case 'getCategories':
        result = getCategories();
        break;
      case 'getDepartments':
        result = getDepartments();
        break;
      case 'createOrder':
        result = createOrder(params.orderData);
        break;
      case 'getOrders':
        result = getOrders(params.userId);
        break;
      case 'getAdminData':
        result = getAdminData();
        break;
      default:
        result = { error: 'Invalid action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Authentication
function handleLogin(username, password) {
  const usersSheet = ss.getSheetByName('Users');
  const users = getSheetData(usersSheet);
  
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        department: user.department,
        role: user.role
      }
    };
  }
  
  return { success: false, message: 'Invalid credentials' };
}

// Product Management
function getProducts() {
  const productsSheet = ss.getSheetByName('Products');
  return getSheetData(productsSheet);
}

function getCategories() {
  const categoriesSheet = ss.getSheetByName('Categories');
  return getSheetData(categoriesSheet);
}

function getDepartments() {
  const departmentsSheet = ss.getSheetByName('Departments');
  return getSheetData(departmentsSheet);
}

// Order Management
function createOrder(orderDataStr) {
  const orderData = JSON.parse(orderDataStr);
  const ordersSheet = ss.getSheetByName('Orders');
  const orderDatesSheet = ss.getSheetByName('OrderDates');
  
  // Generate order ID
  const orderId = Utilities.getUuid();
  
  // Add order date
  orderDatesSheet.appendRow([
    orderId,
    orderData.userId,
    orderData.department,
    orderData.totalAmount,
    new Date(),
    'Pending'
  ]);
  
  // Add order items
  orderData.items.forEach(item => {
    ordersSheet.appendRow([
      orderId,
      item.productId,
      item.quantity,
      item.price
    ]);
  });
  
  return { success: true, orderId: orderId };
}

function getOrders(userId) {
  const orderDatesSheet = ss.getSheetByName('OrderDates');
  const ordersSheet = ss.getSheetByName('Orders');
  const productsSheet = ss.getSheetByName('Products');
  
  const orderDates = getSheetData(orderDatesSheet);
  const orders = getSheetData(ordersSheet);
  const products = getSheetData(productsSheet);
  
  const userOrders = orderDates
    .filter(od => od.userId === userId)
    .map(od => {
      const orderItems = orders
        .filter(o => o.orderId === od.orderId)
        .map(o => {
          const product = products.find(p => p.id === o.productId);
          return {
            ...o,
            productName: product ? product.name : 'Unknown Product'
          };
        });
      
      return {
        ...od,
        items: orderItems
      };
    });
    
  return userOrders;
}

// Admin Functions
function getAdminData() {
  return {
    products: getProducts(),
    categories: getCategories(),
    departments: getDepartments(),
    orders: getAllOrders()
  };
}

function getAllOrders() {
  const orderDatesSheet = ss.getSheetByName('OrderDates');
  const ordersSheet = ss.getSheetByName('Orders');
  const productsSheet = ss.getSheetByName('Products');
  const usersSheet = ss.getSheetByName('Users');
  
  const orderDates = getSheetData(orderDatesSheet);
  const orders = getSheetData(ordersSheet);
  const products = getSheetData(productsSheet);
  const users = getSheetData(usersSheet);
  
  return orderDates.map(od => {
    const user = users.find(u => u.id === od.userId);
    const orderItems = orders
      .filter(o => o.orderId === od.orderId)
      .map(o => {
        const product = products.find(p => p.id === o.productId);
        return {
          ...o,
          productName: product ? product.name : 'Unknown Product'
        };
      });
    
    return {
      ...od,
      username: user ? user.username : 'Unknown User',
      items: orderItems
    };
  });
}

// Utility Functions
function getSheetData(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}
