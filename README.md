# 超级输入框 - 多AI同步助手

<div align="center">

一个强大的浏览器扩展，让你同时在多个 AI 网站上提问，分屏对比答案，提升效率！

[![Version](https://img.shields.io/badge/version-1.0.2-blue.svg)](https://github.com/lkplkplkp0316/super-input-box-beautiful)
[![Chrome](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)
[![Edge](https://img.shields.io/badge/Edge-Extension-blue.svg)](https://microsoftedge.microsoft.com/addons)

[功能特性](#功能特性) • [快速开始](#快速开始) • [使用说明](#使用说明) • [更新日志](#更新日志)

</div>

---

## 📋 更新日志

### v1.0.2 (最新)
- ✨ **点击图标直接打开分屏** - 点击浏览器工具栏图标直接进入分屏界面
- ✨ **新增对话功能** - 添加 "+" 按钮，一键为所有 AI 发起新对话
- ✨ **移除顶部标识** - 简化界面，移除 AI 分屏窗口顶部的名称和图标标识
- ✨ **移除顶部阴影** - 优化视觉效果，移除头部栏的阴影
- 🐛 **修复新对话后发送问题** - 修复发起新对话后无法发送消息的问题
- 🐛 **修复 iframe 查找逻辑** - 使用稳定的 AI ID 标识符，避免刷新后找不到 iframe
- 🎨 **添加分屏页面图标** - 分屏标签页显示正确的图标

### v1.0.1
- ✨ **添加 CSP 支持** - 允许扩展页面嵌入任何网站的 iframe
- 🐛 **修复 URL 过滤格式** - 修正 declarativeNetRequest 的 urlFilter 格式

### v1.0.0
- 🎉 **首次发布** - 支持多 AI 同步提问、分屏对比、赛博玻璃主义 UI 设计

---

## ✨ 功能特性

### 🎯 核心功能

- **多 AI 同步提问** - 一键向多个 AI 网站发送相同问题
- **分屏对比** - 在一个页面中同时查看多个 AI 的回答
- **支持主流 AI**：
  - 💬 ChatGPT (chatgpt.com)
  - ◐ Claude (claude.ai)
  - ☽ Kimi (kimi.moonshot.cn)
  - ✦ Gemini (gemini.google.com)

### 🎨 精美设计

- **赛博玻璃主义 UI** - 现代化的玻璃拟态设计风格
- **浅色主题** - 舒适的浅色配色方案
- **流畅动画** - 平滑的过渡效果和交互反馈
- **响应式布局** - 自适应 1-4 个分屏的网格布局

### ⚡ 便捷体验

- **头部可折叠** - 选择模型后可收起顶部栏，节省空间
- **配置持久化** - 自动保存你的 AI 选择和界面状态
- **快捷键支持** - Enter 发送，Shift+Enter 换行
- **一键新对话** - 快速为所有 AI 发起新对话

---

## 🚀 快速开始

### 安装方法

#### 方式一：从源码安装（开发模式）

1. 下载或克隆此仓库
```bash
git clone https://github.com/lkplkplkp0316/super-input-box-beautiful.git
```

2. 打开 Chrome/Edge 浏览器的扩展管理页面：
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

3. 开启右上角的「开发者模式」

4. 点击「加载已解压的扩展程序」

5. 选择项目文件夹 `超级输入框_插件`

6. 完成！扩展图标会出现在浏览器工具栏

---

## 📖 使用说明

### 基础使用

1. **打开分屏页面**
   - 点击浏览器工具栏的扩展图标
   - 直接进入分屏界面

2. **选择 AI 网站**
   - 点击顶部的 AI 卡片（ChatGPT、Claude、Kimi、Gemini）
   - 最多可同时选择 4 个
   - 再次点击可取消选择

3. **输入问题**
   - 在底部输入框输入你的问题
   - 按 `Enter` 发送（`Shift+Enter` 换行）
   - 点击发送按钮（➤）发送

4. **发起新对话**
   - 点击输入框右侧的 "+" 按钮
   - 为所有 AI 网站同时发起新对话

5. **对比答案**
   - 各个 AI 的回答会显示在对应的分屏中
   - 可以同时对比多个 AI 的回答

### 高级技巧

#### 收起顶部栏
选择好 AI 模型后，点击左上角的 `▼` 按钮收起顶部栏，为分屏内容腾出更多空间。

#### 清空分屏
点击顶部右侧的「清空」按钮可以一次性移除所有 AI 分屏。

---

## 🛠️ 技术架构

### 技术栈

- **Manifest V3** - 最新的 Chrome 扩展标准
- **Vanilla JavaScript** - 纯原生 JS，无框架依赖
- **CSS3** - 现代 CSS 特性（Grid、Flexbox、Backdrop Filter）
- **declarativeNetRequest API** - 绕过 AI 网站的 iframe 限制

### 核心技术

#### 1. iframe 嵌入突破
使用 `declarativeNetRequest` API 动态移除 HTTP 响应头：
- `X-Frame-Options`
- `Content-Security-Policy`
- `X-Content-Type-Options`

#### 2. 跨域消息传递
通过 `window.postMessage` 实现：
- 扩展页面 → iframe 内容
- iframe 内容 → 扩展页面

#### 3. 选择器自动识别
内置各 AI 网站输入框的 CSS 选择器，自动定位和注入内容。

---

## 🐛 常见问题

### Q: 为什么 ChatGPT/Gemini 显示空白或拒绝连接？

**A**: 这些网站使用了额外的安全措施：
- `Content-Security-Policy: frame-ancestors 'none'` 无法被扩展完全绕过
- 部分 AI 网站会检测 iframe 嵌入并拒绝加载

**解决方法**：
1. 确保扩展已加载并刷新了分屏页面
2. Claude 和 Kimi 通常兼容性更好
3. ChatGPT 和 Gemini 可能需要在浏览器中单独使用

### Q: 新对话后无法发送消息？

**A**: 请确保已更新到 v1.0.2 或更高版本，此版本已修复该问题。

### Q: 消息发送后没有反应？

**A**: 请检查：
1. 是否已在对应的 AI 网站登录
2. 输入框选择器是否正确（网站可能更新了 DOM）
3. 浏览器控制台是否有错误信息

---

## 📄 许可证

MIT License

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！**

Made with ❤️

</div>
