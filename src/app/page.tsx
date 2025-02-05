'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getDomainInfo } from '@/config/domain';
import { API_ENDPOINTS } from '@/config/env';

interface Message {
  text: string;
  timestamp: number;
  isUser: boolean;
  sessionId: string;
}

export default function Home() {
  const domain = getDomainInfo();
  console.log('Initial domain:', domain);
  const [bidAmount, setBidAmount] = useState<string>(domain.minBid.toString());
  const [contact, setContact] = useState<string>('');
  const [isBidding, setIsBidding] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  // 监听 Service Worker 消息
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const messageHandler = (event: MessageEvent) => {
      console.log('Received message from SW:', event.data);  // 添加日志
      
      if (event.data && (event.data.type === 'PUSH_MESSAGE' || event.data.type === 'new_message')) {
        // 检查消息是否属于当前会话
        if (event.data.sessionId === sessionId && event.data.domain === domain.name) {
          console.log('Adding new message to chat:', event.data);  // 添加日志
          const newMessage = {
            text: event.data.message,
            timestamp: event.data.timestamp || Date.now(),
            isUser: false,
            sessionId: event.data.sessionId
          };
          setMessages(prev => [...prev, newMessage]);
        }
      }
    };

    // 添加消息监听器
    navigator.serviceWorker.addEventListener('message', messageHandler);

    // 清理函数
    return () => {
      navigator.serviceWorker.removeEventListener('message', messageHandler);
    };
  }, [sessionId, domain.name]);

  // 注册推送服务
  const registerPush = useCallback(async (currentSessionId: string) => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        
        // 请求通知权限
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Notification permission denied');
          return;
        }

        // 获取推送订阅
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'BIxxVmoXcHlWCbjsx70Ko79302Zq6giIE6G5JnjhAVLuOwaKMDqdA7B66cno222VhlhZeOqmUlZJkziZxe387d4'
        });

        // 发送订阅信息到服务器
        await fetch('/api/push-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription,
            domain: domain.name,
            sessionId: currentSessionId
          }),
        });
      }
    } catch (error) {
      console.error('Failed to register push:', error);
    }
  }, [domain.name]);

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsBidding(true);

    try {
      if (!bidAmount) {
        throw new Error('Please enter your bid amount');
      }

      const amount = parseFloat(bidAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid bid amount');
      }

      const response = await fetch(API_ENDPOINTS.BID, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: domain.name,
          amount
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Submission of bid failed');
      }

      setSuccess('Bid submitted successfully!');
      setBidAmount('');
      // Open chat window
      setIsChatOpen(true);
    } catch (err: any) {
      setError(err.message || 'Submission of bid failed');
    } finally {
      setIsBidding(false);
    }
  };

  // 发送初始消息
  const sendInitialMessage = async (currentSessionId: string) => {
    try {
      setIsSending(true);
      const initialMessage = `Domain Information:\n` +
        `Domain: ${domain.name}\n` +
        `Session: ${currentSessionId}\n` +
        `Reference Price: $${domain.minBid.toLocaleString()}\n` +
        `Description: ${domain.description}\n` +
        `Status: Visitor opened chat window`;
      
      const response = await fetch(API_ENDPOINTS.CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: initialMessage,
          domain: domain.name,
          sessionId: currentSessionId,
          isInitial: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending initial message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleChatToggle = async () => {
    const newChatState = !isChatOpen;
    setIsChatOpen(newChatState);
    
    if (newChatState && !sessionId) {
      // 只在首次打开聊天时创建新的 session
      const newSessionId = Math.random().toString(36).substring(7);
      setSessionId(newSessionId);
      await registerPush(newSessionId);
      await sendInitialMessage(newSessionId);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !sessionId) return;

    setIsSending(true);
    const currentMessage = {
      text: newMessage,
      isUser: true,
      timestamp: Date.now(),
      sessionId
    };

    try {
      setMessages(prev => [...prev, currentMessage]);
      setNewMessage('');
      
      const response = await fetch(`${API_ENDPOINTS.CHAT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          domain: domain.name,
          sessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      console.log('Server response:', data);  // 添加日志
      
      // 只有当服务器返回了消息时才添加机器人回复
      if (data.success && data.message) {
        const botMessage = {
          text: data.message,
          isUser: false,
          timestamp: Date.now(),
          sessionId
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        text: '发送消息失败，请稍后重试',
        isUser: false,
        timestamp: Date.now(),
        sessionId
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16 max-w-3xl flex-grow flex flex-col">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400 dark:from-emerald-400 dark:to-emerald-200">
            Domain Ventures
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 flex-grow flex flex-col">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">{domain.name}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">{domain.description}</p>
            <div className="text-3xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400 dark:from-emerald-400 dark:to-emerald-200 mb-8">
              Minimum Bid: ${domain.minBid.toLocaleString()}
            </div>

            {/* 出价表单 */}
            <form onSubmit={handleBidSubmit} className="max-w-sm mx-auto mb-8">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`${domain.minBid.toLocaleString()}`}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 disabled:bg-gray-100 dark:disabled:bg-gray-600"
                    step="1"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isBidding}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isBidding ? 'Submitting...' : 'Place Bid'}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4 flex-grow flex flex-col">
            <button
              onClick={handleChatToggle}
              className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
              </svg>
              {isChatOpen ? 'Close Chat' : 'Start Chat'}
            </button>
            
            {isChatOpen && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
                <div className="bg-white/95 dark:bg-gray-800/95 w-full md:w-[500px] md:h-[600px] h-[85vh] rounded-[32px] flex flex-col relative animate-slide-up shadow-[0_0_50px_rgba(16,185,129,0.15)] dark:shadow-[0_0_50px_rgba(16,185,129,0.25)] overflow-hidden">
                  {/* 标题栏 */}
                  <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Chat with Us</h3>
                    </div>
                    <button
                      onClick={handleChatToggle}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* 消息区域 */}
                  <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.isUser
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          >
                            {message.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 输入区域 */}
                  <div className="border-t dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }} className="flex gap-3 p-6">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isSending}
                        className="flex-1 px-4 py-3 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 disabled:bg-gray-100 dark:disabled:bg-gray-600 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm"
                      />
                      <button
                        type="submit"
                        disabled={isSending}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:hover:shadow-lg"
                      >
                        {isSending ? 'Sending...' : 'Send'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="w-full py-6 mt-auto border-t border-gray-100 dark:border-gray-800 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} <a href="https://facesome.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Facesome.com</a> All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
} 