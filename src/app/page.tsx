'use client';

import React, { useState } from 'react';
import { domains, DomainInfo } from '@/config/domain';

function getDomainInfo(): DomainInfo {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const domainKey = hostname.replace('www.', '').split('.')[0];
    return domains[domainKey] || domains.example;
  }
  return domains.example;
}

export default function Home() {
  const domain = getDomainInfo();
  const [bidAmount, setBidAmount] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [isBidding, setIsBidding] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{text: string; isUser: boolean}[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

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

      const response = await fetch('/api/bid', {
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
      // Open chat window and show message
      setIsChatOpen(true);
      setMessages(prev => [...prev, {
        text: `Thank you for your bid! Your offer of $${amount.toLocaleString()} has been received. Please leave your contact information (email/phone) and any additional message for us.`,
        isUser: false
      }]);
    } catch (err: any) {
      setError(err.message || 'Submission of bid failed');
    } finally {
      setIsBidding(false);
    }
  };

  // 发送初始消息
  const sendInitialMessage = async () => {
    try {
      setIsSending(true);
      const initialMessage = `Domain Information:\n` +
        `Domain: ${domain.name}\n` +
        `Reference Price: $${domain.minBid.toLocaleString()}\n` +
        `Description: ${domain.description}\n` +
        `Status: Visitor opened chat window`;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: initialMessage,
          domain: domain.name,
          isInitial: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      setMessages([
        { 
          text: `Welcome! Interested in ${domain.name}? You can place a bid or leave us a message. We will get back to you as soon as possible.`, 
          isUser: false 
        }
      ]);
    } catch (error) {
      console.error('Error sending initial message:', error);
      setMessages([
        { 
          text: 'Welcome! We are happy to serve you.', 
          isUser: false 
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleChatToggle = () => {
    const newChatState = !isChatOpen;
    setIsChatOpen(newChatState);
    if (newChatState && messages.length === 0) {
      sendInitialMessage();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      const userMessage = { text: newMessage, isUser: true };
      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: newMessage,
          domain: domain.name
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: 'Message received! We will reply to you soon.', 
          isUser: false 
        }]);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        text: error instanceof Error 
          ? `Error: ${error.message}` 
          : 'Failed to send message, please try again later.',
        isUser: false 
      }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400 dark:from-emerald-400 dark:to-emerald-200">
            Premium Domain
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

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
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
                    placeholder="Enter your bid amount"
                    className="w-full pl-8 pr-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

          <div className="space-y-4">
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
              <div className="mt-4 border dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                <div className="h-80 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.isUser
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendMessage} className="border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      disabled={isSending}
                      className="flex-1 px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 disabled:bg-gray-100 dark:disabled:bg-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <button
                      type="submit"
                      disabled={isSending}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:bg-emerald-300 dark:disabled:bg-emerald-500"
                    >
                      {isSending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-16 text-center text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} <a href="https://facesome.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Facesome.com</a> All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
} 