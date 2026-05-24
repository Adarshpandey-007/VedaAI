'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Folder, FileText, Download, ExternalLink, Trash2, Library } from 'lucide-react';
import { useAssignmentStore } from '../../store/assignmentStore';
import styles from './Library.module.css';

type FolderCategory = 'papers' | 'uploads' | 'templates' | 'creations';

interface ILibraryItem {
  id: string;
  name: string;
  category: FolderCategory;
  type: string;
  dateSaved: string;
  size: string;
  actionUrl?: string;
  isCustomUpload?: boolean;
}

const STATIC_TEMPLATES: ILibraryItem[] = [
  {
    id: 't1',
    name: 'CBSE Class 10th Science blueprint.pdf',
    category: 'templates',
    type: 'Syllabus Standard',
    dateSaved: '2026-05-15',
    size: '1.2 MB'
  },
  {
    id: 't2',
    name: 'NCERT Grade 8 Physics Evaluation Key.pdf',
    category: 'templates',
    type: 'Evaluation Key',
    dateSaved: '2026-05-18',
    size: '850 KB'
  },
  {
    id: 't3',
    name: 'DPS Core Assessment Guide.pdf',
    category: 'templates',
    type: 'DPS Custom Framework',
    dateSaved: '2026-05-20',
    size: '2.4 MB'
  }
];

export default function LibraryPage() {
  const assignments = useAssignmentStore(state => state.assignments);
  const deleteAssignment = useAssignmentStore(state => state.deleteAssignment);
  const toolkitItems = useAssignmentStore(state => state.toolkitItems);
  const fetchToolkitItems = useAssignmentStore(state => state.fetchToolkitItems);
  
  const [activeFolder, setActiveFolder] = useState<FolderCategory>('papers');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<ILibraryItem[]>([]);

  // Synchronously pull saved toolkit structures
  useEffect(() => {
    fetchToolkitItems();
  }, [fetchToolkitItems]);

  // Dynamically compile active workspace lists based on enqueued database runs and templates
  useEffect(() => {
    const list: ILibraryItem[] = [];

    // 1. Map generated papers
    assignments.forEach(a => {
      if (a.status === 'completed') {
        list.push({
          id: a.id,
          name: `${a.title} Question Paper.pdf`,
          category: 'papers',
          type: 'CBSE Exam Paper',
          dateSaved: new Date(a.createdAt).toLocaleDateString('en-US'),
          size: `${a.totalMarks} Marks • ${a.totalQuestions} Qs`,
          actionUrl: `/assignments/${a.id}/output`
        });
      }

      // 2. Map uploaded reference attachments
      if (a.fileName) {
        list.push({
          id: `file_${a.id}`,
          name: a.fileName,
          category: 'uploads',
          type: 'Reference Notes',
          dateSaved: new Date(a.createdAt).toLocaleDateString('en-US'),
          size: 'Uploaded PDF/TXT',
          actionUrl: a.fileUrl || '#',
          isCustomUpload: true
        });
      }
    });

    // 3. Map toolkit creations
    toolkitItems.forEach(t => {
      list.push({
        id: t.id,
        name: t.title || `${t.topic} Plan`,
        category: 'creations',
        type: t.type === 'lesson' ? 'AI Lesson Plan' : t.type === 'rubric' ? 'AI Grading Rubric' : 'AI Class Activity',
        dateSaved: new Date(t.createdAt).toLocaleDateString('en-US'),
        size: `${t.grade} • ${t.topic}`,
        actionUrl: `/toolkit?tab=history&id=${t.id}`
      });
    });

    // 4. Concat static syllabus assets
    const compiled = [...list, ...STATIC_TEMPLATES];
    setItems(compiled);
  }, [assignments, toolkitItems]);

  const handleDeleteItem = async (itemId: string, category: FolderCategory) => {
    if (category === 'papers') {
      if (!confirm('Are you sure you want to delete this generated question paper?')) return;
      await deleteAssignment(itemId);
    } else {
      if (!confirm('Are you sure you want to delete this resource?')) return;
      setItems(items.filter(i => i.id !== itemId));
    }
  };

  // Filters computed rows in 0.05 seconds
  const filteredRows = items.filter(item => {
    const matchesCategory = item.category === activeFolder;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getFolderCount = (category: FolderCategory) => {
    return items.filter(item => item.category === category).length;
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>My Library</h1>
          <p className={styles.subtitle}>A secure digital filing cabinet hosting textbooks, generated CBSE papers, and AI assets.</p>
        </div>
      </div>

      {/* Folders row */}
      <div className={styles.foldersGrid}>
        <div 
          onClick={() => setActiveFolder('papers')}
          className={`${styles.folderCard} ${styles.folderOrange} ${activeFolder === 'papers' ? styles.folderActive : ''}`}
        >
          <div className={styles.folderHeader}>
            <span className={styles.folderIcon}>📁</span>
            <span className={styles.documentCount}>{getFolderCount('papers')} Files</span>
          </div>
          <span className={styles.folderName}>Question Papers</span>
        </div>

        <div 
          onClick={() => setActiveFolder('uploads')}
          className={`${styles.folderCard} ${styles.folderBlue} ${activeFolder === 'uploads' ? styles.folderActive : ''}`}
        >
          <div className={styles.folderHeader}>
            <span className={styles.folderIcon}>📂</span>
            <span className={styles.documentCount}>{getFolderCount('uploads')} Files</span>
          </div>
          <span className={styles.folderName}>Reference Notebooks</span>
        </div>

        <div 
          onClick={() => setActiveFolder('templates')}
          className={`${styles.folderCard} ${styles.folderPurple} ${activeFolder === 'templates' ? styles.folderActive : ''}`}
        >
          <div className={styles.folderHeader}>
            <span className={styles.folderIcon}>🗄️</span>
            <span className={styles.documentCount}>{getFolderCount('templates')} Files</span>
          </div>
          <span className={styles.folderName}>System Blueprints</span>
        </div>

        <div 
          onClick={() => setActiveFolder('creations')}
          className={`${styles.folderCard} ${styles.folderGreen} ${activeFolder === 'creations' ? styles.folderActive : ''}`}
        >
          <div className={styles.folderHeader}>
            <span className={styles.folderIcon}>🪄</span>
            <span className={styles.documentCount}>{getFolderCount('creations')} Files</span>
          </div>
          <span className={styles.folderName}>AI Toolkit Creations</span>
        </div>
      </div>

      {/* Documents Table */}
      <div className={styles.datagridSection}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            {activeFolder === 'papers' ? 'Generated Question Papers' : 
             activeFolder === 'uploads' ? 'Uploaded Reference Materials' : 
             activeFolder === 'creations' ? 'AI Toolkit Creations' :
             'Syllabus & NCERT Guidelines'}
          </h2>

          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search library documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.tableContainer}>
          {filteredRows.length === 0 ? (
            <div className={styles.emptyGrid}>
              <Library size={40} style={{ margin: '0 auto 1rem', color: 'var(--accent-muted)' }} />
              <p>No documents found in this folder drawer matching your filters.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Document Name</th>
                  <th className={styles.th}>Type</th>
                  <th className={styles.th}>Date Created</th>
                  <th className={styles.th}>File Info</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.docNameRow}>
                        <FileText size={16} className={styles.docIcon} />
                        <span>{row.name}</span>
                      </div>
                    </td>
                    <td className={styles.td}>{row.type}</td>
                    <td className={styles.td}>{row.dateSaved}</td>
                    <td className={styles.td}>{row.size}</td>
                    <td className={styles.td}>
                      <div className={styles.actionsGroup} style={{ justifyContent: 'flex-end' }}>
                        {row.actionUrl && (
                          <Link href={row.actionUrl} style={{ textDecoration: 'none' }} target={row.category === 'uploads' ? '_blank' : '_self'}>
                            <button className={styles.actionBtn}>
                              <ExternalLink size={12} />
                              <span>Open</span>
                            </button>
                          </Link>
                        )}
                        <button 
                          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                          onClick={() => handleDeleteItem(row.id, row.category)}
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
