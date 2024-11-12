const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  queueLimit: 0
});

// Kiểm tra kết nối
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to the database.');
    connection.release();
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }
})();

// Xuất promise-based pool để sử dụng async/await
module.exports = pool;
