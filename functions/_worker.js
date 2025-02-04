export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      console.log('Request URL:', url.toString());
      console.log('Request method:', request.method);
      
      // 处理 API 请求
      if (url.pathname.startsWith('/api/')) {
        // 处理 OPTIONS 请求
        if (request.method === 'OPTIONS') {
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

        // 获取 API 路径
        const apiPath = url.pathname.replace('/api/', '');
        console.log('API path:', apiPath);
        
        // 根据路径调用相应的处理函数
        switch (apiPath) {
          case 'bid':
            if (request.method === 'POST') {
              const { onRequestPost } = await import('./api/bid.ts');
              return await onRequestPost({ request, env });
            }
            break;

          case 'chat':
            if (request.method === 'POST') {
              const { onRequestPost } = await import('./api/chat.ts');
              return await onRequestPost({ request, env });
            }
            break;

          case 'telegram-webhook':
            if (request.method === 'POST') {
              const { onRequestPost } = await import('./api/telegram-webhook.ts');
              return await onRequestPost({ request, env });
            }
            break;

          case 'setup-webhook':
            if (request.method === 'POST') {
              const { onRequestPost } = await import('./api/setup-webhook.ts');
              return await onRequestPost({ request, env });
            }
            break;
        }

        // 如果没有匹配的路由或方法
        if (request.method === 'GET') {
          return new Response(`Method ${request.method} not allowed`, { 
            status: 405,
            headers: {
              'Allow': 'POST, OPTIONS',
              'Content-Type': 'text/plain',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        return new Response('Not Found', { 
          status: 404,
          headers: { 
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // 处理静态文件
      return await env.ASSETS.fetch(request);
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(error.message || 'Server Error', { 
        status: 500,
        headers: { 
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
}; 