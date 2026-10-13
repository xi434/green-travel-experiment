import { verify } from "https://esm.sh/2fa-lib";

export default async (request, context) => {
  const url = new URL(request.url);
  const inputCode = url.searchParams.get("code");
  const secret = Netlify.env.get("TOTP_SECRET");

  // 没有带口令 → 返回输入口令的 HTML 页面
  if (!inputCode) {
    return new Response(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>请输入动态口令</title>
<style>
  body{margin:0;padding:0;height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f8fafc,#f1f5f9);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;}
  .card{background:white;border-radius:2rem;padding:3rem 3.5rem;box-shadow:0 25px 60px -15px rgba(0,0,0,0.25);border:1px solid #e2e8f0;text-align:center;max-width:600px;width:92%;position:relative;}
  .badge{position:absolute;top:-12px;right:24px;background:#2563eb;color:white;font-size:0.7rem;font-weight:800;padding:0.25rem 0.9rem;border-radius:2rem;letter-spacing:0.05em;box-shadow:0 4px 10px rgba(37,99,235,0.3);}
  .icon{font-size:3.5rem;margin-bottom:0.75rem;line-height:1;}
  h2{font-size:1.8rem;font-weight:900;color:#1e293b;margin:0.5rem 0;}
  p{font-size:1rem;color:#64748b;margin-bottom:2rem;font-weight:500;}
  input{width:100%;padding:1rem 1.25rem;border:2px solid #cbd5e1;border-radius:0.9rem;font-size:1.2rem;outline:none;text-align:center;font-weight:600;letter-spacing:0.05em;background:#f8fafc;box-sizing:border-box;}
  input:focus{border-color:#2563eb;}
  button{width:100%;padding:1.1rem;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;border:none;border-radius:0.9rem;font-size:1.2rem;font-weight:800;cursor:pointer;box-shadow:0 10px 15px -3px rgba(37,99,235,0.3);margin-top:0.75rem;}
  button:hover{transform:translateY(-2px);}
  .err{color:#e11d48;font-weight:700;font-size:0.95rem;margin-top:0.75rem;min-height:1.5rem;}
</style>
</head>
<body>
<div class="card">
  <div class="badge">动态口令 · 主试提供</div>
  <div class="icon">🔐</div>
  <h2>请输入动态口令</h2>
  <p>口令由主试现场生成，30秒内有效</p>
  <input type="text" id="code" placeholder="输入6位数字口令" maxlength="6" inputmode="numeric" autocomplete="off" autofocus>
  <button onclick="submitCode()">验证并进入 ➔</button>
  <div class="err" id="err"></div>
</div>
<script>
  const input = document.getElementById('code');
  const err = document.getElementById('err');
  function submitCode(){
    const v = (input.value||'').trim();
    if(!v){ err.textContent='⚠️ 请输入口令'; return; }
    if(!/^\\d{6}$/.test(v)){ err.textContent='⚠️ 请输入6位数字口令'; return; }
    window.location.href = '/?code=' + v;
  }
  input.addEventListener('keydown', e => { if(e.key==='Enter') submitCode(); });
  input.addEventListener('input', e => { e.target.value = e.target.value.replace(/\\D/g,'').slice(0,6); });
<\/script>
</body>
</html>`, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  // 有口令 → 验证
  const isValid = await verify(inputCode, secret, { window: 1 });
  if (!isValid) {
    return new Response(`<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><title>口令错误</title>
<style>body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;text-align:center;}
h2{color:#e11d48;font-size:2rem;}a{color:#2563eb;font-weight:800;text-decoration:none;}</style></head>
<body><div><div style="font-size:4rem;">❌</div><h2>口令错误或已过期</h2>
<p style="color:#64748b;margin-top:1rem;"><a href="/">← 返回重新输入</a></p></div></body></html>`, 
    { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  // 口令正确 → 放行，让请求继续访问真正的 index.html
  return;
};

export const config = {
  path: "/*",
  excludedPath: ["/*.css", "/*.js", "/*.png", "/*.jpg", "/*.svg", "/*.woff2", "/netlify/*"]
};
