export class WebSocketConnection {
  state: DurableObjectState;
  sessions: Map<string, WebSocket>;
  env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    // 处理 WebSocket 连接
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      const domain = url.searchParams.get('domain');

      server.accept();
      if (domain) {
        this.sessions.set(domain, server);
        server.send(JSON.stringify({ type: 'connected', domain }));
      }

      server.addEventListener('close', () => {
        if (domain) {
          this.sessions.delete(domain);
        }
      });

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // 处理 Telegram 回复
    if (url.pathname === '/telegram-reply') {
      const { domain, message } = await request.json();
      const session = this.sessions.get(domain);
      
      if (session) {
        session.send(JSON.stringify({
          type: 'telegram_reply',
          domain,
          message
        }));
      }

      return new Response('OK');
    }

    return new Response('Not Found', { status: 404 });
  }
} 