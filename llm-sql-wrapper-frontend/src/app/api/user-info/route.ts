import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';

export async function GET(request: NextRequest) {
  const session = await getSession({ req: request as any });
  
  if (session && session.user) {
    return NextResponse.json({
      username: session.user.name || 'unknown',
      email: session.user.email || 'unknown'
    });
  } else {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
}