import { redirect, useNavigate } from 'react-router';
import { authClient } from '../lib/auth';
import type { Route } from './+types/dashboard';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Dashboard - Tabiheim Games' },
    { name: 'description', content: 'Your Tabiheim Games dashboard' },
  ];
}

/**
 * Client loader to protect the dashboard route
 * Checks authentication and redirects to home if not authenticated
 */
export async function clientLoader({}: Route.ClientLoaderArgs) {
  const { data: session } = await authClient.getSession();

  // Redirect to home if not authenticated
  if (!session?.user) {
    throw redirect('/');
  }

  // Return user data to the component
  return { user: session.user };
}

export default function Dashboard({
  loaderData,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const { user } = loaderData;

  async function handleSignOut() {
    await authClient.signOut();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            🎮 Tabiheim Games
          </h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to your Dashboard!
            </h2>
            <p className="text-gray-600">
              Hello, <strong>{user.email}</strong>
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-linear-to-br from-purple-50 to-indigo-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                👋 Hello World!
              </h3>
              <p className="text-gray-700 mb-4">
                This is a protected dashboard page. You can only see
                this because you're authenticated.
              </p>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2">
                  Your Details:
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex">
                    <dt className="font-medium text-gray-600 w-24">
                      User ID:
                    </dt>
                    <dd className="text-gray-900">{user.id}</dd>
                  </div>
                  <div className="flex">
                    <dt className="font-medium text-gray-600 w-24">
                      Email:
                    </dt>
                    <dd className="text-gray-900">{user.email}</dd>
                  </div>
                  <div className="flex">
                    <dt className="font-medium text-gray-600 w-24">
                      Name:
                    </dt>
                    <dd className="text-gray-900">
                      {user.name || 'Not set'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-semibold text-gray-800">
                  Analytics
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Coming soon...
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-semibold text-gray-800">Games</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Coming soon...
                </p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="text-3xl mb-2">⚙️</div>
                <h3 className="font-semibold text-gray-800">
                  Settings
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Coming soon...
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
