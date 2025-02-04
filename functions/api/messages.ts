interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

// 存储每个会话的消息
const sessionMessages = new Map<string, { message: string; timestamp: number }[]>();

export async function onRequestGet(context: { request: Request; env: Env }) {
  console.log('Received message request');
  
  try {
    const url = new URL(context.request.url);
    const domain = url.searchParams.get('domain');
    const sessionId = url.searchParams.get('sessionId');
    const since = parseInt(url.searchParams.get('since') || '0');

    console.log('Request params:', { domain, sessionId, since });

    if (!domain || !sessionId) {
      console.error('Missing domain or sessionId');
      return new Response(
        JSON.stringify({ error: 'Domain and sessionId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 获取该会话的消息
    const key = `${domain}:${sessionId}`;
    console.log('Fetching messages for key:', key);
    
    const allMessages = sessionMessages.get(key) || [];
    console.log('All messages:', allMessages);
    
    const messages = allMessages
      .filter(msg => msg.timestamp > since)
      .map(msg => msg.message);
    
    console.log('Filtered messages:', messages);

    return new Response(
      JSON.stringify({ messages }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
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
  console.log('Adding message:', { domain, sessionId, message });
  
  const key = `${domain}:${sessionId}`;
  const messages = sessionMessages.get(key) || [];
  
  const newMessage = {
    message,
    timestamp: Date.now()
  };
  
  messages.push(newMessage);
  sessionMessages.set(key, messages);
  
  console.log('Updated messages for key:', key, messages);
  console.log('All sessions:', Array.from(sessionMessages.keys()));
} 