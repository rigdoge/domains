import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/utils/telegram';

export async function POST(request: Request) {
  try {
    const { domain, amount } = await request.json();

    // 直接发送到 Telegram
    await sendTelegramMessage(
      `🔔 新出价通知\n\n域名: ${domain}\n出价: $${amount.toLocaleString()}\n时间: ${new Date().toLocaleString()}\n\n#bid #${domain.replace('.', '_')}`
    );

    return NextResponse.json({ message: '出价提交成功' });
  } catch (error) {
    console.error('Error processing bid:', error);
    return NextResponse.json(
      { message: '网络连接异常，请稍后再试' },
      { status: 500 }
    );
  }
} 