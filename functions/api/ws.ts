interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

interface WebSocketEvent {
  data: string;
}

interface WebSocket {
  accept(): void;
  send(data: string): void;
  addEventListener(type: string, handler: (event: WebSocketEvent) => void): void;
}

interface WebSocketPair {
  0: WebSocket;
  1: WebSocket;
}

declare function WebSocketPair(): WebSocketPair;

export async function onRequest(context: { request: Request; env: Env }) {
  const upgradeHeader = context.request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  // @ts-ignore - Cloudflare Workers specific API
  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair);

  // @ts-ignore - Cloudflare Workers specific API
  server.accept();

  const url = new URL(context.request.url);
  const domain = url.searchParams.get('domain');
  if (domain) {
    // @ts-ignore - Cloudflare Workers specific API
    server.send(JSON.stringify({ type: 'connected', domain }));
  }

  // @ts-ignore - Cloudflare Workers specific API
  server.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      // 可以在这里处理特定的消息类型
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  return new Response(null, {
    status: 101,
    // @ts-ignore - Cloudflare Workers specific API
    webSocket: client,
  });
} 