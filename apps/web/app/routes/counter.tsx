import { Button } from '@mantine/core';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Route } from './+types/counter';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Real-time Counter' },
    {
      name: 'description',
      content: 'A real-time counter synced across all viewers',
    },
  ];
}

export default function Counter() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch initial counter value
  useEffect(() => {
    fetchCounter();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('counter-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'counter',
        },
        (payload) => {
          console.log('Counter updated:', payload);
          setCount(payload.new.value);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCounter = async () => {
    try {
      const response = await fetch(
        'http://127.0.0.1:8787/api/v1/counter'
      );

      if (!response.ok) {
        throw new Error('Failed to fetch counter');
      }

      const data = await response.json();
      setCount(data.value);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const response = await fetch(
        'http://127.0.0.1:8787/api/v1/counter/increment',
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to increment counter');
      }

      const data = await response.json();
      // The real-time subscription will update the UI
      // But we can also update immediately for better UX
      setCount(data.value);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecrement = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const response = await fetch(
        'http://127.0.0.1:8787/api/v1/counter/decrement',
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to decrement counter');
      }

      const data = await response.json();
      // The real-time subscription will update the UI
      // But we can also update immediately for better UX
      setCount(data.value);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading counter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Real-time Counter
          </h1>
          <p className="text-gray-600 mb-8">
            Updates live across all viewers
          </p>

          {/* Counter Display */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-8 mb-8 transform transition-transform duration-200 hover:scale-105">
            <div className="text-white text-6xl md:text-7xl font-bold">
              {count}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-4">
            {/* <button
              onClick={handleDecrement}
              disabled={isUpdating}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 text-lg shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              - Decrease
            </button> */}
            <Button onClick={handleDecrement} disabled={isUpdating}>- Decrease</Button>
            <button
              onClick={handleIncrement}
              disabled={isUpdating}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 text-lg shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              + Increase
            </button>
          </div>

          {/* Connection Status */}
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Connected to real-time updates</span>
          </div>

          {/* Back to Home Link */}
          <div className="mt-8">
            <a
              href="/"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
