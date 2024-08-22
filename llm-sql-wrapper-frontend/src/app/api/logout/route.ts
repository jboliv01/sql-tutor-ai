import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('Logout API route handler started');
  try {
    const backendResponse = await fetch('http://127.0.0.1:5000/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Error response from backend:', errorText);
      throw new Error(`Failed to logout: ${backendResponse.status} ${backendResponse.statusText}. Error: ${errorText}`);
    }

    const data = await backendResponse.json();
    console.log('Successful logout:', data);

    const response = NextResponse.json(data);
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json({ error: 'An error occurred during logout.', details: error.message }, { status: 500 });
  }
}