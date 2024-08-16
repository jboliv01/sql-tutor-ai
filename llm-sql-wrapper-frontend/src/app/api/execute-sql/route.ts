// src/app/api/execute-sql/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { sql } = await request.json();
  const motherduckToken = process.env.MOTHERDUCK_TOKEN;

  if (!motherduckToken) {
    return NextResponse.json({ error: 'MotherDuck token is not set' }, { status: 500 });
  }

  try {
    const response = await fetch('http://127.0.0.1:5000/execute-sql', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-MotherDuck-Token': motherduckToken
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to execute SQL: ${response.status} ${response.statusText}. Error: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'An error occurred while executing the SQL query.', details: error.message }, { status: 500 });
  }
}