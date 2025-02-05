interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  MESSAGES: KVNamespace;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const domain = url.searchParams.get('domain');
    const since = url.searchParams.get('since');

    if (!domain) {
      throw new Error('Missing domain parameter');
    }

    // 从 KV 存储获取消息
    const messagesKey = `messages:${domain}`;
    const storedMessages = await context.env.MESSAGES.get(messagesKey);
    let messages = storedMessages ? JSON.parse(storedMessages) : [];

    // 过滤出指定时间之后的消息
    if (since) {
      messages = messages.filter((msg: any) => msg.timestamp > parseInt(since));
    }

    // 按时间戳排序
    messages.sort((a: any, b: any) => a.timestamp - b.timestamp);

    console.log('Filtered messages:', messages);

    return new Response(
      JSON.stringify({ success: true, messages }),
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