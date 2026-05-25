'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Wand2, BookOpen, Table, Gamepad2, Copy, Printer, Check, Clock } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/assignmentStore';
import TopHeaderBar from '@/components/TopHeaderBar';
import styles from './Toolkit.module.css';

// Custom Markdown Parsers for UI Rendering
function parseMarkdownToReact(text: string) {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} style={{ marginLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ marginBottom: '0.25rem' }}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = (key: number) => {
    if (tableRows.length > 0) {
      const cleanRows = tableRows.filter(row => !row.every(cell => cell.trim().match(/^[-:|]+$/)));
      if (cleanRows.length > 0) {
        const headers = cleanRows[0];
        const bodyRows = cleanRows.slice(1);
        elements.push(
          <div key={`table-wrapper-${key}`} style={{ overflowX: 'auto', marginBottom: '1.5rem', width: '100%' }}>
            <table key={`table-${key}`} style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--border-color)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-secondary)' }}>
                  {headers.map((cell, idx) => (
                    <th key={idx} style={{ border: '1px solid var(--border-color)', padding: '0.75rem 1rem', fontWeight: 700, textAlign: 'left' }}>
                      {renderInlineMarkdown(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} style={{ border: '1px solid var(--border-color)', padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                        {renderInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList(index);
      inTable = true;
      const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      return;
    } else if (inTable) {
      flushTable(index);
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushList(index);
      inList = true;
      listItems.push(trimmed.substring(2));
      return;
    } else if (inList) {
      flushList(index);
    }

    if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={index} style={{ fontFamily: 'var(--font-primary)', fontSize: '1.75rem', fontWeight: 800, marginTop: '1.5rem', marginBottom: '1rem', borderBottom: '2px solid var(--accent-glow)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>{renderInlineMarkdown(trimmed.substring(2))}</h1>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={index} style={{ fontFamily: 'var(--font-primary)', fontSize: '1.4rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{renderInlineMarkdown(trimmed.substring(3))}</h2>);
    } else if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={index} style={{ fontFamily: 'var(--font-primary)', fontSize: '1.2rem', fontWeight: 700, marginTop: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{renderInlineMarkdown(trimmed.substring(4))}</h3>);
    } else if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={index} style={{ border: 'none', borderTop: '2px solid var(--border-color)', margin: '1.5rem 0' }} />);
    } else if (trimmed.length > 0) {
      elements.push(<p key={index} style={{ marginBottom: '1rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}>{renderInlineMarkdown(trimmed)}</p>);
    } else {
      elements.push(<div key={index} style={{ height: '0.5rem' }} />);
    }
  });

  flushList(lines.length);
  flushTable(lines.length);

  return elements;
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      return <strong key={idx} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{part}</strong>;
    }
    return part;
  });
}

// Custom Markdown Parsers for Print HTML Window
function parseMarkdownToHTML(text: string): string {
  if (!text) return '';
  
  const lines = text.split('\n');
  let html = '';
  let inList = false;
  let inTable = false;
  let tableRows: string[][] = [];

  const flushList = () => {
    if (inList) {
      html += '</ul>';
      inList = false;
    }
  };

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      const cleanRows = tableRows.filter(row => !row.every(cell => cell.trim().match(/^[-:|]+$/)));
      if (cleanRows.length > 0) {
        const headers = cleanRows[0];
        const bodyRows = cleanRows.slice(1);
        html += '<div style="overflow-x: auto; margin-bottom: 1.5rem; width: 100%;">';
        html += '<table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0;">';
        html += '<thead><tr style="background-color: #f8fafc;">';
        headers.forEach(cell => {
          html += `<th style="border: 1px solid #e2e8f0; padding: 0.75rem 1rem; font-weight: 700; text-align: left;">${renderInlineHTML(cell)}</th>`;
        });
        html += '</tr></thead><tbody>';
        bodyRows.forEach(row => {
          html += '<tr style="border-bottom: 1px solid #e2e8f0;">';
          row.forEach(cell => {
            html += `<td style="border: 1px solid #e2e8f0; padding: 0.75rem 1rem; color: #334155;">${renderInlineHTML(cell)}</td>`;
          });
          html += '</tr>';
        });
        html += '</tbody></table></div>';
      }
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach(line => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      inTable = true;
      tableRows.push(trimmed.split('|').slice(1, -1).map(c => c.trim()));
      return;
    } else if (inTable) {
      flushTable();
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        html += '<ul style="margin-left: 1.5rem; margin-bottom: 1rem; list-style-type: disc;">';
        inList = true;
      }
      html += `<li style="margin-bottom: 0.25rem;">${renderInlineHTML(trimmed.substring(2))}</li>`;
      return;
    } else if (inList) {
      flushList();
    }

    if (trimmed.startsWith('# ')) {
      html += `<h1 style="font-family: \'Outfit\', sans-serif; font-size: 1.75rem; font-weight: 800; margin-top: 1.5rem; margin-bottom: 1rem; border-bottom: 2px solid #ff4e20; padding-bottom: 0.5rem; color: #0f172a;">${renderInlineHTML(trimmed.substring(2))}</h1>`;
    } else if (trimmed.startsWith('## ')) {
      html += `<h2 style="font-family: \'Outfit\', sans-serif; font-size: 1.4rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #1e293b;">${renderInlineHTML(trimmed.substring(3))}</h2>`;
    } else if (trimmed.startsWith('### ')) {
      html += `<h3 style="font-family: \'Outfit\', sans-serif; font-size: 1.2rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #334155;">${renderInlineHTML(trimmed.substring(4))}</h3>`;
    } else if (trimmed === '---' || trimmed === '***') {
      html += '<hr style="border: none; border-top: 2px solid #e2e8f0; margin: 1.5rem 0;" />';
    } else if (trimmed.length > 0) {
      html += `<p style="margin-bottom: 1rem; line-height: 1.7; color: #334155;">${renderInlineHTML(trimmed)}</p>`;
    } else {
      html += '<div style="height: 0.5rem;"></div>';
    }
  });

  flushList();
  flushTable();
  return html;
}

function renderInlineHTML(text: string): string {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      return `<strong style="font-weight: 700; color: #0f172a;">${part}</strong>`;
    }
    return part;
  }).join('');
}

type ToolType = 'lesson' | 'rubric' | 'activity' | 'history';

interface ToolConfig {
  id: ToolType;
  title: string;
  desc: string;
  icon: React.ReactNode;
  promptLabel: string;
  promptPlaceholder: string;
  gradeLabel: string;
}

const TOOLS: ToolConfig[] = [
  {
    id: 'lesson',
    title: 'Lesson Planner AI',
    desc: 'Generate NCERT/CBSE aligned step-by-step syllabus lesson plans.',
    icon: <BookOpen size={18} />,
    promptLabel: 'Topic / Chapter Focus',
    promptPlaceholder: 'e.g. Photosynthesis, Trigonometry Laws, French Revolution',
    gradeLabel: 'Grade / Class Level'
  },
  {
    id: 'rubric',
    title: 'Rubric Generator',
    desc: 'Compile clear academic evaluation matrices with criteria guidelines.',
    icon: <Table size={18} />,
    promptLabel: 'Assignment / Topic Title',
    promptPlaceholder: 'e.g. Lab Report on Acids, Essay on Democracy',
    gradeLabel: 'Target Grade'
  },
  {
    id: 'activity',
    title: 'Activity Maker',
    desc: 'Draft hands-on experiments or interactive group learning activities.',
    icon: <Gamepad2 size={18} />,
    promptLabel: 'Topic / Laboratory Objective',
    promptPlaceholder: 'e.g. Exploring Gravity, Chemical Reaction of Yeast',
    gradeLabel: 'Student Grade'
  }
];

function ToolkitPageContent() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ToolType>('lesson');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('Class 8th');
  const [instructions, setInstructions] = useState('');
  
  // API generation state
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zustand store triggers
  const fetchToolkitItems = useAssignmentStore(state => state.fetchToolkitItems);
  const toolkitItems = useAssignmentStore(state => state.toolkitItems);
  const addToolkitItem = useAssignmentStore(state => state.addToolkitItem);
  const updateToolkitItem = useAssignmentStore(state => state.updateToolkitItem);

  const searchParams = useSearchParams();
  const queryTab = searchParams ? searchParams.get('tab') : null;
  const queryId = searchParams ? searchParams.get('id') : null;

  // Toolkit advanced states
  const [isEditingToolkit, setIsEditingToolkit] = useState(false);
  const [editedContent, setEditedContent] = useState<string>('');

  useEffect(() => {
    fetchToolkitItems();
  }, [fetchToolkitItems]);

  useEffect(() => {
    if (queryTab === 'history') {
      // wrapped in setTimeout to prevent React cascading render warnings / ESLint error
      setTimeout(() => {
        setActiveTab('history');
        if (queryId) {
          setSelectedHistoryId(queryId);
        }
      }, 0);
    }
  }, [queryTab, queryId]);

  // Sync edits text when selected saved creation shifts
  useEffect(() => {
    const selectedItem = toolkitItems.find(t => t.id === selectedHistoryId);
    // wrapped in setTimeout to prevent React cascading render warnings / ESLint error
    setTimeout(() => {
      if (selectedItem) {
        setEditedContent(selectedItem.content);
      } else {
        setEditedContent('');
      }
      setIsEditingToolkit(false);
    }, 0);
  }, [selectedHistoryId, toolkitItems]);

  const handleExportWordToolkit = (title: string, topic: string, content: string) => {
    const contentHtml = `
      <div style="font-family: 'Arial', sans-serif; padding: 20px;">
        <h1 style="font-size: 24px; color: #ff4e20; border-bottom: 2px solid #ff4e20; padding-bottom: 5px; margin-bottom: 20px;">
          ${title}: ${topic}
        </h1>
        ${parseMarkdownToHTML(content)}
      </div>
    `;

    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
          "xmlns:w='urn:schemas-microsoft-com:office:word' " +
          "xmlns='http://www.w3.org/TR/REC-html40'>" +
          "<head><title>Syllabus Outline</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + contentHtml + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${topic.replace(/\s+/g, '_')}_Plan.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const handleSaveToolkitEdit = async (itemId: string) => {
    try {
      await updateToolkitItem(itemId, editedContent);
      setIsEditingToolkit(false);
    } catch {
      alert('Failed to save changes.');
    }
  };

  const activeTool = TOOLS.find(t => t.id === activeTab) || TOOLS[0];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;

    setLoading(true);
    setOutput(null);
    setError(null);
    setCopied(false);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // Pull user API key override if present
      const userApiKey = localStorage.getItem('veda_user_api_key') || '';
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (userApiKey) {
        headers['x-gemini-key'] = userApiKey;
      }

      const res = await fetch(`${apiBase}/api/toolkit/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: activeTab,
          topic,
          grade,
          instructions
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate toolkit asset.');
      }

      const data = await res.json();
      setOutput(data.content);
      setEditedContent(data.content);
      if (data.item) {
        addToolkitItem(data.item);
        setSelectedHistoryId(data.item.id);
        setActiveTab('history');
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : 'Connection failed. Ensure the backend is active.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (!output) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${activeTool.title} - ${topic}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 2.5rem; line-height: 1.6; color: #1e293b; }
            h1 { font-family: 'Outfit', sans-serif; font-size: 1.75rem; border-bottom: 2px solid #ff4e20; padding-bottom: 0.5rem; }
            h2 { font-size: 1.25rem; margin-top: 1.5rem; color: #0f172a; }
            pre { white-space: pre-wrap; font-family: inherit; }
            table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
            th, td { border: 1px solid #e2e8f0; padding: 0.75rem 1rem; text-align: left; }
            th { background-color: #f8fafc; font-weight: 700; }
          </style>
        </head>
        <body>
          ${parseMarkdownToHTML(output)}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className={styles.container}>
      <TopHeaderBar pathName="Toolkit" />

      <div className={styles.headerText}>
        <h1 className={styles.title}>AI Teacher&apos;s Toolkit</h1>
        <p className={styles.subtitle}>Unlock specialized academic micro-wizards powered by Gemini AI to automate core writing tasks.</p>
      </div>

      <div className={styles.workspace}>
        {/* Left Tabs */}
        <aside className={styles.tabsSidebar}>
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTab(tool.id);
                setSelectedHistoryId(null);
                setOutput(null);
                setError(null);
              }}
              className={`${styles.tabBtn} ${activeTab === tool.id ? styles.tabBtnActive : ''}`}
            >
              {tool.icon}
              <span>{tool.title}</span>
            </button>
          ))}

          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.5rem 0' }} />

          <button
            onClick={() => {
              setActiveTab('history');
              setSelectedHistoryId(null);
              setOutput(null);
              setError(null);
            }}
            className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`}
          >
            <Clock size={18} />
            <span>Saved Creations</span>
          </button>
        </aside>

        {/* Right Canvas */}
        {/* Right Canvas */}
        <main className={styles.canvasCard}>
          {activeTab === 'history' ? (
            /* History Board View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {(() => {
                const selectedItem = toolkitItems.find(t => t.id === selectedHistoryId);
                
                if (selectedItem) {
                  return (
                    /* Display Selected Item View */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <button 
                          onClick={() => setSelectedHistoryId(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: 'var(--accent-glow)',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}
                        >
                          &larr; Back to Saved List
                        </button>
                        
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <button 
                            className={styles.actionBtn} 
                            onClick={() => {
                              if (isEditingToolkit) {
                                handleSaveToolkitEdit(selectedItem.id);
                              } else {
                                setIsEditingToolkit(true);
                                setEditedContent(selectedItem.content);
                              }
                            }}
                            style={{
                              backgroundColor: isEditingToolkit ? '#22C55E' : 'transparent',
                              color: isEditingToolkit ? 'white' : 'var(--text-primary)',
                              borderColor: isEditingToolkit ? '#22C55E' : 'var(--border-color)',
                              fontWeight: 800
                            }}
                          >
                            <Check size={14} style={{ color: isEditingToolkit ? 'white' : 'var(--accent-glow)' }} />
                            <span>{isEditingToolkit ? 'Save Outline' : 'Edit Outline'}</span>
                          </button>

                          {isEditingToolkit && (
                            <button 
                              className={styles.actionBtn} 
                              onClick={() => {
                                setIsEditingToolkit(false);
                                setEditedContent(selectedItem.content);
                              }}
                              style={{ color: 'var(--text-primary)' }}
                            >
                              Cancel
                            </button>
                          )}

                          <button 
                            className={styles.actionBtn}
                            onClick={() => handleExportWordToolkit(selectedItem.title, selectedItem.topic, isEditingToolkit ? editedContent : selectedItem.content)}
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <Copy size={14} />
                            <span>Export to Word</span>
                          </button>

                          <button 
                            className={styles.actionBtn} 
                            onClick={() => {
                              navigator.clipboard.writeText(isEditingToolkit ? editedContent : selectedItem.content);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {copied ? <Check size={14} style={{ color: '#22C55E' }} /> : <Copy size={14} />}
                            <span>{copied ? 'Copied!' : 'Copy RAW'}</span>
                          </button>
                          
                          <button 
                            className={styles.actionBtn} 
                            onClick={() => {
                              const printWindow = window.open('', '_blank');
                              if (!printWindow) return;
                              printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>${selectedItem.title} - ${selectedItem.topic}</title>
                                    <style>
                                      body { font-family: 'Inter', system-ui, sans-serif; padding: 2.5rem; line-height: 1.6; color: #1e293b; }
                                      h1 { font-family: 'Outfit', sans-serif; font-size: 1.75rem; border-bottom: 2px solid #ff4e20; padding-bottom: 0.5rem; }
                                      h2 { font-size: 1.25rem; margin-top: 1.5rem; color: #0f172a; }
                                      table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
                                      th, td { border: 1px solid #e2e8f0; padding: 0.75rem 1rem; text-align: left; }
                                      th { background-color: #f8fafc; font-weight: 700; }
                                    </style>
                                  </head>
                                  <body>
                                    ${parseMarkdownToHTML(isEditingToolkit ? editedContent : selectedItem.content)}
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                              printWindow.print();
                            }}
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <Printer size={14} />
                            <span>Print Outline</span>
                          </button>
                        </div>
                      </div>
 
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-glow)' }}>
                          {selectedItem.type === 'lesson' ? 'Lesson Plan' : selectedItem.type === 'rubric' ? 'Rubric Matrix' : 'Classroom Activity'}
                        </span>
                        <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {selectedItem.topic}
                        </h2>
                        <span style={{ fontSize: '0.85rem', color: 'var(--accent-muted)' }}>
                          Grade: <strong>{selectedItem.grade}</strong> | Created: {new Date(selectedItem.createdAt).toLocaleDateString()}
                        </span>
                      </div>
 
                      {isEditingToolkit ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', width: '100%', minHeight: '450px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)' }}>📝 MARKDOWN EDITOR</label>
                            <textarea 
                              value={editedContent}
                              onChange={e => setEditedContent(e.target.value)}
                              style={{ 
                                width: '100%', 
                                flex: 1, 
                                minHeight: '480px',
                                padding: '1rem', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '16px', 
                                background: 'var(--bg-input)', 
                                color: 'var(--text-primary)', 
                                fontFamily: 'monospace', 
                                fontSize: '0.9rem',
                                resize: 'vertical',
                                lineHeight: '1.6',
                                outline: 'none'
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)' }}>✨ LIVE REACT PREVIEW</label>
                            <div className={styles.contentDisplay} style={{ flex: 1, minHeight: '480px', maxHeight: '550px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', backgroundColor: 'var(--surface-elevated)' }}>
                              {parseMarkdownToReact(editedContent)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.contentDisplay} style={{ maxHeight: 'none' }}>
                          {parseMarkdownToReact(selectedItem.content)}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  /* Display History List */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                      <h2 className={styles.cardTitle}>Saved Creations Board</h2>
                      <p className={styles.cardDesc}>Browse, review, and print all previously compiled syllabus lesson plans, activities, and rubrics.</p>
                    </div>

                    {toolkitItems.length === 0 ? (
                      <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--accent-muted)', fontSize: '0.95rem', border: '1px dashed var(--border-color)', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                        <div style={{ fontSize: '2.5rem' }}>📭</div>
                        <span style={{ fontWeight: 700 }}>No saved toolkit creations found</span>
                        <span>Use the generators to compile lesson plans, rubrics, or classroom activities standard aligned.</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {toolkitItems.map(item => (
                          <div 
                            key={item.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '1.25rem',
                              border: '1px solid var(--border-color)',
                              borderRadius: '16px',
                              backgroundColor: 'var(--surface-elevated)',
                              boxShadow: 'var(--shadow-sm)',
                              transition: 'var(--transition-smooth)'
                            }}
                          >
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                              <div style={{
                                fontSize: '1.5rem',
                                backgroundColor: item.type === 'lesson' ? 'var(--badge-easy-bg)' : item.type === 'rubric' ? 'var(--badge-success-bg)' : 'var(--badge-moderate-bg)',
                                padding: '0.5rem',
                                borderRadius: '10px'
                              }}>
                                {item.type === 'lesson' ? '📖' : item.type === 'rubric' ? '📊' : '🪄'}
                              </div>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.topic}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                  Type: <span style={{ color: 'var(--accent-glow)' }}>{item.type === 'lesson' ? 'Lesson Plan' : item.type === 'rubric' ? 'Rubric' : 'Activity'}</span> | Grade: {item.grade}
                                </span>
                              </div>
                            </div>

                            <button 
                              onClick={() => setSelectedHistoryId(item.id)}
                              style={{
                                backgroundColor: 'var(--surface-hover)',
                                color: 'var(--text-primary)',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                cursor: 'pointer'
                              }}
                            >
                              Open Outline
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Standard Generators Workspace */
            <>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{activeTool.title} Workspace</h2>
                <p className={styles.cardDesc}>{activeTool.desc}</p>
              </div>

              <div className={styles.generatorSplit}>
                <form onSubmit={handleGenerate} className={styles.leftFormPane}>
                  <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>{activeTool.promptLabel}</label>
                      <input
                        type="text"
                        placeholder={activeTool.promptPlaceholder}
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className={styles.input}
                        required
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.label}>{activeTool.gradeLabel}</label>
                      <input
                        type="text"
                        placeholder="e.g. Class 8th"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className={styles.input}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Custom Directives / Syllabus Alignment (Optional)</label>
                    <textarea
                      placeholder="e.g. Include laboratory experiments, highlight NCERT section coordinates, prioritize difficulty balancing..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className={styles.textarea}
                      style={{ height: '140px' }}
                    />
                  </div>

                  <button type="submit" className={styles.submitBtn} disabled={loading}>
                    <Wand2 size={16} />
                    <span>{loading ? 'Compiling AI Prompt...' : 'Generate with AI'}</span>
                  </button>
                </form>

                <div className={styles.rightPreviewPane}>
                  {loading ? (
                    <div className={styles.loaderContainer}>
                      <div className={styles.spinner} />
                      <span className={styles.loaderText}>Gemini AI is analyzing syllabus objectives & compiling structure...</span>
                    </div>
                  ) : error ? (
                    <div style={{ color: '#EF4444', backgroundColor: '#FEE2E2', padding: '1rem', borderRadius: '12px', fontWeight: 600 }}>
                      ⚠️ Generation Error: {error}
                    </div>
                  ) : output ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
                      <div className={styles.outputHeader}>
                        <h3 className={styles.outputTitle}>AI Generated Asset Draft</h3>
                        
                        <div className={styles.actionsGroup}>
                          <button className={styles.actionBtn} onClick={handleCopy}>
                            {copied ? <Check size={14} style={{ color: '#22C55E' }} /> : <Copy size={14} />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                          </button>
                          <button className={styles.actionBtn} onClick={handlePrint}>
                            <Printer size={14} />
                            <span>Print Outline</span>
                          </button>
                        </div>
                      </div>

                      <div className={styles.contentDisplay} style={{ flex: 1, maxHeight: '350px' }}>
                        {parseMarkdownToReact(output)}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.previewPlaceholder}>
                      <div className={styles.placeholderIcon}>🪄</div>
                      <h4 className={styles.placeholderTitle}>Interactive AI Workspace</h4>
                      <p className={styles.placeholderDesc}>
                        Your dynamic lesson plan, rubric, or activity draft will appear here. Fill in the syllabus specifications on the left to start compiling.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ToolkitPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--accent-muted)' }}>
        Loading Toolkit workspace...
      </div>
    }>
      <ToolkitPageContent />
    </Suspense>
  );
}
