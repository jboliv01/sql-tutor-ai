import { NextRequest, NextResponse } from 'next/server';

export async function POST(request:NextRequest) {
  const { username, password } = await request.json();
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
    console.log(`Attempting to login at: ${backendUrl}/login`);

    const backendResponse = await fetch(`${backendUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    console.log(`Backend login response status: ${backendResponse.status}`);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`Login error response from backend: ${errorText}`);
      throw new Error(`Failed to login: ${backendResponse.status} ${backendResponse.statusText}`);
    }

    const data = await backendResponse.json();
    console.log('Login successful, received data:', data);

    const response = NextResponse.json(data);

    // Forward any Set-Cookie headers from backend
    const setCookieHeader = backendResponse.headers.get('Set-Cookie');
    if (setCookieHeader) {
      console.log('Received Set-Cookie header:', setCookieHeader);
      response.headers.set('Set-Cookie', setCookieHeader);
    } else {
      console.log('No Set-Cookie header received from backend');
    }

    return response;
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ error: 'An error occurred during login.', details: error.message }, { status: 500 });
  }
}