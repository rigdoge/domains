export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      
      // 处理 API 请求
      if (url.pathname.startsWith('/api/')) {
        // 处理 OPTIONS 请求
        if (request.method === 'OPTIONS') {
          return new Response(null, {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Max-Age': '86400',
            },
          });
        }

        // 根据路径调用相应的处理函数
        const modulePath = `.${url.pathname}.ts`;
        try {
          const module = await import(modulePath);
          
          // POST 请求处理
          if (request.method === 'POST' && module.onRequestPost) {
            return await module.onRequestPost({ request, env });
          }
          
          // GET 请求处理
          if (request.method === 'GET' && module.onRequestGet) {
            return await module.onRequestGet({ request, env });
          }

          return new Response(`Method ${request.method} not allowed`, { 
            status: 405,
            headers: {
              'Allow': 'GET, POST, OPTIONS',
              'Content-Type': 'text/plain'
            }
          });
        } catch (error) {
          console.error(`Error loading module ${modulePath}:`, error);
          return new Response('Not Found', { 
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      }

      // 处理静态文件
      return await env.ASSETS.fetch(request);
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Server Error', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
}; 