interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const domain = url.searchParams.get('domain');
    const since = url.searchParams.get('since');

    if (!domain) {
      throw new Error('Missing domain parameter');
    }

    // 获取 Telegram 更新，使用 offset 参数获取所有新消息
    const response = await fetch(
      `https://api.telegram.org/bot${context.env.TELEGRAM_BOT_TOKEN}/getUpdates?offset=-100&limit=100`,
      {
        method: 'GET',
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.description || 'Failed to get messages from Telegram');
    }

    // 过滤出相关的消息
    const messages = data.result
      .filter((update: any) => {
        const message = update.message;
        // 检查是否是回复消息，且回复的原始消息包含当前域名
        if (!message?.reply_to_message?.text) return false;
        const originalMessage = message.reply_to_message.text;
        return originalMessage.includes(`Domain: ${domain}`);
      })
      .map((update: any) => ({
        text: update.message.text,
        isUser: false,
        timestamp: update.message.date * 1000 // 转换为毫秒
      }))
      // 只返回指定时间之后的消息
      .filter((msg: any) => !since || msg.timestamp > parseInt(since))
      // 按时间戳排序
      .sort((a: any, b: any) => a.timestamp - b.timestamp);

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