// 专门注入到 iframe 中的脚本
// 这个脚本会在 AI 网站的 iframe 中运行

console.log('=== iframe-inject.js 已加载 ===');
console.log('=== 当前 URL:', window.location.href);
console.log('=== 是否在 iframe 中:', window !== window.top);

// 监听来自分屏页面的消息
window.addEventListener('message', (event) => {
  console.log('=== iframe-inject 收到消息:', event.data);

  if (event.data && event.data.action === 'INJECT_MESSAGE') {
    console.log('=== 收到 INJECT_MESSAGE，消息内容:', event.data.message);

    // 尝试找到输入框并填充
    const message = event.data.message;

    // ChatGPT
    if (window.location.hostname.includes('chatgpt.com') || window.location.hostname.includes('chat.openai.com')) {
      const textarea = document.getElementById('prompt-textarea') || document.querySelector('textarea[placeholder*="Send a message"]');
      if (textarea) {
        textarea.value = message;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('=== ChatGPT 输入框已填充');

        // 尝试点击发送按钮
        setTimeout(() => {
          const sendBtn = document.querySelector('button[data-testid="send-button"]');
          if (sendBtn) {
            sendBtn.click();
            console.log('=== ChatGPT 已发送');
          }
        }, 100);
      }
    }

    // Gemini
    if (window.location.hostname.includes('gemini.google.com')) {
      const richTextarea = document.querySelector('rich-textarea');
      if (richTextarea) {
        const editableDiv = richTextarea.querySelector('div[contenteditable="true"]');
        if (editableDiv) {
          editableDiv.textContent = message;
          editableDiv.dispatchEvent(new Event('input', { bubbles: true }));
          console.log('=== Gemini 输入框已填充');

          // 尝试发送
          setTimeout(() => {
            const enterEvent = new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              bubbles: true
            });
            editableDiv.dispatchEvent(enterEvent);
            console.log('=== Gemini 已尝试发送');
          }, 300);
        }
      }
    }

    // Claude
    if (window.location.hostname.includes('claude.ai')) {
      const editableDiv = document.querySelector('div[contenteditable="true"]');
      if (editableDiv) {
        editableDiv.textContent = message;
        editableDiv.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('=== Claude 输入框已填充');

        setTimeout(() => {
          const sendBtn = document.querySelector('button[aria-label="Send Message"]');
          if (sendBtn) {
            sendBtn.click();
            console.log('=== Claude 已发送');
          }
        }, 100);
      }
    }
  }
});

// 通知分屏页面脚本已准备好
if (window !== window.top) {
  window.parent.postMessage({
    action: 'IFRAME_SCRIPT_READY',
    url: window.location.href
  }, '*');
}
