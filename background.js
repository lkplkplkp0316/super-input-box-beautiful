// 背景服务脚本 - 管理插件状态和标签页

let activeTabs = new Map(); // 存储活跃的分屏标签页

// 插件安装时 - 注册网络请求规则
chrome.runtime.onInstalled.addListener(async () => {
  console.log('=== 超级输入框插件已安装 ===');

  // 注册 declarativeNetRequest 规则以移除 X-Frame-Options 和 CSP
  try {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIds = rules.map(rule => rule.id);

    // 删除所有现有规则
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds
    });

    // 添加新规则 - 移除 AI 网站的 X-Frame-Options 和 CSP 头
    // 注意：使用正确的 urlFilter 格式（必须以 || 或 | 开头表示匹配协议）
    const rulesToAdd = [
      {
        id: 1,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          responseHeaders: [
            { header: 'X-Frame-Options', operation: 'remove' },
            { header: 'Content-Security-Policy', operation: 'remove' },
            { header: 'X-Content-Type-Options', operation: 'remove' }
          ]
        },
        condition: {
          urlFilter: '||chatgpt.com/*',
          resourceTypes: ['main_frame', 'sub_frame']
        }
      },
      {
        id: 2,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          responseHeaders: [
            { header: 'X-Frame-Options', operation: 'remove' },
            { header: 'Content-Security-Policy', operation: 'remove' },
            { header: 'X-Content-Type-Options', operation: 'remove' }
          ]
        },
        condition: {
          urlFilter: '||chat.openai.com/*',
          resourceTypes: ['main_frame', 'sub_frame']
        }
      },
      {
        id: 3,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          responseHeaders: [
            { header: 'X-Frame-Options', operation: 'remove' },
            { header: 'Content-Security-Policy', operation: 'remove' },
            { header: 'X-Content-Type-Options', operation: 'remove' }
          ]
        },
        condition: {
          urlFilter: '||gemini.google.com/*',
          resourceTypes: ['main_frame', 'sub_frame']
        }
      },
      {
        id: 4,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          responseHeaders: [
            { header: 'X-Frame-Options', operation: 'remove' },
            { header: 'Content-Security-Policy', operation: 'remove' },
            { header: 'X-Content-Type-Options', operation: 'remove' }
          ]
        },
        condition: {
          urlFilter: '||claude.ai/*',
          resourceTypes: ['main_frame', 'sub_frame']
        }
      },
      {
        id: 5,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          responseHeaders: [
            { header: 'X-Frame-Options', operation: 'remove' },
            { header: 'Content-Security-Policy', operation: 'remove' },
            { header: 'X-Content-Type-Options', operation: 'remove' }
          ]
        },
        condition: {
          urlFilter: '||kimi.moonshot.cn/*',
          resourceTypes: ['main_frame', 'sub_frame']
        }
      },
      {
        id: 6,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          responseHeaders: [
            { header: 'X-Frame-Options', operation: 'remove' },
            { header: 'Content-Security-Policy', operation: 'remove' },
            { header: 'X-Content-Type-Options', operation: 'remove' }
          ]
        },
        condition: {
          urlFilter: '||moonshot.cn/*',
          resourceTypes: ['main_frame', 'sub_frame']
        }
      },
      {
        id: 7,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          responseHeaders: [
            { header: 'X-Frame-Options', operation: 'remove' },
            { header: 'Content-Security-Policy', operation: 'remove' },
            { header: 'X-Content-Type-Options', operation: 'remove' }
          ]
        },
        condition: {
          urlFilter: '||accounts.google.com/*',
          resourceTypes: ['main_frame', 'sub_frame']
        }
      }
    ];

    console.log('=== 尝试注册', rulesToAdd.length, '条规则 ===');

    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rulesToAdd
    });

    console.log('=== 网络请求规则已注册 ===');
  } catch (error) {
    console.error('=== 注册规则失败:', error);
  }
});

// 点击插件图标时 - 打开分屏页面
chrome.action.onClicked.addListener(async (tab) => {
  console.log('=== 点击插件图标 ===');

  // 获取 split.html 的 URL
  const splitUrl = chrome.runtime.getURL('split.html');

  // 检查是否已经打开分屏页面
  const tabs = await chrome.tabs.query({});
  const existingTab = tabs.find(t => t.url && t.url.includes('split.html'));

  if (existingTab) {
    // 如果已打开，切换到该标签页
    await chrome.tabs.update(existingTab.id, { active: true });
    await chrome.windows.update(existingTab.windowId, { focused: true });
  } else {
    // 否则打开新的分屏页面
    await chrome.tabs.create({
      url: splitUrl
    });
  }
});

// 接收来自 popup 和内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('=== Background 收到消息:', request.action, JSON.stringify(request));

  // 立即发送响应，防止通道关闭
  let responded = false;

  const safeSendResponse = (data) => {
    if (!responded) {
      console.log('=== 发送响应:', JSON.stringify(data));
      responded = true;
      try {
        sendResponse(data);
      } catch (e) {
        console.error('=== sendResponse 出错:', e);
      }
    }
  };

  switch (request.action) {
    case 'addTab':
      if (!sender.tab) {
        safeSendResponse({ success: false, error: 'No tab info' });
        return true;
      }
      // 添加到活跃标签列表
      activeTabs.set(sender.tab.id, {
        id: sender.tab.id,
        url: sender.tab.url,
        title: sender.tab.title,
        favicon: sender.tab.favIconUrl
      });
      console.log('=== 添加标签:', sender.tab.id, sender.tab.url);
      safeSendResponse({ success: true, tabs: Array.from(activeTabs.values()) });
      return true;

    case 'removeTab':
      activeTabs.delete(request.tabId);
      safeSendResponse({ success: true, tabs: Array.from(activeTabs.values()) });
      return true;

    case 'getActiveTabs':
      safeSendResponse({ tabs: Array.from(activeTabs.values()) });
      return true;

    case 'manualAddTab':
      // 从分屏页面手动添加 AI 网站
      const siteKey = request.siteKey;
      const url = request.url;

      console.log('=== 手动添加网站:', siteKey, url);

      // 检查是否已经存在该网站的虚拟标签页
      let existingVirtualId = null;
      for (const [tabId, tabInfo] of activeTabs.entries()) {
        if (tabInfo.isVirtual && tabInfo.siteKey === siteKey) {
          existingVirtualId = tabId;
          break;
        }
      }

      if (existingVirtualId) {
        console.log('=== 虚拟标签页已存在:', existingVirtualId);
        safeSendResponse({ success: true, tabs: Array.from(activeTabs.values()), exists: true });
        return true;
      }

      // 直接创建虚拟条目，不查找外部标签页
      // 因为分屏页面的 iframe 不能通过 chrome.tabs.sendMessage 访问
      const virtualId = `virtual-${siteKey}-${Date.now()}`;
      activeTabs.set(virtualId, {
        id: virtualId,
        url: url,
        title: `${siteKey.toUpperCase()} (分屏)`,
        favicon: null,
        isVirtual: true,
        siteKey: siteKey  // 保存 siteKey 用于后续识别
      });
      console.log('=== 创建虚拟标签页:', virtualId);
      safeSendResponse({ success: true, tabs: Array.from(activeTabs.values()), virtual: true });
      return true;

    case 'sendMessageToAll':
      // 向所有活跃标签发送消息
      const message = request.message;
      let promises = [];
      let virtualTabs = [];

      activeTabs.forEach((tabInfo, tabId) => {
        // 检查是否是虚拟标签页（分屏页面）
        if (tabInfo.isVirtual) {
          console.log('=== 跳过虚拟标签页:', tabId);
          virtualTabs.push(tabInfo);
          return; // 跳过虚拟标签页
        }

        const promise = chrome.tabs.sendMessage(tabId, {
          action: 'injectMessage',
          message: message
        }).catch(() => {
          console.log(`标签 ${tabId} 无响应，移除`);
          activeTabs.delete(tabId);
        });
        promises.push(promise);
      });

      // 如果有虚拟标签页，尝试向分屏页面发送消息
      if (virtualTabs.length > 0) {
        console.log('=== 有虚拟标签页，需要通过分屏页面发送');

        // 查找分屏页面标签
        chrome.tabs.query({ url: chrome.runtime.getURL('split.html') }, (tabs) => {
          if (tabs.length > 0) {
            const splitTab = tabs[0];
            console.log('=== 找到分屏页面:', splitTab.id);

            // 向分屏页面发送消息，让它转发到 iframe
            chrome.tabs.sendMessage(splitTab.id, {
              action: 'sendMessageToSplit',
              message: message
            }, (response) => {
              console.log('=== 分屏页面响应:', response);
            });
          } else {
            console.log('=== 未找到分屏页面');
          }
        });
      }

      Promise.allSettled(promises).then(results => {
        safeSendResponse({
          success: true,
          results: results.map(r => r.status === 'fulfilled')
        });
      });
      return true;

    case 'sendMessageToOthers':
      // 从悬浮框发送到其他标签（排除当前标签）
      const msg = request.message;
      let promisesOthers = [];
      const currentTabId = sender.tab ? sender.tab.id : -1;

      activeTabs.forEach((tabInfo, tabId) => {
        if (tabId !== currentTabId) {
          const promise = chrome.tabs.sendMessage(tabId, {
            action: 'injectMessage',
            message: msg
          }).catch(() => {
            console.log(`标签 ${tabId} 无响应，移除`);
            activeTabs.delete(tabId);
          });
          promisesOthers.push(promise);
        }
      });

      Promise.allSettled(promisesOthers).then(results => {
        safeSendResponse({
          success: true,
          results: results.map(r => r.status === 'fulfilled'),
          count: results.length
        });
      });
      return true;

    case 'trackUTEvent':
      // 追踪事件（可选，用于分析）
      console.log('=== 追踪事件:', request.data);
      safeSendResponse({ success: true });
      return true;

    default:
      console.log('=== 未知动作:', request.action);
      safeSendResponse({ success: false, error: 'Unknown action' });
      return true;
  }
});

// 标签页更新时
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && activeTabs.has(tabId)) {
    activeTabs.set(tabId, {
      id: tabId,
      url: tab.url,
      title: tab.title,
      favicon: tab.favIconUrl
    });
  }
});

// 标签页关闭时
chrome.tabs.onRemoved.addListener((tabId) => {
  activeTabs.delete(tabId);
});
