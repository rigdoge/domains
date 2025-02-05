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

export async function onRequestGet(context: { request: Request; env: Env }) {
  console.log('Received messages request');
  
  try {
    const url = new URL(context.request.url);
    const domain = url.searchParams.get('domain');
    const since = url.searchParams.get('since');

    console.log('Request params:', { domain, since });

    if (!domain) {
      console.error('Missing domain parameter');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing domain parameter' 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 检查 KV 是否正确配置
    if (!context.env.MESSAGES) {
      console.error('KV namespace MESSAGES is not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'KV storage is not properly configured' 
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

    // 从 KV 获取消息
    const messagesKey = `messages:${domain}`;
    console.log('Fetching messages for key:', messagesKey);
    
    const storedData = await context.env.MESSAGES.get(messagesKey);
    console.log('Stored data:', storedData);
    
    let messages: Message[] = [];
    if (storedData) {
      try {
        messages = JSON.parse(storedData);
        console.log('Parsed messages:', messages);
      } catch (parseError) {
        console.error('Error parsing stored messages:', parseError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid message data format' 
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

    // 清理过期消息
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    messages = messages.filter(msg => msg.timestamp > oneWeekAgo);
    console.log('Messages after cleanup:', messages);

    // 过滤出指定时间之后的消息
    const filteredMessages = since 
      ? messages.filter(msg => msg.timestamp > parseInt(since))
      : messages;

    console.log('Filtered messages:', filteredMessages);

    // 按时间戳排序
    filteredMessages.sort((a, b) => a.timestamp - b.timestamp);

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
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
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
  console.log('Storing message:', { domain, message });
  
  try {
    // 检查 KV 是否正确配置
    if (!env.MESSAGES) {
      console.error('KV namespace MESSAGES is not configured');
      throw new Error('KV storage is not properly configured');
    }
    
    const messagesKey = `messages:${domain}`;
    console.log('Using key:', messagesKey);
    
    const storedData = await env.MESSAGES.get(messagesKey);
    console.log('Existing stored data:', storedData);
    
    let messages: Message[] = [];
    if (storedData) {
      try {
        messages = JSON.parse(storedData);
      } catch (parseError) {
        console.error('Error parsing existing messages:', parseError);
        throw new Error('Invalid existing message data format');
      }
    }
    console.log('Existing messages:', messages);
    
    messages.push(message);
    
    // 清理过期消息
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const validMessages = messages.filter(msg => msg.timestamp > oneWeekAgo);
    
    const dataToStore = JSON.stringify(validMessages);
    console.log('Storing data:', dataToStore);
    
    await env.MESSAGES.put(messagesKey, dataToStore);
    console.log('Message stored successfully');
  } catch (error) {
    console.error('Error storing message:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
} 