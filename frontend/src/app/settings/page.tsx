'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Shield, Award, Sparkles, Eye, EyeOff, CheckCircle } from 'lucide-react';
import styles from './Settings.module.css';

export default function SettingsPage() {
  // Institutional Credentials
  const [schoolName, setSchoolName] = useState('Delhi Public School');
  const [schoolLocation, setSchoolLocation] = useState('Bokaro Steel City');
  
  // Isolated Developer API Key
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Defaults Generation Parameters
  const [defaultTime, setDefaultTime] = useState(45);
  const [defaultClass, setDefaultClass] = useState('Class 5th');

  // Theme states
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Banner status
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // 1. Hydrate school info
    const savedSchool = localStorage.getItem('veda_school_name');
    const savedLoc = localStorage.getItem('veda_school_location');
    if (savedSchool) setSchoolName(savedSchool);
    if (savedLoc) setSectionLoc(savedLoc);

    function setSectionLoc(val: string) {
      setSchoolLocation(val);
    }

    // 2. Hydrate Custom API Key override
    const savedKey = localStorage.getItem('veda_user_api_key');
    if (savedKey) setApiKey(savedKey);

    // 3. Hydrate defaults
    const savedTime = localStorage.getItem('veda_default_time');
    const savedClass = localStorage.getItem('veda_default_class');
    if (savedTime) setDefaultTime(parseInt(savedTime));
    if (savedClass) setDefaultClass(savedClass);

    // 4. Hydrate theme
    const savedTheme = localStorage.getItem('veda_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (targetTheme: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', targetTheme);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Persist School details
    localStorage.setItem('veda_school_name', schoolName);
    localStorage.setItem('veda_school_location', schoolLocation);
    
    // Persist Developer custom keys
    if (apiKey) {
      localStorage.setItem('veda_user_api_key', apiKey);
    } else {
      localStorage.removeItem('veda_user_api_key');
    }

    // Persist Generation defaults
    localStorage.setItem('veda_default_time', defaultTime.toString());
    localStorage.setItem('veda_default_class', defaultClass);

    // Persist active theme selectors
    localStorage.setItem('veda_theme', theme);
    applyTheme(theme);

    // Dynamically update sidebar headers if present in the document
    const schoolNameEl = document.querySelector('[class*="schoolName"]');
    const schoolLocEl = document.querySelector('[class*="schoolLocation"]');
    if (schoolNameEl) schoolNameEl.textContent = schoolName;
    if (schoolLocEl) schoolLocEl.textContent = schoolLocation;

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (!confirm('Are you sure you want to restore all defaults?')) return;
    
    setSchoolName('Delhi Public School');
    setSchoolLocation('Bokaro Steel City');
    setApiKey('');
    setDefaultTime(45);
    setDefaultClass('Class 5th');
    setTheme('light');
    
    localStorage.clear();
    applyTheme('light');

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerText}>
        <h1 className={styles.title}>System Settings</h1>
        <p className={styles.subtitle}>Customize your digital workspace defaults, secure API access coordinates, and toggles visual parameters.</p>
      </div>

      {saved && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: '#ECFDF5',
          border: '1px solid #10B981',
          color: '#065F46',
          padding: '1rem',
          borderRadius: '12px',
          fontWeight: 700
        }}>
          <CheckCircle size={18} style={{ color: '#10B981' }} />
          <span>Success! Preferences and structural variables saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className={styles.form}>
        <div className={styles.settingsGrid}>
          {/* Card 1: School Credentials */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Award size={18} className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Institutional Profile</h2>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Institution / School Name</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Branch / Location details</label>
              <input
                type="text"
                value={schoolLocation}
                onChange={(e) => setSchoolLocation(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          {/* Card 2: Isolated Developer Key overrides */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Shield size={18} className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>API isolated Key Overrides</h2>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Gemini Developer API Key</label>
              <div className={styles.passwordInputWrapper}>
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="Paste your personal Gemini API key here..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className={styles.passwordInput}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className={styles.passwordToggle}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className={styles.description}>
                Your key is stored locally in this browser. When executing generations, VedaAI proxies requests using your developer quota, avoiding shared system limits.
              </p>
            </div>
          </div>

          {/* Card 3: Default Generation Configs */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Settings size={18} className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Generation Parameters Defaults</h2>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Default Time Allowed (Minutes)</label>
              <input
                type="number"
                min="10"
                max="180"
                value={defaultTime}
                onChange={(e) => setDefaultTime(parseInt(e.target.value) || 0)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Default Target Class / Grade</label>
              <select
                value={defaultClass}
                onChange={(e) => setDefaultClass(e.target.value)}
                className={styles.select}
              >
                <option value="Class 5th">Class 5th</option>
                <option value="Class 8th">Class 8th</option>
                <option value="Class 10th">Class 10th</option>
                <option value="Class 12th">Class 12th</option>
              </select>
            </div>
          </div>

          {/* Card 4: Theme selectors */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Sparkles size={18} className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Premium Visual Themes</h2>
            </div>
            
            <div className={styles.themeGrid}>
              <div 
                onClick={() => setTheme('light')}
                className={`${styles.themeCard} ${theme === 'light' ? styles.themeCardActive : ''}`}
              >
                <div className={`${styles.themeMockup} ${styles.mockupLight}`}>
                  <div className={`${styles.mockupSidebar} ${styles.sidebarLight}`} />
                  <div className={`${styles.mockupContent} ${styles.contentLight}`} />
                </div>
                <span className={styles.themeName}>Sleek Light</span>
              </div>

              <div 
                onClick={() => setTheme('dark')}
                className={`${styles.themeCard} ${theme === 'dark' ? styles.themeCardActive : ''}`}
              >
                <div className={`${styles.themeMockup} ${styles.mockupDark}`}>
                  <div className={`${styles.mockupSidebar} ${styles.sidebarDark}`} />
                  <div className={`${styles.mockupContent} ${styles.contentDark}`} />
                </div>
                <span className={styles.themeName}>Harmonious Dark</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.saveBar}>
          <button type="button" onClick={handleReset} className={styles.resetBtn}>
            Reset Defaults
          </button>
          <button type="submit" className={styles.saveBtn}>
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
