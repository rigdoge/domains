interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { request } = context;
    const { message, domain, sessionId, isInitial } = await request.json();

    if (!message || !sessionId) {
      return new Response(
        JSON.stringify({ message: 'Please enter your message and session ID' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Send message to Telegram
    const notification = isInitial 
      ? message 
      : `New message from visitor:\n\nDomain: ${domain}\nSession: ${sessionId}\nMessage: ${message}\nTime: ${new Date().toISOString()}`;
    
    const telegramResponse = await fetch(`https://api.telegram.org/bot${context.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: context.env.TELEGRAM_CHAT_ID,
        text: notification,
        parse_mode: 'HTML',
      }),
    });

    if (!telegramResponse.ok) {
      throw new Error('Failed to send message to Telegram');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Message sent successfully' 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending chat message:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'Server error, please try again later' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 