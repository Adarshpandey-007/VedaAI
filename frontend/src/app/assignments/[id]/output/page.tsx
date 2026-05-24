'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/assignmentStore';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Eye, 
  EyeOff, 
  Calendar,
  AlertTriangle
} from 'lucide-react';
import styles from './QuestionPaperView.module.css';

export default function QuestionPaperOutputPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  // Sync state from Zustand store
  const currentPaper = useAssignmentStore(state => state.currentPaper);
  const fetchQuestionPaper = useAssignmentStore(state => state.fetchQuestionPaper);
  const clearCurrentPaper = useAssignmentStore(state => state.clearCurrentPaper);
  const error = useAssignmentStore(state => state.error);
  
  // Toggle answer key state
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printWithAnswers, setPrintWithAnswers] = useState(false);

  // Load paper on mount
  useEffect(() => {
    if (assignmentId) {
      fetchQuestionPaper(assignmentId);
    }
    return () => {
      // Clear paper context when leaving output page
      clearCurrentPaper();
    };
  }, [assignmentId, fetchQuestionPaper, clearCurrentPaper]);

  // Download PDF print trigger
  const handlePrintPDF = () => {
    setShowPrintModal(true);
  };

  const triggerPrint = (withAnswers: boolean) => {
    setShowPrintModal(false);
    setPrintWithAnswers(withAnswers);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  if (error) {
    return (
      <div className={styles.container}>
        <Link href="/assignments" className={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Back to Assignments</span>
        </Link>
        <div className={styles.paperCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem 2rem' }}>
          <AlertTriangle size={48} color="#C62828" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>AI Generation Processing or Not Found</h2>
          <p style={{ color: 'var(--accent-muted)', fontSize: '0.9rem', textAlign: 'center', maxWidth: '400px' }}>
            We couldn't retrieve your question paper. If you just submitted, the AI queue is compiling sections. Check back in a few seconds!
          </p>
          <button className={styles.pdfBtn} onClick={() => fetchQuestionPaper(assignmentId)} style={{ border: '1px solid var(--border-color)', marginTop: '1rem' }}>
            Retry Sync
          </button>
        </div>
      </div>
    );
  }

  if (!currentPaper) {
    return (
      <div className={styles.container}>
        <div className={styles.paperCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '6rem 2rem' }}>
          <div className="pulse" style={{ fontSize: '2rem' }}>📝</div>
          <span className="pulse" style={{ fontWeight: 600, color: 'var(--accent-glow)' }}>Loading Question Paper details...</span>
        </div>
      </div>
    );
  }

  // Set difficulty badge classes
  const getDifficultyClass = (diff?: string) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return styles.badgeEasy;
      case 'moderate': return styles.badgeModerate;
      case 'hard':
      case 'challenging': return styles.badgeHard;
      default: return styles.badgeModerate;
    }
  };

  return (
    <div className={styles.container}>
      {/* breadcrumb */}
      <div className={`${styles.header} no-print`}>
        <Link href="/assignments" className={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Create New</span>
        </Link>
      </div>

      {/* AI Response Top Banner */}
      <div className={`${styles.banner} no-print`}>
        <p className={styles.bannerText}>
          Certainly, Lakshya! Here is the customized Question Paper for your school classes on the NCERT chapters, optimized using our structured prompt parser:
        </p>
        <button className={styles.pdfBtn} onClick={handlePrintPDF}>
          <Download size={16} />
          <span>Download as PDF</span>
        </button>
      </div>

      {/* A4 Printable Exam Card */}
      <div className={`${styles.paperCard} printable-paper-card`}>
        
        {/* Exam Header */}
        <div className={styles.paperHeader}>
          <h2 className={styles.schoolName}>{currentPaper.schoolName}</h2>
          <span className={styles.subjectTitle}>Subject: {currentPaper.subject}</span>
          <span className={styles.gradeClass}>{currentPaper.gradeClass}</span>
        </div>

        {/* Exam metadata */}
        <div className={styles.metaRow}>
          <span>Time Allowed: {currentPaper.timeAllowed}</span>
          <span>Maximum Marks: {currentPaper.maxMarks}</span>
        </div>

        <p className={styles.compulsoryAlert}>All questions are compulsory unless stated otherwise.</p>

        {/* Student Fields sheet */}
        <div className={styles.studentSheet}>
          <div className={styles.field}>
            <span>Name:</span>
            <input type="text" className={styles.underlineInput} disabled />
          </div>
          <div className={styles.field}>
            <span>Roll Number:</span>
            <input type="text" className={styles.underlineInput} disabled />
          </div>
          <div className={styles.field} style={{ gridColumn: 'span 2' }}>
            <span>Class: {currentPaper.gradeClass}</span>
          </div>
        </div>

        {/* Dynamic sections */}
        {(() => {
          let globalQIndex = 1;
          return currentPaper.sections.map((section, idx) => (
            <div key={idx} className={styles.sectionBlock}>
              <div className={styles.sectionHeaderBlock}>
                <span className={styles.sectionLetter}>{section.title}</span>
                <span className={styles.sectionInstr}>{section.instruction}</span>
              </div>

              <div className={styles.questionsList}>
                {section.questions.map((q) => {
                  const currentQNum = globalQIndex++;
                  // Replace any manually baked-in leading numbers from AI
                  const cleanedText = q.text.replace(/^(\[.*?\]\s*)?\d+[\.\)]\s*/, '$1');
                  return (
                    <div key={q.id} className={styles.questionItemWrap} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className={styles.questionItem}>
                        <div className={styles.questionText}>
                          <span>{currentQNum}. {cleanedText}</span>
                          <span className={`${styles.difficultyBadge} ${getDifficultyClass(q.difficulty)}`}>
                            {q.difficulty}
                          </span>
                          <span className={styles.marksTag}>[{q.marks} Mark(s)]</span>
                        </div>
                      </div>
                      {q.options && q.options.length > 0 && (
                        <div className={styles.optionsList}>
                          {q.options.map((opt, oIdx) => {
                             const alpha = String.fromCharCode(65 + oIdx);
                             const cleanOpt = opt.replace(/^[A-Z][\.\)]\s*/, '');
                             return (
                              <div key={oIdx} className={styles.optionItem}>
                                <span className={styles.optionLabel}>{alpha}.</span> {cleanOpt}
                              </div>
                             );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ));
        })()}

        <div className={styles.endPaper}>
          <span className={styles.endPaperTag}>End of Question Paper</span>
        </div>

        {/* Expandable Answer Key Section */}
        <div className={`${styles.answerKeyBlock} ${printWithAnswers ? '' : 'no-print'}`}>
          <div className={styles.answerKeyHeader}>
            <h3 className={styles.answerKeyTitle}>Answer Key (For Examiners)</h3>
            <button 
              className={styles.toggleAnswersBtn}
              onClick={() => setShowAnswerKey(!showAnswerKey)}
            >
              {showAnswerKey ? (
                <>
                  <EyeOff size={16} />
                  <span>Hide Solutions</span>
                </>
              ) : (
                <>
                  <Eye size={16} />
                  <span>Show Full Solutions</span>
                </>
              )}
            </button>
          </div>

          {(showAnswerKey || printWithAnswers) && (
            <div className={styles.solutionsList}>
              {currentPaper.answerKey.map((sol, index) => (
                <div key={sol.questionId || index} className={styles.solutionItem}>
                  <span className={styles.solQHeader}>
                    Question {index + 1}: {sol.questionText}
                  </span>
                  <p className={styles.solAnswerText}>{sol.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Premium Print Modal */}
      {showPrintModal && (
        <div className="no-print" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '2.5rem',
            maxWidth: '450px',
            width: '100%',
            boxShadow: 'var(--shadow-premium)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem' }}>🖨️</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>Print Preferences</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: '1.5' }}>Would you like to print this question paper with the Answer Key and solutions included for the examiners?</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
              <button 
                onClick={() => triggerPrint(true)}
                style={{
                  backgroundColor: 'var(--accent-glow)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  padding: '0.9rem 1.5rem',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-button-glow)',
                  cursor: 'pointer',
                  border: 'none',
                  width: '100%'
                }}
              >
                Print WITH Answers
              </button>
              
              <button 
                onClick={() => triggerPrint(false)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#1E293B',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  padding: '0.9rem 1.5rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Print WITHOUT Answers (Questions Only)
              </button>
            </div>

            <button 
              onClick={() => setShowPrintModal(false)}
              style={{
                color: '#64748B',
                fontWeight: 600,
                fontSize: '0.85rem',
                textDecoration: 'underline',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                marginTop: '0.25rem'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
