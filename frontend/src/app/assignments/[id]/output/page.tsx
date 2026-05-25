'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAssignmentStore } from '@/store/assignmentStore';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import styles from './QuestionPaperView.module.css';

export default function QuestionPaperOutputPage() {
  const params = useParams();
  const assignmentId = params.id as string;

  // Sync state from Zustand store
  const currentPaper = useAssignmentStore(state => state.currentPaper);
  const fetchQuestionPaper = useAssignmentStore(state => state.fetchQuestionPaper);
  const clearCurrentPaper = useAssignmentStore(state => state.clearCurrentPaper);
  const error = useAssignmentStore(state => state.error);
  const updateQuestionPaper = useAssignmentStore(state => state.updateQuestionPaper);
  const regenerateSingleQuestion = useAssignmentStore(state => state.regenerateSingleQuestion);
  
  // Toggle answer key state
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printWithAnswers, setPrintWithAnswers] = useState(false);

  // Advanced features state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPaper, setEditedPaper] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [reRollingQId, setReRollingQId] = useState<string | null>(null);

  // Sync edits payload on initial paper hydration
  useEffect(() => {
    if (currentPaper) {
      setTimeout(() => {
        setEditedPaper(JSON.parse(JSON.stringify(currentPaper)));
      }, 0);
    }
  }, [currentPaper]);

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

  // Word document exporter (.doc) supporting headers and custom MSO styles
  const handleExportWord = () => {
    if (!currentPaper) return;

    let contentHtml = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="font-size: 26px; margin: 0; font-family: 'Arial', sans-serif;">${currentPaper.schoolName}</h1>
        <p style="font-size: 16px; font-weight: bold; margin: 5px 0;">Subject: ${currentPaper.subject}</p>
        <p style="font-size: 14px; margin: 5px 0;">Time Allowed: ${currentPaper.timeAllowed} | Max Marks: ${currentPaper.maxMarks}</p>
        <hr style="border: 1px solid #000000; margin-top: 15px;" />
      </div>
      
      <table style="width: 100%; border: 1px solid #94a3b8; border-collapse: collapse; margin-bottom: 20px; font-family: 'Arial', sans-serif; font-size: 12px; background-color: #f8fafc;">
        <tr>
          <td style="width: 50%; padding: 8px; border: 1px solid #e2e8f0;"><strong>Name:</strong> ___________________________________</td>
          <td style="width: 50%; padding: 8px; border: 1px solid #e2e8f0;"><strong>Roll Number:</strong> ___________________________</td>
        </tr>
        <tr>
          <td style="width: 50%; padding: 8px; border: 1px solid #e2e8f0;"><strong>Class:</strong> ${currentPaper.gradeClass}</td>
          <td style="width: 50%; padding: 8px; border: 1px solid #e2e8f0;"><strong>Section:</strong> _________________________________</td>
        </tr>
      </table>

      <p style="text-align: right; font-style: italic; font-size: 12px; margin-bottom: 20px;">All questions are compulsory.</p>
    `;

    // Render sections
    let globalQIdx = 1;
    currentPaper.sections.forEach(sec => {
      contentHtml += `
        <div style="margin-top: 25px;">
          <h2 style="font-size: 18px; text-decoration: underline; font-family: 'Arial', sans-serif; color: #000000; margin-bottom: 10px;">
            ${sec.title} - ${sec.instruction}
          </h2>
      `;

      sec.questions.forEach(q => {
        const cleanedText = q.text.replace(/^(\[.*?\]\s*)?\d+[\.\)]\s*/, '$1');
        contentHtml += `
          <p style="font-size: 14px; margin: 10px 0; font-family: 'Times New Roman', serif;">
            <strong>Q${globalQIdx++}. ${cleanedText}</strong> 
            <span style="float: right; font-weight: bold;">[${q.marks} Mark(s)]</span>
          </p>
        `;

        if (q.options && q.options.length > 0) {
          contentHtml += `<ul style="list-style-type: none; margin-left: 20px; font-family: 'Times New Roman', serif;">`;
          q.options.forEach((opt, oIdx) => {
            const alpha = String.fromCharCode(65 + oIdx);
            const cleanOpt = opt.replace(/^[A-Z][\.\)]\s*/, '');
            contentHtml += `<li style="font-size: 14px; margin: 5px 0;"><strong>${alpha}.</strong> ${cleanOpt}</li>`;
          });
          contentHtml += `</ul>`;
        }
      });

      contentHtml += `</div>`;
    });

    // Add Answer Key
    contentHtml += `
      <br /><br />
      <hr style="border: 1px dashed #000000;" />
      <div style="margin-top: 30px;">
        <h2 style="font-size: 20px; text-align: center; font-family: 'Arial', sans-serif; border-bottom: 1px solid #000000; padding-bottom: 5px;">
          Answer Key (Examiner Reference)
        </h2>
    `;

    currentPaper.answerKey.forEach((sol, sIdx) => {
      contentHtml += `
        <div style="margin-top: 15px; font-family: 'Times New Roman', serif;">
          <p style="font-size: 14px; font-weight: bold; margin: 0;">Question ${sIdx + 1}: ${sol.questionText}</p>
          <p style="font-size: 14px; color: #333333; margin: 5px 0 10px 15px;">Answer: ${sol.answer}</p>
        </div>
      `;
    });

    contentHtml += `</div>`;

    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
          "xmlns:w='urn:schemas-microsoft-com:office:word' " +
          "xmlns='http://www.w3.org/TR/REC-html40'>" +
          "<head><title>Exam Document</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + contentHtml + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${currentPaper.subject.replace(/\s+/g, '_')}_Question_Paper.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  // Trigger single question background AI re-rolling
  const handleRegenerateQuestion = async (qId: string) => {
    if (!assignmentId) return;
    setReRollingQId(qId);
    try {
      await regenerateSingleQuestion(assignmentId, qId);
      // Update local edit form cache
      const updatedPaper = useAssignmentStore.getState().currentPaper;
      if (updatedPaper) {
        setEditedPaper(JSON.parse(JSON.stringify(updatedPaper)));
      }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      alert(err.message || 'Single question regeneration failed.');
    } finally {
      setReRollingQId(null);
    }
  };

  // Save all edits to the server
  const handleSaveChanges = async () => {
    if (!assignmentId || !editedPaper) return;
    try {
      await updateQuestionPaper(assignmentId, editedPaper);
      setIsEditMode(false);
    } catch {
      alert('Failed to save paper changes.');
    }
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
            We couldn&apos;t retrieve your question paper. If you just submitted, the AI queue is compiling sections. Check back in a few seconds!
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
    <>
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
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className={styles.pdfBtn} 
            onClick={() => {
              if (isEditMode) {
                handleSaveChanges();
              } else {
                setIsEditMode(true);
              }
            }}
            style={{ 
              backgroundColor: isEditMode ? '#22C55E' : 'transparent', 
              color: isEditMode ? 'white' : 'white', 
              borderColor: isEditMode ? '#22C55E' : 'rgba(255, 255, 255, 0.4)',
              fontWeight: 800
            }}
          >
            <Sparkles size={16} style={{ color: isEditMode ? 'white' : 'var(--accent-glow)' }} />
            <span>{isEditMode ? 'Save Changes' : 'Edit Paper'}</span>
          </button>
          
          {isEditMode && (
            <button 
              className={styles.pdfBtn} 
              onClick={() => {
                setIsEditMode(false);
                setEditedPaper(JSON.parse(JSON.stringify(currentPaper)));
              }}
              style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              Cancel
            </button>
          )}

          <button className={styles.pdfBtn} onClick={handleExportWord} style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <FileText size={16} />
            <span>Export to Word</span>
          </button>

          <button className={styles.pdfBtn} onClick={handlePrintPDF} style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <Download size={16} />
            <span>Download as PDF</span>
          </button>
        </div>
      </div>

      {/* A4 Printable Exam Card */}
      <div className={`${styles.paperCard} printable-paper-card`}>
        
        {/* Exam Header */}
        <div className={styles.paperHeader}>
          {isEditMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
              <input 
                type="text" 
                value={editedPaper?.schoolName || ''} 
                onChange={e => setEditedPaper({ ...editedPaper, schoolName: e.target.value })}
                style={{ width: '100%', textAlign: 'center', fontSize: '1.25rem', fontWeight: 800, padding: '0.4rem', border: '1px dashed var(--border-color)', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                placeholder="School Name"
              />
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  value={editedPaper?.subject || ''} 
                  onChange={e => setEditedPaper({ ...editedPaper, subject: e.target.value })}
                  style={{ width: '180px', fontSize: '0.9rem', padding: '0.3rem', border: '1px dashed var(--border-color)', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  placeholder="Subject"
                />
                <input 
                  type="text" 
                  value={editedPaper?.gradeClass || ''} 
                  onChange={e => setEditedPaper({ ...editedPaper, gradeClass: e.target.value })}
                  style={{ width: '180px', fontSize: '0.9rem', padding: '0.3rem', border: '1px dashed var(--border-color)', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  placeholder="Class/Grade"
                />
              </div>
            </div>
          ) : (
            <>
              <h2 className={styles.schoolName}>{currentPaper.schoolName}</h2>
              <span className={styles.subjectTitle}>Subject: {currentPaper.subject}</span>
              <span className={styles.gradeClass}>{currentPaper.gradeClass}</span>
            </>
          )}
        </div>

        {/* Exam metadata */}
        <div className={styles.metaRow}>
          {isEditMode ? (
            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', width: '100%' }}>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Time Allowed: </span>
                <input 
                  type="text" 
                  value={editedPaper?.timeAllowed || ''} 
                  onChange={e => setEditedPaper({ ...editedPaper, timeAllowed: e.target.value })}
                  style={{ width: '120px', padding: '0.3rem', fontSize: '0.85rem', border: '1px dashed var(--border-color)', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Maximum Marks: </span>
                <input 
                  type="number" 
                  value={editedPaper?.maxMarks || 0} 
                  onChange={e => setEditedPaper({ ...editedPaper, maxMarks: parseInt(e.target.value) || 0 })}
                  style={{ width: '80px', padding: '0.3rem', fontSize: '0.85rem', border: '1px dashed var(--border-color)', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          ) : (
            <>
              <span>Time Allowed: {currentPaper.timeAllowed}</span>
              <span>Maximum Marks: {currentPaper.maxMarks}</span>
            </>
          )}
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
          <div className={styles.field}>
            <span>Class: {isEditMode ? editedPaper?.gradeClass : currentPaper.gradeClass}</span>
          </div>
          <div className={styles.field}>
            <span>Section:</span>
            <input type="text" className={styles.underlineInput} disabled />
          </div>
        </div>

        {/* Dynamic sections */}
        {(() => {
          let globalQIndex = 1;
          const activePaper = isEditMode ? editedPaper : currentPaper;
          if (!activePaper || !activePaper.sections) return null;

          return activePaper.sections.map((section: any, sIdx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            return (
              <div key={sIdx} className={styles.sectionBlock}>
                <div className={styles.sectionHeaderBlock}>
                  <span className={styles.sectionLetter}>{section.title}</span>
                  {isEditMode ? (
                    <input 
                      type="text" 
                      value={section.instruction || ''} 
                      onChange={e => {
                        const updatedSections = [...editedPaper.sections];
                        updatedSections[sIdx].instruction = e.target.value;
                        setEditedPaper({ ...editedPaper, sections: updatedSections });
                      }}
                      style={{ flex: 1, padding: '0.2rem 0.5rem', border: '1px dashed var(--border-color)', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                    />
                  ) : (
                    <span className={styles.sectionInstr}>{section.instruction}</span>
                  )}
                </div>

                <div className={styles.questionsList}>
                  {section.questions.map((q: any, qIdx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                    const currentQNum = globalQIndex++;
                    const cleanedText = q.text.replace(/^(\[.*?\]\s*)?\d+[\.\)]\s*/, '$1');
                    const isReRolling = reRollingQId === q.id;

                  return (
                    <div key={q.id} className={styles.questionItemWrap} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                      <div className={styles.questionItem}>
                        <div className={styles.questionText} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                              {isEditMode ? (
                                <textarea 
                                  value={cleanedText} 
                                  onChange={e => {
                                    const updatedSections = [...editedPaper.sections];
                                    updatedSections[sIdx].questions[qIdx].text = e.target.value;
                                    setEditedPaper({ ...editedPaper, sections: updatedSections });
                                  }}
                                  rows={2}
                                  style={{ width: '100%', padding: '0.4rem', border: '1px dashed var(--border-color)', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit' }}
                                />
                              ) : (
                                <span style={{ opacity: isReRolling ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                                  {currentQNum}. {cleanedText}
                                </span>
                              )}
                            </div>
                            
                            <div className="no-print" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <button 
                                onClick={() => handleRegenerateQuestion(q.id)}
                                disabled={isReRolling}
                                title="Regenerate this question with Gemini AI"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  color: 'var(--accent-glow)',
                                  padding: '0.35rem 0.65rem',
                                  border: '1px dashed var(--border-color)',
                                  borderRadius: '8px',
                                  background: 'var(--surface-secondary)',
                                  cursor: 'pointer',
                                  boxShadow: 'var(--shadow-sm)',
                                  transition: 'var(--transition-smooth)'
                                }}
                              >
                                <span>{isReRolling ? '⏳ Re-rolling...' : '🪄 Re-roll'}</span>
                              </button>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {isEditMode ? (
                              <>
                                <select 
                                  value={q.difficulty}
                                  onChange={e => {
                                    const updatedSections = [...editedPaper.sections];
                                    updatedSections[sIdx].questions[qIdx].difficulty = e.target.value;
                                    setEditedPaper({ ...editedPaper, sections: updatedSections });
                                  }}
                                  style={{ padding: '0.2rem', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: '4px', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                >
                                  <option value="Easy">Easy</option>
                                  <option value="Moderate">Moderate</option>
                                  <option value="Hard">Hard</option>
                                </select>
                                <div>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Marks: </span>
                                  <input 
                                    type="number" 
                                    value={q.marks}
                                    onChange={e => {
                                      const updatedSections = [...editedPaper.sections];
                                      updatedSections[sIdx].questions[qIdx].marks = parseInt(e.target.value) || 0;
                                      setEditedPaper({ ...editedPaper, sections: updatedSections });
                                    }}
                                    style={{ width: '50px', padding: '0.2rem', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: '4px', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                  />
                                </div>
                              </>
                            ) : (
                              <>
                                <span className={`${styles.difficultyBadge} ${getDifficultyClass(q.difficulty)}`}>
                                  {q.difficulty}
                                </span>
                                <span className={styles.marksTag}>[{q.marks} Mark(s)]</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {q.options && q.options.length > 0 && (
                        <div className={styles.optionsList} style={{ opacity: isReRolling ? 0.4 : 1 }}>
                          {q.options.map((opt: string, oIdx: number) => {
                             const alpha = String.fromCharCode(65 + oIdx);
                             const cleanOpt = opt.replace(/^[A-Z][\.\)]\s*/, '');
                             return (
                              <div key={oIdx} className={styles.optionItem} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className={styles.optionLabel}>{alpha}.</span>
                                {isEditMode ? (
                                  <input 
                                    type="text" 
                                    value={cleanOpt} 
                                    onChange={e => {
                                      const updatedSections = [...editedPaper.sections];
                                      const newOpts = [...updatedSections[sIdx].questions[qIdx].options];
                                      newOpts[oIdx] = `${alpha}. ${e.target.value}`;
                                      updatedSections[sIdx].questions[qIdx].options = newOpts;
                                      setEditedPaper({ ...editedPaper, sections: updatedSections });
                                    }}
                                    style={{ flex: 1, padding: '0.2rem 0.4rem', border: '1px dashed var(--border-color)', borderRadius: '4px', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                                  />
                                ) : (
                                  <span> {cleanOpt}</span>
                                )}
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
            );
          });
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

          {(showAnswerKey || printWithAnswers || isEditMode) && (
            <div className={styles.solutionsList}>
              {(isEditMode ? editedPaper?.answerKey : currentPaper.answerKey).map((sol: any, index: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                return (
                  <div key={sol.questionId || index} className={styles.solutionItem}>
                  <span className={styles.solQHeader}>
                    Question {index + 1}: {sol.questionText}
                  </span>
                  {isEditMode ? (
                    <textarea 
                      value={sol.answer || ''} 
                      onChange={e => {
                        const updatedKey = [...editedPaper.answerKey];
                        updatedKey[index].answer = e.target.value;
                        setEditedPaper({ ...editedPaper, answerKey: updatedKey });
                      }}
                      rows={2}
                      style={{ width: '100%', padding: '0.4rem', border: '1px dashed var(--border-color)', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '0.5rem', fontFamily: 'inherit' }}
                    />
                  ) : (
                    <p className={styles.solAnswerText}>{sol.answer}</p>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>

      {/* Premium Print Modal (Placed as a sibling to styles.container to break free from animated transform context and center perfectly) */}
      {showPrintModal && (
        <div className="no-print" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
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
              <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>Print Preferences</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Would you like to print this question paper with the Answer Key and solutions included for the examiners?</p>
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
                  backgroundColor: 'var(--surface-secondary)',
                  color: 'var(--text-primary)',
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
                color: 'var(--text-tertiary)',
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
    </>
  );
}
