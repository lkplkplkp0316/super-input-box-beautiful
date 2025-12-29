// 内容脚本 - 在网页中运行，负责自动填充和发送消息

let isInIframe = window !== window.top;

if (isInIframe) {
  console.log('=== Content Script 在 iframe 中运行 ===');
  console.log('=== 当前 URL:', window.location.href);
}

// AI 网站选择器配置
const AI_SELECTORS = {
  chatgpt: {
    hostnames: ['chatgpt.com', 'chat.openai.com'],
    selector: '#prompt-textarea, textarea[placeholder*="Send a message"], div[contenteditable="true"]'
  },
  gemini: {
    hostnames: ['gemini.google.com'],
    selector: 'rich-textarea div[contenteditable="true"]'
  },
  kimi: {
    hostnames: ['kimi.moonshot.cn', 'moonshot.cn'],
    selector: 'textarea[placeholder*="和 Kimi 聊天"], textarea[placeholder*="请输入"], div[contenteditable="true"], textarea'
  },
  claude: {
    hostnames: ['claude.ai', 'anthropic.com'],
    selector: 'div[contenteditable="true"], textarea[placeholder*="Talk to Claude"], textarea'
  },
  deepseek: {
    hostnames: ['chat.deepseek.com', 'deepseek.com'],
    selector: 'textarea#chat-input, textarea[placeholder*="输入消息"], textarea'
  }
};

// 检测当前网站
function detectSite() {
  const hostname = window.location.hostname.toLowerCase();

  for (const [site, config] of Object.entries(AI_SELECTORS)) {
    if (config.hostnames.some(h => hostname.includes(h))) {
      return site;
    }
  }
  return 'unknown';
}

// 通用的输入和发送函数
function inputAndSend(message, selector, retry = false) {
  return new Promise((resolve) => {
    try {
      // 支持多个选择器（用逗号分隔）
      const selectors = selector.split(',').map(s => s.trim());
      let element = null;

      // 尝试每个选择器
      for (const sel of selectors) {
        element = document.querySelector(sel);
        if (element) {
          console.log('=== 使用选择器找到输入框:', sel);
          break;
        }
      }

      if (!element) {
        console.log('=== 未找到输入框，选择器:', selector);
        if (!retry) {
          // 重试一次
          setTimeout(() => {
            inputAndSend(message, selector, true).then(resolve);
          }, 1000);
        } else {
          resolve(false);
        }
        return;
      }

      console.log('=== 找到输入框:', element);

      // 聚焦元素
      element.click();
      element.focus();

      // 判断元素类型并输入
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        // 使用原生 value setter
        try {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
          ) || Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          );
          nativeInputValueSetter.set.call(element, message);

          const inputEvent = new Event('input', { bubbles: true });
          element.dispatchEvent(inputEvent);
        } catch (e) {
          element.value = message;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else {
        // contenteditable div，使用 execCommand
        try {
          document.execCommand('insertText', false, message);
        } catch (e) {
          element.textContent = message;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }

      console.log('=== 文本已输入:', message);

      // 等待一下后发送（模拟回车）
      setTimeout(() => {
        const events = ['keydown', 'keypress', 'keyup'];
        events.forEach(eventType => {
          const enterEvent = new KeyboardEvent(eventType, {
            bubbles: true,
            cancelable: true,
            composed: true,
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            charCode: eventType === 'keypress' ? 13 : 0
          });
          element.dispatchEvent(enterEvent);
        });

        console.log('=== Enter 事件已触发');
        resolve(true);
      }, 100);

    } catch (error) {
      console.error('=== 输入发送失败:', error);
      resolve(false);
    }
  });
}

// 页面加载完成通知父窗口
window.addEventListener('load', () => {
  console.log('=== 页面已加载');

  // 通知父窗口页面已加载
  if (isInIframe) {
    window.parent.postMessage({
      type: 'WINDOW_LOADED',
      data: {
        instanceId: window.location.href
      }
    }, '*');
  }

  // 检测并添加标签
  const site = detectSite();
  if (site !== 'unknown' && isInIframe) {
    chrome.runtime.sendMessage({ action: 'addTab' }, (response) => {
      console.log('=== addTab 响应:', response);
    });
  }
});

// 监听来自父窗口的消息
window.addEventListener('message', (event) => {
  console.log('=== content.js 收到 postMessage:', event.data);

  if (!event.data || event.data.type !== 'SEARCH_MESSAGE') {
    return;
  }

  const data = event.data.data;
  const site = detectSite();

  console.log('=== 收到 SEARCH_MESSAGE, site:', site);
  console.log('=== 消息内容:', data.searchText);

  // 优先使用消息中的自定义选择器
  let selector = data.jsSelect;

  // 如果没有提供自定义选择器，使用预设的选择器
  if (!selector) {
    const siteConfig = AI_SELECTORS[site];
    if (!siteConfig) {
      console.log('=== 不支持的网站:', site);
      return;
    }
    selector = siteConfig.selector;
  }

  // 输入并发送
  inputAndSend(data.searchText, selector, data.retry)
    .then((success) => {
      console.log('=== 发送结果:', success);

      // 追踪事件（可选）
      chrome.runtime.sendMessage({
        action: 'trackUTEvent',
        data: {
          eventId: '19999',
          pageName: 'super_input_box',
          eventType: 'dialog_start_result',
          args: {
            result: success ? 'success' : 'fail',
            query: data.searchText,
            name: site,
            entrance: data.entrance || 'split_screen'
          }
        }
      });
    });
});

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('=== 收到来自 background 的消息:', request);

  if (request.action === 'injectMessage') {
    const site = detectSite();
    const siteConfig = AI_SELECTORS[site];

    if (siteConfig) {
      inputAndSend(request.message, siteConfig.selector)
        .then((success) => {
          sendResponse({ success });
        });
      return true; // 异步响应
    } else {
      sendResponse({ success: false, error: 'Unsupported site' });
    }
  }

  return true;
});
