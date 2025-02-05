/**
 * Cloudflare Pages Functions
 * 注意：
 * 1. 这是 Pages Functions 而不是 Workers
 * 2. 不能使用 fs、path 等 Node.js 模块
 * 3. 使用 KV 存储消息
 */

interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  MESSAGES: KVNamespace;
}

interface Message {
  text: string;
  isUser: boolean;
  timestamp: number;
  sessionId: string;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const domain = url.searchParams.get('domain');
    const since = url.searchParams.get('since');

    if (!domain) {
      throw new Error('Missing domain parameter');
    }

    // 从 KV 获取消息
    const messagesKey = `messages:${domain}`;
    const storedData = await context.env.MESSAGES.get(messagesKey);
    let messages: Message[] = storedData ? JSON.parse(storedData) : [];

    // 清理过期消息
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    messages = messages.filter(msg => msg.timestamp > oneWeekAgo);

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
export async function storeMessage(env: Env, domain: string, message: Message) {
  const messagesKey = `messages:${domain}`;
  const storedData = await env.MESSAGES.get(messagesKey);
  const messages: Message[] = storedData ? JSON.parse(storedData) : [];
  
  messages.push(message);
  
  // 清理过期消息
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const validMessages = messages.filter(msg => msg.timestamp > oneWeekAgo);
  
  await env.MESSAGES.put(messagesKey, JSON.stringify(validMessages));
  console.log(`Stored message for ${domain}:`, message);
  console.log('Current messages:', validMessages);
} 