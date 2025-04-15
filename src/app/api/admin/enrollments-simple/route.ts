import { NextRequest, NextResponse } from 'next/server';

// This is a simplified version of the enrollments API that returns an empty array
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      enrollments: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    });
  } catch (error: any) {
    console.error('Error in simplified enrollments API:', error);
    return NextResponse.json({
      error: error.message || 'An unexpected error occurred',
      enrollments: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 }
    }, { status: 500 });
  }
}

// Simplified POST endpoint that just returns success
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Just log what we received and return a fake success response
    console.log('Enrollment creation request received:', body);
    
    return NextResponse.json({
      id: 'fake-id-' + Date.now(),
      user_id: body.user_id,
      course_id: body.course_id,
      progress: 0,
      completed: false,
      enrollment_notes: body.notes || '',
      enrolled_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in simplified enrollments POST API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process enrollment request' },
      { status: 500 }
    );
  }
}

// Simplified DELETE endpoint
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('Enrollment deletion request received for ID:', id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in simplified enrollments DELETE API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete enrollment' },
      { status: 500 }
    );
  }
} 