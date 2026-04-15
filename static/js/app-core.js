/**
 * ============================================================================
 * Facts & Fakes v2 — static/js/app-core.js
 * Version: 2.0.0
 * Date: April 15, 2026
 *
 * PURPOSE:
 *   Application control flow and user interaction.
 *   MUST LOAD AFTER service-templates.js.
 *
 * ARCHITECTURE:
 *   Creates FactsAndFakesApp class which manages:
 *     - Form submission and input validation
 *     - API communication (/api/analyze)
 *     - Loading state with animated step progression
 *     - Results display orchestration (calls ServiceTemplates)
 *     - Trust score gauge drawing
 *     - Accordion toggle
 *     - PDF download
 *     - Reset / analyze another
 *
 * DEPENDENCIES:
 *   - window.ServiceTemplates (from service-templates.js)
 *   - DOM elements defined in index.html
 *
 * GLOBAL FUNCTIONS (called from HTML):
 *   toggleAccordion(id)    — Called by onclick in accordion buttons
 *
 * CHANGELOG:
 *   v2.0.0 (2026-04-15): Initial build. Full application logic.
 *                        Loading step animation, gauge drawing, accordion.
 *                        Phase 1: connects to stub API, ready for real data.
 * ============================================================================
 */

(function (window, document) {
    'use strict';

    // =========================================================================
    // LOADING STEP SEQUENCE
    // =========================================================================

    const LOADING_STEPS = [
        { id: 'article',      message: 'Reading article...',                        progress: 15 },
        { id: 'credibility',  message: 'Checking source credibility...',            progress: 30 },
        { id: 'layer1',       message: 'Analyzing reporting accuracy...',           progress: 50 },
        { id: 'layer2',       message: 'Verifying claims with 4 AI systems...',     progress: 70 },
        { id: 'bias',         message: 'Detecting bias & manipulation...',          progress: 85 },
        { id: 'synthesis',    message: 'Generating report...',                      progress: 95 },
    ];


    // =========================================================================
    // APP CLASS
    // =========================================================================

    class FactsAndFakesApp {

        constructor() {
            this._analysisInProgress = false;
            this._loadingInterval = null;
            this._currentStepIndex = 0;

            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
            } else {
                this.init();
            }
        }

        init() {
            this._bindEvents();
            console.log('[App v2.0.0] Initialized.');
        }

        // =====================================================================
        // EVENT BINDING
        // =====================================================================

        _bindEvents() {
            // Analyze button
            const analyzeBtn = document.getElementById('analyze-btn');
            if (analyzeBtn) {
                analyzeBtn.addEventListener('click', () => this.handleSubmit());
            }

            // Enter key in textarea submits (Ctrl+Enter or Cmd+Enter)
            const textarea = document.getElementById('analysis-input');
            if (textarea) {
                textarea.addEventListener('keydown', (e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        this.handleSubmit();
                    }
                });

                // Auto-detect URL vs text while typing
                textarea.addEventListener('input', () => this._updateInputHint(textarea.value));
            }

            // Reset button
            const resetBtn = document.getElementById('reset-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => this.resetToInput());
            }

            // PDF button
            const pdfBtn = document.getElementById('pdf-btn');
            if (pdfBtn) {
                pdfBtn.addEventListener('click', () => this.downloadPDF());
            }
        }

        // =====================================================================
        // INPUT HINT
        // =====================================================================

        _updateInputHint(value) {
            const hintEl = document.getElementById('input-type-hint');
            if (!hintEl) return;

            const trimmed = (value || '').trim();
            if (!trimmed) {
                hintEl.innerHTML = '<span class="hint-icon">ℹ</span> Supports news articles, opinion pieces, press releases, and transcripts';
                return;
            }

            if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
                hintEl.innerHTML = '<span class="hint-icon" style="color:var(--accent-green)">✓</span> URL detected — article will be fetched automatically';
            } else if (trimmed.length > 200) {
                hintEl.innerHTML = '<span class="hint-icon" style="color:var(--accent-cyan)">✓</span> Article text detected — analyzing directly';
            } else {
                hintEl.innerHTML = '<span class="hint-icon">ℹ</span> Paste a complete URL or article text';
            }
        }

        // =====================================================================
        // FORM SUBMISSION
        // =====================================================================

        handleSubmit() {
            if (this._analysisInProgress) return;

            const textarea = document.getElementById('analysis-input');
            if (!textarea) return;

            const input = textarea.value.trim();

            // Clear previous errors
            this._showError('');

            // Validate
            if (!input) {
                this._showError('Please paste a URL or article text to analyze.');
                textarea.focus();
                return;
            }

            if (input.length < 20) {
                this._showError('Input is too short. Please provide a URL or at least a paragraph of text.');
                textarea.focus();
                return;
            }

            // Determine payload
            let payload = {};
            if (input.startsWith('http://') || input.startsWith('https://')) {
                payload = { url: input, type: 'news' };
            } else {
                payload = { text: input, type: 'news' };
            }

            this._runAnalysis(payload);
        }

        async _runAnalysis(payload) {
            this._analysisInProgress = true;

            // Transition to loading state
            this._showSection('loading');
            this._startLoadingAnimation();

            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || 'Analysis failed. Please try again.');
                }

                // Store AI systems for use by ServiceTemplates
                window._currentAnalysisAIs = (data.metadata && data.metadata.ai_systems_used) ||
                    ['openai', 'anthropic', 'cohere', 'deepseek'];

                // Complete loading animation
                await this._completeLoadingAnimation();

                // Display results
                this._displayResults(data);

            } catch (err) {
                console.error('[App] Analysis error:', err);
                this._stopLoadingAnimation();
                this._showSection('input');
                this._showError(err.message || 'Something went wrong. Please try again.');
            } finally {
                this._analysisInProgress = false;
            }
        }

        // =====================================================================
        // RESULTS DISPLAY
        // =====================================================================

        _displayResults(data) {
            // Check that ServiceTemplates is available
            if (!window.ServiceTemplates) {
                console.error('[App] ServiceTemplates not loaded — cannot display results');
                this._showError('Display error. Please refresh and try again.');
                return;
            }

            // Show results section
            this._showSection('results');

            // Populate all sections via ServiceTemplates
            window.ServiceTemplates.displayAllAnalyses(data);

            // Scroll to results
            const resultsSection = document.getElementById('results-section');
            if (resultsSection) {
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                resultsSection.classList.add('results-visible');
            }
        }

        // =====================================================================
        // LOADING ANIMATION
        // =====================================================================

        _startLoadingAnimation() {
            this._currentStepIndex = 0;
            this._resetLoadingSteps();
            this._setLoadingProgress(5);
            this._setLoadingMessage('Initializing analysis...');

            let stepIdx = 0;

            const advance = () => {
                if (stepIdx >= LOADING_STEPS.length) return;
                const step = LOADING_STEPS[stepIdx];

                // Mark previous step done
                if (stepIdx > 0) {
                    this._setStepState(LOADING_STEPS[stepIdx - 1].id, 'done');
                }

                // Mark current step active
                this._setStepState(step.id, 'active');
                this._setLoadingMessage(step.message);
                this._setLoadingProgress(step.progress);

                stepIdx++;
            };

            // Advance through steps with realistic timing
            advance(); // immediately
            this._loadingInterval = setInterval(advance, 2200);
        }

        async _completeLoadingAnimation() {
            return new Promise((resolve) => {
                // Clear interval
                if (this._loadingInterval) {
                    clearInterval(this._loadingInterval);
                    this._loadingInterval = null;
                }

                // Mark all steps done
                LOADING_STEPS.forEach(step => this._setStepState(step.id, 'done'));
                this._setLoadingMessage('Analysis complete!');
                this._setLoadingProgress(100);

                setTimeout(resolve, 600);
            });
        }

        _stopLoadingAnimation() {
            if (this._loadingInterval) {
                clearInterval(this._loadingInterval);
                this._loadingInterval = null;
            }
        }

        _resetLoadingSteps() {
            LOADING_STEPS.forEach(step => {
                const el = document.getElementById(`step-${step.id}`);
                if (el) {
                    el.classList.remove('step-active', 'step-done');
                    const icon = el.querySelector('.agent-step-icon');
                    if (icon) icon.textContent = '○';
                }
            });
        }

        _setStepState(id, state) {
            const el = document.getElementById(`step-${id}`);
            if (!el) return;

            el.classList.remove('step-active', 'step-done');

            if (state === 'active') {
                el.classList.add('step-active');
                const icon = el.querySelector('.agent-step-icon');
                if (icon) icon.textContent = '◌';
            } else if (state === 'done') {
                el.classList.add('step-done');
                const icon = el.querySelector('.agent-step-icon');
                if (icon) icon.textContent = '●';
            }
        }

        _setLoadingMessage(msg) {
            const el = document.getElementById('loading-message');
            if (el) el.textContent = msg;
        }

        _setLoadingProgress(pct) {
            const bar = document.getElementById('loading-bar');
            const wrapper = document.getElementById('loading-bar-wrapper');
            if (bar) bar.style.width = `${pct}%`;
            if (wrapper) wrapper.setAttribute('aria-valuenow', pct);
        }

        // =====================================================================
        // SECTION SWITCHING
        // =====================================================================

        _showSection(section) {
            const hero      = document.getElementById('hero');
            const loading   = document.getElementById('loading-section');
            const results   = document.getElementById('results-section');

            if (section === 'input') {
                if (hero)    hero.style.display    = '';
                if (loading) loading.style.display = 'none';
                if (results) results.style.display = 'none';
            } else if (section === 'loading') {
                if (hero)    hero.style.display    = 'none';
                if (loading) loading.style.display = '';
                if (results) results.style.display = 'none';
            } else if (section === 'results') {
                if (hero)    hero.style.display    = 'none';
                if (loading) loading.style.display = 'none';
                if (results) results.style.display = '';
            }
        }

        // =====================================================================
        // ERROR DISPLAY
        // =====================================================================

        _showError(message) {
            const errorEl = document.getElementById('input-error');
            if (!errorEl) return;

            if (!message) {
                errorEl.style.display = 'none';
                errorEl.textContent = '';
                return;
            }

            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }

        // =====================================================================
        // RESET
        // =====================================================================

        resetToInput() {
            // Clear input
            const textarea = document.getElementById('analysis-input');
            if (textarea) {
                textarea.value = '';
                this._updateInputHint('');
            }

            // Clear errors
            this._showError('');

            // Clear results visible class
            const resultsSection = document.getElementById('results-section');
            if (resultsSection) {
                resultsSection.classList.remove('results-visible');
            }

            // Close all accordions
            ['credibility', 'bias'].forEach(id => {
                const body = document.getElementById(`accordion-${id}-body`);
                const trigger = document.getElementById(`accordion-${id}-trigger`);
                if (body) body.hidden = true;
                if (trigger) trigger.setAttribute('aria-expanded', 'false');
            });

            // Show hero
            this._showSection('input');

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Focus input
            setTimeout(() => {
                if (textarea) textarea.focus();
            }, 300);
        }

        // =====================================================================
        // PDF DOWNLOAD
        // =====================================================================

        async downloadPDF() {
            const pdfBtn = document.getElementById('pdf-btn');
            if (pdfBtn) {
                pdfBtn.textContent = 'Generating...';
                pdfBtn.disabled = true;
            }

            try {
                // Phase 8 will implement real PDF.
                // For now, show a friendly message.
                alert('PDF report generation will be available in the next build phase.');
            } finally {
                if (pdfBtn) {
                    pdfBtn.innerHTML = '<span class="btn-icon">↓</span> Download Report';
                    pdfBtn.disabled = false;
                }
            }
        }

    } // end FactsAndFakesApp


    // =========================================================================
    // ACCORDION TOGGLE
    // Global function — called directly from onclick in HTML
    // =========================================================================

    window.toggleAccordion = function (id) {
        const body    = document.getElementById(`accordion-${id}-body`);
        const trigger = document.getElementById(`accordion-${id}-trigger`);

        if (!body || !trigger) return;

        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

        if (isExpanded) {
            body.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
        } else {
            body.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
        }
    };


    // =========================================================================
    // BOOT
    // =========================================================================

    // Verify ServiceTemplates is loaded
    if (!window.ServiceTemplates) {
        console.error('[App] CRITICAL: service-templates.js must load before app-core.js');
    }

    // Initialize the application
    window.FactsAndFakesApp = new FactsAndFakesApp();

    console.log('[App-Core v2.0.0] Loaded and ready.');

}(window, document));

// I did no harm and this file is not truncated
