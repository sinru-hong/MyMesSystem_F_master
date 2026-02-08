const BACKEND_URL = "https://localhost:44326";

// #region 查詢
const btnQuery = document.getElementById('btnQuery');
if (btnQuery) {
    btnQuery.addEventListener('click', queryFiles);
}

async function queryFiles() {
    // 💡 取得畫面上輸入的查詢條件
    const createUser = document.getElementsByName('creator')[0].value;
    const createDate = document.getElementsByName('createTime')[0].value;

    try {
        const response = await fetch(`${BACKEND_URL}/api/MasterData/GetUploadFiles?creator=${createUser}&date=${createDate}`);
        if (!response.ok) throw new Error("網路回應不正確");

        const data = await response.json();
        const tbody = document.getElementById('dataTableBody');
        tbody.innerHTML = ''; // 清空舊內容

        data.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', item.id); // 💡 關鍵：存入資料庫 ID
            // 💡 這裡對應後端傳回的 JSON 屬性名稱 (通常首字母會變小寫)
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="downloadFile('${item.filePath}')">下載</button>
                </td>
                <td>${item.filePath}</td>
                <td>${item.remark || ''}</td>
                <td>${item.creator}</td>
                <td>${new Date(item.createTime).toLocaleString()}</td>
                <td>${item.lastModifier || ''}</td>
                <td>${item.lastModifyTime ? new Date(item.lastModifyTime).toLocaleString() : ''}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("查詢失敗:", err);
        alert("查詢發生錯誤，請查看控制台");
    }
}
// #endregion

// #region 下載檔案
function downloadFile(fileName) {
    const url = `${BACKEND_URL}/api/MasterData/DownloadFile?fileName=${encodeURIComponent(fileName)}`;

    // 建立一個看不見的 a 標籤
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName); // 提示瀏覽器下載
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // 💡 關鍵：下載觸發後立即移除，避免產生幽靈元素
    document.body.removeChild(link);
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
    const newRows = document.querySelectorAll('#dataTableBody tr.is-new');

    if (newRows.length === 0) {
        alert("目前沒有需要保存的新增行。");
        return;
    }

    // 禁用按鈕防止重複點擊
    const btnSave = this;
    btnSave.disabled = true;

    for (const row of newRows) {
        try {
            const formData = new FormData();
            const fileInput = row.querySelector('.row-file-input');
            const remark = row.querySelector('[name="newRemark"]').value;
            const filePathValue = row.querySelector('[name="newFilePath"]').value;
            const creator = row.querySelector('[name="newCreator"]').value;

            if (fileInput && fileInput.files.length > 0) {
                formData.append('file', fileInput.files[0]);
            }
            formData.append('remark', remark || "");
            formData.append('filePath', filePathValue || "");
            formData.append('creator', creator);

            const response = await fetch(`${BACKEND_URL}/api/MasterData/SaveMasterData`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                // 💡 保存成功後的 UI 處理
                row.classList.remove('is-new', 'table-warning');

                // 將輸入框內容轉為純文字，鎖定資料
                row.querySelectorAll('input').forEach(input => {
                    const val = input.value;
                    const cell = input.parentElement;
                    cell.innerText = val;
                });

                // 移除操作按鈕 (例如取消按鈕)
                const actionCell = row.cells[1];
                actionCell.innerHTML = '<span class="badge bg-success">已保存</span>';
            } else {
                const errorData = await response.json();
                alert(`保存失敗: ${errorData.message}`);
            }
        } catch (error) {
            console.error("保存出錯:", error);
        }
    }

    btnSave.disabled = false;
    alert("保存作業執行完畢！");
});
// #endregion

// #region 修改
let isEditMode = false;

document.getElementById('btnEdit').addEventListener('click', function () {
    const table = document.getElementById('dataTableBody'); // 💡 請確認 HTML 裡 table 的 ID

    if (!table) {
        console.error("錯誤：找不到 id='dataTableBody' 的表格元素，請檢查 HTML。");
        alert("系統錯誤：找不到表格元件。");
        return;
    }

    isEditMode = !isEditMode;

    if (isEditMode) {
        this.classList.replace('btn-info', 'btn-warning');
        this.innerHTML = '<i class="bi bi-x-circle"></i> 取消修改模式';
        table.classList.add('table-hover-edit');
        alert("修改模式已開啟，請直接點選下方表格中想修改的那一行。");
    } else {
        resetEditButton();
    }
});

// 💡 新增：監聽表格內部的點擊動作
document.getElementById('dataTableBody').addEventListener('click', function (e) {
    // 如果現在不是修改模式，直接結束不處理
    if (!isEditMode) return;

    // 找到被點擊的那個 <tr> (行)
    const row = e.target.closest('tr');

    // 如果沒點到行，或是該行已經在編輯中，或是那是剛新增還沒存檔的行，就不處理
    if (!row || row.classList.contains('editing') || row.classList.contains('is-new')) return;

    console.log("偵測到點擊行，進入編輯模式");
    enterRowEditMode(row);
});

// 💡 執行進入編輯模式的函數
function enterRowEditMode(row) {
    const existingEditingRow = document.querySelector('#dataTableBody tr.editing');
    if (existingEditingRow) {
        alert("請先完成或取消目前的修改。");
        return;
    }

    row.classList.add('editing', 'table-info');

    // 假設備註在第 4 欄 (Index 從 0 開始算，所以是 row.cells[3])
    // 請根據您實際的欄位順序調整索引值
    const remarkCell = row.cells[3];
    const originalRemark = remarkCell.innerText;

    // 將文字替換為輸入框
    remarkCell.innerHTML = `<input type="text" class="form-control form-control-sm" value="${originalRemark}">`;

    // 修改「操作」欄位的按鈕 (假設在第 2 欄，也就是 row.cells[1])
    const actionCell = row.cells[1];
    const originalActionHtml = actionCell.innerHTML; // 備份原本的「下載」按鈕

    actionCell.innerHTML = `
        <button class="btn btn-xs btn-success btn-save-row">保存</button>
        <button class="btn btn-xs btn-secondary btn-cancel-row">取消</button>
    `;

    // 綁定「取消」按鈕邏輯
    actionCell.querySelector('.btn-cancel-row').onclick = (e) => {
        e.stopPropagation(); // 防止再次觸發行點擊
        remarkCell.innerText = originalRemark;
        actionCell.innerHTML = originalActionHtml;
        row.classList.remove('editing', 'table-info');
    };

    // 綁定「保存」按鈕邏輯
    actionCell.querySelector('.btn-save-row').onclick = async (e) => {
        e.stopPropagation();
        const newRemark = remarkCell.querySelector('input').value;
        const id = row.getAttribute('data-id'); // ⚠️ 必須確保 queryFiles 有設定這個屬性
        const modifier = document.getElementsByName('creator')[0].value || "admin";

        await submitRowUpdate(id, newRemark, modifier, row, originalActionHtml);
    };
}

// 💡 執行更新 API 的函式
async function submitRowUpdate(id, remark, modifier, row, originalHtml) {
    const formData = new FormData();
    formData.append('id', id);
    formData.append('remark', remark || "");
    formData.append('modifier', modifier);

    try {
        console.log(`準備更新 ID: ${id}, 備註: ${remark}`);

        const response = await fetch(`${BACKEND_URL}/api/MasterData/UpdateMasterData`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            // const result = await response.json(); // 如果後端有回傳 JSON 才需要這行
            alert("修改成功！");

            // 1. 將輸入框變回純文字 (這部分保留，提供即時視覺回饋)
            row.cells[3].innerText = remark;

            // 2. 將按鈕變回原本的「下載」按鈕
            row.cells[1].innerHTML = originalHtml;

            // 3. 移除編輯狀態的樣式
            row.classList.remove('editing', 'table-info');

            // 💡 關鍵：自動觸發查詢，刷新整張表格的資料 (包含修改時間、修改人)
            console.log("正在重新整理資料清單...");
            queryFiles();
        } else {
            const errorData = await response.json();
            alert("修改失敗：" + (errorData.message || "伺服器錯誤"));
        }
    } catch (err) {
        console.error("連線錯誤:", err);
        alert("無法連線至伺服器，請檢查網路狀態。");
    }
}

function resetEditButton() {
    const btn = document.getElementById('btnEdit');
    const table = document.getElementById('dataTableBody');

    if (btn) {
        btn.classList.replace('btn-warning', 'btn-info');
        btn.innerHTML = '<i class="bi bi-pencil-square"></i> 修改';
    }

    if (table) {
        table.classList.remove('table-hover-edit');
    }
    isEditMode = false;
}
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
