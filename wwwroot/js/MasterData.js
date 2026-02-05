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

// 當 Modal 顯示時，可以預載一些資料 (測試用)
document.getElementById('userSelectModal').addEventListener('show.bs.modal', function () {
    //const tbody = document.getElementById('userModalTableBody');
    // 模擬資料，實際開發改成 fetch API
    //const users = [
    //    { id: 'A001', name: '張三'},
    //    { id: 'A002', name: '李四'}
    //];

    //tbody.innerHTML = users.map((u, index) => `
        //<tr style="cursor:pointer" onclick="selectUser('${u.name}')">
        //    <td>${index + 1}</td>
        //    <td>${u.id}</td>
        //    <td>${u.name}</td>
        //</tr>
    //`).join('');
    fetch(`/Project/GetUsers?user=${modalSearchUser}`)
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('userModalTableBody');
            tbody.innerHTML = ''; // 清空舊內容

            data.forEach((item, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <tr style="cursor:pointer" onclick="selectUser('${u.name}')">
                            <td>${index + 1}</td>
                            <td>${u.id}</td>
                            <td>${u.name}</td>
                     </tr>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error("查詢失敗:", err));
});

// 選取人員並填回輸入框
function selectUser(userName) {
    document.getElementById('inputCreator').value = userName;

    // 關閉視窗 (使用 Bootstrap 的方法)
    const modalElement = document.getElementById('userSelectModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();
}

function searchUserInModal() {
}