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
            relPath: `${relPath}/screenshots/${f}`
          }));
        } catch (e) {}
      }

      const vidDir = path.join(dir, 'videos');
      if (fs.existsSync(vidDir)) {
        try {
          const vidFiles = fs.readdirSync(vidDir).filter(f => /\.(webm|mp4|mov)$/i.test(f));
          videos = vidFiles.map(f => ({
            name: f,
            relPath: `${relPath}/videos/${f}`
          }));
        } catch (e) {}
      }

      const dataDir = path.join(dir, 'data');
      if (fs.existsSync(dataDir)) {
        try {
          const df = fs.readdirSync(dataDir);
          dataFiles = df.slice(0, 15).map(f => ({
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
        module: moduleName,
        name: reportName,
        title: formatTitle(reportName, moduleName, cat),
        relativePath: relPath,
        url: `${relPath}/index.html`,
        githubReportUrl: `${GITHUB_PAGES_BASE}/${relPath}/index.html`,
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
  const categories = [...new Set(allReports.map(r => r.category))];

  const reportsJson = JSON.stringify(allReports);
  const generatedDate = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' });

  const htmlContent = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DealsDray V4.6.3 — Master Automation Test Reports</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #0a0e17;
      --bg-sidebar: #0f172a;
      --bg-panel: #111827;
      --bg-card: rgba(30, 41, 59, 0.5);
      --bg-card-hover: rgba(30, 41, 59, 0.9);
      --bg-input: #1e293b;
      --border-color: rgba(255, 255, 255, 0.08);
      --border-focus: rgba(99, 102, 241, 0.5);
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --accent-primary: #6366f1;
      --accent-gradient: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
      --accent-glow: rgba(99, 102, 241, 0.25);
      --success: #10b981;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
      --shadow-md: 0 8px 30px rgba(0, 0, 0, 0.4);
      --transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    [data-theme="light"] {
      --bg-base: #f1f5f9;
      --bg-sidebar: #ffffff;
      --bg-panel: #f8fafc;
      --bg-card: rgba(255, 255, 255, 0.8);
      --bg-card-hover: #ffffff;
      --bg-input: #e2e8f0;
      --border-color: rgba(0, 0, 0, 0.08);
      --border-focus: rgba(99, 102, 241, 0.5);
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-muted: #94a3b8;
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 8px 30px rgba(0, 0, 0, 0.08);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: var(--bg-base);
      color: var(--text-primary);
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Top Navigation Bar */
    .topbar {
      height: 60px;
      background: var(--bg-sidebar);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      flex-shrink: 0;
      z-index: 100;
    }

    .topbar-brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .brand-logo {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-sm);
      background: var(--accent-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 1.15rem;
      color: #fff;
      box-shadow: 0 2px 10px var(--accent-glow);
    }

    .brand-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.2rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .version-badge {
      font-size: 0.72rem;
      padding: 0.15rem 0.55rem;
      border-radius: 9999px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: var(--accent-primary);
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
    }

    .topbar-metrics {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      font-size: 0.85rem;
    }

    .metric-pill {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.75rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 9999px;
      color: var(--text-secondary);
    }

    .metric-pill strong {
      color: var(--text-primary);
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-icon {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      text-decoration: none;
      transition: var(--transition);
      font-size: 1rem;
    }

    .btn-icon:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-focus);
    }

    /* Main Split-Pane Workspace */
    .app-workspace {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* ── LEFT PANEL (Reports List & Filter) ── */
    .left-sidebar {
      width: 400px;
      min-width: 340px;
      max-width: 480px;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      overflow: hidden;
    }

    .sidebar-header {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .search-box {
      position: relative;
    }

    .search-box input {
      width: 100%;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.6rem 0.85rem 0.6rem 2.25rem;
      color: var(--text-primary);
      font-size: 0.88rem;
      outline: none;
      transition: var(--transition);
      font-family: inherit;
    }

    .search-box input:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 2px var(--accent-glow);
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .category-filter-bar {
      display: flex;
      gap: 0.4rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
    }

    .cat-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 0.4rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition);
    }

    .cat-btn:hover {
      background: var(--bg-card);
      color: var(--text-primary);
    }

    .cat-btn.active {
      background: var(--accent-primary);
      color: #fff;
      border-color: var(--accent-primary);
    }

    .reports-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .report-item {
      padding: 0.75rem 0.85rem;
      background: var(--bg-card);
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .report-item:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-color);
    }

    .report-item.active {
      background: rgba(99, 102, 241, 0.15);
      border-color: var(--accent-primary);
    }

    .report-item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .category-tag {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
    }

    .cat-CMT { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .cat-orderFulFilmentChecklist { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
    .cat-orderFulfilment { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .cat-superadmin { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }

    .report-item-title {
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.25;
    }

    .report-item-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }

    /* ── RIGHT PANEL (Steps Tree, Folder Structure & Inspector) ── */
    .right-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-panel);
      overflow-y: auto;
    }

    .report-detail-header {
      padding: 1.25rem 1.75rem;
      background: var(--bg-sidebar);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .report-title-area h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.45rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .report-path-breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }

    .header-action-btns {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: var(--transition);
      border: 1px solid transparent;
      font-family: inherit;
    }

    .btn-action-primary {
      background: var(--accent-gradient);
      color: #fff;
    }

    .btn-action-primary:hover {
      box-shadow: 0 4px 15px var(--accent-glow);
    }

    /* Two Column Inspector Layout */
    .inspector-body {
      display: grid;
      grid-template-columns: 320px 1fr;
      flex: 1;
      min-height: 0;
    }

    .tree-column {
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding: 1rem;
      gap: 1.25rem;
    }

    .section-heading {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      margin-bottom: 0.6rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .folder-tree-box {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
    }

    .tree-node {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.4rem;
      border-radius: 4px;
      color: var(--text-secondary);
    }

    .tree-node.node-dir {
      font-weight: 600;
      color: var(--text-primary);
    }

    .tree-indent {
      padding-left: 1.2rem;
    }

    .steps-timeline {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .step-node {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.55rem 0.75rem;
      background: var(--bg-card);
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
    }

    .step-node:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-color);
    }

    .step-node.active {
      background: rgba(99, 102, 241, 0.2);
      border-color: var(--accent-primary);
      color: #fff;
    }

    .step-badge {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      font-size: 0.72rem;
      font-family: 'JetBrains Mono', monospace;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-weight: 700;
    }

    .step-node.active .step-badge {
      background: var(--accent-primary);
      color: #fff;
    }

    .step-name-text {
      font-size: 0.82rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Right Preview Stage */
    .preview-stage {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      overflow-y: auto;
    }

    .stage-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }

    .stage-tab-btn {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .stage-tab-btn.active {
      background: var(--accent-primary);
      color: #fff;
      border-color: var(--accent-primary);
    }

    .viewer-panel {
      display: none;
      flex-direction: column;
      gap: 1rem;
    }

    .viewer-panel.active {
      display: flex;
    }

    .screenshot-viewer-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .viewer-card-header {
      padding: 0.85rem 1.25rem;
      background: var(--bg-sidebar);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
    }

    .viewer-main-img-box {
      width: 100%;
      min-height: 480px;
      max-height: 68vh;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .viewer-main-img-box img {
      max-width: 100%;
      max-height: 68vh;
      object-fit: contain;
    }

    .stage-nav-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.65);
      border: 1px solid var(--border-color);
      color: #fff;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.2rem;
      transition: var(--transition);
    }

    .stage-nav-arrow:hover {
      background: var(--accent-primary);
    }

    .stage-arrow-prev { left: 1rem; }
    .stage-arrow-next { right: 1rem; }

    .video-viewer-card {
      background: #000;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
      max-height: 75vh;
    }

    .video-viewer-card video {
      width: 100%;
      max-height: 75vh;
      display: block;
    }

    .thumb-filmstrip {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding: 0.5rem 0;
    }

    .strip-item {
      width: 90px;
      height: 56px;
      border-radius: 4px;
      overflow: hidden;
      border: 2px solid transparent;
      cursor: pointer;
      opacity: 0.6;
      flex-shrink: 0;
      transition: var(--transition);
      background: #000;
    }

    .strip-item.active, .strip-item:hover {
      opacity: 1;
      border-color: var(--accent-primary);
      transform: scale(1.04);
    }

    .strip-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    @media (max-width: 992px) {
      .app-workspace { flex-direction: column; }
      .left-sidebar { width: 100%; max-width: 100%; height: 280px; }
      .inspector-body { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

  <!-- Top Navbar -->
  <header class="topbar">
    <div class="topbar-brand">
      <div class="brand-logo">DD</div>
      <div class="brand-title">
        DealsDray Automation Portal <span class="version-badge">v4.6.3 UAT</span>
      </div>
    </div>

    <div class="topbar-metrics">
      <div class="metric-pill">📑 <strong>${allReports.length}</strong> Reports</div>
      <div class="metric-pill">📸 <strong>${totalScreenshots.toLocaleString()}</strong> Steps</div>
      <div class="metric-pill">🎬 <strong>${totalVideos}</strong> Videos</div>
    </div>

    <div class="topbar-actions">
      <a href="${GITHUB_REPO_URL}" target="_blank" class="btn-icon" title="View GitHub Repo">📦</a>
      <button class="btn-icon" id="themeToggle" title="Toggle Theme">🌙</button>
    </div>
  </header>

  <!-- Split View Layout -->
  <div class="app-workspace">
    
    <!-- ── LEFT HAND SIDE: Reports Explorer & Filters ── -->
    <aside class="left-sidebar">
      <div class="sidebar-header">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="searchInput" placeholder="Search test cases or modules...">
        </div>
        
        <!-- Category Filter Tabs (Folders) -->
        <div class="category-filter-bar">
          ${categories.map((c, i) => `
            <button class="cat-btn ${i === 0 ? 'active' : ''}" data-cat="${c}">
              ${formatCategoryLabel(c)} (${allReports.filter(r => r.category === c).length})
            </button>
          `).join('')}
        </div>
      </div>

      <div class="reports-list" id="reportsList"></div>
    </aside>

    <!-- ── RIGHT HAND SIDE: Steps Tree, Folder Structure & Detailed Preview ── -->
    <main class="right-content">
      
      <!-- Top Detail Header -->
      <div class="report-detail-header">
        <div class="report-title-area">
          <h2 id="detailTitle">Select a Test Case</h2>
          <div class="report-path-breadcrumb" id="detailBreadcrumb">
            📂 DealsDray_Reports
          </div>
        </div>

        <div class="header-action-btns">
          <a id="btnOpenReport" href="#" target="_blank" class="btn-action btn-action-primary">
            🚀 Open Playwright Report
          </a>
        </div>
      </div>

      <!-- Main Inspector Split -->
      <div class="inspector-body">
        
        <!-- Left Sub-column: Folder Structure & Step Tree -->
        <div class="tree-column">
          
          <!-- Folder Structure Node Explorer -->
          <div>
            <div class="section-heading">
              <span>📁 Associated Folder Structure</span>
            </div>
            <div class="folder-tree-box" id="folderTreeBox"></div>
          </div>

          <!-- Execution Steps Tree -->
          <div>
            <div class="section-heading">
              <span>⚡ Execution Steps Tree (<span id="stepsCountBadge">0</span>)</span>
            </div>
            <div class="steps-timeline" id="stepsTimeline"></div>
          </div>
        </div>

        <!-- Right Sub-column: Interactive Stage Viewer -->
        <div class="preview-stage">
          
          <!-- View Navigation Tabs -->
          <div class="stage-nav">
            <button class="stage-tab-btn active" id="tabScreenshots" onclick="setStageTab('screenshots')">
              📸 Screenshot Inspector
            </button>
            <button class="stage-tab-btn" id="tabVideo" onclick="setStageTab('video')">
              🎬 Video Recording (<span id="videoTabBadge">1</span>)
            </button>
          </div>

          <!-- Screenshot Viewer Panel -->
          <div class="viewer-panel active" id="panelScreenshots">
            <div class="screenshot-viewer-card">
              <div class="viewer-card-header">
                <div>
                  <strong id="viewerStepTitle">Step Title</strong>
                </div>
                <div style="font-family: 'JetBrains Mono', monospace; color: var(--text-muted);" id="viewerStepCounter">
                  1 / 1
                </div>
              </div>
              <div class="viewer-main-img-box">
                <button class="stage-nav-arrow stage-arrow-prev" onclick="navStep(-1)">&larr;</button>
                <img id="mainStepImg" src="" alt="Test Step Screenshot">
                <button class="stage-nav-arrow stage-arrow-next" onclick="navStep(1)">&rarr;</button>
              </div>
            </div>

            <!-- Thumbnail Strip -->
            <div class="thumb-filmstrip" id="thumbFilmstrip"></div>
          </div>

          <!-- Video Viewer Panel -->
          <div class="viewer-panel" id="panelVideo">
            <div class="video-viewer-card">
              <video id="stageVideoPlayer" controls autoplay loop playsinline>
                <source id="stageVideoSource" src="" type="video/webm">
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

        </div>

      </div>

    </main>

  </div>

  <script>
    const ALL_REPORTS = ${reportsJson};
    const GITHUB_RAW_BASE = '${GITHUB_RAW_BASE}';

    let activeCategory = '${categories[0]}';
    let selectedReport = ALL_REPORTS.find(r => r.category === activeCategory) || ALL_REPORTS[0];
    let selectedStepIdx = 0;
    let searchQuery = '';
    let stageTab = 'screenshots';

    document.addEventListener('DOMContentLoaded', () => {
      initTheme();
      renderReportsList();
      if (selectedReport) {
        selectReport(selectedReport.id);
      }

      document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderReportsList();
      });

      document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeCategory = btn.getAttribute('data-cat');
          renderReportsList();

          const firstInCat = ALL_REPORTS.find(r => r.category === activeCategory);
          if (firstInCat) {
            selectReport(firstInCat.id);
          }
        });
      });

      document.getElementById('themeToggle').addEventListener('click', toggleTheme);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') navStep(-1);
        if (e.key === 'ArrowRight') navStep(1);
      });
    });

    function getFilteredReports() {
      return ALL_REPORTS.filter(r => {
        const matchCat = r.category === activeCategory;
        const matchSearch = !searchQuery || 
          r.name.toLowerCase().includes(searchQuery) ||
          r.title.toLowerCase().includes(searchQuery) ||
          r.module.toLowerCase().includes(searchQuery) ||
          r.category.toLowerCase().includes(searchQuery);
        return matchCat && matchSearch;
      });
    }

    function renderReportsList() {
      const container = document.getElementById('reportsList');
      const filtered = getFilteredReports();

      if (filtered.length === 0) {
        container.innerHTML = '<div style="padding:2rem 1rem; text-align:center; color:var(--text-muted);">No reports found in this folder</div>';
        return;
      }

      container.innerHTML = filtered.map(r => \`
        <div class="report-item \${selectedReport && selectedReport.id === r.id ? 'active' : ''}" onclick="selectReport('\${r.id}')">
          <div class="report-item-header">
            <span class="category-tag cat-\${r.category}">\${r.category}</span>
            <span style="color:var(--success); font-size:0.72rem; font-weight:600;">● Passed</span>
          </div>
          <div class="report-item-title">\${r.title}</div>
          <div class="report-item-meta">
            <span>📦 \${r.module}</span>
            <span>📸 \${r.screenshotsCount} SS</span>
            <span>🎥 \${r.videosCount}</span>
          </div>
        </div>
      \`).join('');
    }

    function selectReport(reportId) {
      selectedReport = ALL_REPORTS.find(r => r.id === reportId);
      if (!selectedReport) return;
      selectedStepIdx = 0;

      document.querySelectorAll('.report-item').forEach(el => el.classList.remove('active'));
      const activeEl = document.querySelector(\`.report-item[onclick="selectReport('\${reportId}')"]\`);
      if (activeEl) activeEl.classList.add('active');

      document.getElementById('detailTitle').textContent = selectedReport.title;
      document.getElementById('detailBreadcrumb').textContent = \`📂 \${selectedReport.relativePath}\`;
      document.getElementById('btnOpenReport').href = selectedReport.url;

      renderFolderTree(selectedReport);
      renderStepsTree(selectedReport);
      updateStageView();
    }

    function renderFolderTree(report) {
      const box = document.getElementById('folderTreeBox');
      const parts = report.relativePath.split('/');
      const folderName = parts[parts.length - 1];

      let html = \`
        <div class="tree-node node-dir">📁 \${folderName}/</div>
        <div class="tree-indent">
          <div class="tree-node">📄 index.html (\${report.sizeKb} KB)</div>
          <div class="tree-node node-dir">📁 screenshots/ (\${report.screenshotsCount} files)</div>
          <div class="tree-indent">
            \${report.screenshots.slice(0, 3).map(s => \`<div class="tree-node">🖼️ \${s.name}</div>\`).join('')}
            \${report.screenshotsCount > 3 ? \`<div class="tree-node" style="color:var(--text-muted);">... +\${report.screenshotsCount - 3} more files</div>\` : ''}
          </div>
          <div class="tree-node node-dir">📁 videos/ (\${report.videosCount} files)</div>
          <div class="tree-indent">
            \${report.videos.map(v => \`<div class="tree-node">🎬 \${v.name}</div>\`).join('')}
          </div>
        </div>
      \`;
      box.innerHTML = html;
    }

    function renderStepsTree(report) {
      const timeline = document.getElementById('stepsTimeline');
      document.getElementById('stepsCountBadge').textContent = report.screenshotsCount;

      if (report.screenshots.length === 0) {
        timeline.innerHTML = '<div style="color:var(--text-muted); font-size:0.8rem; padding:0.5rem;">No screenshots recorded</div>';
        return;
      }

      timeline.innerHTML = report.screenshots.map((s, idx) => \`
        <div class="step-node \${idx === selectedStepIdx ? 'active' : ''}" onclick="selectStep(\${idx})">
          <span class="step-badge">\${idx + 1}</span>
          <span class="step-name-text" title="\${s.title}">\${s.title}</span>
        </div>
      \`).join('');
    }

    function selectStep(idx) {
      selectedStepIdx = idx;
      document.querySelectorAll('.step-node').forEach((node, i) => {
        node.classList.toggle('active', i === idx);
      });
      updateStageView();
    }

    function updateStageView() {
      if (!selectedReport || selectedReport.screenshots.length === 0) return;

      const currentStep = selectedReport.screenshots[selectedStepIdx];
      const img = document.getElementById('mainStepImg');
      
      img.src = currentStep.relPath;
      img.onerror = () => {
        if (!img.getAttribute('data-retried')) {
          img.setAttribute('data-retried', '1');
          img.src = GITHUB_RAW_BASE + '/' + currentStep.relPath;
        }
      };

      document.getElementById('viewerStepTitle').textContent = \`Step \${selectedStepIdx + 1}: \${currentStep.title}\`;
      document.getElementById('viewerStepCounter').textContent = \`\${selectedStepIdx + 1} of \${selectedReport.screenshots.length} (\${currentStep.name})\`;

      const strip = document.getElementById('thumbFilmstrip');
      strip.innerHTML = selectedReport.screenshots.map((s, idx) => \`
        <div class="strip-item \${idx === selectedStepIdx ? 'active' : ''}" onclick="selectStep(\${idx})">
          <img src="\${s.relPath}" alt="Step \${idx + 1}" onerror="this.src='\${GITHUB_RAW_BASE}/\${s.relPath}'" loading="lazy">
        </div>
      \`).join('');

      const videoPlayer = document.getElementById('stageVideoPlayer');
      const videoBadge = document.getElementById('videoTabBadge');
      videoBadge.textContent = selectedReport.videosCount;

      if (selectedReport.videos.length > 0) {
        videoPlayer.src = selectedReport.videos[0].relPath;
      } else {
        videoPlayer.src = '';
      }
    }

    function navStep(delta) {
      if (!selectedReport || selectedReport.screenshots.length === 0) return;
      const count = selectedReport.screenshots.length;
      selectedStepIdx = (selectedStepIdx + delta + count) % count;
      selectStep(selectedStepIdx);
    }

    function setStageTab(tab) {
      stageTab = tab;
      document.getElementById('tabScreenshots').classList.toggle('active', tab === 'screenshots');
      document.getElementById('tabVideo').classList.toggle('active', tab === 'video');
      document.getElementById('panelScreenshots').classList.toggle('active', tab === 'screenshots');
      document.getElementById('panelVideo').classList.toggle('active', tab === 'video');

      const videoPlayer = document.getElementById('stageVideoPlayer');
      if (tab === 'video' && selectedReport && selectedReport.videos.length > 0) {
        videoPlayer.play().catch(() => {});
      } else {
        videoPlayer.pause();
      }
    }

    function initTheme() {
      const savedTheme = localStorage.getItem('dd_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
      document.getElementById('themeToggle').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    }

    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('dd_theme', next);
      document.getElementById('themeToggle').textContent = next === 'dark' ? '🌙' : '☀️';
    }
  </script>
</body>
</html>`;

  const outputPath = path.join(targetRootDir, 'index.html');
  fs.writeFileSync(outputPath, htmlContent, 'utf8');
  console.log(`Updated Dashboard: ${outputPath}`);
}

generateDashboard('c:\\Users\\viraj\\Desktop\\reports\\DD_V4.6.3_Reports');
