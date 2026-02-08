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

// #region 新增
document.getElementById('btnAdd').addEventListener('click', function () {
    const tbody = document.getElementById('dataTableBody');
    const newRow = document.createElement('tr');

    // 💡 關鍵：加上 'is-new' class 方便保存按鈕搜尋
    newRow.className = 'table-warning is-new';

    const nextIndex = tbody.rows.length + 1;

    newRow.innerHTML = `
        <td>${nextIndex}</td>
        <td>
            <button class="btn btn-sm btn-info text-white upload-btn">上傳</button>
            <button class="btn btn-sm btn-danger cancel-new-row">取消</button>
            <input type="file" class="d-none row-file-input">
        </td>
        <td><input type="text" class="form-control form-control-sm" name="newFilePath" placeholder="請上傳檔案..."></td>
        <td><input type="text" class="form-control form-control-sm" name="newRemark"></td>
        <td>
            <input type="text" class="form-control form-control-sm bg-light"
                   name="newCreator" value="${currentLoginUser}" readonly>
        </td>
        <td><input type="text" class="form-control form-control-sm" name="newCreateTime" value="${document.getElementById('inputCreateTime').value}" readonly></td>
        <td>-</td>
        <td>-</td>
    `;

    tbody.insertBefore(newRow, tbody.firstChild);

    // 綁定上傳與取消按鈕邏輯 (保持不變)
    const fileInput = newRow.querySelector('.row-file-input');
    const pathInput = newRow.querySelector('[name="newFilePath"]');
    newRow.querySelector('.upload-btn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) pathInput.value = e.target.files[0].name;
    });
    newRow.querySelector('.cancel-new-row').addEventListener('click', () => newRow.remove());
});
// #endregion

// #region 保存
document.getElementById('btnSave').addEventListener('click', async function () {
    // 1. 抓取所有標記為新增的行 (你在 btnAdd 邏輯中應該有加上這個 class)
    const newRows = document.querySelectorAll('#dataTableBody tr.is-new');

    if (newRows.length === 0) {
        alert("目前沒有需要保存的新增行。");
        return;
    }

    // 2. 遍歷每一行進行保存
    for (const row of newRows) {
        try {
            const formData = new FormData();
            const fileInput = row.querySelector('.row-file-input');
            const remark = row.querySelector('[name="newRemark"]').value;
            const filePathValue = row.querySelector('[name="newFilePath"]').value;
            const creator = row.querySelector('[name="newCreator"]').value;
            // 💡 檢查是否有檔案，並將資料放入 FormData
            if (fileInput && fileInput.files.length > 0) {
                formData.append('file', fileInput.files[0]);
            }
            formData.append('remark', remark || "");
            formData.append('filePath', filePathValue || "");
            formData.append('creator', creator);

            // 3. 呼叫後端 API
            const response = await fetch(`${BACKEND_URL}/api/MasterData/SaveMasterData`, {
                method: 'POST',
                body: formData
            });

            // 4. 解析回應
            if (response.ok) {
                const result = await response.json();
                console.log("保存成功：", result.message);

                // 💡 成功後移除黃色背景與新增標記，使其看起來像正式資料
                row.classList.remove('is-new', 'table-warning');

                // 將 input 轉為純文字 (選用，或是直接 reload)
                row.querySelector('[name="newRemark"]').parentElement.innerText = remark;
            } else {
                const errorData = await response.json();
                alert(`保存失敗: ${errorData.message}`);
            }

        } catch (error) {
            console.error("處理該行時發生連線錯誤:", error);
            alert("伺服器連線失敗，請檢查網路或後端狀態。");
        }
    }

    alert("保存作業執行完畢！");
});
// #endregion

//#region 人員視窗查詢
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
//#endregion

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
