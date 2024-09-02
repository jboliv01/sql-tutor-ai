import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('API route handler started');

  const { question, is_practice, category } = await request.json();
  console.log('Request details:', { question, is_practice, category });

  try {
    console.log('Sending request to Python backend...');
    const response = await fetch('http://127.0.0.1:5000/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      credentials: 'include',
      body: JSON.stringify({ question, is_practice, category })
    });

    console.log('Received response from Python backend. Status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        console.error('Authentication error: User not logged in');
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      const errorText = await response.text();
      console.error('Error response from backend:', errorText);
      throw new Error(`Failed to fetch from Python backend: ${response.status} ${response.statusText}. Error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Successful response from backend:', data);

    const nextResponse = NextResponse.json(data);

    // Forward any Set-Cookie headers from the backend
    const backendSetCookie = response.headers.get('Set-Cookie');
    if (backendSetCookie) {
      nextResponse.headers.set('Set-Cookie', backendSetCookie);
    }

    return nextResponse;
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request.', details: error.message }, { status: 500 });
  }
}