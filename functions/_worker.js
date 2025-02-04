export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      
      // 处理 OPTIONS 请求
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }

      // 处理 API 请求
      if (url.pathname.startsWith('/api/')) {
        // 根据路径调用相应的处理函数
        const module = await import(`.${url.pathname}.ts`);
        if (module.onRequestPost && request.method === 'POST') {
          return module.onRequestPost({ request, env });
        }
        if (module.onRequestGet && request.method === 'GET') {
          return module.onRequestGet({ request, env });
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