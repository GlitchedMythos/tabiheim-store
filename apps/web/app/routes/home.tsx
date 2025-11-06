import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { authClient } from '../lib/auth';
import { useAuth } from '../hooks/useAuth';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Sign In - Tabiheim Games' },
    { name: 'description', content: 'Sign in to Tabiheim Games' },
  ];
}

export default function Home() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Use absolute URL for callback to ensure redirect goes to frontend, not API
      const callbackURL = `${window.location.origin}/dashboard`;

      await authClient.signIn.magicLink({
        email,
        callbackURL,
      });
      setSent(true);
    } catch (err) {
      console.error('Failed to send magic link:', err);
      setError('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">📧</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Check Your Email
            </h2>
            <p className="text-gray-600 mb-6">
              We've sent a magic link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Click the link in the email to sign in to your account.
              The link will expire in 5 minutes.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setEmail('');
              }}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎮 Tabiheim Games
          </h1>
          <p className="text-gray-600">
            Sign in with your email
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:bg-purple-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            We'll send you a secure link to sign in.
            <br />
            No password required! 🪄
          </p>
        </div>
      </div>
    </div>
  );
}
