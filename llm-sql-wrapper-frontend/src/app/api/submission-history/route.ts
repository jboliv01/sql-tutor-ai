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
      },
      credentials: 'include',
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend request failed: ${backendResponse.status} ${backendResponse.statusText}`);
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching submission history:', error);
    return NextResponse.json({ error: 'Failed to fetch submission history' }, { status: 500 });
  }
}