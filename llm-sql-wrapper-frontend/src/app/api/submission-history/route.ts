// src/app/api/submission-history/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  console.log(`Submission history API route called (${request.method})`);

  const motherduckToken = process.env.MOTHERDUCK_TOKEN;
  if (!motherduckToken) {
    console.error('MotherDuck token is not configured');
    return NextResponse.json({ error: 'MotherDuck token is not configured' }, { status: 500 });
  }

  try {
    console.log('Fetching submission history from backend');
    const backendResponse = await fetch('http://127.0.0.1:5000/submission-history', {
      method: request.method, // Use the same method as the incoming request
      headers: {
        'Content-Type': 'application/json',
        'X-MotherDuck-Token': motherduckToken,
      },
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend request failed: ${backendResponse.status} ${backendResponse.statusText}`);
    }

    const text = await backendResponse.text();
    console.log('Raw response from backend:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      return NextResponse.json({ error: 'Invalid JSON response from backend' }, { status: 500 });
    }

    console.log('Data received from backend:', JSON.stringify(data, null, 2));

    if (!Array.isArray(data) || data.length === 0) {
      console.warn('Received data is not an array or is empty');
      return NextResponse.json({ error: 'No submission history data available' }, { status: 404 });
    } else {
      console.log(`Received ${data.length} submission history items`);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching submission history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission history', details: (error as Error).message },
      { status: 500 }
    );
  }
}