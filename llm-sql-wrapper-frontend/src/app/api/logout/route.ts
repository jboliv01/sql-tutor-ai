import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('Logout API route called (GET)');
  return handleLogoutRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  console.log('Logout API route called (POST)');
  return handleLogoutRequest(request, 'POST');
}

async function handleLogoutRequest(request: NextRequest, method: string) {
  try {
    console.log(`Sending ${method} logout request to backend`);
    const backendResponse = await fetch('http://127.0.0.1:5000/logout', {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      credentials: 'include',
    });

    console.log('Backend response status:', backendResponse.status);
    console.log('Backend response headers:', Object.fromEntries(backendResponse.headers));

    if (!backendResponse.ok) {
      if (backendResponse.status === 401) {
        console.error('Authentication error: User not logged in');
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      throw new Error(`Backend request failed: ${backendResponse.status} ${backendResponse.statusText}`);
    }

    const data = await backendResponse.json();
    console.log('Successful logout response:', data);

    const response = NextResponse.json(data);
    
    // Forward any Set-Cookie headers from backend
    const backendSetCookie = backendResponse.headers.get('Set-Cookie');
    if (backendSetCookie) {
      response.headers.set('Set-Cookie', backendSetCookie);
    }

    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout', details: error.message },
      { status: 500 }
    );
  }
}