import { connections } from './ws';

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

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const update: TelegramUpdate = await context.request.json();
    
    // 只处理回复的消息
    if (!update.message?.reply_to_message) {
      return new Response('OK', { status: 200 });
    }

    // 从原始消息中提取域名信息
    const originalMessage = update.message.reply_to_message.text;
    const domainMatch = originalMessage.match(/Domain: ([^\n]+)/);
    if (!domainMatch) {
      return new Response('OK', { status: 200 });
    }

    const domain = domainMatch[1];
    const replyMessage = update.message.text;

    // 获取对应域名的 WebSocket 连接
    const connection = connections.get(domain);
    if (connection) {
      // @ts-ignore - Cloudflare Workers specific API
      connection.send(JSON.stringify({
        type: 'telegram_reply',
        domain,
        message: replyMessage
      }));
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error handling telegram webhook:', error);
    return new Response('Error', { status: 500 });
  }
} 