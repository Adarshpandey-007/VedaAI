'use client';

import React from 'react';
import Link from 'next/link';
import { useAssignmentStore } from '../store/assignmentStore';
import { 
  Plus, 
  FileText, 
  CheckCircle, 
  Clock, 
  Wand2, 
  ChevronRight, 
  Award,
  Sparkles,
  BookOpen
} from 'lucide-react';
import styles from './Dashboard.module.css';

export default function DashboardHome() {
  const assignments = useAssignmentStore(state => state.assignments);
  const toolkitItems = useAssignmentStore(state => state.toolkitItems);
  const fetchAssignments = useAssignmentStore(state => state.fetchAssignments);
  const fetchToolkitItems = useAssignmentStore(state => state.fetchToolkitItems);

  React.useEffect(() => {
    fetchAssignments();
    fetchToolkitItems();
  }, [fetchAssignments, fetchToolkitItems]);

  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const activeJobsCount = assignments.filter(a => a.status === 'processing' || a.status === 'pending').length;
  const failedJobsCount = assignments.filter(a => a.status === 'failed').length;

  // 1. Difficulty balance calculations
  let easyCount = 0;
  let moderateCount = 0;
  let hardCount = 0;
  
  // 2. Syllabus coverage count
  const subjectCounts: Record<string, number> = {};

  assignments.forEach(a => {
    if (a.status === 'completed') {
      const sub = a.examSubject || 'Science';
      subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;

      a.questionTypes.forEach(qt => {
        if (qt.type.toLowerCase().includes('choice') || qt.type.toLowerCase().includes('mcq')) {
          easyCount += qt.count;
        } else if (qt.type.toLowerCase().includes('short')) {
          moderateCount += qt.count;
        } else {
          hardCount += qt.count;
        }
      });
    }
  });

  // Fallbacks if no assignments are completed yet to render standard statistics
  if (easyCount === 0 && moderateCount === 0 && hardCount === 0) {
    easyCount = 14;
    moderateCount = 10;
    hardCount = 6;
  }

  const totalDiffs = easyCount + moderateCount + hardCount;
  const easyPct = (easyCount / totalDiffs) * 100;
  const modPct = (moderateCount / totalDiffs) * 100;
  const hardPct = (hardCount / totalDiffs) * 100;

  // Donut SVG constants
  // Circumference = 2 * Math.PI * 30 = 188.5
  const circ = 188.5;
  const easyStroke = (easyPct / 100) * circ;
  const modStroke = (modPct / 100) * circ;
  const hardStroke = (hardPct / 100) * circ;

  const easyOffset = 0;
  const modOffset = -easyStroke;
  const hardOffset = -(easyStroke + modStroke);

  // Subject/Syllabus counts fallback
  const subjectList = Object.entries(subjectCounts).map(([name, count]) => ({ name, count }));
  if (subjectList.length === 0) {
    subjectList.push({ name: 'Science', count: 3 });
    subjectList.push({ name: 'Mathematics', count: 2 });
    subjectList.push({ name: 'English', count: 1 });
  }

  const maxSubCount = Math.max(...subjectList.map(s => s.count), 1);

  // Workload saved calculations
  const totalQuestionsCreated = assignments.reduce((sum, a) => sum + (a.status === 'completed' ? a.totalQuestions : 0), 0);
  const totalPlansCreated = toolkitItems.length;
  // Let's assume 3.5 minutes per question generated and 15 minutes per syllabus plan
  const minsSaved = (totalQuestionsCreated * 3.5) + (totalPlansCreated * 15);
  const hoursSaved = minsSaved === 0 ? "8.5" : (minsSaved / 60).toFixed(1);

  const getRecentJobs = () => {
    const combined: Array<{
      id: string;
      title: string;
      createdAt: string;
      status: string;
      progress?: number;
      type: 'assignment' | 'toolkit';
      toolkitType?: string;
    }> = [
      ...assignments.map(a => ({
        id: a.id,
        title: a.title,
        createdAt: a.createdAt,
        status: a.status,
        progress: a.progress,
        type: 'assignment' as const
      })),
      ...toolkitItems.map(t => ({
        id: t.id,
        title: `${t.title}: ${t.topic}`,
        createdAt: t.createdAt,
        status: 'completed',
        type: 'toolkit' as const,
        toolkitType: t.type
      }))
    ];

    return combined
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return isoString;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return { backgroundColor: '#E8F5E9', color: '#2E7D32' };
      case 'processing':
      case 'pending': return { backgroundColor: 'rgba(255, 78, 32, 0.08)', color: 'var(--accent-glow)' };
      case 'failed': return { backgroundColor: '#FFEBEE', color: '#C62828' };
      default: return { backgroundColor: '#F1F5F9', color: '#475569' };
    }
  };

  return (
    <div className={styles.container}>
      {/* Welcome banner */}
      <div className={styles.welcomeCard}>
        <div className={styles.welcomeText}>
          <h1 className={styles.welcomeTitle}>Welcome back, John Doe</h1>
          <p className={styles.welcomeSubtitle}>
            Create, manage, and print customized examinations. Our prompt parsing engine leverages Gemini AI to formulate structured CBSE/NCERT papers.
          </p>
        </div>
        <Link href="/assignments/new" style={{ textDecoration: 'none' }}>
          <button className={styles.createBtn}>
            <Plus size={16} />
            <span>Create Assignment</span>
          </button>
        </Link>
      </div>

      {/* Statistics widgets */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconPurple}`}>
            <FileText size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statVal}>{assignments.length}</span>
            <span className={styles.statLabel}>Total Assessments</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            <CheckCircle size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statVal}>{completedCount}</span>
            <span className={styles.statLabel}>Completed Papers</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconOrange}`}>
            <Clock size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statVal}>{activeJobsCount}</span>
            <span className={styles.statLabel}>Active AI Jobs</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconBlue}`}>
            <Award size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statVal}>{assignments.reduce((sum, a) => sum + a.totalMarks, 0)}</span>
            <span className={styles.statLabel}>Cum. Marks Generated</span>
          </div>
        </div>
      </div>

      {/* Premium SVG Analytics command center */}
      <div className={styles.analyticsGrid}>
        
        {/* Card 1: Difficulty Balance Donut Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Difficulty Balance</h3>
          <p className={styles.chartDesc}>Distribution ratios of generated items</p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', justifyContent: 'center', margin: '0.25rem 0' }}>
            <svg width="90" height="90" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
              <circle cx="40" cy="40" r="30" fill="transparent" stroke="var(--border-color)" strokeWidth="8" />
              {/* Easy Segment */}
              <circle 
                cx="40" 
                cy="40" 
                r="30" 
                fill="transparent" 
                stroke="#22C55E" 
                strokeWidth="8" 
                strokeDasharray={`${easyStroke} ${circ}`} 
                strokeDashoffset={easyOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
              {/* Moderate Segment */}
              <circle 
                cx="40" 
                cy="40" 
                r="30" 
                fill="transparent" 
                stroke="#FF8A00" 
                strokeWidth="8" 
                strokeDasharray={`${modStroke} ${circ}`} 
                strokeDashoffset={modOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
              {/* Hard Segment */}
              <circle 
                cx="40" 
                cy="40" 
                r="30" 
                fill="transparent" 
                stroke="#EF4444" 
                strokeWidth="8" 
                strokeDasharray={`${hardStroke} ${circ}`} 
                strokeDashoffset={hardOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Easy: {easyPct.toFixed(0)}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FF8A00' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Moderate: {modPct.toFixed(0)}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Hard: {hardPct.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Syllabus Coverage Bar Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Syllabus Coverage</h3>
          <p className={styles.chartDesc}>Assessments generated by core subjects</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
            {subjectList.slice(0, 3).map((sub, sIdx) => {
              const pct = (sub.count / maxSubCount) * 100;
              const barColor = sIdx === 0 ? '#6366F1' : sIdx === 1 ? '#3B82F6' : '#8B5CF6';
              return (
                <div key={sub.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    <span>{sub.name}</span>
                    <span>{sub.count} Papers</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Live Workload Efficiency Saved Metrics */}
        <div className={styles.chartCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 className={styles.chartTitle}>Workload Efficiency</h3>
            <p className={styles.chartDesc}>Administrative time saved via Gemini AI</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.25rem 0' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(255, 78, 32, 0.08)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '2px solid var(--accent-glow)',
              boxShadow: 'var(--shadow-button-glow)',
              fontSize: '1.25rem',
              color: 'var(--accent-glow)',
              flexShrink: 0
            }}>
              ⏳
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{hoursSaved} hrs</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>Total writing hours saved</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>
            <span>Plans: {totalPlansCreated}</span>
            <span>Questions: {totalQuestionsCreated}</span>
          </div>
        </div>

      </div>

      {/* Main split sections */}
      <div className={styles.sectionsGrid}>
        
        {/* Recent Jobs column */}
        <div className={styles.blockCard}>
          <div className={styles.blockHeader}>
            <h2 className={styles.blockTitle}>Recent Generation Jobs</h2>
            <Link href="/assignments" className={styles.viewAllLink}>
              View All History &rarr;
            </Link>
          </div>

          <div className={styles.recentList}>
            {getRecentJobs().length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--accent-muted)', fontSize: '0.9rem', border: '1px dashed var(--border-color)', borderRadius: '16px' }}>
                No recent runs found. Submit the Creator form to see background processes.
              </div>
            ) : (
              getRecentJobs().map((job) => (
                <Link 
                  key={job.id} 
                  href={
                    job.type === 'assignment' 
                      ? (job.status === 'completed' ? `/assignments/${job.id}/output` : '/assignments/new')
                      : `/toolkit?tab=history&id=${job.id}`
                  }
                  className={styles.recentItem}
                >
                  <div className={styles.recentLeft}>
                    <div style={{ fontSize: '1.25rem' }}>
                      {job.type === 'assignment' ? '📄' : job.toolkitType === 'lesson' ? '📖' : job.toolkitType === 'rubric' ? '📊' : '🪄'}
                    </div>
                    <div className={styles.recentTitleText}>
                      <span className={styles.recentTitle}>{job.title}</span>
                      <span className={styles.recentDate}>Created: {formatDate(job.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span 
                      className={styles.recentStatus}
                      style={getStatusStyle(job.status)}
                    >
                      {job.type === 'assignment' && job.status === 'processing' ? `Generating (${job.progress}%)` : job.status}
                    </span>
                    <ChevronRight size={16} color="var(--accent-muted)" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* AI Toolkit Helper Column */}
        <div className={styles.blockCard}>
          <div className={styles.blockHeader}>
            <h2 className={styles.blockTitle}>AI Teacher's Toolkit</h2>
          </div>

          <div className={styles.toolkitGrid}>
            <div className={styles.toolItem}>
              <div style={{ fontSize: '1.5rem' }}>🪄</div>
              <div className={styles.toolText}>
                <span className={styles.toolTitle}>CBSE Prompt Generator</span>
                <span className={styles.toolDesc}>Structures chapters into NCERT-standard Sections instantly.</span>
              </div>
            </div>

            <div className={styles.toolItem}>
              <div style={{ fontSize: '1.5rem' }}>🎯</div>
              <div className={styles.toolText}>
                <span className={styles.toolTitle}>Dynamic Rubrics Creator</span>
                <span className={styles.toolDesc}>Set target difficulties and watch standard distributions form.</span>
              </div>
            </div>

            <div className={styles.toolItem}>
              <div style={{ fontSize: '1.5rem' }}>🔑</div>
              <div className={styles.toolText}>
                <span className={styles.toolTitle}>Instant Answer Sheets</span>
                <span className={styles.toolDesc}>Full procedural answer keys compiled with each generated exam.</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
