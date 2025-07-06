import { NextRequest, NextResponse } from 'next/server';
import { getUserCertificates } from '@/lib/certificates';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const certificates = await getUserCertificates(userId);

    return NextResponse.json({ 
      success: true, 
      certificates
    });
  } catch (error) {
    console.error('Error fetching user certificates:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch certificates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}