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

// 从 URL 获取消息
async function getMessages(domain: string): Promise<Message[]> {
  try {
    const response = await fetch(`https://domains.facesome.com/messages/${domain}.json`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
  }
  return [];
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const domain = url.searchParams.get('domain');
    const since = url.searchParams.get('since');

    if (!domain) {
      throw new Error('Missing domain parameter');
    }

    const messages = await getMessages(domain);

    // 清理超过一周的消息
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const validMessages = messages.filter(msg => msg.timestamp > oneWeekAgo);

    // 过滤出指定时间之后的消息
    const filteredMessages = since 
      ? validMessages.filter(msg => msg.timestamp > parseInt(since))
      : validMessages;

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
export async function storeMessage(domain: string, message: Message) {
  const messages = await getMessages(domain);
  messages.push(message);

  // 创建一个新的 JSON 文件
  const response = await fetch(`https://domains.facesome.com/messages/${domain}.json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error('Failed to store message');
  }
} 