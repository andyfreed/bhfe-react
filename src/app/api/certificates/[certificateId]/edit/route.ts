import { NextRequest, NextResponse } from 'next/server';
import { editCertificate } from '@/lib/certificates';

export async function PUT(
  request: NextRequest,
  { params }: { params: { certificateId: string } }
) {
  try {
    const { certificateId } = params;
    const { editedBy, fieldName, newValue, oldValue, editReason } = await request.json();

    if (!certificateId || !editedBy || !fieldName || newValue === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: certificateId, editedBy, fieldName, newValue' },
        { status: 400 }
      );
    }

    await editCertificate({
      certificateId,
      editedBy,
      fieldName,
      newValue,
      oldValue,
      editReason
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Certificate updated successfully'
    });
  } catch (error) {
    console.error('Error editing certificate:', error);
    return NextResponse.json(
      { 
        error: 'Failed to edit certificate',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}