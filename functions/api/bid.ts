interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { request } = context;
    const { domain, amount } = await request.json();

    if (!domain || !amount) {
      return new Response(
        JSON.stringify({ message: 'Please enter bid amount' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Send notification to Telegram
    const message = `New bid received!\n\nDomain: ${domain}\nBid Amount: $${amount.toLocaleString()}\nTime: ${new Date().toISOString()}`;
    
    const telegramResponse = await fetch(`https://api.telegram.org/bot${context.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: context.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!telegramResponse.ok) {
      throw new Error('Failed to send bid notification');
    }

    return new Response(
      JSON.stringify({ message: 'Bid submitted successfully' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending bid notification:', error);
    return new Response(
      JSON.stringify({ message: 'Server error, please try again later' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 