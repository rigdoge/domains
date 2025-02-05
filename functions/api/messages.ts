import fs from 'fs';
import path from 'path';

interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

interface Message {
  text: string;
  isUser: boolean;
  timestamp: number;
  sessionId: string;
}

// 使用内存存储消息
const messageStore: { [domain: string]: Message[] } = {};

// 清理过期消息
function cleanupMessages() {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const domain in messageStore) {
    messageStore[domain] = messageStore[domain].filter(msg => msg.timestamp > oneWeekAgo);
    if (messageStore[domain].length === 0) {
      delete messageStore[domain];
    }
  }
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const domain = url.searchParams.get('domain');
    const since = url.searchParams.get('since');

    if (!domain) {
      throw new Error('Missing domain parameter');
    }

    // 清理过期消息
    cleanupMessages();

    // 获取消息
    const messages = messageStore[domain] || [];

    // 过滤出指定时间之后的消息
    const filteredMessages = since 
      ? messages.filter(msg => msg.timestamp > parseInt(since))
      : messages;

    // 按时间戳排序
    filteredMessages.sort((a, b) => a.timestamp - b.timestamp);

    console.log('Filtered messages:', filteredMessages);

    return new Response(
      JSON.stringify({ success: true, messages: filteredMessages }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in messages API:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// 导出存储消息的函数供其他模块使用
export function storeMessage(domain: string, message: Message) {
  if (!messageStore[domain]) {
    messageStore[domain] = [];
  }
  messageStore[domain].push(message);
  console.log(`Stored message for ${domain}:`, message);
  console.log('Current messages:', messageStore[domain]);
} 