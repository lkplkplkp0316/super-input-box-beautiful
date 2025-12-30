// AI 多屏问答 - 分屏功能脚本
// 赛博玻璃主义 UI

// AI 网站配置
const AI_SITES = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    icon: '💬',
    url: 'https://chatgpt.com',
    color: '#10a37f',
    selector: '#prompt-textarea, textarea[placeholder*="Send a message"], div[contenteditable="true"]'
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    icon: '✦',
    url: 'https://gemini.google.com',
    color: '#4285f4',
    selector: 'rich-textarea div[contenteditable="true"]'
  },
  kimi: {
    id: 'kimi',
    name: 'Kimi',
    icon: '☽',
    url: 'https://kimi.moonshot.cn',
    color: '#8b5cf6',
    selector: 'textarea[placeholder*="和 Kimi 聊天"], textarea[placeholder*="请输入"], div[contenteditable="true"], textarea'
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    icon: '◐',
    url: 'https://claude.ai',
    color: '#cc785c',
    selector: 'div[contenteditable="true"], textarea[placeholder*="Talk to Claude"], textarea'
  }
};

// 状态管理
let activeSplits = [];
let isSending = false;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== AI 多屏问答已加载 ===');

  loadSplitConfig();
  loadHeaderCollapseState();
  bindEvents();
  renderSplits();
});

// 绑定事件
function bindEvents() {
  // 收起/展开按钮
  document.getElementById('collapseBtn').addEventListener('click', toggleHeaderCollapse);

  // AI 卡片点击事件
  document.querySelectorAll('.ai-card').forEach(card => {
    card.addEventListener('click', () => {
      const aiId = card.dataset.ai;
      toggleAI(aiId);
    });
  });

  // 清空按钮
  document.querySelector('.clear-btn').addEventListener('click', clearAllSplits);

  // 发送按钮
  document.getElementById('sendBtn').addEventListener('click', sendMessage);

  // 新对话按钮
  document.getElementById('newChatBtn').addEventListener('click', startNewChat);

  // 输入框回车发送
  const mainInput = document.getElementById('mainInput');
  mainInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // 自动调整输入框高度
  mainInput.addEventListener('input', () => {
    mainInput.style.height = 'auto';
    mainInput.style.height = Math.min(mainInput.scrollHeight, 120) + 'px';
  });
}

// 切换头部收起/展开状态
function toggleHeaderCollapse() {
  const header = document.getElementById('mainHeader');
  header.classList.toggle('collapsed');

  // 保存收起状态
  const isCollapsed = header.classList.contains('collapsed');
  localStorage.setItem('headerCollapsed', isCollapsed);
}

// 加载头部收起状态
function loadHeaderCollapseState() {
  const isCollapsed = localStorage.getItem('headerCollapsed') === 'true';
  if (isCollapsed) {
    document.getElementById('mainHeader').classList.add('collapsed');
  }
}

// 切换 AI 添加/移除
function toggleAI(aiId) {
  const index = activeSplits.findIndex(s => s.id === aiId);

  if (index >= 0) {
    // 移除
    activeSplits.splice(index, 1);
  } else {
    // 添加（最多4个）
    if (activeSplits.length >= 4) {
      showNotification('最多只能添加 4 个分屏', 'warning');
      return;
    }
    activeSplits.push({ ...AI_SITES[aiId] });
  }

  saveSplitConfig();
  renderSplits();
  updateAICards();
}

// 更新 AI 卡片状态
function updateAICards() {
  document.querySelectorAll('.ai-card').forEach(card => {
    const aiId = card.dataset.ai;
    const isActive = activeSplits.some(s => s.id === aiId);
    card.classList.toggle('active', isActive);
  });
}

// 渲染分屏
function renderSplits() {
  const container = document.getElementById('splitContainer');
  const inputBar = document.getElementById('inputBar');

  // 空状态
  if (activeSplits.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-animation">
          <div class="floating-icon">⬡</div>
          <div class="ripple-ring"></div>
          <div class="ripple-ring ripple-2"></div>
        </div>
        <h2 class="empty-title">选择 AI 开始对话</h2>
        <p class="empty-desc">点击上方 AI 卡片添加到分屏</p>
        <div class="empty-hint">支持同时对比多个 AI 的回答</div>
      </div>
    `;
    container.className = 'split-container';
    inputBar.style.display = 'none';
    return;
  }

  // 显示输入栏
  inputBar.style.display = 'flex';

  // 设置容器类名
  container.className = 'split-container';
  if (activeSplits.length === 1) container.classList.add('single');
  else if (activeSplits.length === 2) container.classList.add('two');
  else if (activeSplits.length === 3) container.classList.add('three');
  else if (activeSplits.length === 4) container.classList.add('four');

  // 渲染分屏项
  container.innerHTML = activeSplits.map((ai, index) => `
    <div class="split-item" style="animation-delay: ${index * 0.1}s">
      <div class="split-item-header">
        <div class="split-info">
          <span class="split-icon">${ai.icon}</span>
          <span class="split-name">${ai.name}</span>
        </div>
        <div class="split-actions">
          <button class="split-btn remove" data-ai="${ai.id}" title="移除">✕</button>
        </div>
      </div>
      <div class="split-item-content">
        <iframe
          src="${ai.url}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  `).join('');

  // 绑定移除按钮
  container.querySelectorAll('.split-btn.remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const aiId = btn.dataset.ai;
      toggleAI(aiId);
    });
  });
}

// 发送消息到所有 AI
function sendMessage() {
  const input = document.getElementById('mainInput');
  const message = input.value.trim();

  if (!message) {
    showNotification('请输入问题', 'warning');
    return;
  }

  if (isSending) {
    showNotification('正在发送中...', 'info');
    return;
  }

  isSending = true;
  updateStatus('sending');

  // 发送到每个分屏
  activeSplits.forEach(ai => {
    const iframe = document.querySelector(`iframe[src="${ai.url}"]`);
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage({
          type: 'SEARCH_MESSAGE',
          data: {
            searchText: message,
            instanceId: ai.id,
            entrance: 'split_screen',
            jsSelect: ai.selector,
            retry: false
          }
        }, '*');
      } catch (e) {
        console.log(`发送到 ${ai.name} 失败:`, e);
      }
    }
  });

  // 清空输入框
  input.value = '';
  input.style.height = 'auto';

  // 模拟发送完成
  setTimeout(() => {
    isSending = false;
    updateStatus('success');
    showNotification('消息已发送', 'success');

    setTimeout(() => {
      updateStatus('ready');
    }, 2000);
  }, 1000);
}

// 更新状态显示
function updateStatus(status) {
  const statusEl = document.getElementById('inputStatus');
  const statusText = statusEl.querySelector('.status-text');

  statusEl.className = 'input-status';

  switch (status) {
    case 'sending':
      statusEl.classList.add('sending');
      statusText.textContent = '发送中...';
      break;
    case 'success':
      statusEl.classList.add('success');
      statusText.textContent = '已发送';
      break;
    case 'error':
      statusEl.classList.add('error');
      statusText.textContent = '发送失败';
      break;
    default:
      statusText.textContent = '就绪';
  }
}

// 清空所有分屏
function clearAllSplits() {
  if (activeSplits.length === 0) return;

  if (confirm('确定要清空所有分屏吗？')) {
    activeSplits = [];
    saveSplitConfig();
    renderSplits();
    updateAICards();
    showNotification('已清空所有分屏');
  }
}

// 保存配置到 localStorage
function saveSplitConfig() {
  const config = activeSplits.map(s => s.id);
  localStorage.setItem('aiSplitConfig', JSON.stringify(config));
}

// 加载配置
function loadSplitConfig() {
  try {
    const saved = localStorage.getItem('aiSplitConfig');
    if (saved) {
      const config = JSON.parse(saved);
      config.forEach(aiId => {
        if (AI_SITES[aiId]) {
          activeSplits.push({ ...AI_SITES[aiId] });
        }
      });
      updateAICards();
    }
  } catch (e) {
    console.error('加载配置失败:', e);
  }
}

// 显示通知
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 24px;
    padding: 14px 20px;
    background: var(--bg-tertiary);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    color: var(--text-primary);
    font-size: 14px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 10000;
    opacity: 0;
    transform: translateX(400px);
    transition: all 0.3s ease;
  `;

  if (type === 'success') {
    notification.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    notification.style.boxShadow = '0 0 24px rgba(16, 185, 129, 0.2)';
  } else if (type === 'warning') {
    notification.style.borderColor = 'rgba(245, 158, 11, 0.3)';
    notification.style.boxShadow = '0 0 24px rgba(245, 158, 11, 0.2)';
  } else if (type === 'error') {
    notification.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    notification.style.boxShadow = '0 0 24px rgba(239, 68, 68, 0.2)';
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 10);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// 监听来自 iframe 的消息
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'WINDOW_LOADED') {
    console.log('=== iframe 已加载:', event.data.data.instanceId);
  }
});

// 发起新对话
function startNewChat() {
  if (activeSplits.length === 0) {
    showNotification('请先选择 AI', 'warning');
    return;
  }

  console.log('=== 发起新对话 ===');
  updateStatus('正在新建对话...', 'processing');

  let successCount = 0;

  activeSplits.forEach((split) => {
    const aiConfig = AI_SITES[split.aiId];
    if (!aiConfig) return;

    // 通过重新加载 iframe URL 来发起新对话
    const iframe = document.querySelector(`iframe[data-instance-id="${split.instanceId}"]`);
    if (iframe) {
      // 添加时间戳强制刷新
      const timestamp = Date.now();
      iframe.src = aiConfig.url + '?t=' + timestamp;
      console.log('=== 刷新 iframe:', split.aiId, aiConfig.url);
      successCount++;
    }
  });

  if (successCount > 0) {
    showNotification(`已发起 ${successCount} 个新对话`, 'success');
    updateStatus('就绪', 'ready');
  } else {
    showNotification('新对话发起失败', 'error');
    updateStatus('失败', 'error');
  }
}
