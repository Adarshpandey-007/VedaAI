export interface IQuestionType {
  type: string;
  count: number;
  marksPerQuestion: number;
}

export interface IAssignment {
  id: string;
  title: string;
  dueDate: string;
  questionTypes: IQuestionType[];
  additionalInstructions?: string;
  examClass?: string;
  examSection?: string;
  examSubject?: string;
  schoolName?: string;
  fileUrl?: string;
  fileName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0 to 100
  totalQuestions: number;
  totalMarks: number;
  createdAt: string;
}

export interface IQuestion {
  id: string;
  text: string;
  options?: string[];
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
  answer: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IAnswerKeyItem {
  questionId: string;
  questionText: string;
  answer: string;
}

export interface IQuestionPaper {
  assignmentId: string;
  schoolName: string;
  subject: string;
  gradeClass: string;
  timeAllowed: string;
  maxMarks: number;
  sections: ISection[];
  answerKey: IAnswerKeyItem[];
}

export interface IToolkitItem {
  id: string;
  type: 'lesson' | 'rubric' | 'activity';
  title: string;
  topic: string;
  grade: string;
  instructions?: string;
  content: string;
  createdAt: string;
}
