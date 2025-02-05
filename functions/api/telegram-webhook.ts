import type { KVNamespace } from '@cloudflare/workers-types';

interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  MESSAGES: KVNamespace;
  PUSH_SUBSCRIPTIONS: KVNamespace;
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

// 发送 Web Push 通知
async function sendPushNotification(env: Env, domain: string, sessionId: string, message: string) {
  try {
    // 获取推送订阅信息
    const key = `push:${domain}:${sessionId}`;
    const subscriptionData = await env.PUSH_SUBSCRIPTIONS.get(key);
    
    if (!subscriptionData) {
      console.log('No push subscription found for:', { domain, sessionId });
      return;
    }

    const subscription = JSON.parse(subscriptionData);

    // 使用 web-push 发送通知
    const webpush = require('web-push');
    
    webpush.setVapidDetails(
      'mailto:admin@facesome.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    await webpush.sendNotification(subscription, JSON.stringify({
      text: message,
      timestamp: Date.now()
    }));

    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  console.log('Received webhook request');
  
  try {
    // 解析请求体
    const update: TelegramUpdate = await context.request.json();
    console.log('Received update:', JSON.stringify(update));
    
    if (!update.message?.text) {
      console.log('No message text');
      return new Response('OK', { status: 200 });
    }

    let domain = 'tqdi.com';  // 默认域名
    let sessionId = 'default';  // 默认会话ID

    // 如果是回复消息，尝试从原始消息中提取域名和会话ID
    if (update.message.reply_to_message) {
      const originalMessage = update.message.reply_to_message.text;
      console.log('Original message:', originalMessage);
      
      const domainMatch = originalMessage.match(/Domain: ([^\n]+)/);
      const sessionMatch = originalMessage.match(/Session: ([^\n]+)/);
      
      if (domainMatch) domain = domainMatch[1];
      if (sessionMatch) sessionId = sessionMatch[1];
    }

    const replyMessage = update.message.text;

    console.log('Processing message:', {
      domain,
      sessionId,
      replyMessage
    });

    // 保存消息
    const { storeMessage } = await import('./messages');
    await storeMessage(context.env, domain, {
      text: replyMessage,
      isUser: false,
      timestamp: Date.now(),
      sessionId
    });

    // 发送推送通知
    await sendPushNotification(context.env, domain, sessionId, replyMessage);

    return new Response('OK', { status: 200 });
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