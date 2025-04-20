'use client';

import { useState, useEffect } from 'react';
import { Exam, ExamQuestion } from '@/types/database';
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  Textarea,
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui';
import { PlusCircle, Trash2, Edit, Save } from 'lucide-react';

interface ExamManagerProps {
  courseId: string;
}

export default function ExamManager({ courseId }: ExamManagerProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [editMode, setEditMode] = useState(false);
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [attemptLimit, setAttemptLimit] = useState<number | null>(null);
  
  // Fetch exams
  useEffect(() => {
    async function fetchExams() {
      try {
        setLoading(true);
        const response = await fetch(`/api/courses/${courseId}/exams`);
        
        if (!response.ok) {
          throw new Error('Failed to load exams');
        }
        
        const data = await response.json();
        setExams(data);
      } catch (err) {
        setError('Error loading exams. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchExams();
  }, [courseId]);
  
  // Load exam details
  const loadExam = async (examId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/exams/${examId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load exam details');
      }
      
      const data = await response.json();
      setCurrentExam(data.exam);
      setExamQuestions(data.questions);
      setTitle(data.exam.title);
      setDescription(data.exam.description);
      setPassingScore(data.exam.passing_score);
      setAttemptLimit(data.exam.attempt_limit);
      setEditMode(true);
    } catch (err) {
      setError('Error loading exam details. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Create new exam
  const createNewExam = () => {
    setCurrentExam(null);
    setExamQuestions([]);
    setTitle('');
    setDescription('');
    setPassingScore(70);
    setAttemptLimit(null);
    setEditMode(true);
  };
  
  // Add a blank question
  const addQuestion = () => {
    setExamQuestions([
      ...examQuestions,
      {
        id: `new-${Date.now()}`,
        exam_id: currentExam?.id || '',
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'a',
        created_at: new Date().toISOString()
      }
    ]);
  };
  
  // Update a question
  const updateQuestion = (index: number, field: string, value: string) => {
    const updatedQuestions = [...examQuestions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setExamQuestions(updatedQuestions);
  };
  
  // Remove a question
  const removeQuestion = (index: number) => {
    const updatedQuestions = [...examQuestions];
    updatedQuestions.splice(index, 1);
    setExamQuestions(updatedQuestions);
  };
  
  // Save exam
  const saveExam = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate form
      if (!title.trim()) {
        setError('Exam title is required');
        setLoading(false);
        return;
      }
      
      if (examQuestions.length === 0) {
        setError('Exam must have at least one question');
        setLoading(false);
        return;
      }
      
      // Validate all questions have content
      for (const question of examQuestions) {
        if (!question.question_text.trim() || 
            !question.option_a.trim() || 
            !question.option_b.trim() || 
            !question.option_c.trim() || 
            !question.option_d.trim()) {
          setError('All questions and options must be filled out');
          setLoading(false);
          return;
        }
      }
      
      const examData = {
        title,
        description,
        passing_score: passingScore,
        attempt_limit: attemptLimit,
        questions: examQuestions.map(q => ({
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option
        }))
      };
      
      let response;
      
      if (currentExam?.id) {
        // Update existing exam
        response = await fetch(`/api/exams/${currentExam.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(examData)
        });
      } else {
        // Create new exam
        response = await fetch(`/api/courses/${courseId}/exams`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(examData)
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to save exam');
      }
      
      const savedExam = await response.json();
      
      // Refresh the exams list
      const examsResponse = await fetch(`/api/courses/${courseId}/exams`);
      if (examsResponse.ok) {
        const examsData = await examsResponse.json();
        setExams(examsData);
      }
      
      setSuccess('Exam saved successfully');
      setEditMode(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Save exam error:', err);
      setError(err.message || 'Error saving exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete exam
  const deleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete exam');
      }
      
      // Remove from the list
      setExams(exams.filter(e => e.id !== examId));
      setSuccess('Exam deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error deleting exam. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Cancel editing
  const cancelEdit = () => {
    if (examQuestions.length > 0 && 
        !confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      return;
    }
    
    setEditMode(false);
    setCurrentExam(null);
    setExamQuestions([]);
  };
  
  if (loading && exams.length === 0) {
    return <div className="text-center py-8">Loading exams...</div>;
  }
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Exam Management</h2>

      {loading && <div className="p-4 text-center">Loading...</div>}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {!editMode ? (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Exams</h3>
            <Button onClick={createNewExam}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Exam
            </Button>
          </div>

          {exams.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No exams found. Create one to get started.
            </div>
          ) : (
            <div className="grid gap-4">
              {exams.map((exam) => (
                <Card key={exam.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-semibold">{exam.title}</h4>
                      <p className="text-sm text-gray-600">
                        Passing Score: {exam.passing_score}%
                      </p>
                      {exam.attempt_limit && (
                        <p className="text-sm text-gray-600">
                          Attempt Limit: {exam.attempt_limit}
                        </p>
                      )}
                      <p className="mt-2">{exam.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadExam(exam.id)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteExam(exam.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">
            {currentExam ? 'Edit Exam' : 'Create New Exam'}
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="exam-title">Exam Title *</Label>
              <Input
                id="exam-title"
                placeholder="Enter exam title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="exam-description">Description</Label>
              <Textarea
                id="exam-description"
                placeholder="Enter exam description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="passingScore">Passing Score (%)</Label>
                <Input
                  id="passingScore"
                  type="number"
                  min="1"
                  max="100"
                  value={passingScore}
                  onChange={e => setPassingScore(parseInt(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="attemptLimit">
                  Attempt Limit (leave empty for unlimited)
                </Label>
                <Input
                  id="attemptLimit"
                  type="number"
                  min="1"
                  value={attemptLimit === null || attemptLimit === undefined ? '' : attemptLimit}
                  onChange={e => {
                    const value = e.target.value.trim();
                    setAttemptLimit(value === '' ? null : parseInt(value));
                  }}
                  placeholder="Unlimited attempts"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button onClick={saveExam} disabled={loading}>
                <Save className="w-4 h-4 mr-2" /> Save Exam
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 