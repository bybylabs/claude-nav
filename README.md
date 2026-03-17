# Claude 对话导航

一个 Chrome 扩展，为 [Claude.ai](https://claude.ai) 添加两个功能：

- **对话导航**：侧边栏实时索引所有提问，点击跳转，关键词搜索
- **对话分享**：勾选任意轮次，一键生成可分享链接，格式完整保留

https://nav.bybylabs.org/

> 数据完全本地，分享功能存储在你自己的 Cloudflare KV，不经过任何第三方服务器。

---

## 功能

### 对话导航
- 所有提问按顺序编号列出，侧边栏实时更新
- 点击任意条目，页面平滑滚动并高亮目标消息
- 随页面滚动，侧边栏高亮自动跟随当前位置
- 关键词搜索过滤，实时生效

### 对话分享
- 进入分享模式，勾选要分享的对话轮次（支持全选）
- 选择链接有效期（24小时 / 3天 / 7天 / 30天 / 永久）
- 生成链接自动复制到剪贴板
- 分享页面包含完整的提问和 Claude 回答，代码块、列表、表格、链接格式完整保留
- 分享页配色风格与 Claude.ai 一致

---

## 安装插件

1. 下载本仓库，或在 [Releases](../../releases) 页下载 `claude-conversation-nav.zip` 并解压
2. 打开 Chrome，地址栏输入 `chrome://extensions`
3. 右上角开启**开发者模式**
4. 点击**加载已解压的扩展程序**，选择 `claude-conversation-nav` 文件夹
5. 访问 [claude.ai](https://claude.ai)，页面右侧出现导航按钮，点击即可使用

> 如需在无痕模式使用，进入扩展详情页开启「在无痕模式下允许」。

---

## 配置分享功能

分享功能需要你自己部署一个 Cloudflare Worker 作为后端。Cloudflare 免费套餐完全够用（每天 10 万次请求）。

### 第一步：创建 KV 存储

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages → KV → Create namespace**
3. 名称填 `CLAUDE_SHARES`，创建

### 第二步：部署 Worker

1. 进入 **Workers & Pages → Create → Worker**
2. 名称填 `claude-share`，点击 Deploy
3. 进入 Worker → **Edit Code**，全选删除，粘贴 `worker-v2.js` 的内容
4. 将第 3 行 `AUTH_TOKEN` 改成你自己的密钥（任意字符串，记住它）
5. 点击 **Deploy**

### 第三步：绑定 KV

1. Worker → **Settings → Bindings → Add**
2. 类型选 **KV namespace**，变量名填 `CLAUDE_SHARES`，选择刚才创建的命名空间
3. 保存，重新 Deploy

### 第四步（可选）：绑定自定义域名

如果需要中国大陆的朋友也能访问分享链接，建议绑定一个托管在 Cloudflare 的自定义域名：

Worker → **Settings → Domains & Routes → Add → Custom Domain** → 填入子域名（如 `share.yourdomain.com`）

### 第五步：配置插件

1. 在 Claude.ai 页面打开对话导航侧边栏
2. 点击右上角**齿轮图标**
3. 填入 Worker 地址和第二步设置的密钥，保存
4. 点击**测试连接**，显示成功即可使用

---

## 文件说明

```
claude-conversation-nav/   Chrome 插件源码
  manifest.json            插件配置
  content.js               主逻辑（导航 + 分享）
  timeline.css             侧边栏样式
  options.html             设置页（备用）
  icons/                   图标

worker-v2.js               Cloudflare Worker 代码（部署到自己的账号）
```

---

## 隐私说明

- **导航功能**：完全本地运行，零网络请求，不收集任何数据
- **分享功能**：仅在你主动点击「生成链接」时，将你选中的对话内容发送到**你自己配置的 Worker**，不经过任何第三方服务器；分享数据存储在你自己的 Cloudflare KV 中

---

## 已知限制

- 仅支持 Chrome（及 Chromium 内核浏览器）
- 仅适配 [claude.ai](https://claude.ai)，如 Anthropic 更新页面结构可能需要同步调整
- 分享页面不支持还原 Claude 的交互组件（如工具调用折叠面板），但展开状态的内容会原样保留

---

## License

MIT
