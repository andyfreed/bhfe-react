'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Exam, ExamQuestion } from '@/types/database';

// Updated interface to match current API/database schema
interface ExamAttempt {
  id: string;
  user_id: string;
  exam_id: string;
  score: number | null;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
  passed: boolean | null;
  created_at: string;
  updated_at: string;
}

// Updated interface for exam answers
interface ExamAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_options: string[];
  is_correct: boolean;
  created_at: string;
}

interface ExamTakerProps {
  examId: string;
}

export default function ExamTaker({ examId }: ExamTakerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const [currentPage, setCurrentPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<ExamAttempt | null>(null);
  
  const questionsPerPage = 10;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  
  // Validate exam ID format
  const isValidUUID = (id: string) => {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(id);
  };
  
  // Load or create an exam attempt
  useEffect(() => {
    async function loadExam() {
      try {
        setLoading(true);
        
        // Validate exam ID before proceeding
        if (!isValidUUID(examId)) {
          setError(`Invalid exam ID format: ${examId}. Please contact support if this issue persists.`);
          setLoading(false);
          return;
        }
        
        // First, check if there are any existing attempts
        const attemptsResponse = await fetch(`/api/exams/${examId}/attempts`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!attemptsResponse.ok) {
          const errorText = await attemptsResponse.text();
          console.error(`Failed to load attempts: ${attemptsResponse.status} ${errorText}`);
          
          // In development mode, provide a more detailed error message
          if (process.env.NODE_ENV === 'development') {
            setError(`Failed to load attempts: ${attemptsResponse.status} - ${errorText.substring(0, 100)}... The server may be restarting or experiencing issues.`);
          } else {
            setError('Failed to load attempts. Please try again later.');
          }
          
          setLoading(false);
          return;
        }
        
        const attemptsData = await attemptsResponse.json();
        
        // Find an incomplete attempt based on completed field
        const incompleteAttempt = attemptsData.find((a: ExamAttempt) => !a.completed);
        
        if (incompleteAttempt) {
          // Resume incomplete attempt
          setAttempt(incompleteAttempt);
          
          // Load answers for this attempt
          const attemptResponse = await fetch(`/api/exams/attempts/${incompleteAttempt.id}`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (attemptResponse.ok) {
            const attemptData = await attemptResponse.json();
            
            // Get answers for this attempt
            const answersResponse = await fetch(`/api/exams/attempts/${incompleteAttempt.id}/answers`, {
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            
            if (answersResponse.ok) {
              const answersData = await answersResponse.json();
              
              // Map answers to format used by component
              const answerMap: Record<string, string> = {};
              answersData.forEach((answer: any) => {
                if (answer.selected_option) {
                  answerMap[answer.question_id] = answer.selected_option;
                }
              });
              
              setAnswers(answerMap);
            }
          }
        } else {
          // Create a new attempt
          const newAttemptResponse = await fetch(`/api/exams/${examId}/attempts`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!newAttemptResponse.ok) {
            const errorText = await newAttemptResponse.text();
            console.error('Failed to create exam attempt:', errorText);
            throw new Error(`Failed to create exam attempt: ${errorText}`);
          }
          
          const newAttempt = await newAttemptResponse.json();
          setAttempt(newAttempt);
        }
        
        // Load exam details and questions
        const examResponse = await fetch(`/api/exams/${examId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!examResponse.ok) {
          const errorText = await examResponse.text();
          console.error('Failed to load exam:', errorText);
          throw new Error(`Failed to load exam: ${errorText}`);
        }
        
        const { exam: examData, questions: questionsData } = await examResponse.json();
        setExam(examData);
        setQuestions(questionsData);
      } catch (err) {
        console.error('Error loading exam:', err);
        
        // Better error handling
        let errorMessage = 'Error loading exam. Please try again later.';
        
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'object' && err !== null) {
          // Handle cases where error is an object
          errorMessage = JSON.stringify(err);
        } else {
          errorMessage = String(err);
        }
        
        // In development mode, show full error
        if (process.env.NODE_ENV === 'development') {
          setError(`Error loading exam: ${errorMessage}`);
        } else {
          setError('Error loading exam. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    }
    
    loadExam().catch((err) => {
      // Catch any unhandled promise rejections
      console.error('Unhandled error in loadExam:', err);
      setError('An unexpected error occurred. Please refresh the page.');
      setLoading(false);
    });
  }, [examId]);
  
  // Get current page of questions
  const currentQuestions = questions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  );
  
  // Calculate progress
  const answeredQuestions = Object.keys(answers).length;
  const progress = Math.floor((answeredQuestions / questions.length) * 100);
  
  // Handle answer selection
  const handleAnswer = async (questionId: string, answer: string) => {
    if (!attempt) return;
    
    // Update local state
    setAnswers({
      ...answers,
      [questionId]: answer
    });
    
    try {
      // Save answer to server
      const response = await fetch(`/api/exams/attempts/${attempt.id}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          questionId,
          selectedOptions: [answer]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to save answer:', errorText);
        throw new Error(`Failed to save answer: ${errorText}`);
      }
    } catch (err) {
      console.error('Error saving answer:', err);
      
      // Show a user-friendly error message
      let errorMessage = 'Failed to save answer';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // You could show a toast notification here
      // For now, we'll just log it and continue
      // The answer is still saved locally
      console.warn('Answer saved locally but failed to sync with server:', errorMessage);
    }
  };
  
  // Handle page navigation
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo(0, 0);
    }
  };
  
  // Submit the exam
  const submitExam = async () => {
    if (!attempt) return;
    
    try {
      setSubmitting(true);
      
      // Calculate how many questions are unanswered
      const unanswered = questions.length - answeredQuestions;
      
      // Confirm submission if there are unanswered questions
      if (unanswered > 0) {
        const confirmed = confirm(
          `You have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}. Are you sure you want to submit your exam?`
        );
        
        if (!confirmed) {
          setSubmitting(false);
          return;
        }
      }
      
      // Submit the exam - set status to completed
      const response = await fetch(`/api/exams/attempts/${attempt.id}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to submit exam:', errorText);
        throw new Error(`Failed to submit exam: ${errorText}`);
      }
      
      const completedAttempt = await response.json();
      setResult(completedAttempt);
      setCompleted(true);
    } catch (err) {
      console.error('Error submitting exam:', err);
      
      // Better error handling
      let errorMessage = 'Error submitting exam. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      } else {
        errorMessage = String(err);
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="text-center py-8">Loading exam...</div>;
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded my-8" role="alert">
        <div className="font-bold">Error</div>
        <div>{error}</div>
      </div>
    );
  }
  
  if (!exam) {
    return (
      <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded my-8" role="alert">
        <div className="font-bold">Error</div>
        <div>Exam not found</div>
      </div>
    );
  }
  
  if (completed && result) {
    // Show exam results
    return (
      <div className="bg-white shadow-md rounded-lg p-8 my-8">
        <h2 className="text-2xl font-bold mb-4">Exam Results</h2>
        
        <div className="text-center my-8">
          <div className="text-5xl font-bold mb-2">{result.score}%</div>
          <div className="text-xl">
            {result.passed ? (
              <span className="text-green-600">You passed!</span>
            ) : (
              <span className="text-red-600">You did not pass.</span>
            )}
          </div>
          <p className="mt-4">
            {result.passed
              ? 'Congratulations! You have successfully completed this exam.'
              : `You needed ${exam.passing_score}% to pass. Please try again.`}
          </p>
        </div>
        
        <div className="flex justify-center mt-8">
          <button 
            onClick={() => router.push(`/courses/${exam.course_id}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Return to Course
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 my-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{exam.title}</h1>
        <div className="text-sm">
          Question {currentPage * questionsPerPage + 1}-
          {Math.min((currentPage + 1) * questionsPerPage, questions.length)} of {questions.length}
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-md shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium">Your Progress</div>
          <div className="text-sm">{progress}% Complete</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${progress}%` }} 
          ></div>
        </div>
      </div>
      
      <div className="space-y-6">
        {currentQuestions.map((question, index) => (
          <div key={question.id} className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">
              {currentPage * questionsPerPage + index + 1}. {question.question_text}
            </h3>
            
            <div className="space-y-3">
              {[
                { value: 'a', label: question.option_a },
                { value: 'b', label: question.option_b },
                { value: 'c', label: question.option_c },
                { value: 'd', label: question.option_d }
              ].map((option) => (
                <label 
                  key={option.value} 
                  className={`flex items-center p-3 rounded-md border cursor-pointer transition-colors
                    ${answers[question.id] === option.value 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'hover:bg-gray-50'}`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option.value}
                    checked={answers[question.id] === option.value}
                    onChange={() => handleAnswer(question.id, option.value)}
                    className="mr-2"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between mt-8">
        <button
          onClick={prevPage}
          disabled={currentPage === 0}
          className={`px-4 py-2 rounded border ${
            currentPage === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          ← Previous
        </button>
        
        <div>
          {currentPage === totalPages - 1 ? (
            <button 
              onClick={submitExam} 
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          ) : (
            <button 
              onClick={nextPage}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 