'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Get the ID token directly from the user credential
      const idToken = await userCredential.user.getIdToken();
      console.log('User logged in, token obtained');

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Verify user exists in backend (and sync if needed)
      let userData;
      try {
        console.log('Fetching user from backend...');
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        userData = response.data;
        console.log('User data from /api/auth/me:', userData);
      } catch (apiError: any) {
        console.log('Error fetching user, status:', apiError.response?.status);
        // If user doesn't exist in backend, try to register them
        if (apiError.response?.status === 404) {
          console.log('User not found, needs registration');
          const registerResponse = await axios.post(
            `${API_URL}/api/auth/register`,
            {},
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
          userData = registerResponse.data.user; // Register returns { user, tenant }
          console.log('User registered, data:', userData);
        } else {
          throw apiError;
        }
      }

      console.log('Setting user in Zustand store:', userData);

      // Populate Zustand store with user data
      if (userData) {
        setUser(userData); // Backend response already matches our UserProfile interface
        console.log('User stored in Zustand, tenant_ids:', userData.tenant_ids);
      }

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your FlowShare account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
