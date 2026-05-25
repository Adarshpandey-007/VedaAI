'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAssignmentStore } from '@/store/assignmentStore';
import { 
  ArrowLeft, 
  Bell, 
  Settings, 
  LogOut, 
  Library, 
  Sun, 
  Moon, 
  ChevronDown
} from 'lucide-react';
import styles from './TopHeaderBar.module.css';

interface TopHeaderBarProps {
  pathName: string;
}

interface NotificationItem {
  id: string;
  type: 'paper' | 'toolkit' | 'system';
  icon: string;
  message: string;
  time: string;
  actionUrl: string;
}

export default function TopHeaderBar({ pathName }: TopHeaderBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const assignments = useAssignmentStore(state => state.assignments);
  const toolkitItems = useAssignmentStore(state => state.toolkitItems);

  // States
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>('light');
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [customNotifications, setCustomNotifications] = useState<NotificationItem[]>([]);

  // Refs for click outside handlers
  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);



  // Helper for formatting time (placed above useEffect blocks to avoid hoisting lint rules)
  const formatRelativeTime = (dateStr: string) => {
    try {
      const timeMs = new Date(dateStr).getTime();
      const diffSecs = Math.floor((Date.now() - timeMs) / 1000);
      if (diffSecs < 60) return 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  // Initialize theme
  useEffect(() => {
    const savedTheme = (localStorage.getItem('veda_theme') as 'light' | 'dark') || 'light';
    setTimeout(() => {
      setActiveTheme(savedTheme);
    }, 0);
  }, []);

  // Construct dynamic notifications list based on live store data!
  useEffect(() => {
    const list: NotificationItem[] = [];

    // 1. Add completed or failed assignments
    const sortedAssignments = [...assignments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    sortedAssignments.slice(0, 3).forEach(a => {
      list.push({
        id: `ass-${a.id}`,
        type: 'paper',
        icon: a.status === 'completed' ? '📄' : a.status === 'failed' ? '❌' : '⏳',
        message: a.status === 'completed' 
          ? `Exam paper "${a.title}" was generated successfully.` 
          : a.status === 'failed'
          ? `Generation failed for "${a.title}".`
          : `Exam paper "${a.title}" is currently generating.`,
        time: formatRelativeTime(a.createdAt),
        actionUrl: a.status === 'completed' ? `/assignments/${a.id}/output` : '/assignments'
      });
    });

    // 2. Add recent toolkit items
    const sortedToolkit = [...toolkitItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    sortedToolkit.slice(0, 2).forEach(t => {
      list.push({
        id: `tool-${t.id}`,
        type: 'toolkit',
        icon: '🪄',
        message: `Lesson plan "${t.topic}" is available.`,
        time: formatRelativeTime(t.createdAt),
        actionUrl: `/toolkit?tab=history&id=${t.id}`
      });
    });

    // 3. Fallback welcome notification if empty
    if (list.length === 0) {
      list.push({
        id: 'welcome-sys',
        type: 'system',
        icon: '🏫',
        message: 'Welcome to VedaAI! Your institutional database is connected.',
        time: 'Just now',
        actionUrl: '/'
      });
    }

    setTimeout(() => {
      setCustomNotifications(list);
    }, 0);
  }, [assignments, toolkitItems]);

  // Click outside to close dropdown menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeChange = (themeName: 'light' | 'dark') => {
    setActiveTheme(themeName);
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('veda_theme', themeName);
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    // Add to read list
    if (!readNotificationIds.includes(notif.id)) {
      setReadNotificationIds([...readNotificationIds, notif.id]);
    }
    setIsNotificationsOpen(false);
    router.push(notif.actionUrl);
  };

  const markAllAsRead = () => {
    const allIds = customNotifications.map(n => n.id);
    setReadNotificationIds(allIds);
  };

  const handleSignOut = () => {
    alert('Demonstration Mode: Simulating user account logout. Redirecting to home...');
    setIsProfileOpen(false);
    router.push('/');
  };

  const unreadNotifications = customNotifications.filter(n => !readNotificationIds.includes(n.id));
  const hasUnread = unreadNotifications.length > 0;

  return (
    <div className={`${styles.topHeaderBar} no-print`}>
      {/* Left side navigation trace */}
      <div className={styles.topHeaderLeft}>
        {pathname !== '/' && (
          <button onClick={() => router.back()} className={styles.backArrowBtn} title="Back">
            <ArrowLeft size={16} />
          </button>
        )}
        <span className={styles.topHeaderPath}>{pathName}</span>
      </div>

      {/* Right side widgets */}
      <div className={styles.topHeaderRight}>
        {/* Dynamic Notifications Bell */}
        <div className={styles.topHeaderRight} ref={bellRef}>
          <button 
            className={styles.bellBtn} 
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileOpen(false);
            }}
            title="Notifications"
          >
            <Bell size={18} />
            {hasUnread && <span className={styles.bellDot}></span>}
          </button>

          {isNotificationsOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownTitle}>Notifications</span>
                {hasUnread && (
                  <button className={styles.clearBtn} onClick={markAllAsRead}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className={styles.listScroll}>
                {customNotifications.map(notif => {
                  const isUnread = !readNotificationIds.includes(notif.id);
                  return (
                    <button 
                      key={notif.id} 
                      className={`${styles.notificationItem} ${isUnread ? styles.itemUnread : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <span className={styles.itemIcon}>{notif.icon}</span>
                      <div className={styles.itemContent}>
                        <span className={styles.itemMessage}>{notif.message}</span>
                        <span className={styles.itemTime}>{notif.time}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic John Doe User Profile */}
        <div className={styles.topHeaderRight} ref={profileRef}>
          <div 
            className={styles.profileBadge}
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationsOpen(false);
            }}
          >
            <Image src="/logo_1.png" alt="Avatar" width={32} height={32} className={styles.avatarImage} />
            <span className={styles.profileName}>John Doe</span>
            <span className={styles.profileChevron}>
              <ChevronDown size={12} style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'none', transition: 'var(--transition-smooth)' }} />
            </span>
          </div>

          {isProfileOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.profileHeader}>
                <span className={styles.profileNameText}>John Doe</span>
                <span className={styles.profileEmail}>john.doe@delhipublicschool.edu.in</span>
                <span className={styles.profileRole}>Lead Educator</span>
              </div>

              {/* Dynamic stats aggregates */}
              <div className={styles.profileStats}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{assignments.length}</span>
                  <span className={styles.statLabel}>Exams</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{toolkitItems.length}</span>
                  <span className={styles.statLabel}>Lessons</span>
                </div>
              </div>

              <div className={styles.menuList}>
                <button className={styles.menuItem} onClick={() => { setIsProfileOpen(false); router.push('/library'); }}>
                  <div className={styles.menuItemLeft}>
                    <Library size={15} />
                    <span>My Library</span>
                  </div>
                </button>
                <button className={styles.menuItem} onClick={() => { setIsProfileOpen(false); router.push('/settings'); }}>
                  <div className={styles.menuItemLeft}>
                    <Settings size={15} />
                    <span>System Settings</span>
                  </div>
                </button>

                <div className={styles.themeToggleWrapper}>
                  <span>Visual Theme</span>
                  <div className={styles.themeSwitch}>
                    <div 
                      className={`${styles.themeOption} ${activeTheme === 'light' ? styles.themeOptionActive : styles.themeOptionInactive}`}
                      onClick={() => handleThemeChange('light')}
                    >
                      <Sun size={12} style={{ marginRight: '3px' }} /> Light
                    </div>
                    <div 
                      className={`${styles.themeOption} ${activeTheme === 'dark' ? styles.themeOptionActive : styles.themeOptionInactive}`}
                      onClick={() => handleThemeChange('dark')}
                    >
                      <Moon size={12} style={{ marginRight: '3px' }} /> Dark
                    </div>
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.4rem 0' }} />

                <button className={`${styles.menuItem} styles.menuItemDanger`} onClick={handleSignOut}>
                  <div className={styles.menuItemLeft}>
                    <LogOut size={15} style={{ color: 'var(--badge-danger-text)' }} />
                    <span style={{ color: 'var(--badge-danger-text)' }}>Sign Out</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
