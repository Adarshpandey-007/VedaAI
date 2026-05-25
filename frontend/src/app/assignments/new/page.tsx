'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/assignmentStore';
import { subscribeToAssignment } from '@/utils/socket';
import { 
  ArrowLeft, 
  UploadCloud, 
  Plus, 
  Trash2, 
  Mic, 
  CheckCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import styles from './AssignmentForm.module.css';
import { IQuestionType } from '@/types';

const DEFAULT_QUESTION_TYPES = [
  { type: 'Multiple Choice Questions', count: 4, marksPerQuestion: 1 },
  { type: 'Short Questions', count: 3, marksPerQuestion: 2 },
  { type: 'Diagram/Graph-Based Questions', count: 1, marksPerQuestion: 5 },
  { type: 'Numerical Problems', count: 1, marksPerQuestion: 5 }
];

export default function CreateAssignmentPage() {
  const router = useRouter();
  
  // Zustand store triggers
  const createAssignment = useAssignmentStore(state => state.createAssignment);
  const isGenerating = useAssignmentStore(state => state.isGenerating);
  const activeAssignmentId = useAssignmentStore(state => state.activeAssignmentId);
  const generationProgress = useAssignmentStore(state => state.generationProgress);
  const generationStatusText = useAssignmentStore(state => state.generationStatusText);
  const currentPaper = useAssignmentStore(state => state.currentPaper);
  const resetGenerationState = useAssignmentStore(state => state.resetGenerationState);
  const error = useAssignmentStore(state => state.error);

  // Form local state
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessState, setShowSuccessState] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [examClass, setExamClass] = useState('');
  const [examSection, setExamSection] = useState('');
  const [examSubject, setExamSubject] = useState('');
  const [schoolName, setSchoolName] = useState('Delhi Public School'); // Default or picked from settings
  const [questionTypes, setQuestionTypes] = useState<IQuestionType[]>(DEFAULT_QUESTION_TYPES);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  
  // Drag and drop states
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recording mock state
  const [isRecording, setIsRecording] = useState(false);

  // Totals calculations
  const totalQuestions = questionTypes.reduce((acc, curr) => acc + curr.count, 0);
  const totalMarks = questionTypes.reduce((acc, curr) => acc + (curr.count * curr.marksPerQuestion), 0);

  // Clean generation state on mount
  useEffect(() => {
    if (!isGenerating) {
      resetGenerationState();
      setShowSuccessState(false);
    }
  }, [isGenerating, resetGenerationState]);

  // Sync active tracking ID on mount / change
  useEffect(() => {
    if (activeAssignmentId) {
      setCreatedId(activeAssignmentId);
    }
  }, [activeAssignmentId]);

  // Listen for progress hitting 100% to trigger the success animation window
  useEffect(() => {
    if (isGenerating && generationProgress === 100) {
      setShowSuccessState(true);
    }
  }, [isGenerating, generationProgress]);

  // Success Confirmation State Timer Delay redirect hook
  useEffect(() => {
    if (showSuccessState && createdId) {
      const timer = setTimeout(() => {
        resetGenerationState();
        setShowSuccessState(false);
        router.push(`/assignments/${createdId}/output`);
      }, 1400); // Dynamic 1.4s window for premium checkmark popup bounce feedback
      return () => clearTimeout(timer);
    }
  }, [showSuccessState, createdId, router, resetGenerationState]);

  // Hook WebSocket redirection once complete (fallback guard)
  useEffect(() => {
    if (showSuccessState) return;
    if (!isGenerating && currentPaper && createdId && currentPaper.assignmentId === createdId) {
      router.push(`/assignments/${createdId}/output`);
    }
  }, [isGenerating, currentPaper, createdId, router, showSuccessState]);

  // File Upload Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Question Row Mutators
  const addQuestionType = () => {
    setQuestionTypes([
      ...questionTypes,
      { type: 'Multiple Choice Questions', count: 1, marksPerQuestion: 1 }
    ]);
  };

  const updateQuestionRow = (idx: number, fields: Partial<IQuestionType>) => {
    const updated = [...questionTypes];
    updated[idx] = { ...updated[idx], ...fields };
    setQuestionTypes(updated);
  };

  const deleteQuestionRow = (idx: number) => {
    if (questionTypes.length === 1) return; // Prevent deleting last row
    setQuestionTypes(questionTypes.filter((_, i) => i !== idx));
  };

  // Counter Increments/Decrements
  const incrementCount = (idx: number) => {
    updateQuestionRow(idx, { count: questionTypes[idx].count + 1 });
  };

  const decrementCount = (idx: number) => {
    if (questionTypes[idx].count > 1) {
      updateQuestionRow(idx, { count: questionTypes[idx].count - 1 });
    }
  };

  const incrementMarks = (idx: number) => {
    updateQuestionRow(idx, { marksPerQuestion: questionTypes[idx].marksPerQuestion + 1 });
  };

  const decrementMarks = (idx: number) => {
    if (questionTypes[idx].marksPerQuestion > 1) {
      updateQuestionRow(idx, { marksPerQuestion: questionTypes[idx].marksPerQuestion - 1 });
    }
  };

  // Voice Typing Mock handler
  const toggleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    setIsRecording(true);
    // Simulate typing after 2 seconds
    setTimeout(() => {
      setAdditionalInstructions(prev => 
        (prev ? prev + ' ' : '') + 'Create a CBSE Grade 8 Science syllabus standard paper on Electricity. Integrate NCERT chapters and include clear labels.'
      );
      setIsRecording(false);
    }, 2000);
  };

  // Submit and Queue handshakes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('Please fill out the Assignment Title.');
      return;
    }
    if (!dueDate) {
      alert('Please select a Due Date.');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('dueDate', dueDate);
    formData.append('questionTypes', JSON.stringify(questionTypes));
    formData.append('additionalInstructions', additionalInstructions);
    formData.append('examClass', examClass);
    formData.append('examSection', examSection);
    formData.append('examSubject', examSubject);
    formData.append('schoolName', schoolName);
    
    files.forEach((f) => {
      formData.append('files', f);
    });

    try {
      // 1. Submit API POST request
      const newAssignment = await createAssignment(formData);
      setCreatedId(newAssignment.id);
      
      // 2. Connect client WebSocket listeners to the assignment channel
      subscribeToAssignment(newAssignment.id);

      // 3. Stay on page to let the real-time progress HUD complete and auto-redirect!
      // router.push('/assignments');

    } catch (err: any) {
      setIsSubmitting(false);
      alert(err.message || 'Failed to submit form.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showLoader = isGenerating || showSuccessState;

  return (
    <>
      {!showLoader && (
        <div className={styles.container}>
          {/* breadcrumb */}
          <div className={styles.header}>
            <div className={styles.breadcrumb}>
              <Link href="/assignments" className={styles.backLink}>
                <ArrowLeft size={16} />
                <span>Assignment</span>
              </Link>
            </div>
            <h1 className={styles.title}>Create Assignment</h1>
            <p className={styles.subtitle}>Set up a new assignment for your students</p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              padding: '1rem 1.5rem',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              boxShadow: 'var(--shadow-sm)',
              marginTop: '1rem'
            }}>
              <AlertCircle size={18} color="#B91C1C" />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 800 }}>AI Generation Failed:</span> {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={`${styles.formCard} ${isSubmitting ? styles.formSubmitting : ''}`}>
            {/* Basic Section */}
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Assignment Details</h2>
              <p className={styles.sectionSubtitle}>Basic information about your assignment</p>
            </div>

            {/* Title Field */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Assignment Title</label>
              <input 
                type="text" 
                placeholder="e.g. Quiz on Electricity" 
                className={styles.dateInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Class / Grade</label>
              <input 
                type="text" 
                placeholder="e.g. Class 8th" 
                className={styles.dateInput}
                value={examClass}
                onChange={(e) => setExamClass(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup} style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className={styles.label}>Subject</label>
                <input 
                  type="text" 
                  placeholder="e.g. Science" 
                  className={styles.dateInput}
                  value={examSubject}
                  onChange={(e) => setExamSubject(e.target.value)}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className={styles.label}>School Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Delhi Public School" 
                  className={styles.dateInput}
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Drag & Drop File upload */}
            <div 
              className={`${styles.uploadZone} ${isDragActive ? styles.uploadZoneActive : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
                accept=".txt,.png,.jpg,.jpeg,.pdf"
                multiple
              />
              
              {files.length > 0 ? (
                <div className={styles.fileList} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                  {files.map((f, i) => (
                    <div key={i} className={styles.fileIndicator} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F0FDF4', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                      <FileText size={18} color="#166534" />
                      <span className={styles.fileName} style={{ fontSize: '0.85rem', fontWeight: 600, color: '#166534' }}>{f.name}</span>
                      <button 
                        type="button" 
                        className={styles.removeFileBtn}
                        onClick={() => removeFile(i)}
                        style={{ background: 'transparent', border: 'none', color: '#B91C1C', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <span style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.5rem', fontWeight: 600 }}>Click or drag more files to add to reference material.</span>
                </div>
              ) : (
                <>
                  <div className={styles.uploadIcon}>
                    <UploadCloud size={24} />
                  </div>
                  <div className={styles.uploadText}>
                    <span className={styles.uploadTitle}>Choose files or drag & drop them here</span>
                    <span className={styles.uploadLimits}>JPEG, PNG, PDF, TXT up to 10MB (Multiple allowed)</span>
                  </div>
                  <button type="button" className={styles.browseBtn}>Browse Files</button>
                </>
              )}
            </div>
            <p className={styles.sectionSubtitle} style={{ marginTop: '-1rem', textAlign: 'center' }}>
              Upload images or notes of your preferred document/image for AI reference
            </p>

            {/* Due Date Field */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Due Date</label>
              <div className={styles.dateInputWrapper}>
                <input 
                  type="date" 
                  className={styles.dateInput}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Question Types Builder */}
            <div className={styles.tableContainer}>
              <label className={styles.label}>Question Type Configuration</label>
              
              <div className={styles.tableHeader}>
                <span>Question Type</span>
                <span style={{ textAlign: 'center' }}>No. of Questions</span>
                <span style={{ textAlign: 'center' }}>Marks</span>
                <span></span>
              </div>

              {questionTypes.map((qt, idx) => (
                <div key={idx} className={styles.row}>
                  <select 
                    className={styles.selectInput}
                    value={qt.type}
                    onChange={(e) => updateQuestionRow(idx, { type: e.target.value })}
                  >
                    <option value="Multiple Choice Questions">Multiple Choice Questions</option>
                    <option value="Short Questions">Short Questions</option>
                    <option value="Diagram/Graph-Based Questions">Diagram/Graph-Based Questions</option>
                    <option value="Numerical Problems">Numerical Problems</option>
                  </select>

                  {/* Number of Questions Counter */}
                  <div className={styles.counter}>
                    <button type="button" className={styles.counterBtn} onClick={() => decrementCount(idx)}>-</button>
                    <span className={styles.counterVal}>{qt.count}</span>
                    <button type="button" className={styles.counterBtn} onClick={() => incrementCount(idx)}>+</button>
                  </div>

                  {/* Marks Counter */}
                  <div className={styles.counter}>
                    <button type="button" className={styles.counterBtn} onClick={() => decrementMarks(idx)}>-</button>
                    <span className={styles.counterVal}>{qt.marksPerQuestion}</span>
                    <button type="button" className={styles.counterBtn} onClick={() => incrementMarks(idx)}>+</button>
                  </div>

                  {/* Delete Button */}
                  <button 
                    type="button" 
                    className={styles.deleteBtn}
                    onClick={() => deleteQuestionRow(idx)}
                    disabled={questionTypes.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <button type="button" className={styles.addBtn} onClick={addQuestionType}>
                <Plus size={16} />
                <span>Add Question Type</span>
              </button>
            </div>

            {/* Dynamic aggregates */}
            <div className={styles.totalsBlock}>
              <span>Total Questions: <span className={styles.totalHighlight}>{totalQuestions}</span></span>
              <span>Total Marks: <span className={styles.totalHighlight}>{totalMarks}</span></span>
            </div>

            {/* Additional information + Voice Indicator */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Additional Information (For better output)</label>
              <div className={styles.textareaWrapper}>
                <textarea 
                  placeholder="e.g. Generate a question paper for 3 hour exam duration, highlighting CBSE Grade 8 NCERT topics."
                  className={styles.textarea}
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                />
                <Mic 
                  size={18} 
                  className={`${styles.micIcon} ${isRecording ? styles.micIconActive : ''}`} 
                  onClick={toggleVoiceRecording}
                />
              </div>
            </div>

            {/* Footer controls */}
            <div className={styles.footer}>
              <Link href="/assignments" style={{ textDecoration: 'none' }}>
                <button type="button" className={styles.prevBtn} disabled={isSubmitting}>
                  Previous
                </button>
              </Link>
              <button type="submit" className={styles.nextBtn} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)"></circle>
                      <path d="M12 2C6.47715 2 2 6.47715 2 12C2 13.5 2.5 14.8 3.3 15.9" stroke="white" strokeLinecap="round"></path>
                    </svg>
                    <span>Configuring AI...</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <span>&rarr;</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {showLoader && (
        /* WebSocket Generation progress HUD */
        <div className={styles.overlay}>
          <div className={styles.hudCard}>
            <div className={`${styles.hudIcon} ${showSuccessState ? styles.successIcon : ''}`}>
              {showSuccessState ? (
                <CheckCircle size={32} />
              ) : (
                <UploadCloud size={32} className="pulse" />
              )}
            </div>
            
            <div className={styles.hudLoader}>
              <span className={`${styles.hudPercent} ${showSuccessState ? styles.hudPercentSuccess : ''}`}>
                {showSuccessState ? 100 : generationProgress}%
              </span>
              <div className={styles.hudProgressContainer}>
                <div 
                  className={`${styles.hudProgressBar} ${showSuccessState ? styles.hudProgressBarSuccess : ''}`} 
                  style={{ width: `${showSuccessState ? 100 : generationProgress}%` }}
                ></div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span className={`${styles.hudStatus} ${showSuccessState ? styles.hudStatusSuccess : ''}`}>
                {showSuccessState ? 'Generation Successful!' : generationStatusText}
              </span>
              <span className={styles.hudSubText}>
                {showSuccessState 
                  ? 'Exam compiled. Loading CBSE paper layout...' 
                  : 'Queue is processing. Our worker is compiling CBSE sections.'
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
