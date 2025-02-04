export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      
      // 处理 WebSocket 连接
      if (url.pathname === '/api/ws') {
        const module = await import('./api/ws.ts');
        return module.onRequest({ request, env });
      }

      // 处理 Telegram Webhook
      if (url.pathname === '/api/telegram-webhook') {
        const module = await import('./api/telegram-webhook.ts');
        return module.onRequestPost({ request, env });
      }
      
      // 处理其他 API 请求
      if (url.pathname.startsWith('/api/')) {
        const module = await import(`.${url.pathname}.ts`);
        if (module.onRequestPost && request.method === 'POST') {
          return module.onRequestPost({ request, env });
        }
        return new Response('Not Found', { status: 404 });
      }

      // 处理静态文件
      const response = await env.ASSETS.fetch(request);
      return response;
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Server Error', { status: 500 });
    }
  }
}; 