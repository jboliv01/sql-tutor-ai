import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendResponse = await fetch('http://127.0.0.1:5000/schema', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!backendResponse.ok) {
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
    console.error('Error fetching schema:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schema', details: (error as Error).message },
      { status: 500 }
    );
  }
}