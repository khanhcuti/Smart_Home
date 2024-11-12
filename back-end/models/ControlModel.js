'use strict';
const db = require('../config/db');

// Hàm lấy dữ liệu cảm biến gần nhất
const getLatestSensorData = async (sortType, sortOrder, specificDate, pageSize, currentPage) => {
  let query = 'SELECT * FROM sensordata';
  const queryParams = [];

  // Xử lý điều kiện tìm kiếm theo thời gian
  if (specificDate) {
    // Kiểm tra xem specificDate có chứa cả ngày và giờ không
    if (specificDate.includes(' ')) {
      // Nếu có cả ngày và giờ
      query += ' WHERE timestamp LIKE ?';
      queryParams.push(`${specificDate}%`);
    } else if (specificDate.includes(':')) {
      // Nếu chỉ có giờ
      query += ' WHERE TIME(timestamp) LIKE ?';
      queryParams.push(`${specificDate}%`);
    } else {
      // Nếu chỉ có ngày
      query += ' WHERE DATE(timestamp) = ?';
      queryParams.push(specificDate);
    }
  }

  // Thêm sắp xếp nếu có
  if (sortType && sortOrder) {
    query += ` ORDER BY ${sortType} ${sortOrder.toUpperCase()}`;
  } else {
    query += ' ORDER BY id ASC'; // Sắp xếp mặc định theo id nếu không có tiêu chí sắp xếp
  }

  // Thêm phân trang
  const limit = parseInt(pageSize) || 10; // Mặc định là 10 nếu không có pageSize
  const offset = (parseInt(currentPage) - 1) * limit; // Tính toán offset
  query += ` LIMIT ? OFFSET ?`;
  queryParams.push(limit, offset); // Thêm limit và offset vào queryParams

  const [rows] = await db.query(query, queryParams);
  const totalRecords = await getTotalRecords(specificDate, 'sensordata'); // Lấy tổng số bản ghi từ bảng sensordata
  const totalPages = Math.ceil(totalRecords / limit);

  return {
    rows,
    totalRecords,
    totalPages,
    currentPage: parseInt(currentPage),
    pageSize: limit
  };
};

// Hàm lấy tổng số bản ghi
const getTotalRecords = async (specificDate, table) => {
    let query = `SELECT COUNT(*) as count FROM ${table}`;
    const queryParams = [];

    if (specificDate) {
        if (specificDate.includes(' ')) {
            // Nếu có cả ngày và giờ
            query += ' WHERE timestamp LIKE ?';
            queryParams.push(`${specificDate}%`);
        } else if (specificDate.includes(':')) {
            // Nếu chỉ có giờ
            query += ' WHERE TIME(timestamp) LIKE ?';
            queryParams.push(`${specificDate}%`);
        } else {
            // Nếu chỉ có ngày
            query += ' WHERE DATE(timestamp) = ?';
            queryParams.push(specificDate);
        }
    }

    const [result] = await db.query(query, queryParams);
    return result[0].count;
};

// Hàm lấy lịch sử hoạt động thiết bị với tìm kiếm
const getActionHistory = async (sortType, specificDate, pageSize, currentPage) => {
    let query = 'SELECT * FROM control_history';
    const queryParams = [];

    // Xử lý điều kiện tìm kiếm theo thời gian
    if (specificDate) {
        const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

        if (dateTimeRegex.test(specificDate)) {
            // Tìm kiếm chính xác theo ngày giờ
            query += ' WHERE timestamp = ?';
            queryParams.push(specificDate);
        } else if (dateRegex.test(specificDate)) {
            // Tìm kiếm theo ngày
            query += ' WHERE DATE(timestamp) = ?';
            queryParams.push(specificDate);
        } else if (timeRegex.test(specificDate)) {
            // Tìm kiếm theo giờ
            query += ' WHERE TIME(timestamp) LIKE ?';
            queryParams.push(`${specificDate}%`);
        }
    }

    // Sửa lại phần sắp xếp
    if (sortType) {
        const validSortTypes = ['device', 'status', 'timestamp', 'id'];
        if (sortType === 'ON') {
            query += ' ORDER BY (status = "ON") DESC, id ASC'; // Thêm id ASC
        } else if (sortType === 'OFF') {
            query += ' ORDER BY (status = "OFF") DESC, id ASC'; // Thêm id ASC
        } else if (validSortTypes.includes(sortType)) {
            query += ` ORDER BY ${sortType} ASC`; // Đổi DESC thành ASC
        } else {
            query += ' ORDER BY id ASC'; // Mặc định sắp xếp theo ID tăng dần
        }
    } else {
        query += ' ORDER BY id ASC'; // Mặc định sắp xếp theo ID tăng dần
    }

    // Thêm phân trang
    const limit = parseInt(pageSize) || 10;
    const offset = (parseInt(currentPage) - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    console.log('Query:', query); // Log để debug
    console.log('Params:', queryParams); // Log để debug

    const [rows] = await db.query(query, queryParams);
    const totalRecords = await getTotalRecords(specificDate, 'control_history');
    const totalPages = Math.ceil(totalRecords / limit);

    return {
        rows,
        totalRecords,
        totalPages,
        currentPage: parseInt(currentPage),
        pageSize: limit
    };
};

// Hàm lấy n bản ghi mới nhất cho cả hiển thị giá trị và biểu đồ
const getLatestSensorDataForDisplay = async (limit = 1) => {
  const query = 'SELECT * FROM sensordata ORDER BY id DESC LIMIT ?';
  const [rows] = await db.query(query, [limit]);
  return limit === 1 ? rows[0] : rows; // Trả về object nếu limit=1, array nếu limit>1
};

module.exports = {
    getLatestSensorData,
    getActionHistory,
    getLatestSensorDataForDisplay,
};
