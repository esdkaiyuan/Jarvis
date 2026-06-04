# 贾维斯粒子助手

一个透明、无边框、置顶悬浮在桌面的 Electron AI 助手。当前使用 1500 个 Three.js WebGL 粒子，不绘制背景，不绘制边框，不保留拖尾。粒子会持续刷新颜色，并在散开状态和高级模型之间随机切换。

当前高级模型库包含：螺旋、环面、心形、无限符号、晶体、旋涡星系、莲花、神经网络、原子轨道、光冠、蝴蝶曲线、语音波形、多面体框架、深层涡流、沙漏流、轨道环、全息立方体、数据隧道、电路球、陀螺环、量子门、雷达盘、棱镜螺旋、矩阵网格、戴森球、特殊星系、行星系统。每个模型都有独立的色相、粒子大小和运动强度风格，并会在生成时带随机 3D 姿态变体。

默认可以直接按住粒子球拖拽移动。需要让鼠标点击穿透到桌面时，按 `Ctrl+Shift+M` 切换穿透模式。

## 触发 AI 对话

- 点击粒子群：单击粒子球会立即进入一次语音对话。
- 语音呼唤：默认监听 `贾维斯`、`Jarvis`、`嘉维斯`、`贾维思`、`加维斯`。听到唤醒词后会进入听取指令状态。

拖拽和点击会自动区分：轻点触发对话，按住移动超过阈值则拖动窗口，不会误触发对话。

## 配置

仓库不会提交真实密钥。首次运行前，复制 `.env.example` 为本地 `.env`，然后只在 `.env` 里填写自己的 key：

```bash
cp .env.example .env
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

然后打开 `.env`，把 `MIMO_API_KEY` 改成你自己的小米 MiMo Token Plan key：

```env
MIMO_API_KEY=tp-your-token-plan-key
MIMO_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1
MIMO_CHAT_MODEL=mimo-v2.5-pro
MIMO_ASR_MODEL=mimo-v2.5-asr
MIMO_TTS_MODEL=mimo-v2.5-tts
MIMO_TTS_VOICE=苏打
JARVIS_WINDOW_SIZE=420
JARVIS_PARTICLE_COUNT=1500
JARVIS_MOUSE_PASSTHROUGH=false
JARVIS_WAKE_WORD_ENABLED=true
JARVIS_WAKE_WORDS=贾维斯,jarvis,嘉维斯,贾维思,加维斯
JARVIS_ACTION_DRY_RUN=false
JARVIS_ACTION_OUTPUT_DIR=jarvis-actions
JARVIS_BROWSER_SEARCH_URL=https://www.bing.com/search?q=
```

`tp-` 开头的 Token Plan key 默认使用 `https://token-plan-cn.xiaomimimo.com/v1`。如果你的控制台显示了不同的 Token Plan Base URL，以控制台为准。

### 配置项说明

- `MIMO_API_KEY`：必填，小米 MiMo key。只写在本机 `.env`，不要提交到仓库。
- `MIMO_BASE_URL`：MiMo API 地址。Token Plan 通常为 `https://token-plan-cn.xiaomimimo.com/v1`。
- `MIMO_CHAT_MODEL`：聊天模型，默认 `mimo-v2.5-pro`。
- `MIMO_ASR_MODEL`：语音识别模型，默认 `mimo-v2.5-asr`。
- `MIMO_TTS_MODEL`：语音合成模型，默认 `mimo-v2.5-tts`。
- `MIMO_TTS_VOICE`：TTS 音色，默认 `苏打`。
- `JARVIS_WINDOW_SIZE`：悬浮窗口尺寸，默认 `420`。
- `JARVIS_PARTICLE_COUNT`：粒子数量，默认 `1500`。
- `JARVIS_MOUSE_PASSTHROUGH`：是否默认鼠标穿透，默认 `false`，也就是可拖拽。
- `JARVIS_WAKE_WORD_ENABLED`：是否启用语音唤醒，默认 `true`。
- `JARVIS_WAKE_WORDS`：唤醒词列表，用英文逗号分隔。
- `JARVIS_START_SHORTCUT`：开始语音交流快捷键，默认 `CommandOrControl+Shift+J`。
- `JARVIS_MOUSE_SHORTCUT`：切换鼠标穿透快捷键，默认 `CommandOrControl+Shift+M`。
- `JARVIS_QUIT_SHORTCUT`：退出快捷键，默认 `CommandOrControl+Shift+Q`。
- `JARVIS_ACTION_DRY_RUN`：动作工具干跑模式。设为 `true` 时只播报将要执行的动作，不打开浏览器、不创建文件。
- `JARVIS_ACTION_OUTPUT_DIR`：贾维斯创建 Office 文件的输出目录，默认 `jarvis-actions`。
- `JARVIS_BROWSER_SEARCH_URL`：浏览器搜索地址前缀，默认 Bing。

### 隐私与开源发布

`.env`、`.env.*`、`node_modules/`、`dist/`、测试截图、测试结果和 `jarvis-actions/` 都在 `.gitignore` 中，不会被提交。公开仓库只保留 `.env.example` 作为配置模板。

## 启动

安装依赖：

```bash
npm install
```

开发模式运行：

```bash
npm run dev
```

构建并运行本地桌面版：

```bash
npm start
```

## 动手能力与 MCP

贾维斯现在有一组受限的白名单动作工具。语音识别后会先判断是不是动作命令；命中时直接执行动作并用 TTS 播报结果，没有命中才进入普通 MiMo 聊天。

当前支持：

- `browser.open_url`：打开 `http` / `https` 地址
- `browser.search_web`：用默认浏览器搜索
- `office.create_word_document`：创建并打开 Word 文档
- `office.create_excel_workbook`：创建并打开 Excel 工作簿
- `office.create_powerpoint_deck`：创建并打开 PowerPoint
- `office.open_file`：打开本机已存在文件

语音示例：

```text
贾维斯，帮我用浏览器搜索小米汽车新闻
贾维斯，打开 https://example.com
贾维斯，创建一个 Word 文档，标题是会议纪要
贾维斯，新建 Excel 表格，标题是项目清单
贾维斯，做一个 PPT，标题是季度总结
```

Office 文件默认生成到 `jarvis-actions/`，可通过 `.env` 修改：

```env
JARVIS_ACTION_DRY_RUN=false
JARVIS_ACTION_OUTPUT_DIR=jarvis-actions
JARVIS_BROWSER_SEARCH_URL=https://www.bing.com/search?q=
```

`JARVIS_ACTION_DRY_RUN=true` 时只返回将要执行的动作，不会真正打开浏览器或创建文件，适合测试。

外部 MCP 客户端建议把下面命令配置为 stdio server：

```bash
node mcp/jarvis-office-browser-mcp.cjs
```

也可以使用静默 npm 脚本：

```bash
npm run --silent mcp
```

## 快捷键

- `Ctrl+Shift+J`：开始一次语音交流
- `Ctrl+Shift+M`：切换鼠标穿透，默认可拖拽
- `Ctrl+Shift+方向键`：移动悬浮球位置
- `Ctrl+Shift+Q`：退出

## 验证

```bash
npm test
npm run build
```

## MiMo 说明

语音链路使用 MiMo OpenAI 兼容的 `/chat/completions`：

- ASR：录音编码为 16kHz WAV data URL 后发送 `input_audio`
- Chat：系统身份固定为“贾维斯”
- TTS：要朗读的文本放在 `assistant` 消息里，输出 WAV data URL 并在客户端播放

Token Plan 官方说明主要面向编程工具，非编程类自定义应用可能需要确认授权范围。
