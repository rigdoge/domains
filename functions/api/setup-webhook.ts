interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const webhookUrl = `${baseUrl}/api/telegram-webhook`;

    // 设置 Webhook
    const response = await fetch(
      `https://api.telegram.org/bot${context.env.TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message']
        }),
      }
    );

    const data = await response.json();

    return new Response(
      JSON.stringify({ 
        success: true,
        webhook_url: webhookUrl,
        telegram_response: data
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: response.ok ? 200 : 500
      }
    );
  } catch (error) {
    console.error('Error setting webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 