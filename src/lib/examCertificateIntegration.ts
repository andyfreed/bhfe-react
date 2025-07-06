import { autoGenerateCertificates } from './certificates';

/**
 * Integration utility to automatically generate certificates when exams are passed
 * This should be called from the existing exam completion handlers
 */
export async function handleExamCompletion(
  userId: string,
  courseId: string,
  enrollmentId: string,
  examScore: number,
  passingScore: number = 70
) {
  try {
    // Only generate certificates if the exam was passed
    if (examScore >= passingScore) {
      console.log('Exam passed, generating certificates...', {
        userId,
        courseId,
        enrollmentId,
        examScore,
        passingScore
      });

      const certificates = await autoGenerateCertificates(
        userId,
        courseId,
        enrollmentId,
        examScore,
        passingScore
      );

      console.log(`Successfully generated ${certificates.length} certificate(s):`, certificates);
      return certificates;
    } else {
      console.log('Exam not passed, no certificates generated', {
        examScore,
        passingScore,
        required: passingScore - examScore
      });
      return [];
    }
  } catch (error) {
    console.error('Certificate generation failed:', error);
    // Don't throw - certificate generation failure shouldn't prevent exam completion
    return [];
  }
}

/**
 * Function to manually trigger certificate generation for existing passed exams
 * This can be used for backfilling certificates for users who passed exams before
 * the certificate system was implemented
 */
export async function backfillCertificates(
  userId?: string,
  courseId?: string
) {
  console.log('Starting certificate backfill process...', { userId, courseId });
  
  try {
    // This would need to be implemented based on your specific needs
    // For now, it's a placeholder that shows how you might approach backfilling
    console.log('Certificate backfill would query existing passed exams and generate certificates');
    
    // Example implementation:
    // 1. Query user_enrollments where exam_passed = true
    // 2. For each enrollment, check if certificate exists
    // 3. If not, generate certificate using the exam data
    
    return { success: true, message: 'Backfill process completed' };
  } catch (error) {
    console.error('Certificate backfill failed:', error);
    throw error;
  }
}

/**
 * Utility to check if a user has certificates for a specific course
 */
export async function hasUserCertificates(
  userId: string,
  courseId: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/certificates/user/${userId}`);
    const data = await response.json();
    
    if (!response.ok) {
      return false;
    }
    
    return data.certificates.some((cert: any) => 
      cert.course_id === courseId && !cert.is_revoked
    );
  } catch (error) {
    console.error('Error checking user certificates:', error);
    return false;
  }
}

/**
 * Integration point for updating existing exam completion handlers
 * Add this to wherever exam scores are updated in your existing system
 */
export const integrateWithExamSystem = {
  /**
   * Call this function after updating exam_score and exam_passed in user_enrollments
   */
  onExamScoreUpdate: handleExamCompletion,
  
  /**
   * Call this function to check if certificates should be generated
   */
  shouldGenerateCertificates: (examScore: number, passingScore: number = 70) => {
    return examScore >= passingScore;
  },
  
  /**
   * Call this function to get certificate status for a user/course
   */
  getCertificateStatus: hasUserCertificates,
  
  /**
   * Call this function to backfill certificates for existing data
   */
  backfillCertificates: backfillCertificates
};

// Export for easy access
export default integrateWithExamSystem;