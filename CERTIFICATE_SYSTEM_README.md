# Certificate System Documentation

This document provides comprehensive information about the certificate functionality implemented in the learning management system.

## Overview

The certificate system automatically generates certificates when users pass exams, with different certificate templates based on the type of credit they are taking the course for. The system includes:

- **Automatic Certificate Generation**: Certificates are generated when users pass exams
- **Credit Type Specific Templates**: Different certificate designs based on credit type (CPA, CFP, CDFA, EA, OTRP, EA/OTRP, ERPA)
- **Editable Certificates**: Administrators can edit certificate details with audit trail
- **Certificate Management**: Full CRUD operations for certificates and templates
- **Revocation System**: Certificates can be revoked with reasons tracked

## Database Schema

### Tables Created

1. **certificate_templates** - Templates for different credit types
2. **certificates** - Individual certificates issued to users
3. **certificate_edits** - Audit trail of certificate modifications

### Key Features

- Row Level Security (RLS) enabled on all tables
- Unique certificate numbers generated automatically
- Audit trail for all certificate edits
- Revocation system with reasons and timestamps

## Setup Instructions

### 1. Database Migration

Run the certificate migration SQL:

```bash
# Apply the certificate migration to your database
psql -d your_database -f certificate-migration.sql
```

### 2. API Endpoints

The following API endpoints are available:

- `POST /api/certificates/generate` - Generate certificates for passed exams
- `GET /api/certificates/user/{userId}` - Get certificates for a user
- `PUT /api/certificates/{certificateId}/edit` - Edit a certificate
- `PUT /api/certificates/{certificateId}/revoke` - Revoke a certificate

### 3. Integration with Existing Exam System

To integrate with your existing exam system, use the integration utility:

```typescript
import { handleExamCompletion } from '@/lib/examCertificateIntegration';

// In your exam completion handler
async function onExamCompleted(userId, courseId, enrollmentId, examScore) {
  // ... existing exam completion logic ...
  
  // Generate certificates if exam passed
  await handleExamCompletion(userId, courseId, enrollmentId, examScore);
}
```

## Usage Examples

### Auto-Generate Certificates

```typescript
import { autoGenerateCertificates } from '@/lib/certificates';

const certificates = await autoGenerateCertificates(
  'user-id',
  'course-id', 
  'enrollment-id',
  85, // exam score
  70  // passing score
);
```

### Edit Certificate

```typescript
import { editCertificate } from '@/lib/certificates';

await editCertificate({
  certificateId: 'cert-id',
  editedBy: 'admin-user-id',
  fieldName: 'recipient_name',
  newValue: 'John Doe',
  oldValue: 'John Smith',
  editReason: 'Name correction requested'
});
```

### Revoke Certificate

```typescript
import { revokeCertificate } from '@/lib/certificates';

await revokeCertificate(
  'cert-id',
  'admin-user-id',
  'Certificate issued in error'
);
```

## Credit Types and Templates

The system supports the following credit types with default templates:

- **CPA** - Certified Public Accountant (Blue theme)
- **CFP** - Certified Financial Planner (Indigo theme)
- **CDFA** - Certified Divorce Financial Analyst (Amber theme)
- **EA** - Enrolled Agent (Green theme)
- **OTRP** - Oregon Tax Return Preparer (Red theme)
- **EA/OTRP** - Dual certification (Purple theme)
- **ERPA** - Enrolled Retirement Plan Agent (Orange theme)

Each template includes:
- Customizable colors and layout
- Signature field configurations
- Custom field definitions
- Professional styling

## UI Components

### CertificateCard

Displays certificate information with options to edit/revoke:

```typescript
<CertificateCard
  certificate={certificate}
  onEdit={handleEdit}
  onRevoke={handleRevoke}
  showActions={true}
/>
```

### CertificateEditModal

Modal for editing certificate fields:

```typescript
<CertificateEditModal
  certificate={certificate}
  isOpen={isOpen}
  onClose={handleClose}
  onSave={handleSave}
/>
```

## Admin Features

### Certificate Management Page

Located at `/admin/certificates`, provides:
- Search and filter certificates
- View certificate statistics
- Edit certificate details
- Revoke certificates
- Track edit history

### User Certificate Page

Located at `/certificates`, allows users to:
- View their earned certificates
- See certificate details
- Download certificates (if implemented)

## React Hooks

### useCertificates

Hook for certificate management:

```typescript
const {
  certificates,
  loading,
  error,
  generateCertificates,
  loadUserCertificates,
  editCertificate
} = useCertificates();
```

### useExamCertificateGeneration

Hook for exam integration:

```typescript
const { handleExamPassed } = useExamCertificateGeneration();

// Call when exam is completed
await handleExamPassed(userId, courseId, enrollmentId, score);
```

## Security Features

- Row Level Security on all certificate tables
- Users can only view their own certificates
- Admins have full access to all certificates
- Edit audit trail prevents unauthorized modifications
- Certificate revocation with reason tracking

## Certificate Number Format

Certificates are assigned unique numbers in the format: `CERT-YYYY-NNNNNN`

Example: `CERT-2024-123456`

## Integration Points

### Existing Exam System

The certificate system integrates with your existing exam system through:

1. **Exam Completion Handler**: Call `handleExamCompletion()` when exams are finished
2. **Score Update Handler**: Automatically generate certificates when exam scores are updated
3. **Enrollment System**: Uses existing enrollment data for certificate generation

### Recommended Integration

```typescript
// In your existing exam completion API
export async function POST(request: NextRequest) {
  // ... existing exam logic ...
  
  // Update exam score in database
  await updateExamScore(userId, courseId, examScore);
  
  // Generate certificates if passed
  if (examScore >= passingScore) {
    await handleExamCompletion(userId, courseId, enrollmentId, examScore);
  }
  
  return NextResponse.json({ success: true });
}
```

## Future Enhancements

Potential future features:
- PDF certificate generation
- Email certificate delivery
- Certificate verification system
- Bulk certificate operations
- Certificate templates editor
- Certificate analytics dashboard

## Troubleshooting

### Common Issues

1. **Certificate not generating**: Check exam score meets passing threshold
2. **Database errors**: Ensure migration was applied correctly
3. **Permission errors**: Verify RLS policies are configured properly
4. **Duplicate certificates**: System prevents duplicates per user/course/credit type

### Debug Mode

Enable debug logging by setting environment variable:
```bash
CERTIFICATE_DEBUG=true
```

This will log detailed information about certificate generation process.

## Support

For issues or questions about the certificate system:
1. Check the audit logs in `certificate_edits` table
2. Review the server logs for error messages
3. Verify database permissions and RLS policies
4. Test certificate generation with sample data

---

This certificate system provides a robust foundation for managing professional education certificates with full audit trails and administrative controls.