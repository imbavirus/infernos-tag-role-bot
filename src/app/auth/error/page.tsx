/**
 * @file page.tsx
 * @description Authentication error page component
 * @module app/auth/error/page
 */

'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Props for the ErrorPage component
 * @interface ErrorPageProps
 */
interface ErrorPageProps {}

/**
 * Authentication error page component
 * @component
 * @param {ErrorPageProps} props - Component props
 * @returns {JSX.Element} The error page
 */
export default function ErrorPage({}: ErrorPageProps) {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full p-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Authentication Error</h1>
        <p className="text-gray-300 mb-6">
          {error === 'AccessDenied'
            ? 'You do not have permission to access this application.'
            : 'An error occurred during authentication.'}
        </p>
        <Link
          href="/"
          className="block w-full text-center bg-lime text-gray-900 font-semibold py-2 px-4 rounded hover:bg-lime/90 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
} 