'use client';

import React, { useState, FormEvent } from 'react';

export function SearchBar() {
  const [query, setQuery] = useState('');

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', query);
  };

  return (
    <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for your perfect domain..."
          className="w-full px-6 py-4 text-lg rounded-full border-2 border-blue-100 focus:border-blue-300 focus:ring-2 focus:ring-blue-200 focus:outline-none bg-white/70 backdrop-blur-sm shadow-lg"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
        >
          Search
        </button>
      </div>
      <div className="mt-4 text-center text-gray-500">
        <span className="text-sm">Popular searches: </span>
        {['tech', 'business', 'crypto', 'ai'].map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => setQuery(term)}
            className="text-sm mx-2 text-blue-600 hover:text-blue-800"
          >
            {term}.com
          </button>
        ))}
      </div>
    </form>
  );
} 