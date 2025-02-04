interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

interface TelegramUpdate {
  message?: {
    text: string;
    chat: {
      id: string;
    };
    reply_to_message?: {
      text: string;
    };
  };
}

// 存储消息的 Map
const messageStore = new Map<string, string[]>();

// 处理 CORS 预检请求
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// 处理 GET 请求，用于轮询
export async function onRequestGet(context: { request: Request; env: Env }) {
  const url = new URL(context.request.url);
  const domain = url.searchParams.get('domain');
  const sessionId = url.searchParams.get('sessionId');

  if (!domain || !sessionId) {
    return new Response(
      JSON.stringify({ error: 'Missing domain or sessionId' }),
      { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  // 获取该会话的消息
  const key = `${domain}:${sessionId}`;
  const messages = messageStore.get(key) || [];
  
  // 如果有新消息，返回最新的一条并从存储中删除
  if (messages.length > 0) {
    const message = messages.shift();
    messageStore.set(key, messages);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  // 没有新消息时返回成功但不包含消息
  return new Response(
    JSON.stringify({ success: true }),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  console.log('Received webhook request');
  
  try {
    // 解析请求体
    const update: TelegramUpdate = await context.request.json();
    console.log('Received update:', JSON.stringify(update));
    
    // 只处理回复的消息
    if (!update.message?.reply_to_message) {
      console.log('Skipping non-reply message');
      return new Response('OK', { status: 200 });
    }

    // 从原始消息中提取域名和会话ID信息
    const originalMessage = update.message.reply_to_message.text;
    console.log('Original message:', originalMessage);
    
    const domainMatch = originalMessage.match(/Domain: ([^\n]+)/);
    const sessionMatch = originalMessage.match(/Session: ([^\n]+)/);
    
    if (!domainMatch || !sessionMatch) {
      console.error('Missing domain or session info');
      return new Response('OK', { status: 200 });
    }

    const domain = domainMatch[1];
    const sessionId = sessionMatch[1];
    const replyMessage = update.message.text;

    console.log('Processing message:', {
      domain,
      sessionId,
      replyMessage
    });

    // 将消息存储到 Map 中
    const key = `${domain}:${sessionId}`;
    const messages = messageStore.get(key) || [];
    messages.push(replyMessage);
    messageStore.set(key, messages);

    console.log('Stored messages:', messageStore);

    // 返回成功响应
    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    console.error('Error handling telegram webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
} 