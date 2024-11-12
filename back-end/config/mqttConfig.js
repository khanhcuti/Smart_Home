const mqtt = require('mqtt');
const db = require('./db'); // Đảm bảo bạn đã import db

require("dotenv").config();
const baseUri =  process.env.MQTT_URI;
const option = {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
};

const client = mqtt.connect(baseUri, option);

// Object lưu trạng thái thiết bị tạm thời
let deviceStatus = {
  led1: false,
  led2: false,
  led3: false
};

client.on("connect", () => {
  console.log("Kết nối thành công đến MQTT server");

  client.subscribe("datasensor", (err) => {
    if (!err) {
      console.log("Subscribed to topic datasensor");
    } else {
      console.error("Error subscribing to datasensor:", err);
    }
  });

  client.subscribe("controldevice", (err) => {
    if (!err) {
      console.log("Subscribed to topic controldevice");
    } else {
      console.error("Error subscribing to controldevice:", err);
    }
  });
});

client.on("error", (err) => {
  console.error("Lỗi kết nối đến MQTT server:", err);
});

client.on("message", async (topic, message) => {
  console.log(`Topic ${topic}: ${message}`);
  const data = JSON.parse(message.toString());

  if (topic === "datasensor") {
    // Nhận dữ liệu từ cảm biến và lưu vào database
    const { temperature, humidity, light } = data;
    const query = `INSERT INTO sensordata (temperature, humidity, light, timestamp) VALUES (?, ?, ?, NOW())`;
    
    try {
      const [result] = await db.query(query, [temperature, humidity, light]);
      console.log("Thêm vào database thành công với topic datasensor");
    } catch (err) {
      console.error("Lỗi khi thêm vào database:", err);
    }
  } else if (topic === "controldevice") {
    // Lấy device và status từ dữ liệu
    const { device, status } = data;

    // Cập nhật trạng thái thiết bị
    deviceStatus[device] = (status === "ON");

    console.log("Trạng thái thiết bị cập nhật:", deviceStatus);

    // Lưu trạng thái thiết bị vào database
    const query = `INSERT INTO control_history (device, status, timestamp) VALUES (?, ?, NOW())`;
    try {
      await db.query(query, [device, deviceStatus[device] ? "ON" : "OFF"]);
      console.log(`Lưu trạng thái ${device} - ${deviceStatus[device] ? "ON" : "OFF"} vào database thành công`);
    } catch (err) {
      console.error("Lỗi khi lưu trạng thái vào database:", err);
    }
  }
});

// Hàm gửi lệnh điều khiển đến ESP32 và lưu vào lịch sử điều khiển
function controlDevice(device, status) {
  const message = JSON.stringify({ device, status });
  client.publish("controldevice", message);

  // Cập nhật trạng thái tạm thời trên server
  deviceStatus[device] = status;
  console.log(`Gửi lệnh điều khiển: ${device} - ${status ? "ON" : "OFF"}`);

  // Lưu trạng thái điều khiển vào database
  const query = `INSERT INTO control_history (device, status, timestamp) VALUES (?, ?, NOW())`;
  db.query(query, [device, status ? "ON" : "OFF"])
    .then(() => {
      console.log(`Lưu lệnh điều khiển ${device} - ${status ? "ON" : "OFF"} vào database thành công`);
    })
    .catch((err) => {
      console.error("Lỗi khi lưu lệnh điều khiển vào database:", err);
    });
}

module.exports = { client, controlDevice, deviceStatus };
