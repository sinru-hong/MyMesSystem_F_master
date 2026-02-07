const BACKEND_URL = "https://localhost:44326";

// #region 查詢
const btnQuery = document.getElementById('btnQuery');
if (btnQuery) {
    btnQuery.addEventListener('click', queryFiles);
}

function queryFiles() {
    const createUser = document.getElementsByName('creator')[0].value;
    const createDate = document.getElementsByName('createTime')[0].value;

    alert("已點擊查詢");

    // 呼叫後端 API
    //fetch(`/Project/GetFileLogs?user=${createUser}&date=${createDate}`)
    //    .then(response => response.json())
    //    .then(data => {
    //        const tbody = document.getElementById('dataTableBody');
    //        tbody.innerHTML = ''; // 清空舊內容 

    //        data.forEach((item, index) => {
    //            const tr = document.createElement('tr');
    //            tr.innerHTML = `
    //                <td>${index + 1}</td>
    //                <td><button class="btn btn-sm btn-outline-primary">下載</button></td>
    //                <td>${item.FilePath}</td>
    //                <td>${item.Remark || ''}</td>
    //                <td>${item.CreateUser}</td>
    //                <td>${item.CreateDate}</td>
    //                <td>${item.UpdateUser || ''}</td>
    //                <td>${item.UpdateDate || ''}</td>
    //            `;
    //            tbody.appendChild(tr);
    //        });
    //    })
    //    .catch(err => console.error("查詢失敗:", err));
}
// #endregion

function fetchUserData() {
    const searchInput = document.getElementById('modalSearchUser');
    const userKeyword = searchInput ? searchInput.value : "";
    const url = `${BACKEND_URL}/api/MasterData/GetUsers?userKeyword=${encodeURIComponent(userKeyword)}`;
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error("API 路徑錯誤或伺服器無回應：" + response.status);
            return response.json();
        })
        .then(data => {
            // 如果後端回傳的是物件 { message: "..." }
            console.log("後端回應：", data);

            const tbody = document.getElementById('userModalTableBody');
            if (!tbody) return;
            tbody.innerHTML = '';

            // 判斷 data 是不是陣列 (如果是連線成功的訊息物件就印出訊息)
            if (!Array.isArray(data)) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="3">${data.message || '格式非陣列'}</td>`;
                tbody.appendChild(tr);
                return;
            }

            data.forEach((item, index) => {
                const tr = document.createElement('tr');
                tr.style.cursor = "pointer"; // 讓滑鼠移上去顯示手型

                // 💡 點擊事件：選擇使用者
                tr.onclick = function () {
                    selectUser(item.EmplNo, item.EmplNo);
                };

                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${item.EmplNo || ''}</td>
                    <td>${item.Username || ''}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error("連線失敗：", err));
}
// 當 Modal 顯示時，可以預載一些資料 (測試用)
document.getElementById('userSelectModal').addEventListener('show.bs.modal', function () {
    // 模擬資料
    //const tbody = document.getElementById('userModalTableBody');
    //const users = [
    //    { id: 'A001', name: '張三'},
    //    { id: 'A002', name: '李四'}
    //];

    //tbody.innerHTML = users.map((u, index) => `
    //    <tr style="cursor:pointer" onclick="selectUser('${u.name}')">
    //        <td>${index + 1}</td>
    //        <td>${u.id}</td>
    //        <td>${u.name}</td>
    //    </tr>
    //`).join('');
    fetchUserData();
});

// 選取人員並填回輸入框
function selectUser(EmplNo) {
    document.getElementById('inputCreator').value = EmplNo;

    // 關閉視窗 (使用 Bootstrap 的方法)
    const modalElement = document.getElementById('userSelectModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();
}

//日期元件
document.addEventListener('DOMContentLoaded', function () {
    // 1. 初始化日期元件 (白底黑字樣式)
    flatpickr("#inputCreateTime", {
        locale: "zh_tw",
        dateFormat: "Y-m-d",
        allowInput: false, // 禁止手動輸入
        // 預設就是白底，若需要更黑的字體可透過 CSS 調整
    });

    // 2. 監聽 Modal 顯示時自動載入初始資料 (可選)
    const userModal = document.getElementById('userSelectModal');
    userModal.addEventListener('show.bs.modal', function () {
        fetchUserData(); // 預設查出全部或前幾筆
    });

    // 3. 監聽搜尋框 Enter 鍵
    document.getElementById('modalSearchUser').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') fetchUserData();
    });
});
