'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, GraduationCap, Users as UsersIcon, BookOpen, Trash2 } from 'lucide-react';
import styles from './Groups.module.css';

interface IGroup {
  id: string;
  name: string;
  section: string;
  subject: string;
  studentCount: number;
  averageScore: number;
}

const DEFAULT_GROUPS: IGroup[] = [
  { id: '1', name: 'Class 10th', section: 'Section A', subject: 'Physics', studentCount: 32, averageScore: 84 },
  { id: '2', name: 'Grade 8 Science', section: 'Section B', subject: 'Biology', studentCount: 28, averageScore: 76 },
  { id: '3', name: 'Class 12th', section: 'Section C', subject: 'Chemistry', studentCount: 35, averageScore: 91 },
  { id: '4', name: 'Class 5th English', section: 'Section A', subject: 'English', studentCount: 24, averageScore: 88 }
];

export default function GroupsPage() {
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [studentCount, setStudentCount] = useState(30);

  useEffect(() => {
    const saved = localStorage.getItem('veda_groups');
    if (saved) {
      setGroups(JSON.parse(saved));
    } else {
      setGroups(DEFAULT_GROUPS);
      localStorage.setItem('veda_groups', JSON.stringify(DEFAULT_GROUPS));
    }
  }, []);

  const saveGroups = (newGroups: IGroup[]) => {
    setGroups(newGroups);
    localStorage.setItem('veda_groups', JSON.stringify(newGroups));
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !section) return;

    const newGroup: IGroup = {
      id: Date.now().toString(),
      name,
      section,
      subject,
      studentCount,
      averageScore: Math.floor(Math.random() * 25) + 70 // Mock average score between 70% and 95%
    };

    const updated = [newGroup, ...groups];
    saveGroups(updated);
    
    // Reset Form
    setName('');
    setSection('');
    setSubject('Physics');
    setStudentCount(30);
    setIsModalOpen(false);
  };

  const handleDeleteGroup = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this group?')) return;
    const updated = groups.filter(g => g.id !== id);
    saveGroups(updated);
  };

  // SVG parameters
  const radius = 28;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <div className={styles.headerText}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>My Groups</h1>
            <span className={styles.countBadge}>{groups.length} Classes</span>
          </div>
          <p className={styles.subtitle}>Oversee your students, manage sections, and track average exam performances.</p>
        </div>
        <button className={styles.createBtn} onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          <span>Create Group</span>
        </button>
      </div>

      {groups.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎓</div>
          <div className={styles.emptyText}>
            <h3 className={styles.emptyTitle}>No Groups Created Yet</h3>
            <p className={styles.emptyDesc}>Organize your classrooms and sections to track cumulative test parameters together.</p>
          </div>
          <button className={styles.createBtn} onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Create Your First Group</span>
          </button>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {groups.map(group => {
            const strokeOffset = circumference - (group.averageScore / 100) * circumference;
            return (
              <div key={group.id} className={styles.groupCard}>
                <div className={styles.cardLeft}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.className}>{group.name}</h3>
                    <span className={styles.subjectText}>{group.section} • {group.subject}</span>
                  </div>
                  
                  <div className={styles.cardMetrics}>
                    <span className={styles.metricBadge}>
                      <UsersIcon size={12} />
                      {group.studentCount} Students
                    </span>
                    <span className={`${styles.metricBadge} ${styles.metricBadgeGreen}`}>
                      <BookOpen size={12} />
                      Active
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div className={styles.circleContainer}>
                    <svg className={styles.svgCircle}>
                      <circle className={styles.circleBg} cx="36" cy="36" r={radius} />
                      <circle 
                        className={styles.circleProgress} 
                        cx="36" 
                        cy="36" 
                        r={radius} 
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeOffset}
                      />
                    </svg>
                    <span className={styles.circleText}>{group.averageScore}%</span>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteGroup(group.id, e)} 
                    style={{ color: '#EF4444', padding: '4px', cursor: 'pointer' }}
                    title="Delete Group"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Create New Group</h3>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Class / Grade Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Class 10th, Grade 8 Science" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Section Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Section A, Section B" 
                  value={section} 
                  onChange={(e) => setSection(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Primary Subject</label>
                <select 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)}
                  className={styles.select}
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="English">English</option>
                  <option value="Social Studies">Social Studies</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Total Enrolled Students</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100"
                  value={studentCount} 
                  onChange={(e) => setStudentCount(parseInt(e.target.value) || 0)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
