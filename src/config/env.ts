// 环境变量配置
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://domains.facesome.com';

// API 端点
export const API_ENDPOINTS = {
  MESSAGES: `${API_BASE_URL}/api/messages`,
  CHAT: `${API_BASE_URL}/api/chat`,
  BID: `${API_BASE_URL}/api/bid`,
  PUSH_SUBSCRIPTION: `${API_BASE_URL}/api/push-subscription`
}; 