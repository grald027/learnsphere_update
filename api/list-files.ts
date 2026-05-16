import { list } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    
    const blobs = await list({
      prefix: moduleId || '',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    return NextResponse.json({ blobs: blobs.blobs });
    
  } catch (error) {
    console.error('List error:', error);
    return NextResponse.json({ error: 'List failed' }, { status: 500 });
  }
}