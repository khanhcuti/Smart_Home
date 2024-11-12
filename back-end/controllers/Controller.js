'use strict';
const ControlModel = require('../models/ControlModel');

// Hàm xử lý lấy dữ liệu cảm biến gần nhất
const handleGetLatestSensorData = async (req, res) => {
  const { sortType, sortOrder, specificDate, pageSize = 10, currentPage = 1 } = req.query;

  try {
    const { rows, totalRecords, totalPages, currentPage: page, pageSize: size } = await ControlModel.getLatestSensorData(sortType, sortOrder, specificDate, pageSize, currentPage);
    res.json({ 
      rows: rows || [], 
      totalRecords,
      totalPages,
      currentPage: page,
      pageSize: size
    });
  } catch (err) {
    console.error('Lỗi khi lấy dữ liệu từ database:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Hàm xử lý lấy lịch sử hoạt động thiết bị
const handleGetActionHistory = async (req, res) => {
  const { sortType, specificDate, pageSize = 10, currentPage = 1 } = req.query;
  try {
    const { rows, totalRecords, totalPages, currentPage: page, pageSize: size } = await ControlModel.getActionHistory(sortType, specificDate, pageSize, currentPage);
    res.json({ 
      rows, 
      totalRecords,
      totalPages,
      currentPage: page,
      pageSize: size
    });
  } catch (err) {
    console.error('Lỗi khi lấy lịch sử từ database:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Hàm xử lý lấy dữ liệu cho cả hiển thị và biểu đồ
const handleGetDisplayData = async (req, res) => {
  try {
    const { type } = req.query; // 'values' cho giá trị đo, 'chart' cho biểu đồ
    const limit = type === 'values' ? 1 : 5;
    const data = await ControlModel.getLatestSensorDataForDisplay(limit);
    res.json(data);
  } catch (err) {
    console.error('Lỗi khi lấy dữ liệu hiển thị:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  handleGetLatestSensorData,
  handleGetActionHistory,
  handleGetDisplayData,
};
