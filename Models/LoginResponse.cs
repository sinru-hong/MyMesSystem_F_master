namespace MyMesSystem_F.Models
{
    public class LoginResponse
    {
        // 登入是否成功
        public bool Success { get; set; }

        // 提示訊息 (例如："帳號不存在" 或 "登入成功")
        public string Message { get; set; }

        // 關鍵：是否為第一次登入？前端據此判斷是否跳轉到修改密碼頁
        public bool IsFirstLogin { get; set; }

        // 登入成功後核發的令牌 (JWT Token)，用於後續呼叫其他 API 的身份憑證
        public string Token { get; set; }

        // 使用者基本資訊 (可選)
        public string Username { get; set; }
    }
}
