interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  MESSAGES: KVNamespace;
}

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
    
    const messagesStr = await context.env.MESSAGES.get(key);
    const allMessages = messagesStr ? JSON.parse(messagesStr) : [];
    console.log('All messages:', allMessages);
    
    const messages = allMessages
      .filter((msg: { timestamp: number }) => msg.timestamp > since)
      .map((msg: { message: string }) => msg.message);
    
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
export async function addMessage(env: Env, domain: string, sessionId: string, message: string) {
  console.log('Adding message:', { domain, sessionId, message });
  
  try {
    const key = `${domain}:${sessionId}`;
    const messagesStr = await env.MESSAGES.get(key);
    const messages = messagesStr ? JSON.parse(messagesStr) : [];
    
    const newMessage = {
      message,
      timestamp: Date.now()
    };
    
    messages.push(newMessage);
    
    // 只保留最近的 100 条消息
    if (messages.length > 100) {
      messages.shift();
    }
    
    await env.MESSAGES.put(key, JSON.stringify(messages));
    
    console.log('Updated messages for key:', key, messages);
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
} 