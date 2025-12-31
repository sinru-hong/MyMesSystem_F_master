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
    //#region 強型別回傳
    //fetch(`${BACKEND_URL}/api/Product`)
    //    .then(response => response.json())
    //    .then(data => {
    //const list = document.getElementById('productList');
    //list.innerHTML = ''; // 先清空舊內容

    //data.forEach(item => {
    //    // 這裡的 item.productName 必須對應後端 JSON 的 Key (通常是小寫開頭)
    //    const li = document.createElement('li');
    //    li.className = 'list-group-item';
    //    li.textContent = `產品：${item.productName} (編號：${item.productID}) - 價格：${item.price}`;
    //    list.appendChild(li);
    //});
    //    })
    //    .catch(err => alert("抓取失敗，請檢查後端是否啟動與 CORS 設定"));
    //#endregion
    //#region 弱型別回傳
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
            data.forEach(item => {
                // 注意：Hashtable 序列化後的 Key 通常會維持 SQL 的大小寫
                // 或是根據你的 JSON 設定變動，建議先 console.log(item) 檢查
                const list = document.getElementById('productList');
                list.innerHTML = ''; // 先清空舊內容

                data.forEach(item => {
                    // 這裡的 item.productName 必須對應後端 JSON 的 Key (通常是小寫開頭)
                    const li = document.createElement('li');
                    li.className = 'list-group-item';
                    li.textContent = `產品：${item.ProductName} (編號：${item.ProductID}) - 價格：${item.Price}`;
                    list.appendChild(li);
                });
            });
        })
        .catch(err => {
            console.error("Fetch 過程發生錯誤:", err);
        });
    //#endregion
}