// 在 Node.js 环境中运行这个脚本来生成占位图标
// 或者直接用下面的 SVG 数据

const fs = require('fs');
// 这是一个简单的占位 SVG，会作为 base64 编码的 PNG 使用

// SVG 图标数据（火箭图标）
const svgIcon = `
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="24" fill="url(#grad)"/>
  <text x="64" y="80" font-family="Arial" font-size="64" text-anchor="middle" fill="white">🚀</text>
</svg>
`;

console.log('SVG 图标已生成');
console.log('你可以使用在线工具将 SVG 转换为 PNG：');
console.log('https://cloudconvert.com/svg-to-png');
