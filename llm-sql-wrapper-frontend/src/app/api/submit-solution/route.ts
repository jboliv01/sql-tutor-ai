// src/app/api/submit-solution/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('Submit solution API route handler started');
  const { sql, results, questionId } = await request.json();
  const motherduckToken = process.env.MOTHERDUCK_TOKEN;

  console.log('Request details:', { sql: sql.substring(0, 50) + '...', resultsCount: results.length, questionId });
  console.log('MotherDuck token exists:', !!motherduckToken);
  if (motherduckToken) {
    console.log('First 5 characters of token:', motherduckToken.substring(0, 5));
  }

  if (!motherduckToken) {
    console.error('MotherDuck token is not set in environment variables');
    return NextResponse.json({ error: 'MotherDuck token is not set' }, { status: 500 });
  }

  try {
    console.log('Sending request to Python backend...');
    const response = await fetch('http://127.0.0.1:5000/api/submit-solution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MotherDuck-Token': motherduckToken
      },
      body: JSON.stringify({ sql, results, questionId })
    });

    console.log('Received response from Python backend. Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from backend:', errorText);
      throw new Error(`Failed to fetch from Python backend: ${response.status} ${response.statusText}. Error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Successful response from backend:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request.', details: error.message }, { status: 500 });
  }
}