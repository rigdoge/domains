import type { KVNamespace } from '@cloudflare/workers-types';

interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  MESSAGES: KVNamespace;
  PUSH_SUBSCRIPTIONS: KVNamespace;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { subscription, domain, sessionId } = await context.request.json();

    // 保存订阅信息到 KV
    const key = `push:${domain}:${sessionId}`;
    await context.env.PUSH_SUBSCRIPTIONS.put(key, JSON.stringify(subscription));

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
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

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
} 