import type { KVNamespace } from '@cloudflare/workers-types';

interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  MESSAGES: KVNamespace;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  console.log('Received chat request');
  
  try {
    const { message, domain, sessionId, isInitial } = await context.request.json();
    console.log('Chat request data:', { message, domain, sessionId, isInitial });

    // 验证必要的参数
    if (!message || !domain || !sessionId) {
      throw new Error('Missing required parameters');
    }

    // 发送消息到 Telegram
    const telegramMessage = isInitial 
      ? message 
      : `Domain: ${domain}\nSession: ${sessionId}\nMessage: ${message}`;

    console.log('Sending to Telegram:', telegramMessage);

    const response = await fetch(
      `https://api.telegram.org/bot${context.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: context.env.TELEGRAM_CHAT_ID,
          text: telegramMessage,
        }),
      }
    );

    const result = await response.json();
    console.log('Telegram API response:', result);

    if (!response.ok) {
      throw new Error(result.description || 'Failed to send message to Telegram');
    }

    // 如果是初始消息，不需要自动回复
    if (isInitial) {
      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 生成自动回复消息
    const autoReply = `我们已收到您的消息，客服会尽快回复。\n\n您的消息：${message}`;

    // 保存消息到 KV
    const { storeMessage } = await import('./messages');
    await storeMessage(context.env, domain, {
      text: autoReply,
      isUser: false,
      timestamp: Date.now(),
      sessionId
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: autoReply
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in chat API:', error);
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