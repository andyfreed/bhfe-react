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
        throw new Error('Failed to save exam');
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
    } catch (err) {
      setError('Error saving exam. Please try again.');
      console.error(err);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Course Exams</h2>
        {!editMode && (
          <Button onClick={createNewExam}>
            <PlusCircle className="w-4 h-4 mr-2" /> Create New Exam
          </Button>
        )}
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert variant="success">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {!editMode ? (
        <div className="grid gap-4 md:grid-cols-2">
          {exams.length === 0 ? (
            <div className="col-span-2 text-center py-8 bg-slate-50 rounded-lg">
              <p>No exams have been created for this course yet.</p>
              <Button onClick={createNewExam} className="mt-4">
                <PlusCircle className="w-4 h-4 mr-2" /> Create your first exam
              </Button>
            </div>
          ) : (
            exams.map(exam => (
              <Card key={exam.id} className="p-4">
                <h3 className="text-lg font-bold">{exam.title}</h3>
                <p className="text-sm text-gray-600 mt-1 mb-3">{exam.description}</p>
                <p className="text-sm">Passing Score: {exam.passing_score}%</p>
                
                <div className="flex mt-4 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadExam(exam.id)}
                  >
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteExam(exam.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">
              {currentExam ? 'Edit Exam' : 'Create New Exam'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Exam Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Enter exam title"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Enter exam description"
                  rows={3}
                />
              </div>
              
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
            </div>
          </Card>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Questions</h3>
              <Button onClick={addQuestion} variant="outline">
                <PlusCircle className="w-4 h-4 mr-2" /> Add Question
              </Button>
            </div>
            
            {examQuestions.length === 0 ? (
              <Card className="p-6 text-center">
                <p>No questions added yet. Add your first question to get started.</p>
                <Button onClick={addQuestion} className="mt-4">
                  <PlusCircle className="w-4 h-4 mr-2" /> Add Question
                </Button>
              </Card>
            ) : (
              examQuestions.map((question, index) => (
                <Card key={question.id} className="p-6">
                  <div className="flex justify-between">
                    <h4 className="text-lg font-bold">Question {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor={`question-${index}`}>Question</Label>
                      <Textarea
                        id={`question-${index}`}
                        value={question.question_text}
                        onChange={e => updateQuestion(index, 'question_text', e.target.value)}
                        placeholder="Enter question text"
                        rows={2}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`option-a-${index}`}>Option A</Label>
                        <Input
                          id={`option-a-${index}`}
                          value={question.option_a}
                          onChange={e => updateQuestion(index, 'option_a', e.target.value)}
                          placeholder="Option A"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`option-b-${index}`}>Option B</Label>
                        <Input
                          id={`option-b-${index}`}
                          value={question.option_b}
                          onChange={e => updateQuestion(index, 'option_b', e.target.value)}
                          placeholder="Option B"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`option-c-${index}`}>Option C</Label>
                        <Input
                          id={`option-c-${index}`}
                          value={question.option_c}
                          onChange={e => updateQuestion(index, 'option_c', e.target.value)}
                          placeholder="Option C"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`option-d-${index}`}>Option D</Label>
                        <Input
                          id={`option-d-${index}`}
                          value={question.option_d}
                          onChange={e => updateQuestion(index, 'option_d', e.target.value)}
                          placeholder="Option D"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`correct-${index}`}>Correct Answer</Label>
                      <Select
                        id={`correct-${index}`}
                        value={question.correct_option}
                        onChange={e => updateQuestion(index, 'correct_option', e.target.value)}
                      >
                        <option value="a">Option A</option>
                        <option value="b">Option B</option>
                        <option value="c">Option C</option>
                        <option value="d">Option D</option>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))
            )}
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
      )}
    </div>
  );
} 