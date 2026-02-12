const BACKEND_URL = "https://localhost:44326";

document.addEventListener('DOMContentLoaded', function () {
    const btnSend = document.getElementById('btnSendApi');
    const reqTextArea = document.getElementById('requestJson');
    const resPre = document.getElementById('responseJson');
    const statusBadge = document.getElementById('resStatus');
    const loading = document.getElementById('loadingOverlay');

    if (btnSend) {
        btnSend.addEventListener('click', async function () {
            const method = document.getElementById('httpMethod').value;
            const url = document.getElementById('apiUrl').value;
            const rawJson = reqTextArea.value;

            if (loading) loading.style.display = 'flex';

            try {
                const options = {
                    method: method,
                    headers: { 'Content-Type': 'application/json' }
                };

                if (method !== 'GET') {
                    options.body = rawJson;
                }

                if (url) {
                    const response = await fetch(url, options);

                    // 1. 先用 text() 讀取原始內容，避免 json() 解析失敗導致程式中斷
                    const responseText = await response.text();

                    let result;
                    try {
                        // 2. 嘗試解析成 JSON 物件
                        result = JSON.parse(responseText);
                    } catch (e) {
                        // 3. 如果後端噴出 HTML (就是你看到的那個錯誤網頁)，則手動包裝成 JSON 格式顯示
                        result = {
                            success: false,
                            message: "伺服器回傳格式非 JSON",
                            rawResponse: responseText.substring(0, 200) + "..." // 避免過長的 HTML 撐爆畫面
                        };
                    }

                    // 🛠️ 1. 確保回傳區塊顯示完整的 JSON 內容 (包含你想要的 success, message, errorDetails)
                    resPre.textContent = JSON.stringify(result, null, 2);

                    // 🛠️ 2. 強制設定回傳文字為白色
                    resPre.style.setProperty('color', '#ffffff', 'important');

                    if (statusBadge) {
                        statusBadge.style.display = 'inline';

                        // 🛠️ 3. 優先取後端回傳的 message，若無則顯示 HTTP 狀態字串
                        const displayMsg = result.message || (response.status === 400 ? "Bad Request" : response.statusText);
                        statusBadge.innerText = `Status: ${result.statusCode||400} ${displayMsg}`;

                        // 4. 判斷邏輯：同時檢查 HTTP 狀態碼與 JSON 內的 success 標記
                        if (result.success !== false) {
                            statusBadge.className = "badge bg-success rounded-pill px-3 shadow-sm";
                            resPre.style.borderLeft = "5px solid #198754";
                        } else {
                            statusBadge.className = "badge bg-warning text-dark rounded-pill px-3 shadow-sm animate__animated animate__shakeX";
                            resPre.style.borderLeft = "5px solid #ffc107";
                        }
                    }
                }
            } catch (error) {
                resPre.textContent = "發送失敗: " + error.message;
            } finally {
                if (loading) loading.style.display = 'none';
            }
        });
    }
});

function loadSample(isCorrect) {
    const method = document.getElementById('httpMethod').value;
    const urlInput = document.getElementById('apiUrl');
    const area = document.getElementById('requestJson');

    if (method === 'GET') {
        // 🔹 GET 模式範本
        if (isCorrect) {
            urlInput.value = `${BACKEND_URL}/api/ProjectsApi/ProcessGetDemo?message=HelloWorld`;
        } else {
            urlInput.value = `${BACKEND_URL}/api/ProjectsApi/ProcessGetDemo?message=`;
        }
        area.value = "// GET 參數已更新至上方 URL 欄位";
    } else {
        // 🔹 POST 模式範本
        urlInput.value = `${BACKEND_URL}/api/ProjectsApi/ProcessApiDemo`;
        if (isCorrect) {
            area.value = JSON.stringify({ "EquipmentCode": "CNC-001", "Qcqty": 10 }, null, 2);
        } else {
            area.value = JSON.stringify({ "EquipmentCode": "", "Qcqty": 0 }, null, 2);
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const urlInput = document.getElementById('apiUrl');
    const sampleBtns = document.getElementById('sampleBtnGroup');
    const requestArea = document.getElementById('requestJson'); // Request 區塊
    const responseArea = document.getElementById('responseJson'); // Response 區塊

    if (urlInput && sampleBtns) {
        urlInput.addEventListener('input', function () {
            // 1. 隱藏範本按鈕
            if (!sampleBtns.classList.contains('d-none')) {
                sampleBtns.classList.add('animate__animated', 'animate__fadeOut');

                setTimeout(() => {
                    sampleBtns.classList.add('d-none');
                    sampleBtns.classList.remove('animate__fadeOut');
                }, 500);
            }

            // 2. 🛠️ 核心邏輯：清空 JSON 輸入與回傳文字，確保資料不衝突
            if (requestArea) requestArea.value = '';
            if (responseArea) {
                responseArea.innerText = '// 進入手動編輯模式，待命測試中...';
                // 重置文字顏色為預設灰，取消之前的螢光綠或警告紅
                responseArea.style.setProperty('color', '#8e8e93', 'important');
            }
        });
    }
});

// 快速切換 API 配置
/**
 * 快速切換 API 演示內容
 * @param {string} method - HTTP 方法 (POST/GET)
 * @param {string} url - API 完整路徑
 */
function switchApi(method, url) {
    const methodSelect = document.getElementById('httpMethod');
    const urlInput = document.getElementById('apiUrl');
    const sampleBtns = document.getElementById('sampleBtnGroup');
    const requestArea = document.getElementById('requestJson'); // 取得 JSON 欄位

    if (methodSelect) methodSelect.value = method;
    if (urlInput) urlInput.value = url;

    // 🛠️ 核心邏輯：根據切換的 Method 處理 JSON 區塊
    if (requestArea) {
        if (method === 'GET') {
            // 從 POST 切換到 GET：清空並填入 URL 參數提示
            requestArea.value = "// GET 參數已更新至上方 URL 欄位";
        } else {
            // 從 GET 切換到 POST：直接清空，等待使用者點選「正確/錯誤」範本
            requestArea.value = "";
        }
    }

    if (sampleBtns) {
        sampleBtns.classList.remove('d-none');
        sampleBtns.classList.add('animate__animated', 'animate__fadeIn');
    }

    urlInput.classList.add('highlight-update');
    setTimeout(() => {
        urlInput.classList.remove('highlight-update');
    }, 500);
}