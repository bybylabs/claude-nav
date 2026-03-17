// Claude Share Worker v2
// 需要绑定 KV 命名空间：变量名 CLAUDE_SHARES

const AUTH_TOKEN = 'your-secret-token';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return corsResponse('', 204);
    }

    if (request.method === 'POST' && path === '/save') {
      const token = request.headers.get('X-Auth-Token');
      if (token !== AUTH_TOKEN) {
        return corsResponse(JSON.stringify({ error: '密钥错误' }), 401);
      }
      let body;
      try { body = await request.json(); } catch {
        return corsResponse(JSON.stringify({ error: '请求格式错误' }), 400);
      }
      const { html, title, ttl } = body;
      if (!html) return corsResponse(JSON.stringify({ error: '内容不能为空' }), 400);

      const id = Math.random().toString(36).slice(2, 8);
      const putOptions = (ttl && ttl > 0) ? { expirationTtl: ttl } : {};
      await env.CLAUDE_SHARES.put(id, JSON.stringify({
        html,
        title: title || 'Claude 对话摘录',
        createdAt: new Date().toISOString(),
        ttl: ttl || 0,
      }), putOptions);

      return corsResponse(JSON.stringify({ url: `${url.origin}/s/${id}`, id }), 200);
    }

    if (request.method === 'GET' && path.startsWith('/s/')) {
      const id = path.slice(3).replace(/\/$/, '');
      if (!id) return new Response('Not found', { status: 404 });

      const raw = await env.CLAUDE_SHARES.get(id);
      if (!raw) {
        return new Response(notFoundPage(), {
          status: 404,
          headers: { 'Content-Type': 'text/html;charset=UTF-8' },
        });
      }
      const { html, title, createdAt, ttl } = JSON.parse(raw);
      const date = new Date(createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
      const expireNote = (ttl && ttl > 0)
        ? `链接将在 ${Math.round(ttl / 86400)} 天后失效`
        : '链接永久有效';

      return new Response(renderPage(title, html, date, expireNote), {
        status: 200,
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      });
    }

    return new Response('Claude Share Service', { status: 200 });
  },
};

function corsResponse(body, status) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    },
  });
}

function renderPage(title, html, date, expireNote) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f5f0e8;--surface:#ede8df;--surface2:#e4dfd5;
  --border:#d8d0c4;--text:#1a1814;--muted:#8a8070;
  --user-bg:#ede8df;--code-bg:#ffffff;--accent:#c96a3a;
  --code-text:#1a1814;--inline-code-bg:#f0ebe0;--inline-code-color:#c0392b;
}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB',sans-serif;font-size:15px;line-height:1.75;min-height:100vh}

/* ── Topbar ── */
.topbar{background:var(--surface);border-bottom:1px solid var(--border);padding:11px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10;gap:12px}
.topbar-left{display:flex;align-items:center;gap:9px;min-width:0}
.logo{width:22px;height:22px;background:linear-gradient(135deg,#c96a3a,#e8a87c);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:700;flex-shrink:0}
.topbar-title{color:var(--text);font-weight:500;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.topbar-right{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0}
.topbar-date,.topbar-expire{font-size:11px;color:var(--muted);white-space:nowrap}

/* ── Layout ── */
.main{max-width:760px;margin:0 auto;padding:28px 24px 80px}

/* ── User turn ── */
.user-turn{display:flex;justify-content:flex-end;padding:18px 0 8px}
.user-bubble{background:var(--user-bg);border:1px solid var(--border);border-radius:18px 4px 18px 18px;padding:11px 17px;max-width:78%;font-size:15px;line-height:1.65;white-space:pre-wrap;word-break:break-word;color:var(--text)}

/* ── AI turn ── */
.ai-turn{padding:16px 0 28px;border-bottom:1px solid var(--border)}
.ai-turn:last-child{border-bottom:none}
.ai-label{font-size:12px;font-weight:600;color:var(--muted);margin-bottom:12px;display:flex;align-items:center;gap:6px}
.ai-label::before{content:'';display:inline-block;width:16px;height:16px;background:linear-gradient(135deg,#c96a3a,#e8a87c);border-radius:50%;flex-shrink:0}
.ai-body{font-size:15px;line-height:1.8;color:var(--text)}

/* ── Typography ── */
.ai-body p{margin:10px 0}
.ai-body p:first-child{margin-top:0}
.ai-body ul,.ai-body ol{padding-left:22px;margin:10px 0}
.ai-body li{margin:5px 0}
.ai-body h1,.ai-body h2,.ai-body h3,.ai-body h4{font-weight:700;margin:22px 0 10px;line-height:1.3;color:var(--text)}
.ai-body h1{font-size:1.5em}.ai-body h2{font-size:1.3em}.ai-body h3{font-size:1.1em}.ai-body h4{font-size:1em}
.ai-body blockquote{border-left:3px solid var(--accent);padding-left:14px;color:var(--muted);margin:14px 0;font-style:italic}
.ai-body hr{border:none;border-top:1px solid var(--border);margin:20px 0}
.ai-body a{color:var(--accent);text-decoration:none}.ai-body a:hover{text-decoration:underline}
.ai-body strong,.ai-body b{font-weight:700}
.ai-body em,.ai-body i{font-style:italic}
.ai-body table{border-collapse:collapse;width:100%;margin:14px 0;font-size:14px}
.ai-body th,.ai-body td{border:1px solid var(--border);padding:8px 13px;text-align:left}
.ai-body th{background:var(--surface2);font-weight:600}

/* ── Code ── */
.ai-body pre,.ai-body code{font-family:'JetBrains Mono','Fira Code','Cascadia Code',ui-monospace,monospace;font-size:13px}
.ai-body pre{background:var(--code-bg);border:1px solid var(--border);border-radius:10px;padding:0;margin:14px 0;overflow:hidden;line-height:1.6;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.ai-body pre .code-lang{font-size:11px;color:var(--muted);padding:7px 14px 6px;border-bottom:1px solid var(--border);background:var(--surface);font-family:inherit;letter-spacing:.05em;text-transform:lowercase}
.ai-body pre code{display:block;padding:14px 16px;overflow-x:auto;color:var(--code-text)}
.ai-body code:not(pre code){background:var(--inline-code-bg);border:1px solid var(--border);border-radius:4px;padding:2px 6px;font-size:13px;color:var(--inline-code-color)}

/* ── Details (展开快照) ── */
.details-open{background:var(--surface);border:1px solid var(--border);border-radius:8px;margin:12px 0;overflow:hidden}
.details-summary{padding:9px 14px;font-size:13px;font-weight:500;color:var(--muted);border-bottom:1px solid var(--border);background:var(--surface2)}
.details-body{padding:12px 14px;font-size:13px}

/* ── Footer ── */
.footer-note{text-align:center;font-size:12px;color:var(--muted);margin-top:48px;padding-top:20px;border-top:1px solid var(--border)}
</style>
</head>
<body>
<div class="topbar">
  <div class="topbar-left">
    <div class="logo">C</div>
    <span class="topbar-title">${esc(title)}</span>
  </div>
  <div class="topbar-right">
    <span class="topbar-date">分享于 ${date}</span>
    <span class="topbar-expire">${expireNote}</span>
  </div>
</div>
<div class="main">
  ${html}
  <div class="footer-note">Claude 对话摘录 · 由分享者选取</div>
</div>
</body></html>`;
}

function notFoundPage() {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>链接已失效</title>
<style>body{background:#1a1a1f;color:#6b6b88;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center}h1{color:#e0e0ec;font-size:1.5em;margin-bottom:12px}</style>
</head><body><div><h1>链接已失效</h1><p>该分享链接不存在或已过期</p></div></body></html>`;
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
