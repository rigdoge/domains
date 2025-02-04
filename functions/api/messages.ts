interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

// 存储每个会话的消息
const sessionMessages = new Map<string, { message: string; timestamp: number }[]>();

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const domain = url.searchParams.get('domain');
    const sessionId = url.searchParams.get('sessionId');
    const since = parseInt(url.searchParams.get('since') || '0');

    if (!domain || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Domain and sessionId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 获取该会话的消息
    const key = `${domain}:${sessionId}`;
    const messages = (sessionMessages.get(key) || [])
      .filter(msg => msg.timestamp > since)
      .map(msg => msg.message);

    return new Response(
      JSON.stringify({ messages }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting messages:', error);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// 添加消息的辅助函数
export function addMessage(domain: string, sessionId: string, message: string) {
  const key = `${domain}:${sessionId}`;
  const messages = sessionMessages.get(key) || [];
  messages.push({
    message,
    timestamp: Date.now()
  });
  sessionMessages.set(key, messages);
} 