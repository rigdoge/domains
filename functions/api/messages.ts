interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

// 存储每个域名的消息
const domainMessages = new Map<string, { message: string; timestamp: number }[]>();

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const domain = url.searchParams.get('domain');
    const since = parseInt(url.searchParams.get('since') || '0');

    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 获取该域名的新消息
    const messages = (domainMessages.get(domain) || [])
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
export function addMessage(domain: string, message: string) {
  const messages = domainMessages.get(domain) || [];
  messages.push({
    message,
    timestamp: Date.now()
  });
  domainMessages.set(domain, messages);
} 