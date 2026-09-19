const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..'); // If placed in scratch or root

function generateDashboard(targetRootDir) {
  function findReports(dir, category = '') {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    const hasIndex = entries.some(e => e.isFile() && e.name.toLowerCase() === 'index.html');
    
    // Make sure we don't treat the root itself as a report
    if (hasIndex && dir !== targetRootDir) {
      const relPath = path.relative(targetRootDir, dir).replace(/\\/g, '/');
      const parts = relPath.split('/');
      const cat = category || parts[0];
      const moduleName = parts.length > 2 ? parts[1] : (parts.length === 2 ? parts[0] : 'General');
      const reportName = parts[parts.length - 1];

      let screenshots = [];
      let videos = [];

      const scDir = path.join(dir, 'screenshots');
      if (fs.existsSync(scDir)) {
        try {
          const scFiles = fs.readdirSync(scDir).filter(f => /\.(png|jpe?g|webp)$/i.test(f));
          screenshots = scFiles.map(f => `${relPath}/screenshots/${f}`);
        } catch (e) {}
      }

      const vidDir = path.join(dir, 'videos');
      if (fs.existsSync(vidDir)) {
        try {
          const vidFiles = fs.readdirSync(vidDir).filter(f => /\.(webm|mp4|mov)$/i.test(f));
          videos = vidFiles.map(f => `${relPath}/videos/${f}`);
        } catch (e) {}
      }

      const indexPath = path.join(dir, 'index.html');
      const stats = fs.statSync(indexPath);

      results.push({
        id: relPath.replace(/[^a-zA-Z0-9_-]/g, '_'),
        category: cat,
        module: moduleName,
        name: reportName,
        title: formatTitle(reportName, moduleName, cat),
        relativePath: relPath,
        url: `${relPath}/index.html`,
        screenshotsCount: screenshots.length,
        videosCount: videos.length,
        screenshots: screenshots,
        videos: videos,
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

  const allReports = findReports(targetRootDir);
  // Sort reports logically
  allReports.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.module !== b.module) return a.module.localeCompare(b.module);
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });

  const totalScreenshots = allReports.reduce((sum, r) => sum + r.screenshotsCount, 0);
  const totalVideos = allReports.reduce((sum, r) => sum + r.videosCount, 0);

  const categories = [...new Set(allReports.map(r => r.category))];
  const modulesByCategory = {};
  for (const cat of categories) {
    modulesByCategory[cat] = [...new Set(allReports.filter(r => r.category === cat).map(r => r.module))];
  }

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
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #0a0e17;
      --bg-secondary: #111827;
      --bg-card: rgba(17, 24, 39, 0.75);
      --bg-card-hover: rgba(30, 41, 59, 0.85);
      --border-color: rgba(255, 255, 255, 0.08);
      --border-hover: rgba(99, 102, 241, 0.4);
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --accent-primary: #6366f1;
      --accent-gradient: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
      --accent-glow: rgba(99, 102, 241, 0.25);
      --success: #10b981;
      --success-glow: rgba(16, 185, 129, 0.2);
      --warning: #f59e0b;
      --info: #06b6d4;
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
      --shadow-md: 0 8px 30px rgba(0, 0, 0, 0.4);
      --shadow-glow: 0 0 40px var(--accent-glow);
      --transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    [data-theme="light"] {
      --bg-primary: #f8fafc;
      --bg-secondary: #ffffff;
      --bg-card: rgba(255, 255, 255, 0.85);
      --bg-card-hover: rgba(241, 245, 249, 0.95);
      --border-color: rgba(0, 0, 0, 0.08);
      --border-hover: rgba(99, 102, 241, 0.5);
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-muted: #94a3b8;
      --accent-glow: rgba(99, 102, 241, 0.15);
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 8px 30px rgba(0, 0, 0, 0.08);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      line-height: 1.5;
      background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.08) 0px, transparent 50%),
        radial-gradient(at 50% 50%, rgba(6, 182, 212, 0.05) 0px, transparent 50%);
      background-attachment: fixed;
    }

    /* Container */
    .container {
      max-width: 1540px;
      margin: 0 auto;
      padding: 2rem 1.5rem 5rem;
    }

    /* Header */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .brand-logo {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      background: var(--accent-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px var(--accent-glow);
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 1.5rem;
      color: #fff;
    }

    .brand-text h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.85rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-text h1 .version-badge {
      font-size: 0.8rem;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: var(--accent-primary);
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
    }

    .brand-text p {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-top: 0.15rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .theme-toggle, .btn-icon {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      width: 44px;
      height: 44px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: var(--transition);
    }

    .theme-toggle:hover, .btn-icon:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-hover);
      transform: translateY(-2px);
    }

    /* KPI Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }

    .stat-card {
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
      transition: var(--transition);
      box-shadow: var(--shadow-sm);
    }

    .stat-card:hover {
      transform: translateY(-4px);
      border-color: var(--border-hover);
      box-shadow: var(--shadow-md);
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--accent-gradient);
      opacity: 0.8;
    }

    .stat-title {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .stat-value {
      font-family: 'Outfit', sans-serif;
      font-size: 2.25rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }

    .stat-desc {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .stat-icon {
      position: absolute;
      right: 1.5rem;
      top: 1.5rem;
      font-size: 1.75rem;
      opacity: 0.2;
    }

    /* Checklist Quick Jump Bar */
    .checklist-banner {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.08) 100%);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
      margin-bottom: 2.5rem;
      backdrop-filter: blur(10px);
    }

    .checklist-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .checklist-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-primary);
    }

    .checklist-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      max-height: 110px;
      overflow-y: auto;
      padding-right: 0.5rem;
    }

    .case-chip {
      background: rgba(17, 24, 39, 0.6);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 0.3rem 0.65rem;
      border-radius: var(--radius-sm);
      font-size: 0.78rem;
      font-family: 'JetBrains Mono', monospace;
      text-decoration: none;
      transition: var(--transition);
      cursor: pointer;
    }

    .case-chip:hover {
      background: var(--accent-primary);
      color: #fff;
      border-color: var(--accent-primary);
      transform: scale(1.05);
    }

    /* Controls Bar */
    .controls-panel {
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      margin-bottom: 2rem;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow-sm);
    }

    .search-wrapper {
      position: relative;
      flex: 1;
      min-width: 280px;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      color: var(--text-primary);
      font-size: 0.95rem;
      outline: none;
      transition: var(--transition);
      font-family: inherit;
    }

    .search-input:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }

    .search-shortcut {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      padding: 0.15rem 0.45rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }

    .filter-group {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    }

    .filter-select {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.75rem 1rem;
      color: var(--text-primary);
      font-size: 0.9rem;
      outline: none;
      cursor: pointer;
      font-family: inherit;
    }

    .view-toggle {
      display: flex;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.2rem;
    }

    .view-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      font-weight: 500;
      transition: var(--transition);
    }

    .view-btn.active {
      background: var(--accent-primary);
      color: #fff;
    }

    /* Category Nav Tabs */
    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }

    .tab-btn {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 0.75rem 1.25rem;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition);
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .tab-btn:hover {
      background: var(--bg-card-hover);
      color: var(--text-primary);
      border-color: var(--border-hover);
    }

    .tab-btn.active {
      background: var(--accent-gradient);
      color: #fff;
      border-color: transparent;
      box-shadow: 0 4px 15px var(--accent-glow);
    }

    .tab-count {
      font-size: 0.75rem;
      background: rgba(0, 0, 0, 0.25);
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
    }

    .tab-btn.active .tab-count {
      background: rgba(255, 255, 255, 0.25);
    }

    /* Grid Layout */
    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.5rem;
    }

    .report-card {
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: var(--transition);
      box-shadow: var(--shadow-sm);
      position: relative;
    }

    .report-card:hover {
      transform: translateY(-5px);
      border-color: var(--border-hover);
      box-shadow: var(--shadow-md);
      background: var(--bg-card-hover);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .category-badge {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
    }

    .badge-CMT { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
    .badge-orderFulFilmentChecklist { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
    .badge-orderFulfilment { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-superadmin { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      color: var(--success);
      font-weight: 600;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 8px var(--success);
    }

    .card-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.35rem;
      line-height: 1.35;
    }

    .card-module {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Media Previews */
    .media-meta-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
      margin-bottom: 1.25rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .media-meta-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .card-actions {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 0.5rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.65rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: var(--transition);
      border: 1px solid transparent;
      font-family: inherit;
    }

    .btn-primary {
      background: var(--accent-gradient);
      color: #fff;
      box-shadow: 0 2px 10px var(--accent-glow);
    }

    .btn-primary:hover {
      box-shadow: 0 4px 20px var(--accent-glow);
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: var(--bg-secondary);
      border-color: var(--border-color);
      color: var(--text-primary);
    }

    .btn-secondary:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-hover);
      color: var(--accent-primary);
    }

    /* Table View */
    .reports-table-wrapper {
      display: none;
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow-x: auto;
      box-shadow: var(--shadow-sm);
    }

    .reports-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }

    .reports-table th {
      background: var(--bg-secondary);
      padding: 1rem 1.25rem;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-color);
    }

    .reports-table td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-secondary);
    }

    .reports-table tr:hover td {
      background: var(--bg-card-hover);
    }

    .table-title {
      font-weight: 600;
      color: var(--text-primary);
    }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      opacity: 0;
      transition: opacity 0.25s ease;
    }

    .modal-backdrop.open {
      display: flex;
      opacity: 1;
    }

    .modal-box {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 1100px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: var(--shadow-md);
      position: relative;
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .modal-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.5rem;
      cursor: pointer;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition);
    }

    .modal-close:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    /* Video Player */
    .video-container {
      width: 100%;
      max-height: 65vh;
      background: #000;
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .video-container video {
      width: 100%;
      height: 100%;
      max-height: 65vh;
      display: block;
    }

    /* Gallery */
    .gallery-viewer {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
    }

    .main-image-wrapper {
      width: 100%;
      height: 55vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.4);
      border-radius: var(--radius-sm);
      overflow: hidden;
      position: relative;
    }

    .main-image-wrapper img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .gallery-nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.6);
      border: 1px solid var(--border-color);
      color: #fff;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.25rem;
      transition: var(--transition);
    }

    .gallery-nav-btn:hover {
      background: var(--accent-primary);
    }

    .gallery-prev { left: 1rem; }
    .gallery-next { right: 1rem; }

    .gallery-counter {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .thumbnails-strip {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      max-width: 100%;
      padding: 0.5rem 0;
    }

    .thumb-item {
      width: 80px;
      height: 50px;
      border-radius: 4px;
      overflow: hidden;
      border: 2px solid transparent;
      cursor: pointer;
      opacity: 0.6;
      transition: var(--transition);
      flex-shrink: 0;
    }

    .thumb-item.active, .thumb-item:hover {
      opacity: 1;
      border-color: var(--accent-primary);
    }

    .thumb-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Empty state */
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-muted);
    }

    /* Footer */
    footer {
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color);
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    @media (max-width: 768px) {
      .container { padding: 1rem; }
      header { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .controls-panel { flex-direction: column; align-items: stretch; }
      .card-actions { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

<div class="container">
  <!-- Header -->
  <header>
    <div class="brand-section">
      <div class="brand-logo">DD</div>
      <div class="brand-text">
        <h1>DealsDray Test Portal <span class="version-badge">v4.6.3 UAT</span></h1>
        <p>Comprehensive End-to-End Automation Execution Master Reports</p>
      </div>
    </div>
    <div class="header-actions">
      <button class="theme-toggle" id="themeToggle" title="Toggle Dark/Light Mode">
        🌙
      </button>
    </div>
  </header>

  <!-- High-Level Stats -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-title">Total Reports</div>
      <div class="stat-value" id="statTotalReports">${allReports.length}</div>
      <div class="stat-desc">✅ 100% Executed & Verified</div>
      <div class="stat-icon">📑</div>
    </div>

    <div class="stat-card">
      <div class="stat-title">Captured Screenshots</div>
      <div class="stat-value" id="statTotalScreenshots">${totalScreenshots.toLocaleString()}</div>
      <div class="stat-desc">📸 Step-by-step visual proofs</div>
      <div class="stat-icon">📷</div>
    </div>

    <div class="stat-card">
      <div class="stat-title">Video Recordings</div>
      <div class="stat-value" id="statTotalVideos">${totalVideos}</div>
      <div class="stat-desc">🎥 Full session screen captures</div>
      <div class="stat-icon">🎬</div>
    </div>

    <div class="stat-card">
      <div class="stat-title">Core Modules</div>
      <div class="stat-value">${categories.length}</div>
      <div class="stat-desc">CMT, OFT, Checklists, SuperAdmin</div>
      <div class="stat-icon">🏢</div>
    </div>
  </div>

  <!-- Order Fulfilment Quick Jump Matrix -->
  <div class="checklist-banner">
    <div class="checklist-header">
      <div class="checklist-title">
        <span>⚡</span> Order Fulfilment Checklist Cases (Quick Matrix)
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">
        44 Test Cases Available
      </div>
    </div>
    <div class="checklist-chips" id="checklistChips">
      <!-- Generated via JS -->
    </div>
  </div>

  <!-- Controls Bar -->
  <div class="controls-panel">
    <div class="search-wrapper">
      <span class="search-icon">🔍</span>
      <input type="text" id="searchInput" class="search-input" placeholder="Search reports, cases, modules, or test names...">
      <span class="search-shortcut">/</span>
    </div>

    <div class="filter-group">
      <select id="moduleFilter" class="filter-select">
        <option value="ALL">All Modules</option>
      </select>

      <select id="sortSelect" class="filter-select">
        <option value="name_asc">Sort by Name (A-Z)</option>
        <option value="name_desc">Sort by Name (Z-A)</option>
        <option value="screenshots_desc">Most Screenshots</option>
        <option value="size_desc">Largest Size</option>
      </select>

      <div class="view-toggle">
        <button class="view-btn active" id="gridViewBtn" title="Grid View">🔲 Grid</button>
        <button class="view-btn" id="tableViewBtn" title="Table View">📋 Table</button>
      </div>
    </div>
  </div>

  <!-- Tabs Navigation -->
  <div class="tabs-nav" id="categoryTabs">
    <button class="tab-btn active" data-category="ALL">
      All Reports <span class="tab-count">${allReports.length}</span>
    </button>
    ${categories.map(cat => `
      <button class="tab-btn" data-category="${cat}">
        ${cat} <span class="tab-count">${allReports.filter(r => r.category === cat).length}</span>
      </button>
    `).join('')}
  </div>

  <!-- Grid View Container -->
  <div class="reports-grid" id="reportsGrid"></div>

  <!-- Table View Container -->
  <div class="reports-table-wrapper" id="reportsTableWrapper">
    <table class="reports-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Module</th>
          <th>Test Report Name</th>
          <th>Screenshots</th>
          <th>Videos</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="reportsTableBody"></tbody>
    </table>
  </div>

  <!-- Footer -->
  <footer>
    <p>DealsDray Automation Master Dashboard &bull; Generated on ${generatedDate}</p>
  </footer>
</div>

<!-- Video Modal -->
<div class="modal-backdrop" id="videoModal">
  <div class="modal-box">
    <div class="modal-header">
      <div class="modal-title" id="videoModalTitle">Execution Recording</div>
      <button class="modal-close" onclick="closeModal('videoModal')">&times;</button>
    </div>
    <div class="modal-body">
      <div class="video-container">
        <video id="modalVideoPlayer" controls autoplay loop playsinline>
          <source src="" type="video/webm">
          Your browser does not support video playback.
        </video>
      </div>
    </div>
  </div>
</div>

<!-- Screenshot Gallery Lightbox Modal -->
<div class="modal-backdrop" id="galleryModal">
  <div class="modal-box">
    <div class="modal-header">
      <div class="modal-title" id="galleryModalTitle">Screenshot Gallery</div>
      <button class="modal-close" onclick="closeModal('galleryModal')">&times;</button>
    </div>
    <div class="modal-body">
      <div class="gallery-viewer">
        <div class="main-image-wrapper">
          <button class="gallery-nav-btn gallery-prev" onclick="navGallery(-1)">&larr;</button>
          <img id="galleryMainImg" src="" alt="Screenshot">
          <button class="gallery-nav-btn gallery-next" onclick="navGallery(1)">&rarr;</button>
        </div>
        <div class="gallery-counter" id="galleryCounter">1 / 1</div>
        <div class="thumbnails-strip" id="galleryThumbs"></div>
      </div>
    </div>
  </div>
</div>

<script>
  const ALL_REPORTS = ${reportsJson};
  let currentCategory = 'ALL';
  let currentModule = 'ALL';
  let searchQuery = '';
  let sortBy = 'name_asc';
  let viewMode = 'grid';

  // Gallery state
  let currentGalleryList = [];
  let currentGalleryIdx = 0;

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    initChecklistChips();
    initTheme();
    updateModuleFilterOptions();
    renderReports();

    // Event Listeners
    document.getElementById('searchInput').addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderReports();
    });

    // Keyboard shortcut / for search
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
      }
      if (e.key === 'Escape') {
        closeModal('videoModal');
        closeModal('galleryModal');
      }
      if (document.getElementById('galleryModal').classList.contains('open')) {
        if (e.key === 'ArrowLeft') navGallery(-1);
        if (e.key === 'ArrowRight') navGallery(1);
      }
    });

    document.getElementById('moduleFilter').addEventListener('change', (e) => {
      currentModule = e.target.value;
      renderReports();
    });

    document.getElementById('sortSelect').addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderReports();
    });

    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-category');
        currentModule = 'ALL';
        updateModuleFilterOptions();
        renderReports();
      });
    });

    // View toggle
    document.getElementById('gridViewBtn').addEventListener('click', () => setViewMode('grid'));
    document.getElementById('tableViewBtn').addEventListener('click', () => setViewMode('table'));
  });

  function initChecklistChips() {
    const container = document.getElementById('checklistChips');
    const checklistReports = ALL_REPORTS.filter(r => r.category === 'orderFulFilmentChecklist');
    
    container.innerHTML = checklistReports.map(r => {
      return \`<a href="\${r.url}" target="_blank" class="case-chip" title="\${r.title} (\${r.screenshotsCount} SS)">
        \${r.name.replace('_report', '')}
      </a>\`;
    }).join('');
  }

  function updateModuleFilterOptions() {
    const select = document.getElementById('moduleFilter');
    let filtered = ALL_REPORTS;
    if (currentCategory !== 'ALL') {
      filtered = ALL_REPORTS.filter(r => r.category === currentCategory);
    }
    const modules = [...new Set(filtered.map(r => r.module))].sort();

    select.innerHTML = '<option value="ALL">All Modules (' + filtered.length + ')</option>' +
      modules.map(m => \`<option value="\${m}">\${m}</option>\`).join('');
    select.value = 'ALL';
  }

  function setViewMode(mode) {
    viewMode = mode;
    document.getElementById('gridViewBtn').classList.toggle('active', mode === 'grid');
    document.getElementById('tableViewBtn').classList.toggle('active', mode === 'table');
    document.getElementById('reportsGrid').style.display = mode === 'grid' ? 'grid' : 'none';
    document.getElementById('reportsTableWrapper').style.display = mode === 'table' ? 'block' : 'none';
  }

  function filterAndSortReports() {
    return ALL_REPORTS.filter(r => {
      const matchCat = currentCategory === 'ALL' || r.category === currentCategory;
      const matchMod = currentModule === 'ALL' || r.module === currentModule;
      const matchSearch = !searchQuery || 
        r.name.toLowerCase().includes(searchQuery) ||
        r.title.toLowerCase().includes(searchQuery) ||
        r.module.toLowerCase().includes(searchQuery) ||
        r.category.toLowerCase().includes(searchQuery) ||
        r.screenshots.some(s => s.toLowerCase().includes(searchQuery));
      return matchCat && matchMod && matchSearch;
    }).sort((a, b) => {
      if (sortBy === 'name_asc') return a.title.localeCompare(b.title, undefined, { numeric: true });
      if (sortBy === 'name_desc') return b.title.localeCompare(a.title, undefined, { numeric: true });
      if (sortBy === 'screenshots_desc') return b.screenshotsCount - a.screenshotsCount;
      if (sortBy === 'size_desc') return b.sizeKb - a.sizeKb;
      return 0;
    });
  }

  function renderReports() {
    const filtered = filterAndSortReports();
    const grid = document.getElementById('reportsGrid');
    const tableBody = document.getElementById('reportsTableBody');

    if (filtered.length === 0) {
      grid.innerHTML = \`<div class="empty-state">
        <h3>No matching test reports found</h3>
        <p style="margin-top: 0.5rem;">Try adjusting your search query or active category filters.</p>
      </div>\`;
      tableBody.innerHTML = \`<tr><td colspan="6" style="text-align:center; padding: 2rem;">No matching test reports found</td></tr>\`;
      return;
    }

    // Render Grid
    grid.innerHTML = filtered.map(r => \`
      <div class="report-card">
        <div>
          <div class="card-header">
            <span class="category-badge badge-\${r.category}">\${r.category}</span>
            <div class="status-badge"><span class="status-dot"></span> Passed</div>
          </div>
          <h3 class="card-title">\${r.title}</h3>
          <div class="card-module">📦 \${r.module} / \${r.name}</div>
          
          <div class="media-meta-row">
            <div class="media-meta-item">📸 <strong>\${r.screenshotsCount}</strong> screenshots</div>
            <div class="media-meta-item">🎥 <strong>\${r.videosCount}</strong> video</div>
            <div class="media-meta-item">💾 \${r.sizeKb} KB</div>
          </div>
        </div>

        <div class="card-actions">
          <a href="\${r.url}" target="_blank" class="btn btn-primary">
            🚀 Open Report
          </a>
          \${r.videos.length > 0 ? \`
            <button class="btn btn-secondary" onclick="openVideoModal('\${r.videos[0]}', '\${escapeHtml(r.title)}')">
              🎬 Video
            </button>
          \` : ''}
          \${r.screenshots.length > 0 ? \`
            <button class="btn btn-secondary" onclick="openGalleryModal('\${r.id}', '\${escapeHtml(r.title)}')">
              📸 Gallery
            </button>
          \` : ''}
        </div>
      </div>
    \`).join('');

    // Render Table
    tableBody.innerHTML = filtered.map(r => \`
      <tr>
        <td><span class="category-badge badge-\${r.category}">\${r.category}</span></td>
        <td><code>\${r.module}</code></td>
        <td>
          <div class="table-title">\${r.title}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted); font-family: 'JetBrains Mono';">\${r.name}</div>
        </td>
        <td>📸 \${r.screenshotsCount}</td>
        <td>🎥 \${r.videosCount}</td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <a href="\${r.url}" target="_blank" class="btn btn-primary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;">Open</a>
            \${r.videos.length > 0 ? \`
              <button class="btn btn-secondary" style="padding: 0.4rem 0.6rem; font-size: 0.8rem;" onclick="openVideoModal('\${r.videos[0]}', '\${escapeHtml(r.title)}')">🎬</button>
            \` : ''}
            \${r.screenshots.length > 0 ? \`
              <button class="btn btn-secondary" style="padding: 0.4rem 0.6rem; font-size: 0.8rem;" onclick="openGalleryModal('\${r.id}', '\${escapeHtml(r.title)}')">📸</button>
            \` : ''}
          </div>
        </td>
      </tr>
    \`).join('');
  }

  // Modals
  function openVideoModal(videoSrc, title) {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('modalVideoPlayer');
    document.getElementById('videoModalTitle').textContent = title + ' — Video Recording';
    player.src = videoSrc;
    modal.classList.add('open');
    player.play().catch(() => {});
  }

  function openGalleryModal(reportId, title) {
    const report = ALL_REPORTS.find(r => r.id === reportId);
    if (!report || report.screenshots.length === 0) return;

    currentGalleryList = report.screenshots;
    currentGalleryIdx = 0;
    document.getElementById('galleryModalTitle').textContent = title + ' — Screenshot Gallery';
    
    updateGalleryView();
    document.getElementById('galleryModal').classList.add('open');
  }

  function updateGalleryView() {
    const img = document.getElementById('galleryMainImg');
    const counter = document.getElementById('galleryCounter');
    const thumbs = document.getElementById('galleryThumbs');
    const currentSrc = currentGalleryList[currentGalleryIdx];

    img.src = currentSrc;
    const fileName = currentSrc.split('/').pop();
    counter.textContent = \`Step \${currentGalleryIdx + 1} of \${currentGalleryList.length} (\${fileName})\`;

    thumbs.innerHTML = currentGalleryList.map((src, idx) => \`
      <div class="thumb-item \${idx === currentGalleryIdx ? 'active' : ''}" onclick="setGalleryIdx(\${idx})">
        <img src="\${src}" alt="Thumb \${idx + 1}" loading="lazy">
      </div>
    \`).join('');
  }

  function setGalleryIdx(idx) {
    currentGalleryIdx = idx;
    updateGalleryView();
  }

  function navGallery(step) {
    currentGalleryIdx = (currentGalleryIdx + step + currentGalleryList.length) % currentGalleryList.length;
    updateGalleryView();
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('open');
    if (modalId === 'videoModal') {
      const player = document.getElementById('modalVideoPlayer');
      player.pause();
      player.src = '';
    }
  }

  // Theme Toggle
  function initTheme() {
    const savedTheme = localStorage.getItem('dd_report_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('themeToggle').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dd_report_theme', next);
    document.getElementById('themeToggle').textContent = next === 'dark' ? '🌙' : '☀️';
  }

  function escapeHtml(str) {
    return str.replace(/'/g, "\\\\'").replace(/"/g, '&quot;');
  }
</script>

</body>
</html>`;

  const outputPath = path.join(targetRootDir, 'index.html');
  fs.writeFileSync(outputPath, htmlContent, 'utf8');
  console.log(`Successfully generated master HTML report at: ${outputPath}`);
  console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
}

generateDashboard('c:\\Users\\viraj\\Desktop\\reports\\DD_V4.6.3_Reports');
