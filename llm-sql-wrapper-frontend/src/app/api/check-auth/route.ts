import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('check-auth route called');
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
    console.log(`Attempting to fetch from: ${backendUrl}/check-auth`);

    const response = await fetch(`${backendUrl}/check-auth`, {
      credentials: 'include',
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    console.log(`Backend responded with status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from backend: ${errorText}`);
      throw new Error(`Failed to fetch authentication status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received data from backend:', data);

    if (data.authenticated) {
      console.log('User is authenticated');
      return NextResponse.json({
        authenticated: true,
        username: data.username,
        user_id: data.user_id
      });
    } else {
      console.log('User is not authenticated');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } catch (error) {
    console.error('Error in check-auth route:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}