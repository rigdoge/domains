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

    // 获取 Telegram 更新
    const response = await fetch(
      `https://api.telegram.org/bot${context.env.TELEGRAM_BOT_TOKEN}/getUpdates?offset=-1&limit=10`,
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
        if (!message?.reply_to_message?.text) return false;
        return message.reply_to_message.text.includes(`Domain: ${domain}`);
      })
      .map((update: any) => ({
        text: update.message.text,
        isUser: false,
        timestamp: update.message.date * 1000 // 转换为毫秒
      }))
      .filter((msg: any) => !since || msg.timestamp > parseInt(since));

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