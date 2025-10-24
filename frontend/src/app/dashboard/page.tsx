'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await apiClient.get('/api/auth/me');
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>
              {user?.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Role: <span className="font-medium">{user?.role}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Production Data</CardTitle>
            <CardDescription>Submit and manage production entries</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/production">
              <Button className="w-full">Go to Production</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reconciliation</CardTitle>
            <CardDescription>View and trigger reconciliations</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/reconciliation">
              <Button className="w-full">Go to Reconciliation</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>Invite partners and manage users</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/team">
              <Button className="w-full" variant="outline">Manage Team</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>View production trends and forecasts</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/analytics">
              <Button className="w-full" variant="outline">View Analytics</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
