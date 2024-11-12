// Biến toàn cục để lưu trữ biểu đồ và interval
let sensorChart;
let updateInterval;

// Biến toàn cục để lưu trạng thái thiết bị
let deviceStatus = {
    led1: false,
    led2: false,
    led3: false
};

// Kết nối đến broker MQTT 
const client = mqtt.connect('ws://192.168.71.243:9001', {
    username: 'khanh',
    password: 'b21dccn451'
});

// Xử lý kết nối MQTT
client.on('connect', () => {
    console.log('Đã kết nối MQTT broker');
    client.subscribe('datasensor', (err) => {
        if (err) {
            console.error('Lỗi khi subscribe topic:', err);
        }
    });
});

// Xử lý khi nhận được dữ liệu mới từ MQTT
client.on('message', (topic, message) => {
    if (topic === 'datasensor') {
        try {
            const data = JSON.parse(message.toString());
            console.log('Dữ liệu mới nhận từ MQTT:', data);
            
            // Khi có dữ liệu mới từ MQTT, lấy dữ liệu mới nhất từ DB
            updateSensorData();
            updateChartData();
        } catch (error) {
            console.error('Lỗi khi xử lý dữ liệu:', error);
        }
    }
});

// Hàm lấy dữ liệu mới nhất để hiển thị trên thanh đo
function updateSensorData() {
    fetch('http://localhost:3000/api/display?type=values')
        .then(response => response.json())
        .then(data => {
            if (data) {
                console.log('Dữ liệu mới nhất từ DB:', data);
                
                document.getElementById('temperatureValue').textContent = data.temperature.toFixed(1);
                document.getElementById('humidityValue').textContent = data.humidity.toFixed(0);
                document.getElementById('lightValue').textContent = Math.round(data.light);
            }
        })
        .catch(error => console.error('Lỗi khi lấy dữ liệu mới nhất:', error));
}

// Hàm lấy 5 bản ghi mới nhất để vẽ biểu đồ
function updateChartData() {
    fetch('http://localhost:3000/api/display?type=chart')
        .then(response => response.json())
        .then(data => {
            if (data && Array.isArray(data)) {
                // Đảo ngược mảng để hiển thị đúng thứ tự thời gian (từ cũ đến mới)
                const recentData = [...data].reverse();
                console.log('5 bản ghi mới nhất từ DB:', recentData);
                
                // Cập nhật dữ liệu cho biểu đồ
                sensorChart.data.datasets[0].data = recentData.map(row => ({
                    x: new Date(row.timestamp).getTime(),
                    y: row.temperature
                }));
                sensorChart.data.datasets[1].data = recentData.map(row => ({
                    x: new Date(row.timestamp).getTime(),
                    y: row.humidity
                }));
                sensorChart.data.datasets[2].data = recentData.map(row => ({
                    x: new Date(row.timestamp).getTime(),
                    y: row.light
                }));

                // Cập nhật biểu đồ với animation
                sensorChart.update('active');
            }
        })
        .catch(error => console.error('Lỗi khi lấy dữ liệu biểu đồ:', error));
}

// Hàm khởi tạo trang Dashboard
function initDashboard() {
    const ctx = document.getElementById('sensorChart').getContext('2d');
    sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Nhiệt độ (°C)',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgb(255, 99, 132)',
                    tension: 0.3,
                    yAxisID: 'y-temperature'
                },
                {
                    label: 'Độ ẩm (%)',
                    data: [],
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgb(54, 162, 235)',
                    tension: 0.3,
                    yAxisID: 'y-humidity'
                },
                {
                    label: 'Ánh sáng (lux)',
                    data: [],
                    borderColor: 'rgb(255, 205, 86)',
                    backgroundColor: 'rgba(255, 205, 86, 0.5)',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgb(255, 205, 86)',
                    tension: 0.3,
                    yAxisID: 'y-light'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'second',
                        displayFormats: {
                            second: 'HH:mm:ss',
                            minute: 'HH:mm:ss',
                            hour: 'HH:mm',
                            day: 'DD/MM'
                        },
                        tooltipFormat: 'DD/MM/YYYY HH:mm:ss'
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        source: 'data',
                        autoSkip: false,
                        color: 'rgba(0, 0, 0, 0.7)'
                    }
                },
                'y-temperature': {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Nhiệt độ (°C)'
                    },
                    grid: {
                        color: 'rgba(255, 99, 132, 0.2)'
                    },
                    ticks: {
                        color: 'rgb(255, 99, 132)'
                    },
                    min: 0,
                    max: 50
                },
                'y-humidity': {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Độ ẩm (%)'
                    },
                    ticks: {
                        color: 'rgb(54, 162, 235)'
                    },
                    min: 0,
                    max: 100
                },
                'y-light': {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Ánh sáng (lux)'
                    },
                    ticks: {
                        color: 'rgb(255, 205, 86)'
                    },
                    min: 0,
                    max: 1000
                }
            }
        }
    });

    // Thêm sự kiện cho các nút điều khiển
    document.getElementById('led1On').addEventListener('click', () => toggleDevice('Đèn', 'ON'));
    document.getElementById('led1Off').addEventListener('click', () => toggleDevice('Đèn', 'OFF'));
    document.getElementById('led2On').addEventListener('click', () => toggleDevice('Điều Hòa', 'ON'));
    document.getElementById('led2Off').addEventListener('click', () => toggleDevice('Điều Hòa', 'OFF'));
    document.getElementById('led3On').addEventListener('click', () => toggleDevice('Quạt', 'ON'));
    document.getElementById('led3Off').addEventListener('click', () => toggleDevice('Quạt', 'OFF'));

    // Cập nhật dữ liệu ban đầu
    updateSensorData();
    updateChartData();

    // Thiết lập interval ngắn hơn (2 giây)
    updateInterval = setInterval(() => {
        updateSensorData();
        updateChartData();
    }, 30000);
}

// Cleanup khi rời khỏi trang
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});

const icons = {
    Đèn: {
        on: "../img/light-bulb.gif",
        off: "../img/light-bulb.png"
    },
    "Điều Hòa": {
        on: "../img/air-conditioner.gif",
        off: "../img/air-conditioner.png"
    },
    Quạt: {
        on: "../img/fan.gif",
        off: "../img/fan.png"
    }
};

function toggleDevice(device, status) {
    const message = JSON.stringify({ device: device, status: status });

    client.publish('controldevice', message, (err) => {
        if (err) {
            console.error('Lỗi khi gửi lệnh:', err);
            alert('Có lỗi xảy ra khi điều khiển thiết bị.');
        } else {
            let iconElementId;
            if (device === 'Đèn') {
                iconElementId = 'light-icon';
            } else if (device === 'Điều Hòa') {
                iconElementId = 'ac-icon';
            } else if (device === 'Quạt') {
                iconElementId = 'fan-icon';
            }

            if (iconElementId) {
                const iconElement = document.getElementById(iconElementId);
                iconElement.src = status === 'ON' ? icons[device].on : icons[device].off;
            }

            console.log(`${device} is now ${status}`);
        }
    });
}

document.addEventListener('DOMContentLoaded', initDashboard);

