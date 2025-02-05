// 环境变量配置
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (
  typeof window !== 'undefined' && window.location.hostname === 'domains.facesome.com'
    ? 'https://domains.facesome.com'
    : 'https://domains-9vn.pages.dev'
);

// API 端点
export const API_ENDPOINTS = {
  MESSAGES: `${API_BASE_URL}/api/messages`,
  CHAT: `${API_BASE_URL}/api/chat`,
  BID: `${API_BASE_URL}/api/bid`
}; 