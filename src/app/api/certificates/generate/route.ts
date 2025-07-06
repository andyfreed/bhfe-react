import { NextRequest, NextResponse } from 'next/server';
import { autoGenerateCertificates } from '@/lib/certificates';

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId, enrollmentId, examScore, passingScore } = await request.json();

    if (!userId || !courseId || !enrollmentId || examScore === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, courseId, enrollmentId, examScore' },
        { status: 400 }
      );
    }

    const certificates = await autoGenerateCertificates(
      userId,
      courseId,
      enrollmentId,
      examScore,
      passingScore || 70
    );

    return NextResponse.json({ 
      success: true, 
      certificates,
      message: `Generated ${certificates.length} certificate(s)`
    });
  } catch (error) {
    console.error('Error generating certificates:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate certificates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}