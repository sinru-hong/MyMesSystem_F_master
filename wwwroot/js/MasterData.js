const BACKEND_URL = "https://localhost:44326";

// #region 查詢
const btnQuery = document.getElementById('btnQuery');
if (btnQuery) {
    btnQuery.addEventListener('click', queryFiles);
}

async function queryFiles() {
    const createUser = document.getElementsByName('creator')[0].value;
    const createDate = document.getElementsByName('createTime')[0].value;

    try {
        const response = await fetch(`${BACKEND_URL}/api/MasterData/GetUploadFiles?creator=${createUser}&date=${createDate}`);
        if (!response.ok) throw new Error("網路回應不正確");

        const data = await response.json();
        const tbody = document.getElementById('dataTableBody');
        tbody.innerHTML = '';

        data.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', item.id);
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick='downloadFile(${JSON.stringify(item.filePath)})'>下載</button>
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
function downloadFile(filePath) {
    const url = `${BACKEND_URL}/api/MasterData/DownloadFile?fileName=${encodeURIComponent(filePath)}`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filePath);
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
}
// #endregion

// #region 新增
document.getElementById('btnAdd').addEventListener('click', function () {
    const tbody = document.getElementById('dataTableBody');
    const newRow = document.createElement('tr');

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
                row.classList.remove('is-new', 'table-warning');

                row.querySelectorAll('input').forEach(input => {
                    const val = input.value;
                    const cell = input.parentElement;
                    cell.innerText = val;
                });

                const actionCell = row.cells[1];
                actionCell.innerHTML = '<span class="badge bg-success">已保存</span>';

                actionCell.querySelector('.btn-save-row').onclick = async (e) => {
                    e.stopPropagation();
                    const newRemark = remarkCell.querySelector('input').value;
                    const id = row.getAttribute('data-id');
                    const modifier = document.getElementsByName('creator')[0].value || "admin";

                    await submitRowUpdate(id, newRemark, modifier, row, originalActionHtml);
                };

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
    const table = document.getElementById('dataTableBody');

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

document.getElementById('dataTableBody').addEventListener('click', function (e) {
    if (!isEditMode) return;
    const row = e.target.closest('tr');
    if (!row || row.classList.contains('editing') || row.classList.contains('is-new')) return;
    console.log("偵測到點擊行，進入編輯模式");
    enterRowEditMode(row);
});
function enterRowEditMode(row) {
    const existingEditingRow = document.querySelector('#dataTableBody tr.editing');
    if (existingEditingRow) {
        alert("請先完成或取消目前的修改。");
        return;
    }

    row.classList.add('editing', 'table-info');

    const remarkCell = row.cells[3];
    const originalRemark = remarkCell.innerText;

    remarkCell.innerHTML = `<input type="text" class="form-control form-control-sm" value="${originalRemark}">`;

    const actionCell = row.cells[1];
    const originalActionHtml = actionCell.innerHTML; 

    actionCell.innerHTML = `
        <button class="btn btn-xs btn-success btn-save-row">保存</button>
        <button class="btn btn-xs btn-secondary btn-cancel-row">取消</button>
    `;

    actionCell.querySelector('.btn-cancel-row').onclick = (e) => {
        e.stopPropagation(); 
        remarkCell.innerText = originalRemark;
        actionCell.innerHTML = originalActionHtml;
        row.classList.remove('editing', 'table-info');
    };

    actionCell.querySelector('.btn-save-row').onclick = async (e) => {
        e.stopPropagation();
        const newRemark = remarkCell.querySelector('input').value;
        const id = row.getAttribute('data-id');
        const modifier = document.getElementsByName('creator')[0].value || "admin";

        await submitRowUpdate(id, newRemark, modifier, row, originalActionHtml);
    };
}

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
            alert("修改成功！");
            row.cells[3].innerText = remark;
            row.cells[1].innerHTML = originalHtml;
            row.classList.remove('editing', 'table-info');
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

// #region 刪除
let isDeleteMode = false;

document.getElementById('btnDelete').addEventListener('click', function () {
    isDeleteMode = !isDeleteMode;
    const table = document.getElementById('dataTableBody');

    if (isDeleteMode) {
        // 切換按鈕狀態
        this.classList.replace('btn-info', 'btn-danger');
        this.innerHTML = '<i class="bi bi-x-circle"></i> 取消刪除模式';
        table.classList.add('table-hover-delete'); 
        alert("刪除模式已開啟，請點選您想刪除的資料行。");
    } else {
        resetDeleteButton();
    }
});

document.getElementById('dataTableBody').addEventListener('click', async function (e) {
    if (!isDeleteMode) return;

    const row = e.target.closest('tr');
    if (!row || row.classList.contains('is-new')) return;

    const id = row.getAttribute('data-id');
    const fileName = row.cells[2].innerText; // 假設檔案名稱在第 3 欄

    if (confirm(`確定要刪除檔案 [${fileName}] 嗎？\n(此操作為軟刪除，資料將保留在資料庫中)`)) {
        await executeDelete(id, row);
    }
});

async function executeDelete(id, row) {
    const modifier = document.getElementsByName('creator')[0].value || "admin";
    const formData = new FormData();
    formData.append('id', id);
    formData.append('modifier', modifier);

    try {
        const response = await fetch(`${BACKEND_URL}/api/MasterData/DeleteMasterData`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            alert("刪除成功！");
            queryFiles(); 
        } else {
            alert("刪除失敗");
        }
    } catch (err) {
        console.error("連線錯誤:", err);
    } finally {
        resetDeleteButton();
    }
}

function resetDeleteButton() {
    const btn = document.getElementById('btnDelete');
    btn.classList.replace('btn-danger', 'btn-info');
    btn.innerHTML = '<i class="bi bi-trash"></i> 刪除';
    document.getElementById('dataTableBody').classList.remove('table-hover-delete');
    isDeleteMode = false;
}
// #endregion

// #region 導出
document.getElementById('btnExport').addEventListener('click', function () {
    const createUser = document.getElementsByName('creator')[0].value;
    const createDate = document.getElementsByName('createTime')[0].value;
    console.log("正在準備匯出資料...");
    const url = `${BACKEND_URL}/api/MasterData/ExportToExcel?creator=${encodeURIComponent(createUser)}&date=${encodeURIComponent(createDate)}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ExportData.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
// #endregion

// #region 導入
document.getElementById('btnImport').addEventListener('click', function () {
    const currentEmplno = currentLoginUser;

    if (!currentEmplno) {
        alert("無法取得操作人員資訊，請重新登入。");
        return;
    }
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx, .xls';

    fileInput.onchange = async e => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('creator', currentEmplno); 

        try {
            console.log(`人員 ${currentEmplno} 正在導入檔案...`);

            const response = await fetch(`${BACKEND_URL}/api/MasterData/ImportExcel`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                alert(`導入成功！${result.message}`);
                queryFiles(); 
            } else {
                alert(`導入失敗：${result.message}`);
            }
        } catch (err) {
            console.error("導入錯誤:", err);
            alert("系統連線異常，請稍後再試。");
        }
    };

    fileInput.click();
});
// #endregion

// #region 刷新
const btnRefresh = document.getElementById('btnRefresh');
const loadingOverlay = document.getElementById('loadingOverlay');

if (btnRefresh) {
    btnRefresh.addEventListener('click', function () {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        setTimeout(() => {
            location.reload();
        }, 100);
    });
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
            console.log("後端回應：", data);

            const tbody = document.getElementById('userModalTableBody');
            if (!tbody) return;
            tbody.innerHTML = '';
            if (!Array.isArray(data)) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="3">${data.message || '格式非陣列'}</td>`;
                tbody.appendChild(tr);
                return;
            }

            data.forEach((item, index) => {
                const tr = document.createElement('tr');
                tr.style.cursor = "pointer"; 

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

function selectUser(EmplNo) {
    document.getElementById('inputCreator').value = EmplNo;

    const modalElement = document.getElementById('userSelectModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();
}
//#endregion

//日期元件
document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#inputCreateTime", {
        locale: "zh_tw",
        dateFormat: "Y-m-d",
        allowInput: false, 
    });

    const userModal = document.getElementById('userSelectModal');
    userModal.addEventListener('show.bs.modal', function () {
        fetchUserData(); 
    });

    document.getElementById('modalSearchUser').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') fetchUserData();
    });
});
