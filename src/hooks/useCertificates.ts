import { useState, useCallback } from 'react';
import { CertificateWithRelations } from '@/lib/certificates';

export const useCertificates = () => {
  const [certificates, setCertificates] = useState<CertificateWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCertificates = useCallback(async (
    userId: string,
    courseId: string,
    enrollmentId: string,
    examScore: number,
    passingScore: number = 70
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          courseId,
          enrollmentId,
          examScore,
          passingScore
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate certificates');
      }

      return data.certificates;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate certificates';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserCertificates = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/certificates/user/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load certificates');
      }

      setCertificates(data.certificates);
      return data.certificates;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load certificates';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const editCertificate = useCallback(async (
    certificateId: string,
    editedBy: string,
    fieldName: string,
    newValue: string,
    oldValue: string,
    editReason?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/certificates/${certificateId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          editedBy,
          fieldName,
          newValue,
          oldValue,
          editReason
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to edit certificate');
      }

      // Update local state
      setCertificates(prev => 
        prev.map(cert => 
          cert.id === certificateId 
            ? { ...cert, [fieldName]: newValue }
            : cert
        )
      );

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to edit certificate';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    certificates,
    loading,
    error,
    generateCertificates,
    loadUserCertificates,
    editCertificate,
    setCertificates,
    setError
  };
};

/**
 * Hook to automatically generate certificates when an exam is passed
 * This should be called from the exam completion handler
 */
export const useExamCertificateGeneration = () => {
  const { generateCertificates } = useCertificates();

  const handleExamPassed = useCallback(async (
    userId: string,
    courseId: string,
    enrollmentId: string,
    examScore: number,
    passingScore: number = 70
  ) => {
    if (examScore < passingScore) {
      console.log('Exam score below passing threshold, no certificates generated');
      return [];
    }

    try {
      console.log('Generating certificates for passed exam:', {
        userId,
        courseId,
        enrollmentId,
        examScore,
        passingScore
      });

      const certificates = await generateCertificates(
        userId,
        courseId,
        enrollmentId,
        examScore,
        passingScore
      );

      console.log('Successfully generated certificates:', certificates);
      return certificates;
    } catch (error) {
      console.error('Failed to generate certificates:', error);
      // Don't throw here - certificate generation failure shouldn't prevent exam completion
      return [];
    }
  }, [generateCertificates]);

  return {
    handleExamPassed
  };
};