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
  const data = JSON.parse(e.postData.contents);
  
  switch (data.action) {
    case 'login':
      return ContentService.createTextOutput(JSON.stringify(handleLogin(data.username, data.password)))
        .setMimeType(ContentService.MimeType.JSON);
    case 'getProducts':
      return ContentService.createTextOutput(JSON.stringify(getProducts()))
        .setMimeType(ContentService.MimeType.JSON);
    case 'getCategories':
      return ContentService.createTextOutput(JSON.stringify(getCategories()))
        .setMimeType(ContentService.MimeType.JSON);
    case 'getDepartments':
      return ContentService.createTextOutput(JSON.stringify(getDepartments()))
        .setMimeType(ContentService.MimeType.JSON);
    case 'createOrder':
      return ContentService.createTextOutput(JSON.stringify(createOrder(data.orderData)))
        .setMimeType(ContentService.MimeType.JSON);
    case 'getOrders':
      return ContentService.createTextOutput(JSON.stringify(getOrders(data.userId)))
        .setMimeType(ContentService.MimeType.JSON);
    case 'getAdminData':
      return ContentService.createTextOutput(JSON.stringify(getAdminData()))
        .setMimeType(ContentService.MimeType.JSON);
    case 'resetPassword':
      return ContentService.createTextOutput(JSON.stringify(resetPassword(data)))
        .setMimeType(ContentService.MimeType.JSON);
    case 'getUsers':
      return ContentService.createTextOutput(JSON.stringify(getUsers()))
        .setMimeType(ContentService.MimeType.JSON);
    case 'addUser':
      return ContentService.createTextOutput(JSON.stringify(addUser(data.userData)))
        .setMimeType(ContentService.MimeType.JSON);
    case 'updateUser':
      return ContentService.createTextOutput(JSON.stringify(updateUser(data.userId, data.userData)))
        .setMimeType(ContentService.MimeType.JSON);
    default:
      return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
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

// ฟังก์ชันสำหรับตรวจสอบความถูกต้องของข้อมูล
function validateProduct(product) {
  if (!product.name || product.name.trim() === '') {
    throw new Error('Product name is required');
  }
  if (!product.price || isNaN(product.price) || product.price < 0) {
    throw new Error('Invalid product price');
  }
  if (!product.unit || product.unit.trim() === '') {
    throw new Error('Product unit is required');
  }
  return true;
}

function validateOrder(order) {
  if (!order.userId || order.userId.trim() === '') {
    throw new Error('User ID is required');
  }
  if (!Array.isArray(order.items) || order.items.length === 0) {
    throw new Error('Order must contain at least one item');
  }
  order.items.forEach((item, index) => {
    if (!item.productId || !item.quantity || item.quantity < 1) {
      throw new Error(`Invalid item at position ${index + 1}`);
    }
  });
  return true;
}

function validateUser(user) {
  if (!user.username || user.username.trim() === '') {
    throw new Error('กรุณาระบุชื่อผู้ใช้');
  }
  if (!user.name || user.name.trim() === '') {
    throw new Error('กรุณาระบุชื่อ-นามสกุล');
  }
  if (!user.department || user.department.trim() === '') {
    throw new Error('กรุณาระบุแผนก');
  }
  if (!user.role || user.role.trim() === '') {
    throw new Error('กรุณาระบุตำแหน่ง');
  }
  return true;
}

// เพิ่มการตรวจสอบความถูกต้องในฟังก์ชัน addProduct
function addProduct(data) {
  try {
    validateProduct(data);
    const productsSheet = ss.getSheetByName('Products');
    const productId = Utilities.getUuid();
    
    // เพิ่มแถวใหม่ใน Google Sheets
    productsSheet.appendRow([
      productId,
      data.name,
      data.price,
      data.category,
      data.department,
      data.unit
    ]);
    
    return { 
      success: true, 
      message: 'เพิ่มสินค้าสำเร็จ', 
      productId: productId 
    };
  } catch (e) {
    return { error: e.message };
  }
}

// เพิ่มการตรวจสอบความถูกต้องในฟังก์ชัน createOrder
function createOrder(data) {
  try {
    validateOrder(data);
    const orderData = JSON.parse(data);
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
  } catch (e) {
    return { error: e.message };
  }
}

function resetPassword(data) {
  try {
    const { userId } = data;
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Users');
    const users = sheet.getDataRange().getValues();
    const headers = users[0];
    const userIdIndex = headers.indexOf('id');
    const passwordIndex = headers.indexOf('password');
    
    for (let i = 1; i < users.length; i++) {
      if (users[i][userIdIndex] === userId) {
        // Reset password to empty string
        sheet.getRange(i + 1, passwordIndex + 1).setValue('');
        return { success: true, message: 'Password has been reset successfully' };
      }
    }
    
    throw new Error('User not found');
  } catch (e) {
    return { error: e.message };
  }
}

// ฟังก์ชันสำหรับจัดการผู้ใช้
function getUsers() {
  const usersSheet = ss.getSheetByName('Users');
  return getSheetData(usersSheet);
}

function addUser(userData) {
  try {
    validateUser(userData);
    const usersSheet = ss.getSheetByName('Users');
    const userId = Utilities.getUuid();
    
    // เพิ่มผู้ใช้ใหม่
    usersSheet.appendRow([
      userId,
      userData.username,
      userData.password,  // เก็บรหัสผ่านใน sheet
      userData.name,
      userData.department,
      userData.role
    ]);
    
    return { 
      success: true, 
      message: 'เพิ่มผู้ใช้สำเร็จ',
      userId: userId 
    };
  } catch (e) {
    return { error: e.message };
  }
}

function updateUser(userId, userData) {
  try {
    validateUser(userData);
    const usersSheet = ss.getSheetByName('Users');
    const users = usersSheet.getDataRange().getValues();
    const headers = users[0];
    const userIdIndex = headers.indexOf('id');
    
    for (let i = 1; i < users.length; i++) {
      if (users[i][userIdIndex] === userId) {
        // อัพเดทข้อมูลผู้ใช้
        usersSheet.getRange(i + 1, 2).setValue(userData.username);
        if (userData.password) { // อัพเดทรหัสผ่านถ้ามีการเปลี่ยน
          usersSheet.getRange(i + 1, 3).setValue(userData.password);
        }
        usersSheet.getRange(i + 1, 4).setValue(userData.name);
        usersSheet.getRange(i + 1, 5).setValue(userData.department);
        usersSheet.getRange(i + 1, 6).setValue(userData.role);
        
        return { success: true, message: 'อัพเดทผู้ใช้สำเร็จ' };
      }
    }
    
    throw new Error('ไม่พบผู้ใช้');
  } catch (e) {
    return { error: e.message };
  }
}
