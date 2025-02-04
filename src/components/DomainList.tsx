'use client';

import React, { useState } from 'react';

interface Domain {
  id: number;
  name: string;
  price: number;
  category: string;
  description?: string;
}

const SAMPLE_DOMAINS: Domain[] = [
  { 
    id: 1, 
    name: 'example.com', 
    price: 5000, 
    category: 'Premium',
    description: 'Perfect for your next big project'
  },
  { 
    id: 2, 
    name: 'business.com', 
    price: 10000, 
    category: 'Premium',
    description: 'Establish your professional presence'
  },
  { 
    id: 3, 
    name: 'startup.io', 
    price: 2000, 
    category: 'Technology',
    description: 'Modern domain for tech startups'
  },
  { 
    id: 4, 
    name: 'shop.store', 
    price: 1500, 
    category: 'E-commerce',
    description: 'Start your online store today'
  },
];

export function DomainList(): React.ReactElement {
  const [domains] = useState<Domain[]>(SAMPLE_DOMAINS);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {domains.map((domain) => (
        <div
          key={domain.id}
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {domain.category}
            </span>
            <span className="text-2xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              ${domain.price.toLocaleString()}
            </span>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {domain.name}
          </h3>
          
          {domain.description && (
            <p className="text-gray-600 mb-4 text-sm">
              {domain.description}
            </p>
          )}
          
          <div className="flex gap-2 mt-4">
            <button 
              type="button"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg font-medium"
            >
              Buy Now
            </button>
            <button 
              type="button"
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              aria-label="Add to favorites"
            >
              ❤️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 