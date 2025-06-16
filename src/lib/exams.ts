import { createServerSupabaseClient } from './supabaseServer';
import type { Exam, ExamQuestion, UserExamAttempt, UserExamAnswer } from '../types/database';

// Get all exams for a course
export async function getCourseExams(courseId: string): Promise<Exam[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('course_id', courseId)
    .order('title');

  if (error) {
    console.error('Error fetching course exams:', error);
    throw error;
  }
  return data;
}

// Get a specific exam with all questions
export async function getExamWithQuestions(examId: string): Promise<{ exam: Exam; questions: ExamQuestion[] } | null> {
  const supabase = await createServerSupabaseClient();
  
  try {
    // Get the exam
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single();
    
    if (examError) {
      if (examError.code === 'PGRST116') { // Record not found
        return null;
      }
      console.error('Error fetching exam:', examError);
      throw examError;
    }
    
    // Get the questions for this exam
    const { data: questionsData, error: questionsError } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', examId)
      .order('created_at');
      
    if (questionsError) {
      console.error('Error fetching exam questions:', questionsError);
      throw questionsError;
    }
    
    return {
      exam: examData,
      questions: questionsData || []
    };
  } catch (error) {
    console.error('Error in getExamWithQuestions:', error);
    throw error;
  }
}

// Create a new exam for a course
export async function createExam(
  exam: Omit<Exam, 'id' | 'created_at'>,
  questions: Omit<ExamQuestion, 'id' | 'exam_id' | 'created_at'>[]
): Promise<{ exam: Exam; questions: ExamQuestion[] }> {
  const supabase = await createServerSupabaseClient();
  
  try {
    // Insert the exam
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .insert(exam)
      .select()
      .single();

    if (examError) {
      console.error('Error creating exam:', examError);
      throw examError;
    }

    if (questions.length > 0) {
      // Add the exam ID to all questions
      const questionsWithExamId = questions.map(question => ({
        ...question,
        exam_id: examData.id
      }));
      
      // Insert all questions
      const { data: questionData, error: questionsError } = await supabase
        .from('exam_questions')
        .insert(questionsWithExamId)
        .select();
        
      if (questionsError) {
        console.error('Error creating exam questions:', questionsError);
        throw questionsError;
      }

      return { 
        exam: examData, 
        questions: questionData || [] 
      };
    }

    return { 
      exam: examData, 
      questions: [] 
    };
  } catch (error) {
    console.error('Error in createExam:', error);
    throw error;
  }
}

// Update an existing exam
export async function updateExam(
  examId: string,
  exam: Partial<Omit<Exam, 'id' | 'created_at'>>,
  questions?: Omit<ExamQuestion, 'id' | 'exam_id' | 'created_at'>[]
): Promise<{ exam: Exam; questions: ExamQuestion[] }> {
  const supabase = await createServerSupabaseClient();
  
  try {
    // Update exam
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .update(exam)
      .eq('id', examId)
      .select()
      .single();

    if (examError) {
      console.error('Error updating exam:', examError);
      throw examError;
    }

    let updatedQuestions: ExamQuestion[] = [];
    
    // Update questions if provided
    if (questions) {
      // Delete existing questions for this exam
      const { error: deleteError } = await supabase
        .from('exam_questions')
        .delete()
        .eq('exam_id', examId);
        
      if (deleteError) {
        console.error('Error deleting existing exam questions:', deleteError);
        throw deleteError;
      }
      
      if (questions.length > 0) {
        // Add the exam ID to all questions
        const questionsWithExamId = questions.map(question => ({
          ...question,
          exam_id: examId
        }));
        
        // Insert all questions
        const { data: questionData, error: questionsError } = await supabase
          .from('exam_questions')
          .insert(questionsWithExamId)
          .select();
          
        if (questionsError) {
          console.error('Error updating exam questions:', questionsError);
          throw questionsError;
        }
        
        updatedQuestions = questionData || [];
      }
    } else {
      // Fetch existing questions if not updating them
      const { data: existingQuestions, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId);
        
      if (questionsError) {
        console.error('Error fetching existing exam questions:', questionsError);
        throw questionsError;
      }
      
      updatedQuestions = existingQuestions || [];
    }

    return { 
      exam: examData, 
      questions: updatedQuestions 
    };
  } catch (error) {
    console.error('Error in updateExam:', error);
    throw error;
  }
}

// Delete an exam and all its questions
export async function deleteExam(examId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  try {
    // Delete questions first (foreign key constraint)
    const { error: questionsError } = await supabase
      .from('exam_questions')
      .delete()
      .eq('exam_id', examId);
      
    if (questionsError) {
      console.error('Error deleting exam questions:', questionsError);
      throw questionsError;
    }
    
    // Then delete the exam
    const { error: examError } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId);
      
    if (examError) {
      console.error('Error deleting exam:', examError);
      throw examError;
    }
  } catch (error) {
    console.error('Error in deleteExam:', error);
    throw error;
  }
}

// Create a new exam attempt for a user
export async function createExamAttempt(
  userId: string,
  examId: string
): Promise<UserExamAttempt> {
  const supabase = await createServerSupabaseClient();
  
  const attemptData = {
    user_id: userId,
    exam_id: examId,
    score: null,
    completed: false,
    started_at: new Date().toISOString(),
    completed_at: null,
    passed: null
  };
  
  const { data, error } = await supabase
    .from('user_exam_attempts')
    .insert(attemptData)
    .select()
    .single();
    
  if (error) {
    console.error('Error creating exam attempt:', error);
    throw error;
  }
  
  return data;
}

// Save a user's answer to a question
export async function saveUserAnswer(
  attemptId: string,
  questionId: string,
  selectedOption: 'a' | 'b' | 'c' | 'd'
): Promise<UserExamAnswer> {
  const supabase = await createServerSupabaseClient();
  
  // Get the correct answer for this question
  const { data: question, error: questionError } = await supabase
    .from('exam_questions')
    .select('correct_option')
    .eq('id', questionId)
    .single();
    
  if (questionError) {
    console.error('Error fetching question:', questionError);
    throw questionError;
  }
  
  const isCorrect = question.correct_option === selectedOption;
  
  const answerData = {
    attempt_id: attemptId,
    question_id: questionId,
    selected_option: selectedOption,
    is_correct: isCorrect
  };
  
  // Check if the user has already answered this question
  const { data: existingAnswer, error: existingError } = await supabase
    .from('user_exam_answers')
    .select('id')
    .eq('attempt_id', attemptId)
    .eq('question_id', questionId)
    .maybeSingle();
    
  if (existingError) {
    console.error('Error checking existing answer:', existingError);
    throw existingError;
  }
  
  let result;
  
  if (existingAnswer) {
    // Update existing answer
    const { data, error } = await supabase
      .from('user_exam_answers')
      .update(answerData)
      .eq('id', existingAnswer.id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating answer:', error);
      throw error;
    }
    
    result = data;
  } else {
    // Insert new answer
    const { data, error } = await supabase
      .from('user_exam_answers')
      .insert(answerData)
      .select()
      .single();
      
    if (error) {
      console.error('Error saving answer:', error);
      throw error;
    }
    
    result = data;
  }
  
  return result;
}

// Complete an exam attempt and calculate score
export async function completeExamAttempt(attemptId: string): Promise<UserExamAttempt> {
  const supabase = await createServerSupabaseClient();
  
  // Get all answers for this attempt
  const { data: answers, error: answersError } = await supabase
    .from('user_exam_answers')
    .select('is_correct')
    .eq('attempt_id', attemptId);
    
  if (answersError) {
    console.error('Error fetching answers:', answersError);
    throw answersError;
  }
  
  // Calculate score (percentage correct)
  const totalQuestions = answers.length;
  const correctAnswers = answers.filter(a => a.is_correct).length;
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  
  // Get the exam to determine if the user passed
  const { data: attempt, error: attemptError } = await supabase
    .from('user_exam_attempts')
    .select('exam_id')
    .eq('id', attemptId)
    .single();
    
  if (attemptError) {
    console.error('Error fetching attempt:', attemptError);
    throw attemptError;
  }
  
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('passing_score')
    .eq('id', attempt.exam_id)
    .single();
    
  if (examError) {
    console.error('Error fetching exam:', examError);
    throw examError;
  }
  
  const passed = score >= exam.passing_score;
  
  // Update the attempt with the score and completion
  const { data, error } = await supabase
    .from('user_exam_attempts')
    .update({
      score,
      completed: true,
      completed_at: new Date().toISOString(),
      passed
    })
    .eq('id', attemptId)
    .select()
    .single();
    
  if (error) {
    console.error('Error completing attempt:', error);
    throw error;
  }
  
  return data;
}

// Get user's exam attempts for a specific exam
export async function getUserExamAttempts(userId: string, examId: string): Promise<UserExamAttempt[]> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_exam_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('exam_id', examId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching user exam attempts:', error);
    throw error;
  }
  
  return data;
}

// Get a specific exam attempt with all answers
export async function getExamAttemptWithAnswers(
  attemptId: string
): Promise<{ attempt: UserExamAttempt; answers: UserExamAnswer[] }> {
  const supabase = await createServerSupabaseClient();
  
  const { data: attempt, error: attemptError } = await supabase
    .from('user_exam_attempts')
    .select('*')
    .eq('id', attemptId)
    .single();
    
  if (attemptError) {
    console.error('Error fetching attempt:', attemptError);
    throw attemptError;
  }
  
  const { data: answers, error: answersError } = await supabase
    .from('user_exam_answers')
    .select('*')
    .eq('attempt_id', attemptId);
    
  if (answersError) {
    console.error('Error fetching answers:', answersError);
    throw answersError;
  }
  
  return {
    attempt,
    answers: answers || []
  };
} 