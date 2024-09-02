import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('Submit solution API route handler started');

  const { sql, results, questionId } = await request.json();
  console.log('Request details:', { sql: sql.substring(0, 50) + '...', resultsCount: results.length, questionId });

  try {
    console.log('Sending request to Python backend...');
    const response = await fetch('http://127.0.0.1:5000/submit-solution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      credentials: 'include',
      body: JSON.stringify({ sql, results, questionId })
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