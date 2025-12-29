// Popup 脚本

let activeTabs = [];
let floatInputEnabled = false;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== Popup 已加载 ===');

  // 绑定按钮事件
  document.getElementById('btnChatGPT').addEventListener('click', () => openSite('chatgpt'));
  document.getElementById('btnGemini').addEventListener('click', () => openSite('gemini'));
  document.getElementById('btnOpenSplit').addEventListener('click', openSplitScreen);
  document.getElementById('btnTest').addEventListener('click', testCreateTab);
  document.getElementById('btnRefresh').addEventListener('click', refreshTabs);
  document.getElementById('btnSend').addEventListener('click', sendMessageToAll);
  document.getElementById('btnCloseStatus').addEventListener('click', closeStatus);
  document.getElementById('floatInputToggle').addEventListener('change', toggleFloatInput);

  console.log('=== 按钮事件已绑定 ===');

  loadSettings();
  refreshTabs();
  setupInputListener();

  // 定期刷新标签列表
  setInterval(refreshTabs, 3000);
});

// 加载设置
function loadSettings() {
  chrome.storage.local.get(['floatInputEnabled'], (result) => {
    if (result.floatInputEnabled !== undefined) {
      floatInputEnabled = result.floatInputEnabled;
      document.getElementById('floatInputToggle').checked = floatInputEnabled;
    }
  });
}

// 测试函数 - 直接创建标签
async function testCreateTab() {
  const logDiv = document.getElementById('testLog');
  logDiv.innerHTML += '<div>=== 开始测试 ===</div>';

  try {
    logDiv.innerHTML += '<div>调用 chrome.tabs.create...</div>';
    const tab = await chrome.tabs.create({ url: 'https://www.baidu.com' });
    logDiv.innerHTML += `<div style="color:green">✓ 成功! 标签ID: ${tab.id}</div>`;
  } catch (error) {
    logDiv.innerHTML += `<div style="color:red">✗ 失败: ${error.message}</div>`;
  }
}

// 打开网站 - 直接使用 chrome.tabs.create
async function openSite(site) {
  console.log('=== 点击打开网站:', site);

  const urls = {
    chatgpt: 'https://chatgpt.com',
    gemini: 'https://gemini.google.com'
  };

  const url = urls[site.toLowerCase()];
  if (!url) {
    console.error('=== 未知网站:', site);
    showNotification('未知网站: ' + site, 'error');
    return;
  }

  console.log('=== 准备打开:', url);

  try {
    const tab = await chrome.tabs.create({ url });
    console.log('=== 标签创建成功:', tab.id);
    showNotification(`${site} 已在新标签打开`);

    // 等待一秒后刷新标签列表
    setTimeout(refreshTabs, 1000);
  } catch (error) {
    console.error('=== 创建标签失败:', error);
    showNotification('打开失败: ' + error.message, 'error');
  }
}

// 打开分屏页面
async function openSplitScreen() {
  console.log('=== 打开分屏页面 ===');

  try {
    // 获取扩展的 split.html URL
    const splitUrl = chrome.runtime.getURL('split.html');
    const tab = await chrome.tabs.create({ url: splitUrl });
    console.log('=== 分屏页面已打开, 标签ID:', tab.id);
    showNotification('分屏页面已打开');
  } catch (error) {
    console.error('=== 打开分屏页面失败:', error);
    showNotification('打开失败: ' + error.message, 'error');
  }
}

// 切换悬浮输入框
function toggleFloatInput() {
  const toggle = document.getElementById('floatInputToggle');
  floatInputEnabled = toggle.checked;

  console.log('切换悬浮输入框:', floatInputEnabled);

  chrome.storage.local.set({ floatInputEnabled });

  // 通知所有标签页
  chrome.tabs.query({}, (tabs) => {
    console.log('找到标签页数量:', tabs.length);
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'toggleFloatInput',
        enabled: floatInputEnabled
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('标签', tab.id, '发送消息失败:', chrome.runtime.lastError.message);
        } else {
          console.log('标签', tab.id, '悬浮框切换成功');
        }
      });
    });
  });

  if (floatInputEnabled) {
    showNotification('悬浮输入框已启用');
  } else {
    showNotification('悬浮输入框已关闭');
  }
}

// 刷新标签列表
function refreshTabs() {
  chrome.runtime.sendMessage({ action: 'getActiveTabs' }, (response) => {
    if (response && response.tabs) {
      activeTabs = response.tabs;
      renderTabs();
    }
  });
}

// 渲染标签列表
function renderTabs() {
  const tabsList = document.getElementById('tabsList');

  if (activeTabs.length === 0) {
    tabsList.innerHTML = `
      <div class="empty-state">
        <p>暂无活跃标签</p>
        <p class="hint">打开 AI 网站后会自动添加</p>
      </div>
    `;
    return;
  }

  tabsList.innerHTML = activeTabs.map(tab => `
    <div class="tab-item">
      <img class="tab-favicon" src="${tab.favicon || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌐</text></svg>'}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌐</text></svg>'">
      <div class="tab-info">
        <div class="tab-title" title="${escapeHtml(tab.title)}">${escapeHtml(tab.title)}</div>
        <div class="tab-url">${getSiteName(tab.url)}</div>
      </div>
      <button class="tab-remove" data-tab-id="${tab.id}" title="移除">✕</button>
    </div>
  `).join('');

  // 绑定删除按钮事件
  tabsList.querySelectorAll('.tab-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = parseInt(btn.getAttribute('data-tab-id'));
      removeTab(tabId);
    });
  });
}

// 移除标签
function removeTab(tabId) {
  chrome.runtime.sendMessage({ action: 'removeTab', tabId }, () => {
    refreshTabs();
  });
}

// 获取网站名称
function getSiteName(url) {
  if (!url) return '未知网站';

  const siteMap = {
    'chatgpt.com': 'ChatGPT',
    'chat.openai.com': 'ChatGPT',
    'gemini.google.com': 'Gemini'
  };

  for (const [domain, name] of Object.entries(siteMap)) {
    if (url.includes(domain)) {
      return name;
    }
  }

  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return '未知';
  }
}

// 设置输入监听
function setupInputListener() {
  const input = document.getElementById('messageInput');
  const charCount = document.getElementById('charCount');

  input.addEventListener('input', () => {
    charCount.textContent = `${input.value.length} 字符`;
  });

  // 支持 Ctrl+Enter 发送
  input.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      sendMessageToAll();
    }
  });
}

// 发送消息到所有标签
function sendMessageToAll() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();

  if (!message) {
    showNotification('请输入消息', 'error');
    return;
  }

  if (activeTabs.length === 0) {
    showNotification('没有活跃的标签页', 'error');
    return;
  }

  const sendBtn = document.querySelector('.send-btn');
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<span>发送中...</span>';

  chrome.runtime.sendMessage({ action: 'sendMessageToAll', message }, (response) => {
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<span>发送到全部</span><span class="arrow">→</span>';

    if (response && response.success) {
      showStatus(response.results);
      input.value = '';
      document.getElementById('charCount').textContent = '0 字符';
    }
  });
}

// 显示发送状态
function showStatus(results) {
  const statusSection = document.getElementById('statusSection');
  const statusList = document.getElementById('statusList');

  statusSection.style.display = 'block';

  statusList.innerHTML = activeTabs.map((tab, index) => {
    const success = results[index];
    return `
      <div class="status-item ${success ? 'success' : 'error'}">
        <span class="icon">${success ? '✓' : '✗'}</span>
        <span>${getSiteName(tab.url)}: ${success ? '发送成功' : '发送失败'}</span>
      </div>
    `;
  }).join('');

  // 3秒后自动关闭
  setTimeout(() => {
    statusSection.style.display = 'none';
  }, 3000);
}

// 关闭状态
function closeStatus() {
  document.getElementById('statusSection').style.display = 'none';
}

// 显示通知
function showNotification(message, type = 'success') {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease;
    font-size: 14px;
    font-weight: 500;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// HTML 转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
