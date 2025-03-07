import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', { callbackUrl: '/home' });
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    try {
      const result = await signIn('email', { email, callbackUrl: '/home', redirect: false });
      if (result?.error) {
        setError(result.error);
      } else {
        // Handle successful email sign-in
        router.push('/home');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={handleGoogleSignIn}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Sign in with Google
      </button>
      <form onSubmit={handleEmailSignIn}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
        />
        <button
          type="submit"
          className="mt-3 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Sign in with Email
        </button>
      </form>
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
}