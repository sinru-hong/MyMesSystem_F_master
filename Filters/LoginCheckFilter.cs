using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace MyMesSystem_F.Filters
{
    public class LoginCheckFilter : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            // 1. 取得當前請求的 Session
            var userEmplNo = context.HttpContext.Session.GetString("UserEmplNo");

            // 2. 判斷是否為空
            if (string.IsNullOrEmpty(userEmplNo))
            {
                // 3. 如果是空的，強制跳轉回 HomeController 的 Login Action
                context.Result = new RedirectToActionResult("Login", "Home", null);
            }

            base.OnActionExecuting(context);
        }
    }
}