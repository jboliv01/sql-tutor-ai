//src/api/schema/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const motherduckToken = process.env.MOTHERDUCK_TOKEN;

  if (!motherduckToken) {
    return NextResponse.json({ error: 'MotherDuck token is not set' }, { status: 500 });
  }

  try {
    const response = await fetch('http://127.0.0.1:5000/schema', {
      headers: { 
        'X-MotherDuck-Token': motherduckToken
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'An error occurred while fetching the schema.' }, { status: 500 });
  }
}