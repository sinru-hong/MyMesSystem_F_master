const BACKEND_URL = "https://localhost:44326";

// #region 1. 查詢邏輯：對接新輸入框
const btnQuery = document.getElementById('btnQuery');
if (btnQuery) {
    btnQuery.addEventListener('click', queryFiles);
}

async function queryFiles() {
    // 對接 form-control-ios 的值 [cite: 120, 121]
    const createUser = document.getElementById('inputCreator').value;
    const createDate = document.getElementById('inputCreateTime').value;

    try {
        const response = await fetch(`${BACKEND_URL}/api/MasterData/GetUploadFiles?creator=${createUser}&date=${createDate}`);
        if (!response.ok) throw new Error("網路回應不正確");

        const data = await response.json();
        const tbody = document.getElementById('dataTableBody');
        tbody.innerHTML = '';

        data.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', item.id);

            // 在 queryFiles 函式內部的 tr.innerHTML 修改如下
            tr.innerHTML = `
    <td class="ps-4 text-muted">${index + 1}</td>
    <td title="${item.filePath}" class="fw-medium">${item.filePath}</td> 
    <td>${item.remark || ""}</td> 
    <td><span class="badge bg-light text-dark border px-3 rounded-pill">${item.creator}</span></td>
    <td class="text-secondary small">${new Date(item.createTime).toLocaleString('zh-TW', { hour12: false })}</td>
    <td class="pe-4 text-center">
        <div class="d-flex justify-content-center gap-1">
            <button class="btn btn-sm btn-white-pill rounded-circle p-2" onclick="downloadFile(this)" data-bs-toggle="tooltip" data-bs-placement="bottom" title="下載檔案">
                <i class="bi bi-download"></i>
            </button>
            <button class="btn btn-sm btn-white-pill rounded-circle p-2 text-danger" onclick="deleteItem('${item.id}')" data-bs-toggle="tooltip" data-bs-placement="bottom" title="刪除項目">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    </td>
`;
            tbody.appendChild(tr);

            // [關鍵]：利用 setTimeout 達成依序展開的效果
            setTimeout(() => {
                tr.classList.add('reveal');
            }, index * 50); // 每行間隔 50 毫秒
        });

        reinitTooltips();
    } catch (err) {
        console.error("查詢失敗:", err);
    }
}

function reinitTooltips() {
    // 先銷毀舊的 Tooltip 實例防止記憶體洩漏 (選配)
    var existingTooltips = document.querySelectorAll('.tooltip');
    existingTooltips.forEach(t => t.remove());

    // 重新初始化
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            delay: { "show": 0, "hide": 0 } // 確保與按鈕變色同步
        });
    });
}
// #endregion

// #region 2. 新增邏輯：優化保存按鈕位置與樣式
document.getElementById('btnAdd').addEventListener('click', function () {
    const tbody = document.getElementById('dataTableBody');
    const newRow = document.createElement('tr');
    newRow.className = 'is-new reveal'; // 觸發滑入動畫

    newRow.innerHTML = `
        <td class="ps-4 text-muted">-</td>
        <td>
            <div class="d-flex align-items-center gap-2 btn-container">
                <input type="text" class="form-control-ios flex-grow-1" 
                       name="newFilePath" placeholder="選擇檔案..." 
                       readonly style="max-width: 250px; background-color: #f2f2f7;">
                <button class="btn btn-white-pill px-4 upload-btn fw-bold shadow-sm" type="button">選擇</button>
            </div>
            <input type="file" class="d-none row-file-input">
        </td>
        <td>
            <input type="text" class="form-control-ios" name="newRemark" placeholder="請輸入備註...">
        </td>
        <td><span class="badge bg-light text-dark border px-3 rounded-pill">${currentLoginUser}</span></td>
        <td class="text-secondary small">${new Date().toLocaleDateString()}</td>
        <td class="pe-4 text-center">
            <div class="d-flex justify-content-center gap-1 action-container">
                <button class="btn btn-sm btn-white-pill shadow-sm px-3 cancel-new-row">
                    <i class="bi bi-x-lg me-1"></i>取消
                </button>
            </div>
        </td>
    `;

    tbody.insertBefore(newRow, tbody.firstChild);

    const fileInput = newRow.querySelector('.row-file-input');
    const pathInput = newRow.querySelector('[name="newFilePath"]');
    const uploadBtn = newRow.querySelector('.upload-btn');
    const remarkInput = newRow.querySelector('[name="newRemark"]');
    const actionContainer = newRow.querySelector('.action-container');

    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            pathInput.value = e.target.files[0].name;
            pathInput.style.backgroundColor = "#ffffff";

            // 檢查是否已有保存按鈕，若無則建立與「修改邏輯」一致的小勾按鈕
            if (!newRow.querySelector('.save-btn')) {
                const saveBtn = document.createElement('button');
                // 套用妳要求的圓形小勾樣式
                saveBtn.className = 'btn btn-sm btn-white-pill rounded-circle p-2 save-btn reveal-btn shadow-sm';
                saveBtn.innerHTML = '<i class="bi bi-check-lg text-dark"></i>';
                saveBtn.title = '點擊保存';

                saveBtn.addEventListener('click', async () => {
                    const file = fileInput.files[0];
                    if (!file) {
                        alert("請先選擇檔案！");
                        return;
                    }

                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("creator", currentLoginUser);
                    formData.append("remark", remarkInput.value); // 修正：取 .value 內容
                    formData.append("filePath", file.name);

                    try {
                        const loader = document.getElementById('loadingOverlay');
                        if (loader) loader.style.display = 'flex';

                        const response = await fetch(`${BACKEND_URL}/api/MasterData/SaveMasterData`, {
                            method: 'POST',
                            body: formData
                        });

                        const result = await response.json();

                        if (response.ok && (result.success || result.Success)) {
                            alert("✨ " + (result.message || "儲存成功"));
                            newRow.remove();
                            if (typeof queryFiles === "function") queryFiles();
                        } else {
                            alert("❌ " + (result.message || "儲存失敗"));
                        }
                    } catch (error) {
                        console.error("API 請求發生錯誤:", error);
                        alert("系統連線異常，請檢查網路。");
                    } finally {
                        const loader = document.getElementById('loadingOverlay');
                        if (loader) loader.style.display = 'none';
                    }
                });

                // 將小勾保存按鈕插入到「取消」按鈕前面
                actionContainer.insertBefore(saveBtn, actionContainer.firstChild);
            }
        }
    });

    newRow.querySelector('.cancel-new-row').addEventListener('click', () => {
        newRow.style.opacity = '0';
        newRow.style.transform = 'translateY(-20px)';
        setTimeout(() => newRow.remove(), 300);
    });
});
// #endregion

// #region 3. 修改模式：偵測變更並動態顯示保存按鈕
let isEditMode = false;

document.getElementById('btnEdit').addEventListener('click', function () {
    isEditMode = !isEditMode;
    const rows = document.querySelectorAll('#dataTableBody tr');

    if (isEditMode) {
        this.innerHTML = '<i class="bi bi-x-circle me-2"></i>取消修改'; // 改為取消，強調狀態
        this.classList.add('active-edit');

        rows.forEach(tr => {
            const remarkCell = tr.children[2]; // 備註欄位
            const originalRemark = remarkCell.innerText.trim();
            const actionCell = tr.children[4]; // 操作欄位 (索引 4)

            // 1. 插入輸入框，並紀錄原始值
             remarkCell.innerHTML = `
                <input type="text" class="form-control-ios edit-input"
                       value="${originalRemark}"
                       data-old-value="${originalRemark}"
                       oninput="debouncedInputChange(this)">
            `;
        });
    } else {
        resetEditButton();
        queryFiles(); // 取消時刷新回復原始狀態
    }
});
function resetEditButton() {
    const btn = document.getElementById('btnEdit');
    // 恢復為原本的「白底黑字」樣式與「修改」字樣
    btn.innerHTML = '<i class="bi bi-pencil-square me-2"></i>修改';
    btn.classList.remove('active-edit');

    // 移除表格可能存在的編輯模式特定類別（如陰影效果）
    const table = document.getElementById('dataTableBody');
    if (table) table.classList.remove('table-hover-edit');

    isEditMode = false;
}
// 1. 定義防抖工具函式
function debounce(func, delay = 500) {
    let timer;
    return function (...args) {
        clearTimeout(timer); // 每次觸發就清除上一個定時器
        timer = setTimeout(() => {
            func.apply(this, args); // 延遲時間到才執行
        }, delay);
    };
}

// 2. 將原本的邏輯包裝起來
const debouncedInputChange = debounce(function (input) {
    const tr = input.closest('tr');
    const actionCell = tr.querySelector('.text-center .d-flex');
    const oldValue = input.dataset.oldValue;
    const newValue = input.value.trim();
    const saveBtnId = `save_${tr.dataset.id}`;

    if (newValue !== oldValue) {
        if (!document.getElementById(saveBtnId)) {
            const saveBtn = document.createElement('button');
            saveBtn.id = saveBtnId;
            saveBtn.className = 'btn btn-sm btn-white-pill rounded-circle p-2 reveal-btn shadow-sm';
            saveBtn.innerHTML = '<i class="bi bi-check-lg text-dark"></i>';
            saveBtn.title = '點擊保存';
            saveBtn.onclick = () => updateItem(tr.dataset.id, newValue);

            actionCell.insertBefore(saveBtn, actionCell.firstChild);
        }
    } else {
        const existingBtn = document.getElementById(saveBtnId);
        if (existingBtn) existingBtn.remove();
    }
}, 500);

async function updateItem(id, newRemark) {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("remark", newRemark);
    formData.append("modifier", currentLoginUser);

    try {
        // 顯示 Loading
        const loader = document.getElementById('loadingOverlay');
        if (loader) loader.style.display = 'flex';

        const response = await fetch(`${BACKEND_URL}/api/MasterData/UpdateMasterData`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert("✨ " + (result.message || result.Message || "修改成功"));

            // 1. 先執行重新查詢，更新資料庫最新的「修改人」與「修改時間」
            if (typeof queryFiles === "function") {
                await queryFiles();
            }

            // 2. 核心微調：直接呼叫重設函式，將按鈕文字與狀態恢復原狀
            resetEditButton();

            // 3. 確保編輯模式旗標已關閉，防止邏輯衝突
            isEditMode = false;
        } else {
            alert("❌ 修改失敗：" + (result.message || "發生錯誤"));
        }
    } catch (error) {
        console.error("更新請求錯誤:", error);
        alert("系統連線異常");
    } finally {
        const loader = document.getElementById('loadingOverlay');
        if (loader) loader.style.display = 'none';
    }
}
// #endregion

// #region 4. 刷新邏輯：過場動畫 
const btnRefresh = document.getElementById('btnRefresh');
if (btnRefresh) {
    btnRefresh.addEventListener('click', function () {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'flex';
        setTimeout(() => location.reload(), 300);
    });
}
// #endregion

// #region 5. 人員選單：優化查詢體驗 [cite: 197, 207]
// #region 5. 人員選單：優化動態展示體驗
function fetchUserData() {
    const searchInput = document.getElementById('modalSearchUser');
    const userKeyword = searchInput ? searchInput.value : "";
    const tbody = document.getElementById('userModalTableBody');

    // 清空並顯示搜尋中狀態
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">搜尋中...</td></tr>';

    fetch(`${BACKEND_URL}/api/MasterData/GetUsers?userKeyword=${encodeURIComponent(userKeyword)}`)
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = '';

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">查無人員資料</td></tr>';
                return;
            }

            data.forEach((item, index) => {
                const tr = document.createElement('tr');
                tr.className = 'cursor-pointer'; // 初始狀態會繼承 CSS 中的 #dataTableBody tr 設定 [cite: 54]

                // 設定 ID 與內容 [cite: 28, 37]
                tr.setAttribute('data-id', item.EmplNo);
                tr.onclick = () => selectUser(item.EmplNo);

                tr.innerHTML = `
        <td class="ps-4">${index + 1}</td>
        <td class="fw-bold">${item.EmplNo}</td>
        <td class="pe-4">${item.Username}</td>
    `;

                tbody.appendChild(tr);

                // 使用妳提議的邏輯：統一透過 CSS Class 觸發動畫
                setTimeout(() => {
                    tr.classList.add('reveal');
                }, index * 50); // 每行間隔 50 毫秒 [cite: 32]
            });
        })
        .catch(err => {
            console.error("人員查詢失敗:", err);
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-4">系統錯誤，請稍後再試</td></tr>';
        });
}
// #endregion

function selectUser(EmplNo) {
    document.getElementById('inputCreator').value = EmplNo;
    const modal = bootstrap.Modal.getInstance(document.getElementById('userSelectModal'));
    modal.hide();
}
// #endregion

// 刪除按鈕邏輯
async function deleteItem(id) {
    // 1. 使用原生確認視窗 (後續可美化為 iOS Modal)
    if (!confirm("確定要刪除這筆資料嗎？此操作無法復原。")) return;

    // 2. 封裝 FormData 對接後端 [FromForm] 參數
    const formData = new FormData();
    formData.append("id", id);
    formData.append("modifier", currentLoginUser); // [cite: 111, 112]

    try {
        // 顯示載入遮罩
        const loader = document.getElementById('loadingOverlay');
        if (loader) loader.style.display = 'flex';

        const response = await fetch(`${BACKEND_URL}/api/MasterData/DeleteMasterData`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            alert("✅ " + result.message);

            // 3. 執行「縮小消失」動畫
            const tr = document.querySelector(`tr[data-id="${id}"]`);
            if (tr) {
                tr.style.opacity = '0';
                tr.style.transform = 'scale(0.9)'; // 輕微縮小效果
                tr.style.transition = 'all 0.3s ease';

                // 等待動畫結束後移除 DOM 並重新排序或查詢
                setTimeout(() => {
                    tr.remove();
                    queryFiles(); // 重新整理列表確保序號正確
                }, 300);
            }
        } else {
            alert("❌ 刪除失敗：" + result.message);
        }
    } catch (error) {
        console.error("刪除 API 請求錯誤:", error);
        alert("系統連線異常，請稍後再試。");
    } finally {
        const loader = document.getElementById('loadingOverlay');
        if (loader) loader.style.display = 'none';
    }
}

// 下載檔案邏輯
// 修改後的下載函式
async function downloadFile(btnElement) {
    // 1. 從按鈕往上找到該行 tr
    const tr = btnElement.closest('tr');
    if (!tr) return;

    // 2. 抓取該行第二個單元格 (td) 的文字內容
    // 這樣可以確保抓到的是 \localhost... 完整的路徑，且不會有轉義字元問題
    const filePath = tr.children[1].innerText.trim();

    if (!filePath) {
        alert("找不到檔案路徑內容");
        return;
    }

    try {
        // 顯示載入遮罩 [cite: 31, 71]
        const loader = document.getElementById('loadingOverlay');
        if (loader) loader.style.display = 'flex';

        // 3. 對接後端 API [cite: 26, 27]
        // 務必使用 encodeURIComponent，因為路徑含特殊符號
        const url = `${BACKEND_URL}/api/MasterData/DownloadFile?fileName=${encodeURIComponent(filePath)}`;

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "檔案下載失敗");
        }

        // 4. 處理檔案串流下載
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;

        // 從路徑擷取檔名 
        const fileName = filePath.split('\\').pop().split('/').pop();
        a.download = fileName;

        document.body.appendChild(a);
        a.click();

        // 5. 資源回收
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);

    } catch (err) {
        console.error("下載發生錯誤:", err);
        alert("❌ 下載失敗：" + err.message);
    } finally {
        const loader = document.getElementById('loadingOverlay');
        if (loader) loader.style.display = 'none';
    }
}

// #region 6. 匯入與匯出邏輯
document.addEventListener('DOMContentLoaded', function () {
    const btnExport = document.getElementById('btnExport');
    const btnImport = document.getElementById('btnImport');

    if (btnExport) btnExport.addEventListener('click', exportToExcel);
    if (btnImport) btnImport.addEventListener('click', triggerImport);
});

// --- 匯出功能 ---
async function exportToExcel() {
    // 獲取當前查詢條件，確保匯出的資料與畫面一致 
    const creator = document.getElementById('inputCreator').value;
    const dateRange = document.getElementById('inputCreateTime').value;

    try {
        showLoader(true);
        // 對接後端 Get 請求 [cite: 3]
        const url = `${BACKEND_URL}/api/MasterData/ExportToExcel?creator=${encodeURIComponent(creator)}&date=${encodeURIComponent(dateRange)}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error("匯出失敗");

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `MasterData_Export_${new Date().getTime()}.xlsx`; // 設定預設檔名
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();
    } catch (err) {
        alert("❌ 匯出 Excel 發生錯誤: " + err.message);
    } finally {
        showLoader(false);
    }
}

// --- 匯入功能 ---
function triggerImport() {
    // 建立一個隱藏的 file input，保持介面美觀
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx, .xls';

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("creator", currentLoginUser); // 對接後端 [FromForm] creator [cite: 42]

        try {
            showLoader(true);
            const response = await fetch(`${BACKEND_URL}/api/MasterData/ImportExcel`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (response.ok) {
                alert(`✨ 匯入成功！共匯入 ${result.count || 0} 筆資料。`);
                if (typeof queryFiles === "function") queryFiles(); // 刷新列表 
            } else {
                alert("❌ 匯入失敗：" + result.message);
            }
        } catch (err) {
            alert("❌ 系統錯誤：" + err.message);
        } finally {
            showLoader(false);
        }
    };
    fileInput.click();
}

// 輔助函式：控制載入遮罩
function showLoader(show) {
    const loader = document.getElementById('loadingOverlay');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}
// #endregion

// 初始化日期元件
document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#inputCreateTime", {
        mode: "range",               // 範疇模式
        dateFormat: "Y/m/d",         // 顯示格式
        locale: "zh_tw",             // 繁體中文
        showMonths: 1,
        disableMobile: true,         // 禁止在手機上啟動原生 UI，保持視覺一致
        // 自定義左右箭頭，對接妳使用的 Bootstrap Icons
        prevArrow: '<i class="bi bi-chevron-left"></i>',
        nextArrow: '<i class="bi bi-chevron-right"></i>',
        // 當日期改變時，妳可以選擇是否自動執行一次查詢
        onChange: function (selectedDates, dateStr) {
            console.log("選取的日期範圍:", dateStr);
        },
        onOpen: function (selectedDates, dateStr, instance) {
            instance.calendarContainer.classList.add("dark-theme-calendar");
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    // 取得所有帶有 data-bs-toggle="tooltip" 的元素
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            // 這裡可以設定延遲顯示時間（毫秒），0 代表同步顯示
            delay: { "show": 0, "hide": 0 }
        })
    })
});