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

                const response = await fetch(url, options);
                const responseText = await response.text();

                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (e) {
                    result = { rawResponse: responseText };
                }

                resPre.textContent = JSON.stringify(result, null, 2);

                if (statusBadge) {
                    statusBadge.style.display = 'inline';
                    statusBadge.innerText = `Status: ${response.status} ${response.statusText}`;
                    if (response.ok && (result.success !== false)) {
                        statusBadge.className = "badge bg-success";
                        resPre.style.borderLeft = "5px solid #198754";
                    } else {
                        statusBadge.className = "badge bg-warning text-dark";
                        resPre.style.borderLeft = "5px solid #ffc107";
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

function switchApi(method, url) {
    document.getElementById('httpMethod').value = method;
    document.getElementById('apiUrl').value = url;
    if (method === 'GET') {
        document.getElementById('requestJson').value = "// GET 方法通常不使用 Body";
    } else {
        loadSample(true);
    }
}