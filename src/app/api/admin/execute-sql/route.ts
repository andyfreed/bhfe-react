import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a database connection pool using the DATABASE_URL environment variable
// With direct DB access we can bypass RLS completely
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Use SSL in production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
});

export async function POST(request: NextRequest) {
  // Only allow in development mode for now for safety
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production for security reasons' },
      { status: 403 }
    );
  }

  try {
    const { sql } = await request.json();
    
    if (!sql) {
      return NextResponse.json({ error: 'SQL query is required' }, { status: 400 });
    }

    console.log('Executing SQL directly:', sql);
    
    // Get a client from the pool
    const client = await pool.connect();
    
    try {
      // Execute the query
      const result = await client.query(sql);
      console.log('SQL execution successful, rows:', result.rowCount);
      
      return NextResponse.json({
        success: true,
        rowCount: result.rowCount,
        rows: result.rows,
      });
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error: any) {
    console.error('Error executing SQL:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to execute SQL query',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
} 