'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAssignmentStore } from '../store/assignmentStore';
import { 
  Home, 
  Users, 
  FileText, 
  Wand2, 
  Library, 
  Settings, 
  Plus
} from 'lucide-react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const assignments = useAssignmentStore(state => state.assignments);

  // Active state checker
  const isActive = (path: string) => {
    return pathname === path ? styles.active : '';
  };



  return (
    <>
      {/* Desktop Glass Sidebar */}
      <aside className={`${styles.sidebar} no-print`}>
        <div className={styles.topSection}>
          <div className={styles.logo}>
            <Image src="/logo_1.png" alt="VedaAI Logo" width={32} height={32} className={styles.logoImage} />
            <span>VedaAI</span>
          </div>

          <Link href="/assignments/new" style={{ textDecoration: 'none' }}>
            <button className={styles.createBtn}>
              <Plus size={16} />
              <span>Create Assignment</span>
            </button>
          </Link>

          <nav className={styles.navigation}>
            <Link href="/" className={`${styles.navLink} ${isActive('/')}`}>
              <div className={styles.navLinkLeft}>
                <Home size={18} />
                <span>Home</span>
              </div>
            </Link>

            <Link href="/groups" className={`${styles.navLink} ${isActive('/groups')}`}>
              <div className={styles.navLinkLeft}>
                <Users size={18} />
                <span>My Groups</span>
              </div>
            </Link>

            <Link href="/assignments" className={`${styles.navLink} ${isActive('/assignments') || isActive('/assignments/new')}`}>
              <div className={styles.navLinkLeft}>
                <FileText size={18} />
                <span>Assignments</span>
              </div>
              {assignments.length > 0 && (
                <span className={styles.badge}>{assignments.length}</span>
              )}
            </Link>

            <Link href="/toolkit" className={`${styles.navLink} ${isActive('/toolkit')}`}>
              <div className={styles.navLinkLeft}>
                <Wand2 size={18} />
                <span>AI Teacher&apos;s Toolkit</span>
              </div>
            </Link>

            <Link href="/library" className={`${styles.navLink} ${isActive('/library')}`}>
              <div className={styles.navLinkLeft}>
                <Library size={18} />
                <span>My Library</span>
              </div>
            </Link>
          </nav>
        </div>

        <div className={styles.bottomSection}>
          <Link href="/settings" className={styles.settingsLink}>
            <Settings size={18} />
            <span>Settings</span>
          </Link>

          <div className={styles.schoolBadge}>
            <div className={styles.schoolAvatar}>🏫</div>
            <div className={styles.schoolText}>
              <span className={styles.schoolName}>Delhi Public School</span>
              <span className={styles.schoolLocation}>Bokaro Steel City</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Dark Bottom Nav Bar */}
      <nav className={`${styles.mobileNav} no-print`}>
        <Link href="/" className={`${styles.mobileLink} ${pathname === '/' ? styles.mobileLinkActive : ''}`}>
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link href="/assignments" className={`${styles.mobileLink} ${pathname.startsWith('/assignments') ? styles.mobileLinkActive : ''}`}>
          <FileText size={20} />
          <span>Assignments</span>
        </Link>
        <Link href="/library" className={`${styles.mobileLink} ${pathname === '/library' ? styles.mobileLinkActive : ''}`}>
          <Library size={20} />
          <span>Library</span>
        </Link>
        <Link href="/toolkit" className={`${styles.mobileLink} ${pathname === '/toolkit' ? styles.mobileLinkActive : ''}`}>
          <Wand2 size={20} />
          <span>AI Toolkit</span>
        </Link>
      </nav>
    </>
  );
}
