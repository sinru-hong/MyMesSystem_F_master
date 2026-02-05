// product.js
console.log("前端 JS 已就緒");

const BACKEND_URL = "https://localhost:44326";
// 修改為 Go 後端的網址
//const BACKEND_URL = "http://localhost:8080";

// 確保 fetch 的路徑是對的
//fetch(`${BACKEND_URL}/api/Product`)

document.addEventListener('DOMContentLoaded', function () {
    console.log("網頁載入完成，準備綁定事件");

    // 假設你在 CSHTML 有個 id="btnLoad" 的按鈕
    const btn = document.getElementById('btnLoad');
    if (btn) {
        btn.addEventListener('click', fetchData);
    }
});

function fetchData() {
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

//連接go後端用的
//function fetchData() {
//    console.log("開始抓取產品資料...");

//    // 指向 Go 後端的 complex 路由
//    fetch(`${BACKEND_URL}/api/Product/complex`)
//        .then(response => {
//            console.log("HTTP 狀態碼:", response.status);
//            if (response.status === 204) return [];
//            return response.json();
//        })
//        .then(data => {
//            console.log("成功抓取資料:", data);

//            const list = document.getElementById('productList');
//            if (!list) return;

//            // 修正點：在迴圈「之前」清空舊內容，才不會只剩最後一筆
//            list.innerHTML = '';

//            // 修正點：移除原本重複的巢狀 data.forEach
//            data.forEach(item => {
//                const li = document.createElement('li');
//                li.className = 'list-group-item';

//                // 修正點：確保對應 Go 後端 struct 標籤的大小寫 (如 ProductName)
//                li.textContent = `產品：${item.ProductName} (編號：${item.ProductID}) - 價格：${item.Price}`;

//                list.appendChild(li);
//            });
//        })
//        .catch(err => {
//            console.error("Fetch 過程發生錯誤:", err);
//            alert("抓取失敗，請確認 Go 後端服務已啟動。");
//        });
//}