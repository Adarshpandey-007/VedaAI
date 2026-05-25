'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAssignmentStore } from '../../store/assignmentStore';
import { subscribeToAssignment } from '../../utils/socket';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Eye, 
  Trash2, 
  FileText,
  Filter
} from 'lucide-react';
import TopHeaderBar from '@/components/TopHeaderBar';
import styles from './AssignmentsList.module.css';
import { IAssignment } from '../../types';

export default function AssignmentsPage() {
  const router = useRouter();
  
  // Sync states from Zustand
  const assignments = useAssignmentStore(state => state.assignments);
  const fetchAssignments = useAssignmentStore(state => state.fetchAssignments);
  const deleteAssignment = useAssignmentStore(state => state.deleteAssignment);

  // Local filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Dropdown menu state tracking
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  // Close menus on click outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this assignment and its generated question paper?')) {
      await deleteAssignment(id);
    }
  };

  const handleCardClick = (assignment: IAssignment) => {
    if (assignment.status === 'completed') {
      router.push(`/assignments/${assignment.id}/output`);
    } else if (assignment.status === 'processing' || assignment.status === 'pending') {
      // Setup tracking state in Zustand store so that assignments/new will resume displaying the HUD
      const store = useAssignmentStore.getState();
      store.startGeneration(assignment.id);
      store.updateGenerationProgress(
        assignment.id,
        assignment.progress || 0,
        'Syncing generation progress...'
      );
      
      // Re-subscribe client WebSocket listeners to the assignment channel
      subscribeToAssignment(assignment.id);
      
      router.push(`/assignments/new`);
    }
  };

  // Formatting dates beautifully
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Completed') return matchesSearch && assignment.status === 'completed';
    if (statusFilter === 'Generating') return matchesSearch && (assignment.status === 'processing' || assignment.status === 'pending');
    if (statusFilter === 'Failed') return matchesSearch && assignment.status === 'failed';
    
    return matchesSearch;
  });

  return (
    <>
      <div className={styles.container}>
        <TopHeaderBar pathName="Assignment" />

      {/* Page Header */}
      <div className={`${styles.headerGroup} no-print`}>
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            {assignments.length > 0 && <div className={styles.greenDot}></div>}
            <h1 className={styles.title}>Assignments</h1>
          </div>
        </div>
        <p className={styles.pageSubtitle}>Manage and create assignments for your classes.</p>
      </div>

      {assignments.length === 0 ? (
        /* Empty State Layout (0 State screen) */
        <div className={styles.zeroStateCard}>
          <div className={styles.zeroIllustration}>
            <FileText size={72} color="#94A3B8" />
            <div className={styles.zeroMagnifier}>
              <span className={styles.redX}>&times;</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
            <h2 className={styles.zeroTitle}>No assignments yet</h2>
            <p className={styles.zeroSubtitle}>
              Create your first assignment to start collecting and grading student submissions. 
              You can set up rubrics, define marking criteria, and let AI assist with grading.
            </p>
          </div>

          <Link href="/assignments/new" style={{ textDecoration: 'none' }}>
            <button className={styles.zeroBtn}>
              <Plus size={16} />
              <span>Create Your First Assignment</span>
            </button>
          </Link>
        </div>
      ) : (
        /* Filled State Layout */
        <>
          {/* Filters Control Bar */}
          <div className={`${styles.filtersBar} no-print`}>
            <div className={styles.filterGroup}>
              <Filter size={16} className={styles.filterIcon} />
              <span>Filter By</span>
              <select 
                className={styles.filterSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Generating">Generating</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search Assignment" 
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className={styles.grid}>
            {filteredAssignments.map((ass) => (
              <div 
                key={ass.id} 
                className={styles.card}
                onClick={() => handleCardClick(ass)}
                style={{ cursor: ass.status === 'completed' || ass.status === 'processing' ? 'pointer' : 'default' }}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{ass.title}</h3>
                  <button 
                    type="button" 
                    className={styles.menuBtn}
                    onClick={(e) => toggleMenu(e, ass.id)}
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Actions Dropdown Popup */}
                  {activeMenuId === ass.id && (
                    <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                      <button 
                        className={styles.dropdownItem}
                        onClick={() => {
                          setActiveMenuId(null);
                          if (ass.status === 'completed') {
                            router.push(`/assignments/${ass.id}/output`);
                          } else {
                            alert('AI generation is still in progress. View option will activate upon completion.');
                          }
                        }}
                        disabled={ass.status !== 'completed'}
                        style={{ opacity: ass.status === 'completed' ? 1 : 0.5 }}
                      >
                        <Eye size={14} />
                        <span>View Assignment</span>
                      </button>
                      
                      <button 
                        className={`${styles.dropdownItem} ${styles.deleteItem}`}
                        onClick={(e) => {
                          setActiveMenuId(null);
                          handleDelete(e, ass.id);
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Body Dates */}
                <div className={styles.datesWrapper}>
                  <span>Assigned on : <span className={styles.dateBold}>{formatDate(ass.createdAt)}</span></span>
                  <span>Due : <span className={styles.dateBold}>{formatDate(ass.dueDate)}</span></span>
                </div>

                {/* Footer and Badges - Only show for in-progress or failed to keep completed clean! */}
                {ass.status !== 'completed' && (
                  <div className={styles.cardFooter}>
                    <div className={styles.metrics}>
                      <span>{ass.totalQuestions} Questions</span>
                      <span>•</span>
                      <span>{ass.totalMarks} Marks</span>
                    </div>

                    <span className={`${styles.statusBadge} ${
                      ass.status === 'processing' || ass.status === 'pending' ? styles.statusProcessing :
                      ass.status === 'failed' ? styles.statusFailed : styles.statusPending
                    }`}>
                      {ass.status === 'processing' ? `Generating (${ass.progress}%)` : ass.status}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      </div>

      {/* Desktop Centered Bottom Pill Floating Button */}
      <div className={`${styles.desktopPillBtnContainer} no-print`}>
        <Link href="/assignments/new" style={{ textDecoration: 'none' }}>
          <button className={styles.desktopPillBtn}>
            <Plus size={20} fontWeight={800} />
            <span>Create Assignment</span>
          </button>
        </Link>
      </div>

      {/* Floating plus action button (primarily for mobile view) */}
      <Link href="/assignments/new" className={`${styles.floatBtn} no-print`}>
        <Plus size={24} />
      </Link>
    </>
  );
}
