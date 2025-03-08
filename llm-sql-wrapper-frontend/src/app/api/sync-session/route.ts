// src/app/api/sync-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log('No NextAuth session found');
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    console.log('Found NextAuth session, syncing with backend');
    
    // Sync the session with the backend
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
    const response = await fetch(`${backendUrl}/auth/nextauth-login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: session.user.email,
        name: session.user.name
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error syncing session with backend: ${errorText}`);
      return NextResponse.json(
        { success: false, message: 'Failed to sync session with backend' },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('Successfully synced session with backend:', data);

    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error('Error syncing session:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}