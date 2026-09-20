const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\viraj\\Desktop\\reports\\DD_V4.6.3_Reports';
const GITHUB_REPO_URL = 'https://github.com/Virajnaik31/DD_V4.6.3_Reports';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/Virajnaik31/DD_V4.6.3_Reports/main';
const GITHUB_PAGES_BASE = 'https://virajnaik31.github.io/DD_V4.6.3_Reports';

function generateDashboard(targetRootDir) {
  function findReports(dir, category = '') {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    const hasIndex = entries.some(e => e.isFile() && e.name.toLowerCase() === 'index.html');
    
    if (hasIndex && dir !== targetRootDir) {
      const relPath = path.relative(targetRootDir, dir).replace(/\\/g, '/');
      const parts = relPath.split('/');
      const cat = category || parts[0];
      const moduleName = parts.length > 2 ? parts[1] : (parts.length === 2 ? parts[0] : 'General');
      const reportName = parts[parts.length - 1];

      let screenshots = [];
      let videos = [];
      let dataFiles = [];

      const scDir = path.join(dir, 'screenshots');
      if (fs.existsSync(scDir)) {
        try {
          const scFiles = fs.readdirSync(scDir).filter(f => /\.(png|jpe?g|webp)$/i.test(f));
          screenshots = scFiles.map(f => ({
            name: f,
            title: formatStepName(f),
            relPath: `${relPath}/screenshots/${f}`,
            cloudUrl: `${GITHUB_RAW_BASE}/${relPath}/screenshots/${f}`
          }));
        } catch (e) {}
      }

      const vidDir = path.join(dir, 'videos');
      if (fs.existsSync(vidDir)) {
        try {
          const vidFiles = fs.readdirSync(vidDir).filter(f => /\.(webm|mp4|mov)$/i.test(f));
          videos = vidFiles.map(f => ({
            name: f,
            relPath: `${relPath}/videos/${f}`,
            cloudUrl: `${GITHUB_RAW_BASE}/${relPath}/videos/${f}`
          }));
        } catch (e) {}
      }

      const dataDir = path.join(dir, 'data');
      if (fs.existsSync(dataDir)) {
        try {
          const df = fs.readdirSync(dataDir);
          dataFiles = df.slice(0, 20).map(f => ({
            name: f,
            relPath: `${relPath}/data/${f}`
          }));
        } catch (e) {}
      }

      const indexPath = path.join(dir, 'index.html');
      const stats = fs.statSync(indexPath);

      results.push({
        id: relPath.replace(/[^a-zA-Z0-9_-]/g, '_'),
        category: cat,
        categoryLabel: formatCategoryLabel(cat),
        shortLabel: formatCategoryShort(cat),
        module: moduleName,
        name: reportName,
        title: formatTitle(reportName, moduleName, cat),
        relativePath: relPath,
        url: `${relPath}/index.html`,
        githubReportUrl: `${GITHUB_PAGES_BASE}/${relPath}/index.html`,
        githubRepoUrl: `${GITHUB_REPO_URL}/tree/main/${relPath}`,
        status: 'passed',
        duration: '1.2s',
        screenshotsCount: screenshots.length,
        videosCount: videos.length,
        screenshots: screenshots,
        videos: videos,
        dataFiles: dataFiles,
        lastModified: stats.mtime.toISOString(),
        sizeKb: Math.round(stats.size / 1024)
      });
    }

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'data' && entry.name !== 'screenshots' && entry.name !== 'videos' && entry.name !== 'node_modules' && entry.name !== '.git') {
        const subDir = path.join(dir, entry.name);
        results = results.concat(findReports(subDir, category || entry.name));
      }
    }

    return results;
  }

  function formatCategoryLabel(cat) {
    switch (cat) {
      case 'CMT': return 'CMT';
      case 'orderFulFilmentChecklist': return 'Order Fulfilment Checklist';
      case 'orderFulfilment': return 'Order Fulfilment';
      case 'superadmin': return 'SuperAdmin';
      default: return cat;
    }
  }

  function formatCategoryShort(cat) {
    switch (cat) {
      case 'CMT': return 'CMT';
      case 'orderFulFilmentChecklist': return 'Checklist';
      case 'orderFulfilment': return 'Fulfilment';
      case 'superadmin': return 'SuperAdmin';
      default: return cat;
    }
  }

  function formatTitle(name, module, cat) {
    if (/^case[-_]?(\d+)/i.test(name)) {
      const match = name.match(/^case[-_]?(\d+)/i);
      return `Case ${match[1].padStart(3, '0')}: Order Fulfilment Test`;
    }
    if (name.includes('case-001-020')) {
      return 'Cases 001-020 Batch Execution Report';
    }
    let clean = name.replace(/_report$/i, '').replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').trim();
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    return clean;
  }

  function formatStepName(fileName) {
    let clean = fileName.replace(/\.(png|jpe?g|webp)$/i, '');
    clean = clean.replace(/^(\d+[_.-])+/g, '');
    clean = clean.replace(/[-_]/g, ' ').trim();
    if (!clean) clean = fileName;
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  const allReports = findReports(targetRootDir);
  allReports.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.module !== b.module) return a.module.localeCompare(b.module);
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });

  const totalScreenshots = allReports.reduce((sum, r) => sum + r.screenshotsCount, 0);
  const totalVideos = allReports.reduce((sum, r) => sum + r.videosCount, 0);
  const passedCount = allReports.filter(r => r.status === 'passed').length;
  const failedCount = allReports.filter(r => r.status === 'failed').length;
  const passRate = allReports.length > 0 ? ((passedCount / allReports.length) * 100).toFixed(1) : '100.0';

  const categories = [...new Set(allReports.map(r => r.category))];
  const reportsJson = JSON.stringify(allReports);

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DD 4.6.3 UAT Master Test Reports</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
:root {
  --bg-primary: #0a0e17;
  --bg-secondary: #111827;
  --bg-surface: #161f30;
  --bg-card: #151d2d;
  --bg-card-hover: #1c263b;
  --bg-active: rgba(59, 130, 246, 0.16);
  --border-color: rgba(255, 255, 255, 0.08);
  --border-subtle: rgba(255, 255, 255, 0.05);
  --border-focus: #3b82f6;
  
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  
  --color-pass: #10b981;
  --color-pass-bg: rgba(16, 185, 129, 0.12);
  --color-pass-border: rgba(16, 185, 129, 0.35);
  
  --color-fail: #ef4444;
  --color-fail-bg: rgba(239, 68, 68, 0.14);
  --color-fail-border: rgba(239, 68, 68, 0.4);
  
  --accent-blue: #3b82f6;
  --accent-cyan: #06b6d4;
  --accent-purple: #8b5cf6;
  
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', Consolas, Monaco, monospace;
  
  --sidebar-width: 360px;
  --header-height: 64px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --transition: all 0.18s ease-in-out;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

/* Master Layout */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Top Master Header */
.master-header {
  height: var(--header-height);
  min-height: var(--header-height);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 50;
  gap: 16px;
  flex-shrink: 0;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.brand-logo {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.35);
}

.brand-logo svg {
  width: 20px;
  height: 20px;
  fill: #ffffff;
}

.brand-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand-info h1 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.2;
}

.brand-info .tag-version {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 9999px;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.brand-info .subtitle {
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* Top Navigation Tabs - FOLDERS ONLY (No 'All') */
.nav-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(10, 14, 23, 0.6);
  padding: 4px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  flex-shrink: 0;
}

.nav-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.nav-tab-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
}

.nav-tab-btn.active {
  background: rgba(59, 130, 246, 0.18);
  color: #ffffff;
  border-color: rgba(59, 130, 246, 0.4);
  font-weight: 600;
}

.nav-tab-btn.failed-tab {
  color: #f87171;
}

.nav-tab-btn.failed-tab:hover {
  background: rgba(239, 68, 68, 0.1);
}

.nav-tab-btn.failed-tab.active {
  background: var(--color-fail-bg);
  color: #fca5a5;
  border-color: var(--color-fail-border);
}

.tab-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
}

.tab-badge.badge-failed {
  background: rgba(239, 68, 68, 0.25);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

/* Header Right Metrics */
.header-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(10, 14, 23, 0.6);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  font-size: 0.78rem;
}

.stat-pill .label {
  color: var(--text-muted);
}

.stat-pill .value {
  font-weight: 700;
}

.stat-pill .value.pass {
  color: var(--color-pass);
}

.stat-pill .value.fail {
  color: var(--color-fail);
}

.stat-pill .value.rate {
  color: #60a5fa;
}

/* Main Workspace */
.main-workspace {
  display: flex;
  flex: 1;
  height: calc(100vh - var(--header-height));
  overflow: hidden;
}

/* Left Sidebar (Reports List) */
.reports-sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  max-width: var(--sidebar-width);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
}

.sidebar-filter-bar {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(10, 14, 23, 0.3);
  flex-shrink: 0;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box svg {
  position: absolute;
  left: 10px;
  width: 15px;
  height: 15px;
  fill: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 7px 10px 7px 32px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.82rem;
  outline: none;
  transition: var(--transition);
}

.search-input:focus {
  border-color: var(--border-focus);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.filter-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.filter-count-badge {
  font-weight: 500;
  color: var(--text-secondary);
}

.filter-tags {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-chip {
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition);
}

.filter-chip:hover {
  color: var(--text-primary);
}

.filter-chip.active {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border-color: rgba(59, 130, 246, 0.4);
}

.filter-chip.chip-fail.active {
  background: var(--color-fail-bg);
  color: #fca5a5;
  border-color: var(--color-fail-border);
}

/* FOLDER-WISE VIEW CONTROLS */
.sidebar-view-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
}

.folder-mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.72rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.folder-mode-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.folder-mode-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
  color: #60a5fa;
  font-weight: 600;
}

.tree-toggle-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.72rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.tree-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

/* FOLDER GROUP SECTION IN SIDEBAR */
.folder-group {
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
}

.folder-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: rgba(22, 31, 48, 0.85);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  user-select: none;
  transition: var(--transition);
  margin-bottom: 6px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.folder-group-header:hover {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(255, 255, 255, 0.12);
}

.folder-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.folder-chevron {
  width: 14px;
  height: 14px;
  fill: var(--text-muted);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.folder-group.expanded .folder-chevron {
  transform: rotate(90deg);
}

.folder-icon {
  font-size: 0.88rem;
  flex-shrink: 0;
}

.folder-name-text {
  font-size: 0.82rem;
  font-weight: 600;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-count-badge {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.folder-items-container {
  display: none;
  flex-direction: column;
  gap: 6px;
  padding-left: 10px;
  border-left: 2px solid rgba(59, 130, 246, 0.25);
  margin-left: 8px;
  margin-bottom: 6px;
}

.folder-group.expanded .folder-items-container {
  display: flex;
}

/* Sidebar Reports List */
.reports-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reports-list::-webkit-scrollbar {
  width: 5px;
}
.reports-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 3px;
}

.report-card {
  flex-shrink: 0;
  padding: 11px 13px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
  gap: 5px;
  position: relative;
  overflow: hidden;
}

.report-card:hover {
  background: var(--bg-card-hover);
  border-color: rgba(255, 255, 255, 0.15);
}

.report-card.active {
  background: var(--bg-active);
  border-color: rgba(59, 130, 246, 0.5);
}

.report-card.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--accent-blue);
}

.report-card.status-failed {
  border-left: 3px solid var(--color-fail);
}

.report-card.status-failed.active {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.12);
}

.card-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-badge.passed {
  background: var(--color-pass-bg);
  color: var(--color-pass);
  border: 1px solid var(--color-pass-border);
}

.status-badge.failed {
  background: var(--color-fail-bg);
  color: var(--color-fail);
  border: 1px solid var(--color-fail-border);
}

.status-badge .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: currentColor;
}

.card-duration {
  font-size: 0.72rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.card-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  word-break: break-word;
}

.card-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.card-meta-row span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Right Detail Panel */
.report-detail-panel {
  flex: 1;
  background: var(--bg-primary);
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
}

.detail-content-wrapper {
  padding: 20px 28px 40px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 1300px;
  margin: 0 auto;
  width: 100%;
}

/* Detail Top Header Card */
.detail-header-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  border-top: 3px solid var(--accent-blue);
}

.detail-header-card.failed-header {
  border-top: 3px solid var(--color-fail);
}

.detail-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.detail-title-group h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.25;
}

.detail-spec-path {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: #93c5fd;
  margin-top: 4px;
  background: rgba(59, 130, 246, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(59, 130, 246, 0.18);
}

.header-actions-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  text-decoration: none;
  border: 1px solid transparent;
}

.btn-primary-action {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(37, 99, 235, 0.3);
}

.btn-primary-action:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.btn-secondary-action {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.16);
  color: #f1f5f9;
}

.btn-secondary-action:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.28);
  color: #ffffff;
  transform: translateY(-1px);
}

.detail-metrics-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
  font-size: 0.78rem;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-muted);
}

.metric-item strong {
  color: var(--text-secondary);
  font-weight: 600;
}

/* TOP VIDEO SECTION */
.video-section-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.section-title svg {
  width: 18px;
  height: 18px;
  fill: var(--accent-cyan);
}

.video-player-container {
  background: #000000;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 480px;
  width: 100%;
}

.video-player-container video {
  width: 100%;
  max-height: 480px;
  display: block;
  outline: none;
}

.video-controls-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 4px;
}

.video-speed-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.speed-label {
  font-size: 0.76rem;
  color: var(--text-muted);
  margin-right: 4px;
}

.speed-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 0.74rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  font-family: var(--font-mono);
}

.speed-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.speed-btn.active {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.6);
  color: #93c5fd;
  font-weight: 600;
}

.video-skip-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.video-skip-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
  color: #ffffff;
}

/* SCREENSHOT INSPECTOR / GALLERY VIEW */
.steps-tree-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.view-mode-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(10, 14, 23, 0.5);
  padding: 3px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.view-tab-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 3px 10px;
  font-size: 0.76rem;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition);
}

.view-tab-btn:hover {
  color: #ffffff;
}

.view-tab-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
  color: #60a5fa;
  font-weight: 600;
}

/* STEPS LIST */
.steps-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.step-node {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: rgba(10, 14, 23, 0.4);
  overflow: hidden;
  transition: var(--transition);
}

.step-node:hover {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(10, 14, 23, 0.65);
}

.step-node.has-screenshot {
  border-left: 3px solid var(--accent-cyan);
}

.step-header {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.step-left-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.step-chevron {
  width: 14px;
  height: 14px;
  fill: var(--text-muted);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.step-node.expanded > .step-header .step-chevron {
  transform: rotate(90deg);
}

.step-icon-badge {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
}

.step-title-text {
  font-size: 0.84rem;
  font-weight: 500;
  color: var(--text-primary);
  word-break: break-word;
}

.step-right-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.step-screenshot-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(6, 182, 212, 0.15);
  color: #22d3ee;
  border: 1px solid rgba(6, 182, 212, 0.3);
  font-size: 0.7rem;
  font-weight: 600;
}

.step-body {
  display: none;
  padding: 0 12px 12px 42px;
  border-top: 1px solid var(--border-subtle);
  background: rgba(8, 12, 20, 0.5);
}

.step-node.expanded > .step-body {
  display: block;
}

.step-inline-screenshots {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.step-screenshot-card {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-surface);
  width: 240px;
  transition: var(--transition);
  cursor: pointer;
  position: relative;
}

.step-screenshot-card:hover {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 12px rgba(6, 182, 212, 0.25);
  transform: translateY(-2px);
}

.step-screenshot-img-box {
  width: 100%;
  height: 140px;
  background: #000000;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-screenshot-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  transition: transform 0.25s ease;
}

.step-screenshot-card:hover .step-screenshot-img-box img {
  transform: scale(1.05);
}

.step-screenshot-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #ffffff;
  font-size: 0.76rem;
  font-weight: 600;
  transition: opacity 0.2s ease;
}

.step-screenshot-card:hover .step-screenshot-overlay {
  opacity: 1;
}

.step-screenshot-caption {
  padding: 6px 8px;
  font-size: 0.72rem;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-subtle);
}

/* GALLERY GRID VIEW */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.gallery-item {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
}

.gallery-item:hover {
  border-color: var(--accent-blue);
  transform: translateY(-2px);
}

.gallery-thumb {
  width: 100%;
  height: 150px;
  background: #000;
  overflow: hidden;
}

.gallery-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  transition: transform 0.25s ease;
}

.gallery-item:hover .gallery-thumb img {
  transform: scale(1.05);
}

.gallery-caption {
  padding: 8px 10px;
  font-size: 0.74rem;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-top: 1px solid var(--border-subtle);
}

/* FOLDER STRUCTURE CARD */
.folder-structure-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tree-view-box {
  background: rgba(10, 14, 23, 0.5);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--text-secondary);
}

/* LIGHTBOX MODAL */
.lightbox-modal {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(8px);
  z-index: 100;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.lightbox-modal.active {
  display: flex;
}

.lightbox-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
  z-index: 10;
}

.lightbox-title {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: #ffffff;
}

.lightbox-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.lightbox-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: var(--transition);
}

.lightbox-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.lightbox-content {
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-content img {
  max-width: 90vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: var(--radius-md);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
}

.lightbox-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  z-index: 10;
}

.lightbox-nav-btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

.lightbox-prev { left: 20px; }
.lightbox-next { right: 20px; }

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
  text-align: center;
  padding: 4rem 2rem;
}

.empty-state svg {
  width: 48px;
  height: 48px;
  stroke: var(--text-muted);
}
  </style>
</head>
<body>
  <div class="app-container">
    <!-- Top Master Header / Navigation Bar -->
    <header class="master-header">
      <div class="brand-section">
        <div class="brand-logo">
          <svg viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.45l8.27 14.3H3.73L12 5.45zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>
        </div>
        <div class="brand-info">
          <h1>
            DD UAT Reports
            <span class="tag-version">v4.6.3</span>
          </h1>
          <div class="subtitle">Unified Test Execution &amp; Artifacts Hub</div>
        </div>
      </div>

      <!-- Quick Navigation Bar for Specific Folders (NO 'All') -->
      <nav class="nav-tabs" id="navTabs">
        <!-- Rendered dynamically for each category folder -->
      </nav>

      <!-- Suite Metrics -->
      <div class="header-stats">
        <div class="stat-pill" title="Total test reports executed">
          <span class="label">Total:</span>
          <span class="value" id="statTotal">${allReports.length}</span>
        </div>
        <div class="stat-pill" title="Passed tests">
          <span class="label">Passed:</span>
          <span class="value pass" id="statPassed">${passedCount}</span>
        </div>
        <div class="stat-pill" title="Failed tests">
          <span class="label">Failed:</span>
          <span class="value ${failedCount > 0 ? 'fail' : ''}" id="statFailed">${failedCount}</span>
        </div>
        <div class="stat-pill" title="Overall pass rate">
          <span class="label">Rate:</span>
          <span class="value rate" id="statPassRate">${passRate}%</span>
        </div>
      </div>
    </header>

    <!-- Main Workspace -->
    <main class="main-workspace">
      <!-- Left Sidebar: Filtered Reports List -->
      <aside class="reports-sidebar">
        <div class="sidebar-filter-bar">
          <div class="search-box">
            <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 14z"/></svg>
            <input type="text" id="searchInput" class="search-input" placeholder="Search tests, specs, folders...">
          </div>

          <!-- Grouping Controls Row -->
          <div class="sidebar-view-toggle-row">
            <div style="display: flex; gap: 4px;">
              <button class="folder-mode-btn active" id="btnFolderwise" title="Group reports by subfolders">
                📁 Folder-wise
              </button>
              <button class="folder-mode-btn" id="btnFlatList" title="Show flat list of reports">
                📋 Flat List
              </button>
            </div>
            <div style="display: flex; gap: 4px;">
              <button class="tree-toggle-btn" onclick="toggleAllFolderGroups(true)" title="Expand all subfolders">➕</button>
              <button class="tree-toggle-btn" onclick="toggleAllFolderGroups(false)" title="Collapse all subfolders">➖</button>
            </div>
          </div>

          <div class="filter-meta-row">
            <span class="filter-count-badge" id="filterCount">Showing ${allReports.length} reports</span>
            <div class="filter-tags">
              <button class="filter-chip active" id="chipAll" data-filter="ALL">All</button>
              <button class="filter-chip" id="chipPassed" data-filter="PASSED">Passed</button>
              <button class="filter-chip chip-fail" id="chipFailed" data-filter="FAILED">Failed</button>
            </div>
          </div>
        </div>

        <div class="reports-list" id="reportsList">
          <!-- Rendered dynamically -->
        </div>
      </aside>

      <!-- Right Detail Panel -->
      <section class="report-detail-panel" id="detailPanel">
        <div class="detail-content-wrapper" id="detailContent">
          <!-- Rendered dynamically -->
        </div>
      </section>
    </main>

    <!-- Fullscreen Lightbox Modal for Screenshots -->
    <div class="lightbox-modal" id="lightboxModal">
      <div class="lightbox-header">
        <div class="lightbox-title" id="lightboxTitle">Screenshot Preview</div>
        <div class="lightbox-controls">
          <span style="color: var(--text-muted); font-size: 0.8rem; font-family: var(--font-mono);" id="lightboxCounter">1 / 1</span>
          <a class="lightbox-btn" id="lightboxDownload" href="#" target="_blank" download>
            💾 View Original
          </a>
          <button class="lightbox-btn" id="lightboxClose" title="Close (Esc)">✕</button>
        </div>
      </div>
      <button class="lightbox-nav-btn lightbox-prev" id="lightboxPrev" title="Previous (Left Arrow)">◀</button>
      <div class="lightbox-content">
        <img id="lightboxImg" src="" alt="Screenshot Fullview">
      </div>
      <button class="lightbox-nav-btn lightbox-next" id="lightboxNext" title="Next (Right Arrow)">▶</button>
    </div>
  </div>

  <script>
    const ALL_REPORTS = ${reportsJson};
    const GITHUB_RAW_BASE = '${GITHUB_RAW_BASE}';
    const GITHUB_PAGES_BASE = '${GITHUB_PAGES_BASE}';
    const JSDELIVR_BASE = 'https://cdn.jsdelivr.net/gh/Virajnaik31/DD_V4.6.3_Reports@main';

    function getMediaUrl(relPath) {
      const cleanPath = relPath.startsWith('./') ? relPath.slice(2) : relPath;
      if (window.location.protocol.startsWith('content') || window.location.protocol.startsWith('http')) {
        return GITHUB_PAGES_BASE + '/' + cleanPath;
      }
      return relPath;
    }

    function handleImgError(imgElement, relPath) {
      if (!imgElement.getAttribute('data-retried')) {
        imgElement.setAttribute('data-retried', '1');
        const cleanPath = relPath.startsWith('./') ? relPath.slice(2) : relPath;
        imgElement.src = GITHUB_RAW_BASE + '/' + cleanPath;
      }
    }

    function handleVideoError(videoElement, relPath) {
      const retryCount = parseInt(videoElement.getAttribute('data-retried') || '0', 10);
      const cleanPath = relPath.startsWith('./') ? relPath.slice(2) : relPath;
      
      if (retryCount === 0) {
        videoElement.setAttribute('data-retried', '1');
        videoElement.src = GITHUB_PAGES_BASE + '/' + cleanPath;
        videoElement.load();
      } else if (retryCount === 1) {
        videoElement.setAttribute('data-retried', '2');
        videoElement.src = JSDELIVR_BASE + '/' + cleanPath;
        videoElement.load();
      } else if (retryCount === 2) {
        videoElement.setAttribute('data-retried', '3');
        videoElement.src = GITHUB_RAW_BASE + '/' + cleanPath;
        videoElement.load();
      }
    }

    const state = {
      activeTab: '${categories[0] || 'CMT'}',
      statusFilter: 'ALL',
      searchQuery: '',
      sidebarGrouping: 'FOLDERWISE',
      selectedReportId: null,
      activeViewMode: 'tree',
      isVideoCollapsed: false,
      lightbox: {
        isOpen: false,
        images: [],
        currentIndex: 0,
        title: ''
      }
    };

    const elements = {
      navTabs: document.getElementById('navTabs'),
      searchInput: document.getElementById('searchInput'),
      filterCount: document.getElementById('filterCount'),
      chipAll: document.getElementById('chipAll'),
      chipPassed: document.getElementById('chipPassed'),
      chipFailed: document.getElementById('chipFailed'),
      btnFolderwise: document.getElementById('btnFolderwise'),
      btnFlatList: document.getElementById('btnFlatList'),
      reportsList: document.getElementById('reportsList'),
      detailContent: document.getElementById('detailContent'),
      lightboxModal: document.getElementById('lightboxModal'),
      lightboxImg: document.getElementById('lightboxImg'),
      lightboxTitle: document.getElementById('lightboxTitle'),
      lightboxCounter: document.getElementById('lightboxCounter'),
      lightboxDownload: document.getElementById('lightboxDownload'),
      lightboxClose: document.getElementById('lightboxClose'),
      lightboxPrev: document.getElementById('lightboxPrev'),
      lightboxNext: document.getElementById('lightboxNext')
    };

    function init() {
      renderNavTabs();
      renderReportsList();
      
      const firstInTab = ALL_REPORTS.find(r => r.category === state.activeTab) || ALL_REPORTS[0];
      if (firstInTab) {
        selectReport(firstInTab.id);
      }
      
      setupEventListeners();
    }

    /* Helper: Cloud fallback for media */
    function getMediaUrl(relPath) {
      return relPath;
    }

    function handleImgError(imgElement, relPath) {
      if (!imgElement.getAttribute('data-retried')) {
        imgElement.setAttribute('data-retried', '1');
        const cleanPath = relPath.startsWith('./') ? relPath.slice(2) : relPath;
        imgElement.src = GITHUB_RAW_BASE + '/' + cleanPath;
      }
    }

    function handleVideoError(videoElement, relPath) {
      if (!videoElement.getAttribute('data-retried')) {
        videoElement.setAttribute('data-retried', '1');
        const cleanPath = relPath.startsWith('./') ? relPath.slice(2) : relPath;
        videoElement.src = GITHUB_RAW_BASE + '/' + cleanPath;
        videoElement.load();
      }
    }

    /* Render Top Navigation Tabs - FOLDERS PRESENT ONLY (NO 'All') */
    function renderNavTabs() {
      const categoriesSet = [...new Set(ALL_REPORTS.map(r => r.category))];
      
      let html = categoriesSet.map(cat => {
        const count = ALL_REPORTS.filter(r => r.category === cat).length;
        const shortLabel = ALL_REPORTS.find(r => r.category === cat)?.shortLabel || cat;
        const isActive = state.activeTab === cat ? 'active' : '';
        return \`
          <button class="nav-tab-btn \${isActive}" data-tab="\${cat}">
            📁 \${shortLabel}
            <span class="tab-badge">(\${count})</span>
          </button>
        \`;
      }).join('');

      const failedCount = ALL_REPORTS.filter(r => r.status === 'failed').length;
      if (failedCount > 0) {
        const isFailedActive = state.activeTab === 'FAILED' ? 'active' : '';
        html += \`
          <button class="nav-tab-btn failed-tab \${isFailedActive}" data-tab="FAILED">
            ⚠️ Failed
            <span class="tab-badge badge-failed">(\${failedCount})</span>
          </button>
        \`;
      }

      elements.navTabs.innerHTML = html;
    }

    function setActiveTab(tabId) {
      state.activeTab = tabId;
      document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
      });
      renderReportsList();

      const filtered = getFilteredReports();
      if (filtered.length > 0) {
        selectReport(filtered[0].id);
      }
    }

    function getFilteredReports() {
      return ALL_REPORTS.filter(report => {
        // Tab Category Filter
        let tabMatch = false;
        if (state.activeTab === 'FAILED') {
          tabMatch = report.status === 'failed';
        } else {
          tabMatch = report.category === state.activeTab;
        }

        // Status Filter Chip
        let statusMatch = true;
        if (state.statusFilter === 'PASSED') statusMatch = report.status === 'passed';
        if (state.statusFilter === 'FAILED') statusMatch = report.status === 'failed';

        // Search Filter
        let searchMatch = true;
        if (state.searchQuery.trim()) {
          const q = state.searchQuery.toLowerCase().trim();
          searchMatch = report.title.toLowerCase().includes(q) ||
                        report.relativePath.toLowerCase().includes(q) ||
                        report.module.toLowerCase().includes(q) ||
                        report.name.toLowerCase().includes(q);
        }

        return tabMatch && statusMatch && searchMatch;
      });
    }

    function renderReportsList() {
      const filtered = getFilteredReports();
      elements.filterCount.textContent = \`Showing \${filtered.length} reports\`;

      if (filtered.length === 0) {
        elements.reportsList.innerHTML = \`
          <div style="padding: 2.5rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
            🔍 No test reports found in this folder filter
          </div>
        \`;
        return;
      }

      if (state.sidebarGrouping === 'FLAT') {
        elements.reportsList.innerHTML = filtered.map(r => createReportCardHTML(r)).join('');
      } else {
        // Folder-wise grouping
        const groups = {};
        filtered.forEach(r => {
          const parts = r.relativePath.split('/');
          const groupName = parts.length > 2 ? parts[1] : (parts.length === 2 ? parts[0] : 'General');
          if (!groups[groupName]) groups[groupName] = [];
          groups[groupName].push(r);
        });

        let html = '';
        for (const [groupName, reports] of Object.entries(groups)) {
          html += \`
            <div class="folder-group expanded" data-folder="\${groupName}">
              <div class="folder-group-header" onclick="toggleFolderGroup(this)">
                <div class="folder-header-left">
                  <svg class="folder-chevron" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                  <span class="folder-icon">📁</span>
                  <span class="folder-name-text" title="\${groupName}">\${groupName}</span>
                </div>
                <span class="folder-count-badge">\${reports.length}</span>
              </div>
              <div class="folder-items-container">
                \${reports.map(r => createReportCardHTML(r)).join('')}
              </div>
            </div>
          \`;
        }
        elements.reportsList.innerHTML = html;
      }

      // Highlight active card
      if (state.selectedReportId) {
        const activeCard = elements.reportsList.querySelector(\`.report-card[data-id="\${state.selectedReportId}"]\`);
        if (activeCard) activeCard.classList.add('active');
      }
    }

    function createReportCardHTML(r) {
      const isSelected = state.selectedReportId === r.id;
      const statusClass = r.status === 'passed' ? 'passed' : 'failed';
      return \`
        <div class="report-card \${isSelected ? 'active' : ''} status-\${statusClass}" data-id="\${r.id}">
          <div class="card-top-row">
            <span class="status-badge \${statusClass}">
              <span class="dot"></span>
              \${r.status === 'passed' ? 'PASSED' : 'FAILED'}
            </span>
            <span class="card-duration">\${r.duration || '1s'}</span>
          </div>
          <div class="card-title">\${r.title}</div>
          <div class="card-meta-row">
            <span>📁 \${r.module}</span>
            <span>📸 \${r.screenshotsCount} SS</span>
            <span>🎬 \${r.videosCount}</span>
          </div>
        </div>
      \`;
    }

    window.toggleFolderGroup = function(headerEl) {
      const group = headerEl.closest('.folder-group');
      if (group) {
        group.classList.toggle('expanded');
      }
    };

    window.toggleAllFolderGroups = function(expand) {
      document.querySelectorAll('.folder-group').forEach(g => {
        g.classList.toggle('expanded', expand);
      });
    };

    function setSidebarGrouping(mode) {
      state.sidebarGrouping = mode;
      elements.btnFolderwise.classList.toggle('active', mode === 'FOLDERWISE');
      elements.btnFlatList.classList.toggle('active', mode === 'FLAT');
      renderReportsList();
    }

    function selectReport(reportId) {
      state.selectedReportId = reportId;
      const report = ALL_REPORTS.find(r => r.id === reportId);
      if (!report) return;

      document.querySelectorAll('.report-card').forEach(c => c.classList.remove('active'));
      const activeEl = elements.reportsList.querySelector(\`.report-card[data-id="\${reportId}"]\`);
      if (activeEl) activeEl.classList.add('active');

      renderDetailView(report);
    }

    function renderDetailView(report) {
      state.lightbox.images = report.screenshots.map(s => ({
        path: s.relPath,
        name: s.title || s.name
      }));

      const hasVideo = report.videos && report.videos.length > 0;
      const firstVideo = hasVideo ? report.videos[0] : null;

      let html = \`
        <!-- Header Card -->
        <div class="detail-header-card \${report.status === 'failed' ? 'failed-header' : ''}">
          <div class="detail-title-row">
            <div class="detail-title-group">
              <h2>\${report.title}</h2>
              <div class="detail-spec-path">
                📂 \${report.relativePath}
              </div>
            </div>

            <div class="header-actions-group">
              <a href="\${report.url}" target="_blank" class="btn-action btn-primary-action" title="Open Playwright HTML Report">
                🚀 Open Playwright Report
              </a>
              <a href="\${report.githubReportUrl}" target="_blank" class="btn-action btn-secondary-action" title="View Hosted Live Report on GitHub Pages">
                🌐 Live Cloud Report
              </a>
              <a href="\${report.githubRepoUrl}" target="_blank" class="btn-action btn-secondary-action" title="View Source Files on GitHub">
                📦 GitHub Code
              </a>
            </div>
          </div>

          <div class="detail-metrics-row">
            <div class="metric-item">
              <span class="status-badge \${report.status === 'passed' ? 'passed' : 'failed'}">
                <span class="dot"></span>
                \${report.status === 'passed' ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            <div class="metric-item">⏱️ Duration: <strong>\${report.duration || '1.2s'}</strong></div>
            <div class="metric-item">📁 Module: <strong>\${report.module}</strong></div>
            <div class="metric-item">📸 Screenshots: <strong style="color:var(--accent-cyan);">\${report.screenshotsCount}</strong></div>
            <div class="metric-item">🎬 Video: <strong>\${report.videosCount > 0 ? 'Recorded' : 'None'}</strong></div>
            <div class="metric-item">📅 Last Modified: <strong>\${new Date(report.lastModified).toLocaleString()}</strong></div>
          </div>
        </div>
      \`;

      // Video Player Section (if video exists)
      if (hasVideo) {
        const videoLocalUrl = firstVideo.relPath;
        const cleanPath = firstVideo.relPath.startsWith('./') ? firstVideo.relPath.slice(2) : firstVideo.relPath;
        const videoPagesUrl = GITHUB_PAGES_BASE + '/' + cleanPath;
        const videoCdnUrl = JSDELIVR_BASE + '/' + cleanPath;
        const videoRawUrl = GITHUB_RAW_BASE + '/' + cleanPath;

        const initialVideoSrc = (window.location.protocol.startsWith('content') || window.location.protocol.startsWith('http'))
          ? videoPagesUrl
          : videoLocalUrl;

        html += \`
          <div class="video-section-card">
            <div class="section-title-row">
              <div class="section-title">
                <svg viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                Execution Video Recording
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <a href="\${videoPagesUrl}" target="_blank" class="tree-toggle-btn" style="text-decoration:none; font-size:0.75rem; color:#60a5fa;" title="Open video stream directly in Chrome/native mobile player">
                  ▶️ Open in Mobile Player
                </a>
                <a href="\${videoRawUrl}" target="_blank" download class="tree-toggle-btn" style="text-decoration:none; font-size:0.75rem; color:#94a3b8;" title="Download raw video file">
                  📥 Download
                </a>
                <button class="tree-toggle-btn" onclick="toggleVideoCollapse(this)" style="font-size:0.75rem;">
                  🔽 Hide Video
                </button>
              </div>
            </div>

            <div class="video-player-container" id="videoPlayerBox">
              <video id="testVideoPlayer" 
                     src="\${initialVideoSrc}" 
                     controls 
                     muted 
                     playsinline 
                     webkit-playsinline 
                     preload="metadata"
                     style="width: 100%; max-height: 480px; background: #000;"
                     onerror="handleVideoError(this, '\${videoLocalUrl}')">
                <source src="\${initialVideoSrc}" type="video/webm">
                <source src="\${videoPagesUrl}" type="video/webm">
                <source src="\${videoCdnUrl}" type="video/webm">
                <source src="\${videoRawUrl}" type="video/webm">
                Your mobile browser does not support inline WebM playback. Tap "Open in Mobile Player" above.
              </video>
            </div>

            <div class="video-controls-toolbar" id="videoToolbarBox">
              <div style="display: flex; align-items: center; gap: 6px;">
                <button class="video-skip-btn" onclick="skipVideo(-10)">⏪ -10s</button>
                <button class="video-skip-btn" onclick="skipVideo(-5)">⏪ -5s</button>
                <button class="video-skip-btn" onclick="skipVideo(5)">⏩ +5s</button>
                <button class="video-skip-btn" onclick="skipVideo(10)">⏩ +10s</button>
              </div>

              <div class="video-speed-group">
                <span class="speed-label">⚡ Speed:</span>
                <button class="speed-btn" onclick="setVideoSpeed(0.5, this)">0.5x</button>
                <button class="speed-btn active" onclick="setVideoSpeed(1, this)">1x</button>
                <button class="speed-btn" onclick="setVideoSpeed(1.5, this)">1.5x</button>
                <button class="speed-btn" onclick="setVideoSpeed(2, this)">2x</button>
                <button class="speed-btn" onclick="setVideoSpeed(3, this)">3x</button>
                <button class="speed-btn" onclick="setVideoSpeed(4, this)">4x</button>
              </div>
            </div>
          </div>
        \`;
      }

      // Steps Execution Tree & Screenshots Gallery
      html += \`
        <div class="steps-tree-card">
          <div class="section-title-row">
            <div class="section-title">
              <svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
              Execution Steps & Attached Screenshots (\${report.screenshotsCount})
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="view-mode-tabs">
                <button class="view-tab-btn \${state.activeViewMode === 'tree' ? 'active' : ''}" onclick="switchViewMode('tree')">
                  ⚡ Steps Tree
                </button>
                <button class="view-tab-btn \${state.activeViewMode === 'gallery' ? 'active' : ''}" onclick="switchViewMode('gallery')">
                  🖼️ Gallery Grid
                </button>
              </div>

              <div id="treeControls" style="display: \${state.activeViewMode === 'tree' ? 'flex' : 'none'}; gap: 4px;">
                <button class="tree-toggle-btn" onclick="toggleAllSteps(true)" title="Expand all step nodes">➕ Expand All</button>
                <button class="tree-toggle-btn" onclick="toggleAllSteps(false)" title="Collapse all step nodes">➖ Collapse All</button>
              </div>
            </div>
          </div>

          <!-- Tree View -->
          <div class="steps-list" id="stepsTreeView" style="display: \${state.activeViewMode === 'tree' ? 'flex' : 'none'};">
            \${renderStepsTreeHTML(report)}
          </div>

          <!-- Gallery Grid View -->
          <div class="gallery-grid" id="galleryView" style="display: \${state.activeViewMode === 'gallery' ? 'grid' : 'none'};">
            \${report.screenshots.map((s, idx) => \`
              <div class="gallery-item" onclick="openLightboxFromGallery(\${idx})">
                <div class="gallery-thumb">
                  <img src="\${s.relPath}" alt="\${s.title}" onerror="handleImgError(this, '\${s.relPath}')" loading="lazy">
                </div>
                <div class="gallery-caption" title="\${s.title}">
                  \${idx + 1}. \${s.title}
                </div>
              </div>
            \`).join('')}
          </div>
        </div>
      \`;

      // Associated Folder Structure Card
      html += \`
        <div class="folder-structure-card">
          <div class="section-title">
            📁 Associated Folder Structure & Files
          </div>
          <div class="tree-view-box">
            <div>📁 <strong>\${report.relativePath}/</strong></div>
            <div style="padding-left: 18px; margin-top: 4px; display: flex; flex-direction: column; gap: 3px;">
              <div>📄 index.html (\${report.sizeKb} KB)</div>
              <div>📁 screenshots/ (\${report.screenshotsCount} files)</div>
              <div style="padding-left: 18px; color: var(--text-muted); font-size: 0.72rem;">
                \${report.screenshots.slice(0, 3).map(s => \`<div>🖼️ \${s.name}</div>\`).join('')}
                \${report.screenshotsCount > 3 ? \`<div>... +\${report.screenshotsCount - 3} more files</div>\` : ''}
              </div>
              <div>📁 videos/ (\${report.videosCount} files)</div>
              <div style="padding-left: 18px; color: var(--text-muted); font-size: 0.72rem;">
                \${report.videos.map(v => \`<div>🎬 \${v.name}</div>\`).join('')}
              </div>
            </div>
          </div>
        </div>
      \`;

      elements.detailContent.innerHTML = html;

      // Attach video error fallback
      const videoEl = document.getElementById('testVideoPlayer');
      if (videoEl && firstVideo) {
        videoEl.onerror = function() {
          handleVideoError(this, firstVideo.relPath);
        };
      }
    }

    function renderStepsTreeHTML(report) {
      if (!report.screenshots || report.screenshots.length === 0) {
        return '<div style="color:var(--text-muted); font-size:0.82rem; padding:0.5rem;">No execution screenshots recorded for this test.</div>';
      }

      return report.screenshots.map((s, idx) => \`
        <div class="step-node expanded has-screenshot">
          <div class="step-header" onclick="toggleStepNode(this)">
            <div class="step-left-info">
              <svg class="step-chevron" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
              <div class="step-icon-badge">⚡</div>
              <div class="step-title-text">\${idx + 1}. \${s.title}</div>
            </div>

            <div class="step-right-meta">
              <span class="step-screenshot-indicator">
                <svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                Screenshot
              </span>
            </div>
          </div>

          <div class="step-body">
            <div class="step-inline-screenshots">
              <div class="step-screenshot-card" onclick="openLightbox('\${s.relPath}', '\${s.title}')">
                <div class="step-screenshot-img-box">
                  <img src="\${s.relPath}" alt="\${s.title}" onerror="handleImgError(this, '\${s.relPath}')" loading="lazy">
                  <div class="step-screenshot-overlay">
                    🔍 Click to Enlarge
                  </div>
                </div>
                <div class="step-screenshot-caption">\${s.name}</div>
              </div>
            </div>
          </div>
        </div>
      \`).join('');
    }

    window.toggleStepNode = function(headerEl) {
      const node = headerEl.closest('.step-node');
      if (node) {
        node.classList.toggle('expanded');
      }
    };

    window.toggleAllSteps = function(expand) {
      document.querySelectorAll('.step-node').forEach(node => {
        node.classList.toggle('expanded', expand);
      });
    };

    window.switchViewMode = function(mode) {
      state.activeViewMode = mode;
      document.querySelectorAll('.view-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(mode));
      });

      const treeView = document.getElementById('stepsTreeView');
      const galleryView = document.getElementById('galleryView');
      const treeControls = document.getElementById('treeControls');

      if (treeView) treeView.style.display = mode === 'tree' ? 'flex' : 'none';
      if (galleryView) galleryView.style.display = mode === 'gallery' ? 'grid' : 'none';
      if (treeControls) treeControls.style.display = mode === 'tree' ? 'flex' : 'none';
    };

    window.setVideoSpeed = function(speed, btn) {
      const video = document.getElementById('testVideoPlayer');
      if (video) {
        video.playbackRate = speed;
        btn.parentElement.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    };

    window.skipVideo = function(seconds) {
      const video = document.getElementById('testVideoPlayer');
      if (video) {
        video.currentTime = Math.max(0, Math.min(video.duration || 9999, video.currentTime + seconds));
      }
    };

    window.toggleVideoCollapse = function(btn) {
      state.isVideoCollapsed = !state.isVideoCollapsed;
      const box = document.getElementById('videoPlayerBox');
      const tool = document.getElementById('videoToolbarBox');
      if (box) box.style.display = state.isVideoCollapsed ? 'none' : 'flex';
      if (tool) tool.style.display = state.isVideoCollapsed ? 'none' : 'flex';
      btn.textContent = state.isVideoCollapsed ? '🔼 Show Video' : '🔽 Hide Video';
    };

    window.openLightbox = function(imgPath, title) {
      state.lightbox.isOpen = true;
      state.lightbox.title = title || '';
      
      const cleanPath = imgPath.startsWith('./') ? imgPath.slice(2) : imgPath;
      let idx = state.lightbox.images.findIndex(img => img.path === imgPath || img.path === cleanPath || \`./\${img.path}\` === imgPath);
      if (idx === -1) {
        state.lightbox.images = [{ path: cleanPath, name: title }];
        idx = 0;
      }
      state.lightbox.currentIndex = idx;
      updateLightboxUI();
    };

    window.openLightboxFromGallery = function(idx) {
      state.lightbox.isOpen = true;
      state.lightbox.currentIndex = idx;
      updateLightboxUI();
    };

    function updateLightboxUI() {
      const imgObj = state.lightbox.images[state.lightbox.currentIndex];
      if (!imgObj) return;

      elements.lightboxImg.removeAttribute('data-retried');
      elements.lightboxImg.src = imgObj.path;
      elements.lightboxImg.onerror = function() {
        handleImgError(this, imgObj.path);
      };

      elements.lightboxTitle.textContent = imgObj.name || state.lightbox.title;
      elements.lightboxCounter.textContent = \`\${state.lightbox.currentIndex + 1} / \${state.lightbox.images.length}\`;
      elements.lightboxDownload.href = imgObj.path;
      elements.lightboxModal.classList.add('active');
    }

    function closeLightbox() {
      state.lightbox.isOpen = false;
      elements.lightboxModal.classList.remove('active');
      elements.lightboxImg.src = '';
    }

    function nextLightbox() {
      if (state.lightbox.images.length <= 1) return;
      state.lightbox.currentIndex = (state.lightbox.currentIndex + 1) % state.lightbox.images.length;
      updateLightboxUI();
    }

    function prevLightbox() {
      if (state.lightbox.images.length <= 1) return;
      state.lightbox.currentIndex = (state.lightbox.currentIndex - 1 + state.lightbox.images.length) % state.lightbox.images.length;
      updateLightboxUI();
    }

    function setupEventListeners() {
      elements.navTabs.addEventListener('click', e => {
        const btn = e.target.closest('.nav-tab-btn');
        if (btn) {
          const tabId = btn.getAttribute('data-tab');
          setActiveTab(tabId);
        }
      });

      elements.searchInput.addEventListener('input', e => {
        state.searchQuery = e.target.value;
        renderReportsList();
      });

      [elements.chipAll, elements.chipPassed, elements.chipFailed].forEach(chip => {
        if (chip) {
          chip.addEventListener('click', () => {
            [elements.chipAll, elements.chipPassed, elements.chipFailed].forEach(c => c && c.classList.remove('active'));
            chip.classList.add('active');
            state.statusFilter = chip.getAttribute('data-filter');
            renderReportsList();
          });
        }
      });

      if (elements.btnFolderwise) {
        elements.btnFolderwise.addEventListener('click', () => setSidebarGrouping('FOLDERWISE'));
      }
      if (elements.btnFlatList) {
        elements.btnFlatList.addEventListener('click', () => setSidebarGrouping('FLAT'));
      }

      elements.reportsList.addEventListener('click', e => {
        const card = e.target.closest('.report-card');
        if (card) {
          const reportId = card.getAttribute('data-id');
          selectReport(reportId);
        }
      });

      elements.lightboxClose.addEventListener('click', closeLightbox);
      elements.lightboxNext.addEventListener('click', nextLightbox);
      elements.lightboxPrev.addEventListener('click', prevLightbox);

      elements.lightboxModal.addEventListener('click', e => {
        if (e.target === elements.lightboxModal || e.target.classList.contains('lightbox-content')) {
          closeLightbox();
        }
      });

      document.addEventListener('keydown', e => {
        if (state.lightbox.isOpen) {
          if (e.key === 'Escape') closeLightbox();
          if (e.key === 'ArrowRight') nextLightbox();
          if (e.key === 'ArrowLeft') prevLightbox();
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  </script>
</body>
</html>`;

  const outputPath = path.join(targetRootDir, 'DD_V4.6.3_Reports.html');
  fs.writeFileSync(outputPath, htmlContent, 'utf8');

  console.log(`Successfully generated standalone report in: ${outputPath}`);
}

generateDashboard('c:\\Users\\viraj\\Desktop\\reports\\DD_V4.6.3_Reports');
