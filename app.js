/**
 * AutoSummarize Web Application
 * Orchestrates UI interactions, document rendering, and real-time summarization.
 */

(function () {
  'use strict';

  // Application State
  const state = {
    currentDocKey: 'office97',
    currentText: '',
    summaryMode: 'highlight', // 'highlight', 'executive', 'newdoc', 'hide'
    lengthOption: { type: 'percent', value: 25 },
    scoredResult: null,
    summaryResult: null,
    activeTab: 'doc',
    isClassicTheme: false
  };

  // DOM Elements
  const dom = {
    // Controls
    sampleDocSelect: document.getElementById('sampleDocSelect'),
    modeOptions: document.querySelectorAll('.mode-option'),
    lengthPresetSelect: document.getElementById('lengthPresetSelect'),
    summaryPercentSlider: document.getElementById('summaryPercentSlider'),
    sliderValueText: document.getElementById('sliderValueText'),
    floatingSlider: document.getElementById('floatingSlider'),
    floatingSliderText: document.getElementById('floatingSliderText'),
    floatingToolbar: document.getElementById('floatingWordToolbar'),
    closeFloatingBtn: document.getElementById('closeFloatingBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),

    // Statistics
    statOriginalWords: document.getElementById('statOriginalWords'),
    statSummaryWords: document.getElementById('statSummaryWords'),
    statOriginalSentences: document.getElementById('statOriginalSentences'),
    statSummarySentences: document.getElementById('statSummarySentences'),
    statPercentRatio: document.getElementById('statPercentRatio'),
    sidebarKeywords: document.getElementById('sidebarKeywords'),

    // Tabs & Panels
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanels: document.querySelectorAll('.tab-panel'),
    panelDocView: document.getElementById('panelDocView'),
    panelEdit: document.getElementById('panelEdit'),
    panelInspector: document.getElementById('panelInspector'),
    panelGuide: document.getElementById('panelGuide'),

    // Document Canvas
    executiveSummaryContainer: document.getElementById('executiveSummaryContainer'),
    documentTextContainer: document.getElementById('documentTextContainer'),

    // Edit Tab
    customDocInput: document.getElementById('customDocInput'),
    applyCustomTextBtn: document.getElementById('applyCustomTextBtn'),

    // Inspector Tab
    inspectorKeywordsList: document.getElementById('inspectorKeywordsList'),
    sentenceScoresTableBody: document.getElementById('sentenceScoresTableBody'),

    // Actions
    copySummaryBtn: document.getElementById('copySummaryBtn'),
    resetDocBtn: document.getElementById('resetDocBtn')
  };

  /**
   * Initialize Application
   */
  function init() {
    // Load initial sample document
    loadDocument(state.currentDocKey);

    // Bind Event Listeners
    setupEventListeners();
  }

  /**
   * Load a document from sample-docs or custom text
   */
  function loadDocument(key) {
    state.currentDocKey = key;
    if (key === 'custom') {
      if (!state.currentText) {
        state.currentText = SAMPLE_DOCUMENTS.office97.text;
      }
      dom.customDocInput.value = state.currentText;
      switchTab('edit');
    } else if (SAMPLE_DOCUMENTS[key]) {
      state.currentText = SAMPLE_DOCUMENTS[key].text;
      dom.customDocInput.value = state.currentText;
      dom.sampleDocSelect.value = key;
    }

    recomputeScoresAndSummary();
  }

  /**
   * Re-run document scoring and summary extraction
   */
  function recomputeScoresAndSummary() {
    if (!state.currentText.trim()) {
      state.scoredResult = { sentences: [], keywords: [], stats: { totalWords: 0, totalSentences: 0 } };
      state.summaryResult = { selectedIds: new Set(), summarySentences: [], summaryStats: {} };
      renderAll();
      return;
    }

    // 1. Run core NLP scoring (U.S. Patent 5,924,108)
    state.scoredResult = scoreDocument(state.currentText);

    // 2. Extract summary sentences based on current length settings
    state.summaryResult = extractSummary(state.scoredResult, state.lengthOption);

    // 3. Render updates across UI
    renderAll();
  }

  /**
   * Render all UI elements according to current state
   */
  function renderAll() {
    renderDocumentCanvas();
    renderStatistics();
    renderKeywords();
    renderInspectorTable();
  }

  /**
   * Render Document Canvas based on the 4 classic Word summary modes:
   * 1. Highlight: Yellow highlighter over key sentences
   * 2. Executive: Abstract summary placed at top of document
   * 3. NewDoc: Only summary sentences rendered
   * 4. Hide: Non-summary sentences faded/hidden
   */
  function renderDocumentCanvas() {
    const { sentences } = state.scoredResult;
    const { selectedIds, summarySentences } = state.summaryResult;

    // Reset executive summary container
    dom.executiveSummaryContainer.innerHTML = '';
    dom.documentTextContainer.innerHTML = '';

    if (!sentences || sentences.length === 0) {
      dom.documentTextContainer.innerHTML = '<p style="color: #64748b; font-style: italic;">No document text to display.</p>';
      return;
    }

    // MODE 2: Executive Summary Mode (Inserts summary block at top)
    if (state.summaryMode === 'executive') {
      const execBox = document.createElement('div');
      execBox.className = 'executive-summary-banner';
      
      const execHeader = document.createElement('div');
      execHeader.className = 'exec-header';
      execHeader.innerHTML = '📌 Executive Summary (Auto-Generated)';
      execBox.appendChild(execHeader);

      const execContent = document.createElement('div');
      execContent.innerHTML = summarySentences.map(s => escapeHtml(s.text)).join(' ');
      execBox.appendChild(execContent);

      dom.executiveSummaryContainer.appendChild(execBox);
    }

    // MODE 3: Create New Document (Summary Only)
    if (state.summaryMode === 'newdoc') {
      const summaryHeader = document.createElement('h3');
      summaryHeader.style.cssText = 'margin-bottom: 16px; font-size: 1.2rem; color: #1e3a8a; border-bottom: 2px solid #2563eb; padding-bottom: 6px;';
      summaryHeader.innerText = 'Document Summary (Extracted Points)';
      dom.documentTextContainer.appendChild(summaryHeader);

      let currentPara = -1;
      let paraElem = null;

      summarySentences.forEach(s => {
        if (s.paraIndex !== currentPara) {
          currentPara = s.paraIndex;
          paraElem = document.createElement('p');
          paraElem.style.marginBottom = '1.2em';
          dom.documentTextContainer.appendChild(paraElem);
        }
        const sSpan = document.createElement('span');
        sSpan.className = 'sentence';
        sSpan.innerText = s.text + ' ';
        paraElem.appendChild(sSpan);
      });

      return;
    }

    // MODES 1 & 4 (and original document flow for Mode 2)
    let currentPara = -1;
    let paraElem = null;

    sentences.forEach(s => {
      if (s.paraIndex !== currentPara) {
        currentPara = s.paraIndex;
        paraElem = document.createElement(s.isHeading ? 'h2' : 'p');
        if (s.isHeading) {
          paraElem.style.cssText = 'font-size: 1.35rem; font-weight: 700; margin-bottom: 0.8em; margin-top: 0.5em; color: #111827;';
        } else {
          paraElem.style.marginBottom = '1.2em';
        }
        dom.documentTextContainer.appendChild(paraElem);
      }

      const isSelected = selectedIds.has(s.id);
      const sSpan = document.createElement('span');
      sSpan.className = 'sentence';
      sSpan.dataset.id = s.id;

      if (state.summaryMode === 'highlight') {
        if (isSelected) sSpan.classList.add('highlighted');
      } else if (state.summaryMode === 'hide') {
        if (!isSelected) {
          sSpan.classList.add('hidden-mode');
        } else {
          sSpan.style.fontWeight = '500';
        }
      }

      sSpan.innerText = s.text + ' ';
      paraElem.appendChild(sSpan);
    });
  }

  /**
   * Update Document Statistics (Original Words, Summary Words, etc.)
   */
  function renderStatistics() {
    const stats = state.summaryResult.summaryStats || {};
    dom.statOriginalWords.innerText = stats.originalWords || 0;
    dom.statSummaryWords.innerText = stats.summaryWords || 0;
    dom.statOriginalSentences.innerText = stats.originalSentencesCount || 0;
    dom.statSummarySentences.innerText = stats.summarySentencesCount || 0;
    dom.statPercentRatio.innerText = (stats.actualPercent || 0) + '%';
  }

  /**
   * Render extracted topic keywords
   */
  function renderKeywords() {
    const keywords = state.scoredResult.keywords || [];
    
    // Sidebar chips
    dom.sidebarKeywords.innerHTML = '';
    keywords.slice(0, 6).forEach(kw => {
      const chip = document.createElement('span');
      chip.className = 'keyword-chip';
      chip.innerHTML = `<span>${escapeHtml(kw.word)}</span><span class="keyword-count">${kw.freq}</span>`;
      dom.sidebarKeywords.appendChild(chip);
    });

    // Inspector chips
    dom.inspectorKeywordsList.innerHTML = '';
    keywords.forEach(kw => {
      const chip = document.createElement('span');
      chip.className = 'keyword-chip';
      chip.innerHTML = `<span>${escapeHtml(kw.word)}</span><span class="keyword-count">${kw.freq}</span>`;
      dom.inspectorKeywordsList.appendChild(chip);
    });
  }

  /**
   * Render Sentence Scoring Matrix in Inspector Tab
   */
  function renderInspectorTable() {
    const { sentences } = state.scoredResult;
    const { selectedIds } = state.summaryResult;

    dom.sentenceScoresTableBody.innerHTML = '';

    if (!sentences || sentences.length === 0) {
      dom.sentenceScoresTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #94a3b8; padding: 20px;">No sentences analyzed yet.</td></tr>';
      return;
    }

    sentences.forEach(s => {
      const isSelected = selectedIds.has(s.id);
      const tr = document.createElement('tr');
      if (isSelected) tr.classList.add('selected-row');

      const contentWordsPreview = s.contentWords.slice(0, 5).join(', ') + (s.contentWords.length > 5 ? '...' : '');

      tr.innerHTML = `
        <td style="font-weight: 600; color: #64748b;">${s.id + 1}</td>
        <td>
          <span class="${isSelected ? 'badge-included' : 'badge-omitted'}">
            ${isSelected ? '✓ Included' : 'Excluded'}
          </span>
        </td>
        <td style="max-width: 320px; word-break: break-word;">${escapeHtml(s.text)}</td>
        <td style="font-size: 0.75rem; color: #64748b; max-width: 150px;">${escapeHtml(contentWordsPreview || '—')}</td>
        <td class="num-cell">${s.scores.frequencyScore.toFixed(2)}</td>
        <td class="num-cell" style="color: ${s.scores.positionBonus > 0 ? '#15803d' : '#94a3b8'};">+${s.scores.positionBonus.toFixed(2)}</td>
        <td class="num-cell" style="color: ${s.scores.titleBonus > 0 ? '#15803d' : '#94a3b8'};">+${s.scores.titleBonus.toFixed(2)}</td>
        <td class="num-cell" style="color: ${s.scores.cueScore < 0 ? '#b91c1c' : (s.scores.cueScore > 0 ? '#15803d' : '#94a3b8')};">
          ${s.scores.cueScore > 0 ? '+' : ''}${s.scores.cueScore.toFixed(2)}
        </td>
        <td class="num-cell score-badge" style="color: ${isSelected ? '#1d4ed8' : '#334155'}; font-size: 0.9rem;">
          ${s.scores.totalScore.toFixed(2)}
        </td>
      `;

      dom.sentenceScoresTableBody.appendChild(tr);
    });
  }

  /**
   * Switch Active Main Tab
   */
  function switchTab(tabId) {
    state.activeTab = tabId;
    dom.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    dom.tabPanels.forEach(panel => {
      panel.style.display = 'none';
    });

    if (tabId === 'doc') dom.panelDocView.style.display = 'flex';
    if (tabId === 'edit') dom.panelEdit.style.display = 'block';
    if (tabId === 'inspector') dom.panelInspector.style.display = 'flex';
    if (tabId === 'guide') dom.panelGuide.style.display = 'flex';
  }

  /**
   * Synchronize Slider Values
   */
  function updateSliderValue(val) {
    const num = parseInt(val, 10);
    state.lengthOption = { type: 'percent', value: num };
    dom.summaryPercentSlider.value = num;
    dom.floatingSlider.value = num;
    dom.sliderValueText.innerText = num + '%';
    dom.floatingSliderText.innerText = num + '%';
    
    // Check if preset matches
    if ([10, 25, 50, 75].includes(num)) {
      dom.lengthPresetSelect.value = `pct_${num}`;
    } else {
      dom.lengthPresetSelect.value = 'custom_slider';
    }

    recomputeScoresAndSummary();
  }

  /**
   * Setup Event Listeners
   */
  function setupEventListeners() {
    // Sample Document Selector
    dom.sampleDocSelect.addEventListener('change', (e) => {
      loadDocument(e.target.value);
    });

    // Summary Mode Radio Buttons
    dom.modeOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        dom.modeOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        const radio = opt.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        state.summaryMode = opt.dataset.mode;
        renderDocumentCanvas();
      });
    });

    // Preset Length Dropdown
    dom.lengthPresetSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val.startsWith('pct_')) {
        const pct = parseInt(val.replace('pct_', ''), 10);
        updateSliderValue(pct);
      } else if (val.startsWith('sen_')) {
        const count = parseInt(val.replace('sen_', ''), 10);
        state.lengthOption = { type: 'sentences', value: count };
        dom.sliderValueText.innerText = `${count} sents`;
        dom.floatingSliderText.innerText = `${count}s`;
        recomputeScoresAndSummary();
      } else if (val.startsWith('wrd_')) {
        const words = parseInt(val.replace('wrd_', ''), 10);
        state.lengthOption = { type: 'words', value: words };
        dom.sliderValueText.innerText = `~${words} wrds`;
        dom.floatingSliderText.innerText = `${words}w`;
        recomputeScoresAndSummary();
      }
    });

    // Sliders (Bidirectional sync)
    dom.summaryPercentSlider.addEventListener('input', (e) => {
      updateSliderValue(e.target.value);
    });

    dom.floatingSlider.addEventListener('input', (e) => {
      updateSliderValue(e.target.value);
    });

    // Close Floating Toolbar
    dom.closeFloatingBtn.addEventListener('click', () => {
      dom.floatingToolbar.style.display = 'none';
    });

    // Tab buttons
    dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
      });
    });

    // Apply custom text
    dom.applyCustomTextBtn.addEventListener('click', () => {
      const text = dom.customDocInput.value;
      state.currentText = text;
      state.currentDocKey = 'custom';
      dom.sampleDocSelect.value = 'custom';
      recomputeScoresAndSummary();
      switchTab('doc');
    });

    // Reset document
    dom.resetDocBtn.addEventListener('click', () => {
      loadDocument(state.currentDocKey);
    });

    // Copy Summary to Clipboard
    dom.copySummaryBtn.addEventListener('click', async () => {
      const { summarySentences } = state.summaryResult;
      if (!summarySentences || summarySentences.length === 0) return;
      const textToCopy = summarySentences.map(s => s.text).join('\n\n');
      
      try {
        await navigator.clipboard.writeText(textToCopy);
        const originalText = dom.copySummaryBtn.innerHTML;
        dom.copySummaryBtn.innerHTML = '✓ Copied!';
        setTimeout(() => {
          dom.copySummaryBtn.innerHTML = originalText;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    });

    // Theme Toggle (Word 97 Classic vs Modern)
    dom.themeToggleBtn.addEventListener('click', () => {
      state.isClassicTheme = !state.isClassicTheme;
      document.body.classList.toggle('theme-word97', state.isClassicTheme);
      dom.themeToggleBtn.innerHTML = state.isClassicTheme ? '✨ Modern Theme' : '🕹️ Classic Theme';
    });
  }

  /**
   * Helper to escape HTML characters
   */
  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Start app when DOM is ready
  document.addEventListener('DOMContentLoaded', init);

})();
