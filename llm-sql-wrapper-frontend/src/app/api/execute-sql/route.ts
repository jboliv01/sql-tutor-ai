import { NextRequest, NextResponse } from 'next/server';

async function executePostgresQuery(sql, cookies) {
  console.log('Executing SQL query:', sql);
  console.log('JSONified', JSON.stringify({ sql }));
  
  const response = await fetch('http://127.0.0.1:5000/execute-sql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies // Forward the cookies
    },
    body: JSON.stringify({ sql }),
    credentials: 'include'
  });

  const responseText = await response.text();
  let responseData;

  try {
    responseData = JSON.parse(responseText);
  } catch (error) {
    console.error('Failed to parse response as JSON:', responseText);
    throw new Error(`Invalid JSON response from server: ${responseText}`);
  }

  if (!response.ok) {
    console.error('Error response from server:', responseData);
    throw new Error(JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      error: responseData.error,
      message: responseData.message,
      query: responseData.query
    }));
  }

  return responseData;
}

export async function POST(request) {
  try {
    const { sql } = await request.json();
    const cookies = request.headers.get('cookie') || '';
    
    const data = await executePostgresQuery(sql, cookies);
    
    const response = NextResponse.json(data);
    
    // Handle Set-Cookie header
    const setCookieHeader = response.headers.get('Set-Cookie');
    if (setCookieHeader) {
      response.headers.set('Set-Cookie', setCookieHeader);
    }
    
    return response;
  } catch (error) {
    console.error('Error in POST handler:', error);
    
    let errorResponse;
    try {
      errorResponse = JSON.parse(error.message);
    } catch {
      errorResponse = {
        error: 'UnknownError',
        message: error.message,
        query: sql
      };
    }
    
    return NextResponse.json(errorResponse, { status: errorResponse.status || 500 });
  }
}