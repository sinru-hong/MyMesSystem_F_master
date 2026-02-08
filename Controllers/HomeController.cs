using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MyMesSystem_F.Models;

namespace MyMesSystem_F.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IConfiguration _configuration;

        // 只留下這一個就好！把原本只有 ILogger 的那個刪掉
        public HomeController(ILogger<HomeController> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        // 1. 顯示登入頁面
        public IActionResult Login()
        {
            return View();
        }

        // 2. 處理登入驗證
        [HttpPost]
        public async Task<IActionResult> VerifyLogin(string emplNo, string password)
        {
            //// 這裡暫時用簡單的邏輯，之後可以改成連資料庫
            //if (username == "admin" && password == "1234")
            //{
            //    // 驗證成功，跳轉到原本的 Index (監控畫面)
            //    return RedirectToAction("Index");
            //}

            using (var client = new HttpClient())
            {
                var baseUrl = _configuration.GetValue<string>("ApiSettings:BaseUrl");
                var apiUrl = $"{baseUrl}api/users/login";
                var content = JsonContent.Create(new { EmplNo = emplNo, Password = password });

                var response = await client.PostAsync(apiUrl, content);

                //處理業務邏輯（登入成功或密碼錯誤）
                if (response.IsSuccessStatusCode)
                {
                    var rawContent = await response.Content.ReadAsStringAsync();

                    // 檢查是否真的是 JSON，避免解析 HTML 導致崩潰
                    if (!rawContent.TrimStart().StartsWith("{"))
                    {
                        ViewBag.Error = "後端回應格式異常，請檢查伺服器狀態。";
                        return View("Login");
                    }

                    var result = System.Text.Json.JsonSerializer.Deserialize<LoginResponse>(rawContent,
                        new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    if (result == null || result.Success == false)
                    {
                        ViewBag.Error = result?.Message ?? "帳號或密碼錯誤";
                        ViewBag.SavedUsername = emplNo;
                        return View("Login");
                    }
                    else
                    {
                        HttpContext.Session.SetString("UserEmplNo", emplNo);
                        return RedirectToAction("Index");
                    }
                }
                ////處理環境或安全配置錯誤（如 IIS 攔截）
                //else if (response.StatusCode == System.Net.httptatusCode.Unauthorized)
                //{
                //    // 不再嘗試解析 LoginResponse，因為 401 通常來自伺服器攔截回傳的 HTML
                //    ViewBag.Error = "登入服務權限異常 (401)，請聯絡管理員檢查後端 API 存取權限。";
                //    return View("Login");
                //}
                //處理不可預期的伺服器崩潰，並保留偵錯資訊
                else
                {
                    // 1. 讀取原始內容
                    var rawHtml = await response.Content.ReadAsStringAsync();

                    // 2. 嘗試從 HTML 中萃取錯誤資訊 (例如 404 或 500)
                    string errorMessage = $"後端錯誤 ({response.StatusCode})";

                    if (rawHtml.Contains("<title>"))
                    {
                        int start = rawHtml.IndexOf("<title>") + 7;
                        int end = rawHtml.IndexOf("</title>");
                        if (end > start)
                        {
                            string pageTitle = rawHtml.Substring(start, end - start);
                            errorMessage += $" - 頁面標題: {pageTitle}";
                        }
                    }

                    // 3. 輸出詳細日誌到 Visual Studio 偵錯視窗
                    Debug.WriteLine("--- [嚴重錯誤] 後端回傳原始內容開始 ---");
                    Debug.WriteLine(rawHtml);
                    Debug.WriteLine("--- [嚴重錯誤] 後端回傳原始內容結束 ---");

                    // 4. 給使用者的提示 (加上一點指引)
                    ViewBag.Error = $"{errorMessage}。請檢查後端服務是否正常啟動，或查看偵錯輸出。";
                    return View("Login");
                }
            }
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        public IActionResult About()
        {
            return View();
        }
    }
}