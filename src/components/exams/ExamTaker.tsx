'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Exam, ExamQuestion, UserExamAttempt, UserExamAnswer } from '@/types/database';

interface ExamTakerProps {
  examId: string;
}

export default function ExamTaker({ examId }: ExamTakerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [attempt, setAttempt] = useState<UserExamAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const [currentPage, setCurrentPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<UserExamAttempt | null>(null);
  
  const questionsPerPage = 10;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  
  // Load or create an exam attempt
  useEffect(() => {
    async function loadExam() {
      try {
        setLoading(true);
        
        // First, check if there are any existing attempts
        const attemptsResponse = await fetch(`/api/exams/${examId}/attempts`);
        
        if (!attemptsResponse.ok) {
          throw new Error('Failed to load attempts');
        }
        
        const attemptsData = await attemptsResponse.json();
        
        // Check for incomplete attempts
        const incompleteAttempt = attemptsData.find((a: UserExamAttempt) => !a.completed);
        
        if (incompleteAttempt) {
          // Resume incomplete attempt
          setAttempt(incompleteAttempt);
          
          // Load answers for this attempt
          const attemptResponse = await fetch(`/api/exams/attempts/${incompleteAttempt.id}`);
          
          if (attemptResponse.ok) {
            const { attempt, answers: attemptAnswers } = await attemptResponse.json();
            
            // Map answers to format used by component
            const answerMap: Record<string, string> = {};
            attemptAnswers.forEach((answer: UserExamAnswer) => {
              if (answer.selected_option) {
                answerMap[answer.question_id] = answer.selected_option;
              }
            });
            
            setAnswers(answerMap);
          }
        } else {
          // Create a new attempt
          const newAttemptResponse = await fetch(`/api/exams/${examId}/attempts`, {
            method: 'POST'
          });
          
          if (!newAttemptResponse.ok) {
            throw new Error('Failed to create exam attempt');
          }
          
          const newAttempt = await newAttemptResponse.json();
          setAttempt(newAttempt);
        }
        
        // Load exam details and questions
        const examResponse = await fetch(`/api/exams/${examId}`);
        
        if (!examResponse.ok) {
          throw new Error('Failed to load exam');
        }
        
        const { exam: examData, questions: questionsData } = await examResponse.json();
        setExam(examData);
        setQuestions(questionsData);
      } catch (err) {
        console.error(err);
        setError('Error loading exam. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    loadExam();
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
        body: JSON.stringify({
          questionId,
          selectedOption: answer
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save answer');
      }
    } catch (err) {
      console.error('Error saving answer:', err);
      // Could show a notification that saving failed but continue
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
      
      // Submit the exam
      const response = await fetch(`/api/exams/attempts/${attempt.id}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit exam');
      }
      
      const completedAttempt = await response.json();
      setResult(completedAttempt);
      setCompleted(true);
    } catch (err) {
      console.error('Error submitting exam:', err);
      setError('Error submitting exam. Please try again.');
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