// src/app/api/schema/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const motherduckToken = process.env.MOTHERDUCK_TOKEN;

  if (!motherduckToken) {
    return NextResponse.json({ error: 'MotherDuck token is not configured' }, { status: 500 });
  }

  try {
    const backendResponse = await fetch('http://127.0.0.1:5000/schema', {
      method: 'GET',
      headers: {
        'X-MotherDuck-Token': motherduckToken,
      },
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend request failed: ${backendResponse.status} ${backendResponse.statusText}`);
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching schema:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schema', details: (error as Error).message },
      { status: 500 }
    );
  }
}