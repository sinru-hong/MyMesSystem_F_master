// product.js
console.log("前端 JS 已就緒");

// 這是你未來後端 API 的位址 (記得根據你後端啟動後的 Port 做修改)
const BACKEND_URL = "https://localhost:44326";

document.addEventListener('DOMContentLoaded', function () {
    console.log("網頁載入完成，準備綁定事件");

    // 假設你在 CSHTML 有個 id="btnLoad" 的按鈕
    const btn = document.getElementById('btnLoad');
    if (btn) {
        btn.addEventListener('click', fetchData);
    }
});

function fetchData() {
    // 這裡就是你筆記提到的「非同步通訊 (AJAX/Fetch)」
    fetch(`${BACKEND_URL}/api/Product`)
        .then(response => {
            if (!response.ok) throw new Error("網路請求失敗");
            return response.json();
        })
        .then(data => {
            console.log("從後端拿到的資料：", data);
            // 在這裡處理資料顯示邏輯
            alert("成功拿到資料！請看 Console 控制台");
        })
        .catch(error => {
            console.error("發生錯誤：", error);
        });
}
document.getElementById('btnLoad').addEventListener('click', function () {
    fetch(`${BACKEND_URL}/api/Product`)
        .then(response => response.json())
        .then(data => {
            const list = document.getElementById('productList');
            list.innerHTML = ''; // 先清空舊內容

            data.forEach(item => {
                // 這裡的 item.productName 必須對應後端 JSON 的 Key (通常是小寫開頭)
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = `產品：${item.productName} (編號：${item.productID}) - 價格：${item.price}`;
                list.appendChild(li);
            });
        })
        .catch(err => alert("抓取失敗，請檢查後端是否啟動與 CORS 設定"));
});

fetch(`${BACKEND_URL}/api/Product/complex`)
    .then(response => {
        // 先印出狀態碼看看，如果是 500 代表後端 C# 報錯了
        console.log("HTTP 狀態碼:", response.status);

        // 檢查回傳內容是否為空
        if (response.status === 204) {
            console.warn("後端回傳成功，但沒有任何資料 (204 No Content)");
            return [];
        }
        return response.json();
    })
    .then(data => {
        console.log("成功抓取資料:", data);
        // 注意：Hashtable 序列化後的 Key 通常會維持 SQL 的大小寫
        // 或是根據你的 JSON 設定變動，建議先 console.log(item) 檢查
        console.log(data);
        for (i = 0; i <= data.length-1; i++) {
            console.log("產品名稱：", data[i].ProductName); // 必須與 SQL 欄位名一致
            console.log("產品ID：", data[i].ProductID); // 必須與 SQL 欄位名一致
        }
    })
    .catch(err => {
        console.error("Fetch 過程發生錯誤:", err);
    });