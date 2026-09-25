(function() {
  'use strict';

  // Embedded metadata (inline so no API keys needed)
  const animeData = {
    "shows": [
      {
        "id": "demon-slayer",
        "title": "Demon Slayer: Kimetsu no Yaiba",
        "totalSeasons": 4,
        "missingSeasons": [3],
        "note": "Season 4 (Swordsmith Village Arc) released 2023"
      },
      {
        "id": "jujutsu-kaisen",
        "title": "Jujutsu Kaisen",
        "totalSeasons": 2,
        "missingSeasons": [3],
        "note": "Season 3 confirmed but not on CR yet"
      },
      {
        "id": "attack-on-titan",
        "title": "Attack on Titan",
        "totalSeasons": 4,
        "missingSeasons": [],
        "note": "Complete on CR"
      },
      {
        "id": "chainsaw-man",
        "title": "Chainsaw Man",
        "totalSeasons": 1,
        "missingSeasons": [2],
        "note": "Season 2 announced"
      },
      {
        "id": "blue-lock",
        "title": "Blue Lock",
        "totalSeasons": 2,
        "missingSeasons": [3],
        "note": "Season 3 in production"
      },
      {
        "id": "spy-x-family",
        "title": "Spy x Family",
        "totalSeasons": 2,
        "missingSeasons": [3],
        "note": "Season 3 greenlit"
      },
      {
        "id": "fullmetal-alchemist",
        "title": "Fullmetal Alchemist: Brotherhood",
        "totalSeasons": 1,
        "missingSeasons": [],
        "note": "Complete on CR"
      },
      {
        "id": "black-clover",
        "title": "Black Clover",
        "totalSeasons": 4,
        "missingSeasons": [5],
        "note": "Continuing beyond manga"
      },
      {
        "id": "my-hero-academia",
        "title": "My Hero Academia",
        "totalSeasons": 7,
        "missingSeasons": [7],
        "note": "Season 7 final season part 3"
      },
      {
        "id": "one-piece",
        "title": "One Piece",
        "totalSeasons": 22,
        "missingSeasons": [],
        "note": "Long-running, many seasons on CR"
      }
    ]
  };

  // Helpers
  function parseTitleFromPage() {
    // Try multiple selectors for the anime title on CR pages
    const selectors = [
      'h1',
      '.page-title',
      '.title',
      '.anime-title',
      '.series-title'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim() && el.textContent.trim().length > 3) {
        return el.textContent.trim();
      }
    }
    // Fallback: page title
    const pageTitle = document.title;
    if (pageTitle && pageTitle.includes('Crunchyroll')) {
      // Remove site name suffix
      const cleaned = pageTitle.replace(/^Crunchyroll - /i, '').replace(/ - Crunchyroll$/i, '');
      if (cleaned.length > 3) return cleaned;
    }
    return null;
  }

  function normalizeTitle(str) {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  function findShowInData(pageTitle) {
    if (!pageTitle) return null;
    const lower = pageTitle.toLowerCase();
    return animeData.shows.find(show => lower.includes(show.title.toLowerCase()));
  }

  // Overlay DOM
  function createOverlay(showInfo) {
    const overlay = document.createElement('div');
    overlay.className = 'missing-season-overlay';
    overlay.innerHTML = `
      <div>Missing Seasons: ${showInfo.missingSeasons.length > 0 ? showInfo.missingSeasons.join(', ') : 'None!'} <span class="note">(${showInfo.note})</span></div>
    `;
    return overlay;
  }

  function createToggleButton(isActive) {
    const btn = document.createElement('button');
    btn.className = 'overlay-toggle-btn ' + (isActive ? 'active' : '');
    btn.textContent = isActive ? 'Hide Overlays' : 'Show Missing Seasons';
    btn.addEventListener('click', toggleOverlays);
    return btn;
  }

  let overlayInstance = null;
  let toggleBtn = null;
  let showing = false;

  function showOverlay(showInfo) {
    if (overlayInstance) {
      overlayInstance.textContent = `Missing Seasons: ${showInfo.missingSeasons.length > 0 ? showInfo.missingSeasons.join(', ') : 'None!'} <span class="note">(${showInfo.note})</span>`;
    } else {
      overlayInstance = createOverlay(showInfo);
      document.body.appendChild(overlayInstance);
    }
    if (toggleBtn) {
      toggleBtn.textContent = showing ? 'Show Missing Seasons' : 'Hide Overlays';
      toggleBtn.classList.toggle('active', showing);
    }
  }

  function hideOverlay() {
    if (overlayInstance && overlayInstance.parentNode) {
      overlayInstance.parentNode.removeChild(overlayInstance);
      overlayInstance = null;
    }
    if (toggleBtn) {
      toggleBtn.textContent = 'Show Missing Seasons';
      toggleBtn.classList.remove('active');
    }
  }

  function toggleOverlays() {
    showing = !showing;
    if (showing) {
      // Find current show and show overlay
      const pageTitle = parseTitleFromPage();
      const showInfo = findShowInData(pageTitle);
      if (showInfo) {
        showOverlay(showInfo);
      }
      toggleBtn.textContent = 'Hide Overlays';
      toggleBtn.classList.add('active');
    } else {
      hideOverlay();
    }
  }

  // Init: inject CSS, create toggle button, set up observer
  function init() {
    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
      ${document.querySelector('style')?.textContent || ''}
      .missing-season-overlay {
        position: fixed;
        top: 20px;
        left: 20px;
        background: rgba(0,0,0,0.85);
        color: #ff9a00;
        padding: 12px 16px;
        border-radius: 6px;
        font-family: 'Roboto', sans-serif;
        font-size: 13px;
        z-index: 2147483647;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      }
      .overlay-toggle-btn {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e2e6e9;
        color: #21262a;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 2147483647;
        cursor: pointer;
        font-family: 'Roboto', sans-serif;
      }
      .overlay-toggle-btn.active {
        background: #ff9a00;
        color: white;
      }
    `;
    document.head.appendChild(style);

    // Create toggle button
    toggleBtn = createToggleButton(false);
    document.body.appendChild(toggleBtn);

    // Show overlay for current page on init
    const pageTitle = parseTitleFromPage();
    const showInfo = findShowInData(pageTitle);
    if (showInfo) {
      showOverlay(showInfo);
    }
  }

  init();
})();