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
