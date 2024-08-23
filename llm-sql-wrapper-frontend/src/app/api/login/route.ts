import { NextRequest, NextResponse } from 'next/server';

export async function POST(request:NextRequest) {
  const { username, password } = await request.json();
  try {
    const backendResponse = await fetch('http://127.0.0.1:5000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      throw new Error(`Failed to login: ${backendResponse.status} ${backendResponse.statusText}. Error: ${errorText}`);
    }

    const data = await backendResponse.json();
    const response = NextResponse.json(data);

    // Forward any Set-Cookie headers from backend
    const setCookieHeader = backendResponse.headers.get('Set-Cookie');
    if (setCookieHeader) {
      response.headers.set('Set-Cookie', setCookieHeader);
    }

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'An error occurred during login.', details: error.message }, { status: 500 });
  }
}
