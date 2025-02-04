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

export async function onRequestPost(context: { request: Request; env: Env }) {
  console.log('Received webhook request');
  
  try {
    // 解析请求体
    const update: TelegramUpdate = await context.request.json();
    console.log('Received update:', JSON.stringify(update));
    
    // 如果是轮询请求，检查域名和会话ID
    if (!update.message?.text && update.message?.reply_to_message?.text) {
      const originalMessage = update.message.reply_to_message.text;
      const domainMatch = originalMessage.match(/Domain: ([^\n]+)/);
      const sessionMatch = originalMessage.match(/Session: ([^\n]+)/);
      
      if (domainMatch && sessionMatch) {
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
    }
    
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

    // 返回消息给前端
    return new Response(
      JSON.stringify({ 
        success: true,
        message: replyMessage
      }),
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