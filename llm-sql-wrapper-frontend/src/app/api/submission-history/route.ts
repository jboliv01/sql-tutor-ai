import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('Submission history API route called (GET)');
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  console.log('Submission history API route called (POST)');
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  try {
    console.log('Fetching submission history from backend');
    const backendResponse = await fetch('http://127.0.0.1:5000/submission-history', {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      credentials: 'include',
    });

    if (!backendResponse.ok) {
      if (backendResponse.status === 401) {
        console.error('Authentication error: User not logged in');
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      throw new Error(`Backend request failed: ${backendResponse.status} ${backendResponse.statusText}`);
    }

    const data = await backendResponse.json();
    const response = NextResponse.json(data);

    // Forward any Set-Cookie headers from the backend
    const backendSetCookie = backendResponse.headers.get('Set-Cookie');
    if (backendSetCookie) {
      response.headers.set('Set-Cookie', backendSetCookie);
    }

    return response;
  } catch (error) {
    console.error('Error fetching submission history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission history', details: error.message },
      { status: 500 }
    );
  }
}