import { useState } from 'react';
import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { Link } from "react-router";
import { AuthButton } from "~/components/AuthButton";
import { getAccessToken } from "~/lib/auth";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);

  /**
   * Test the protected API endpoint
   * This demonstrates how the API responds differently based on authentication status:
   * - If not logged in: Returns 403 Forbidden
   * - If logged in: Returns success with user data
   */
  const testProtectedApi = async () => {
    setApiLoading(true);
    setApiResponse(null);

    try {
      const token = await getAccessToken();

      // Prepare headers - include Authorization if we have a token
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Make request to protected API endpoint
      const response = await fetch('http://localhost:8787/api/v1/protected/test', {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      setApiResponse({
        status: response.status,
        statusText: response.statusText,
        authenticated: data.authenticated || false,
        data,
      });
    } catch (error) {
      console.error('API error:', error);
      setApiResponse({
        status: 0,
        statusText: 'Network Error',
        authenticated: false,
        data: {
          error: error instanceof Error ? error.message : 'Failed to call API',
          message: 'Make sure the API worker is running on http://localhost:8787'
        },
      });
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div>
      <Welcome />

      {/* Navigation Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mt-8 mb-8 px-4">
        <Link
          to="/counter"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          Try Real-time Counter
        </Link>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Protected Dashboard
        </Link>
      </div>

      {/* Authentication Section */}
      <div className="max-w-2xl mx-auto px-4 mb-12">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🔐 Authentication Demo
          </h2>
          <p className="text-gray-600 mb-6">
            Sign in with a magic link (passwordless authentication). We'll send a magic link to your email - just click it to sign in!
          </p>
          <AuthButton />
        </div>
      </div>

      {/* Protected API Test Section */}
      <div className="max-w-2xl mx-auto px-4 mb-16">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🚀 Protected API Test
          </h2>
          <p className="text-gray-600 mb-6">
            This button demonstrates how the API responds differently based on your authentication status:
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-red-500 font-bold">❌</span>
              <div>
                <span className="font-medium text-gray-700">Not logged in:</span>
                <span className="text-gray-600"> Returns 403 Forbidden</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✅</span>
              <div>
                <span className="font-medium text-gray-700">Logged in:</span>
                <span className="text-gray-600"> Returns success with your user data</span>
              </div>
            </div>
          </div>

          <button
            onClick={testProtectedApi}
            disabled={apiLoading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {apiLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                Testing API...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="16 18 22 12 16 6"/>
                  <polyline points="8 6 2 12 8 18"/>
                </svg>
                Test Protected API Endpoint
              </span>
            )}
          </button>

          {/* API Response Display */}
          {apiResponse && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                API Response:
              </h3>

              {/* Status Badge */}
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  apiResponse.status === 200
                    ? 'bg-green-100 text-green-800'
                    : apiResponse.status === 403
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {apiResponse.status === 200 ? '✅' : '❌'} Status: {apiResponse.status} {apiResponse.statusText}
                </span>

                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  apiResponse.authenticated
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {apiResponse.authenticated ? '🔓 Authenticated' : '🔒 Not Authenticated'}
                </span>
              </div>

              {/* Response Data */}
              <div className={`p-4 rounded-lg border ${
                apiResponse.status === 200
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(apiResponse.data, null, 2)}
                </pre>
              </div>

              {/* Explanation */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 What's happening:</strong>
                  {apiResponse.authenticated ? (
                    <span> Your JWT token was successfully verified by the API. The token is sent in the <code className="bg-blue-100 px-1 rounded">Authorization</code> header as <code className="bg-blue-100 px-1 rounded">Bearer &lt;token&gt;</code>.</span>
                  ) : (
                    <span> No valid JWT token was provided or found. The API requires authentication via the <code className="bg-blue-100 px-1 rounded">Authorization</code> header. Sign in above to get a token!</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
