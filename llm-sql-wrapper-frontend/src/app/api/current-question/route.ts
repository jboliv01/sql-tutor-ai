import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
    const response = await fetch(`${backendUrl}/current-question`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch current question: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in current-question route:', error);
    return NextResponse.json({ error: 'An error occurred while fetching the current question' }, { status: 500 });
  }
}