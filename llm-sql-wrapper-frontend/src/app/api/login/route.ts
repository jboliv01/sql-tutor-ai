import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('Login API route handler started');
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
      console.error('Error response from backend:', errorText);
      throw new Error(`Failed to login: ${backendResponse.status} ${backendResponse.statusText}. Error: ${errorText}`);
    }

    const data = await backendResponse.json();
    console.log('Successful login:', data);
    
    const response = NextResponse.json(data);
    response.cookies.set('session', data.session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json({ error: 'An error occurred during login.', details: error.message }, { status: 500 });
  }
}