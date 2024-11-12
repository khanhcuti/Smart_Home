document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    let recordsPerPage = parseInt(document.getElementById('pageSize').value);
    let actionHistory = [];

    // Thêm sự kiện cho các controls
    document.getElementById('sortType').addEventListener('change', fetchActionHistory);
    document.getElementById('searchButton').addEventListener('click', fetchActionHistory);
    document.getElementById('pageSize').addEventListener('change', (event) => {
        recordsPerPage = parseInt(event.target.value);
        currentPage = 1;
        fetchActionHistory();
    });

    document.getElementById('specificDate').addEventListener('input', (event) => {
        if (event.target.value === '') {
            currentPage = 1;
            fetchActionHistory();
        }
    });

    async function fetchActionHistory() {
        const sortType = document.getElementById('sortType').value;
        const specificDate = document.getElementById('specificDate').value;

        // Xử lý định dạng ngày tháng
        let formattedDate = '';
        if (specificDate) {
            // Kiểm tra định dạng DD/MM/YYYY HH:mm:ss
            const dateTimeRegex = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})$/;
            const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
            const timeRegex = /^(\d{2}:\d{2}(?::\d{2})?)$/;

            const dateTimeMatch = specificDate.match(dateTimeRegex);
            const dateMatch = specificDate.match(dateRegex);
            const timeMatch = specificDate.match(timeRegex);

            if (dateTimeMatch) {
                // Chuyển đổi DD/MM/YYYY HH:mm:ss sang YYYY-MM-DD HH:mm:ss
                const [_, day, month, year, time] = dateTimeMatch;
                formattedDate = `${year}-${month}-${day} ${time}`;
            } else if (dateMatch) {
                // Chuyển đổi DD/MM/YYYY sang YYYY-MM-DD
                const [_, day, month, year] = dateMatch;
                formattedDate = `${year}-${month}-${day}`;
            } else if (timeMatch) {
                // Giữ nguyên định dạng giờ
                formattedDate = timeMatch[0];
            }
        }

        try {
            const response = await fetch(`http://127.0.0.1:3000/api/actionhistory?sortType=${sortType}&specificDate=${formattedDate}&pageSize=${recordsPerPage}&currentPage=${currentPage}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            console.log('Dữ liệu nhận được:', data);

            actionHistory = Array.isArray(data.rows) ? data.rows : [];
            currentPage = data.currentPage;
            
            displayRows();
            updatePagination({
                totalPages: data.totalPages,
                currentPage: data.currentPage
            });
        } catch (error) {
            console.error('Có lỗi xảy ra khi lấy dữ liệu:', error);
        }
    }

    function displayRows() {
        const tbody = document.querySelector('#actionHistoryTable tbody');
        tbody.innerHTML = '';

        if (actionHistory.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="4">Không có dữ liệu để hiển thị</td>`;
            tbody.appendChild(row);
            return;
        }

        for (let item of actionHistory) {
            const row = document.createElement('tr');
            const formattedTime = new Date(item.timestamp).toLocaleString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).replace(',', '');

            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.device}</td>
                <td>${item.status}</td>
                <td>${formattedTime}</td>
            `;
            tbody.appendChild(row);
        }
    }

    function updatePagination(data) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        const { totalPages } = data;

        const prevButton = document.createElement('button');
        prevButton.textContent = 'Trước';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchActionHistory();
            }
        });
        pagination.appendChild(prevButton);

        const pageIndicator = document.createElement('span');
        pageIndicator.textContent = `Trang ${currentPage} / ${totalPages || 0}`;
        pagination.appendChild(pageIndicator);

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Tiếp theo';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchActionHistory();
            }
        });
        pagination.appendChild(nextButton);
    }

    // Gọi hàm để lấy dữ liệu khi trang web được tải
    window.onload = fetchActionHistory;
});
