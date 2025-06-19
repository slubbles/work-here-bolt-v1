'use client';

import { useState } from 'react';

export default function TestPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-red-500">
          🚀 Snarbles is Live!
        </h1>
        
        <p className="text-2xl text-gray-300">
          Next.js server is running successfully
        </p>
        
        <div className="space-y-4">
          <p className="text-lg">Test Counter: {count}</p>
          <button 
            onClick={() => setCount(count + 1)}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Click Me ({count})
          </button>
        </div>
        
        <div className="text-sm text-gray-500 space-y-2">
          <p>✅ Next.js Server: Running</p>
          <p>✅ React: Working</p>
          <p>✅ Tailwind CSS: Loaded</p>
          <p>✅ Client Components: Functional</p>
        </div>
      </div>
    </div>
  );
}