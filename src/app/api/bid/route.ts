import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/utils/telegram';

export async function POST(request: Request) {
  try {
    const { domain, amount } = await request.json();

    if (!domain || !amount) {
      return NextResponse.json(
        { message: 'Please enter bid amount' },
        { status: 400 }
      );
    }

    // Send notification to Telegram
    const message = `New bid received!\n\nDomain: ${domain}\nBid Amount: $${amount.toLocaleString()}\nTime: ${new Date().toLocaleString()}`;
    
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
      }),
    });

    return NextResponse.json({ message: 'Bid submitted successfully' });
  } catch (error) {
    console.error('Error sending bid notification:', error);
    return NextResponse.json(
      { message: 'Server error, please try again later' },
      { status: 500 }
    );
  }
} 