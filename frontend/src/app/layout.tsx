'use client';

import React, { useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getSocket } from '../utils/socket';
import { useAssignmentStore } from '../store/assignmentStore';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetchAssignments = useAssignmentStore(state => state.fetchAssignments);

  // Initialize theme, global Socket.io listeners and sync data
  useEffect(() => {
    // 1. Establish connection to socket server
    getSocket();
    
    // 2. Fetch assignments list from server
    fetchAssignments();

    // 3. Hydrate and apply active theme
    const savedTheme = localStorage.getItem('veda_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, [fetchAssignments]);

  return (
    <html lang="en">
      <head>
        <title>VedaAI - AI Assessment Creator</title>
        <meta name="description" content="Generate high-quality school exam papers using cutting-edge AI engines." />
        <link rel="icon" href="/logo_1.png" type="image/png" />
      </head>
      <body>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
