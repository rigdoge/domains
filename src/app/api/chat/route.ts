import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, domain, isInitial } = await request.json();

    if (!message) {
      return NextResponse.json(
        { message: 'Please enter your message' },
        { status: 400 }
      );
    }

    // Send message to Telegram
    const notification = isInitial 
      ? message 
      : `New message from visitor:\n\nDomain: ${domain}\nMessage: ${message}\nTime: ${new Date().toLocaleString()}`;
    
    const telegramResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: notification,
      }),
    });

    if (!telegramResponse.ok) {
      throw new Error('Failed to send message to Telegram');
    }

    return NextResponse.json({ 
      success: true,
      message: 'Message sent successfully' 
    });
  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Server error, please try again later' 
      },
      { status: 500 }
    );
  }
} 