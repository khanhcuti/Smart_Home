document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1; // Trang hiện tại
    let recordsPerPage = parseInt(document.getElementById('pageSize').value); // Lấy giá trị pageSize từ dropdown
    let sensorData = []; // Mảng chứa dữ liệu cảm biến

    // Thêm sự kiện cho dropdown
    document.getElementById('sortType').addEventListener('change', fetchSensorData);
    document.getElementById('sortOrder').addEventListener('change', fetchSensorData);
    document.getElementById('searchButton').addEventListener('click', fetchSensorData);
    document.getElementById('pageSize').addEventListener('change', (event) => {
        recordsPerPage = parseInt(event.target.value); // Cập nhật recordsPerPage khi người dùng thay đổi
        currentPage = 1; // Reset về trang đầu
        fetchSensorData(); // Gọi lại dữ liệu
    });

    document.getElementById('specificDate').addEventListener('input', (event) => {
        if (event.target.value === '') {
            currentPage = 1; // Reset về trang đầu
            fetchSensorData(); // Gọi lại dữ liệu không có tham s tìm kiếm
        }
    });

    async function fetchSensorData() {
        const sortType = document.getElementById('sortType').value;
        const sortOrder = document.getElementById('sortOrder').value;
        const specificDate = document.getElementById('specificDate').value;

        // Chuyển đổi định dạng thời gian
        let formattedDate = '';
        if (specificDate) {
            // Kiểm tra xem có phải định dạng ngày/tháng/năm không
            const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
            const match = specificDate.match(dateRegex);
            
            if (match) {
                // Nếu là định dạng ngày/tháng/năm, chuyển đổi sang YYYY-MM-DD
                const [_, day, month, year] = match;
                formattedDate = `${year}-${month}-${day}`;
            } else {
                // Nếu là định dạng giờ:phút hoặc giờ:phút:giây
                const timeRegex = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;
                const timeMatch = specificDate.match(timeRegex);
                if (timeMatch) {
                    formattedDate = specificDate;
                } else {
                    // Nếu là kết hợp ngày và giờ (DD/MM/YYYY HH:mm:ss)
                    const dateTimeRegex = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2}(?::\d{2})?)$/;
                    const dateTimeMatch = specificDate.match(dateTimeRegex);
                    if (dateTimeMatch) {
                        const [_, day, month, year, time] = dateTimeMatch;
                        formattedDate = `${year}-${month}-${day} ${time}`;
                    }
                }
            }
        }

        console.log('Tham số tìm kiếm:', { sortType, sortOrder, formattedDate }); // Log tham số tìm kiếm

        try {
            const response = await fetch(`http://127.0.0.1:3000/api/datasensor?sortType=${sortType}&sortOrder=${sortOrder}&specificDate=${formattedDate}&pageSize=${recordsPerPage}&currentPage=${currentPage}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            console.log('Dữ liệu nhận được:', data); // Log dữ liệu nhận được

            sensorData = Array.isArray(data.rows) ? data.rows : []; // Đảm bảo sensorData là mảng
            console.log('Sensor Data:', sensorData); // Log sensorData
            displayRows(); // Hiển thị dữ liệu
            updatePagination(data); // Truyền toàn bộ object data
        } catch (error) {
            console.error('Có lỗi xảy ra khi l���y dữ liệu:', error);
        }
    }

    function displayRows() {
        const tbody = document.querySelector('#sensorDataTable tbody');
        tbody.innerHTML = ''; 

        if (sensorData.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5">Không có dữ liệu để hiển thị</td>`;
            tbody.appendChild(row);
            return;
        }

        for (let item of sensorData) {
            const row = document.createElement('tr');
            // Định dạng thời gian về 24 giờ
            const formattedTime = new Date(item.timestamp).toLocaleString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false // Bỏ định dạng AM/PM
            }).replace(',', ''); // Loại bỏ dấu phẩy

            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.temperature}</td>
                <td>${item.humidity}</td>
                <td>${item.light}</td>
                <td>${formattedTime}</td>
            `;
            tbody.appendChild(row);
        }
    }

    // Hàm tạo thanh phân trang
    function updatePagination(data) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        // Đảm bảo các giá trị là số
        const totalPages = parseInt(data.totalPages) || 1;
        const currentPageNum = parseInt(data.currentPage) || 1;

        console.log('Pagination data:', {
            totalPages: totalPages,
            currentPage: currentPageNum,
            totalRecords: data.totalRecords
        });

        const prevButton = document.createElement('button');
        prevButton.textContent = 'Trước';
        prevButton.disabled = currentPageNum <= 1;
        prevButton.addEventListener('click', () => {
            if (currentPageNum > 1) {
                currentPage = currentPageNum - 1;
                fetchSensorData();
            }
        });
        pagination.appendChild(prevButton);

        const pageIndicator = document.createElement('span');
        pageIndicator.textContent = `Trang ${currentPageNum} / ${totalPages}`;
        pageIndicator.style.margin = '0 10px'; // Thêm margin cho đẹp
        pagination.appendChild(pageIndicator);

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Tiếp theo';
        nextButton.disabled = currentPageNum >= totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPageNum < totalPages) {
                currentPage = currentPageNum + 1;
                fetchSensorData();
            }
        });
        pagination.appendChild(nextButton);
    }

    // Gọi hàm để lấy dữ liệu khi trang web được tải
    window.onload = fetchSensorData;
});
