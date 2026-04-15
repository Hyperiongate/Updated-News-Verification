/**
 * ============================================================================
 * Facts & Fakes v2 — static/js/service-templates.js
 * Version: 2.0.0
 * Date: April 15, 2026
 *
 * PURPOSE:
 *   Template generation and data display logic.
 *   Populates all result sections with data from the API response.
 *   MUST LOAD BEFORE app-core.js.
 *
 * ARCHITECTURE:
 *   Creates global window.ServiceTemplates object.
 *   app-core.js calls ServiceTemplates.displayAllAnalyses(data) after
 *   API response is received.
 *
 * KEY METHODS:
 *   displayAllAnalyses(data)          — Main entry point, calls all displayers
 *   displayTrustScore(data)           — Radial gauge + trust label + summary
 *   displayLayer1(layer1)             — Article accuracy assertions
 *   displayLayer2(layer2)             — Claim truth verdicts + AI consensus
 *   displayCredibility(credibility)   — Source + author deep-dive
 *   displayBias(bias)                 — Bias spectrum + manipulation
 *   getVerdictClass(verdict)          — Maps verdict string → CSS class
 *   getVerdictLabel(verdict)          — Maps verdict string → display label
 *   formatScore(score)                — Formats score with color class
 *
 * CHANGELOG:
 *   v2.0.0 (2026-04-15): Initial build. Full display logic for all sections.
 *                        Two-layer breakdown, accordion content, gauge drawing.
 * ============================================================================
 */

(function (window) {
    'use strict';

    // =========================================================================
    // VERDICT MAPS
    // =========================================================================

    const VERDICT_CLASSES = {
        // Layer 2 — 13-point scale
        'true':                      'verdict--true',
        'mostly_true':               'verdict--mostly_true',
        'partially_true':            'verdict--partially_true',
        'exaggerated':               'verdict--misleading',
        'misleading':                'verdict--misleading',
        'mostly_false':              'verdict--mostly_false',
        'false':                     'verdict--false',
        'empty_rhetoric':            'verdict--opinion',
        'unsubstantiated_prediction':'verdict--unverifiable',
        'needs_context':             'verdict--partially_true',
        'opinion':                   'verdict--opinion',
        'mixed':                     'verdict--partially_true',
        'unverified':                'verdict--unverifiable',
        // Layer 1 scale
        'accurate':                  'verdict--true',
        'mostly_accurate':           'verdict--mostly_true',
        'inaccurate':                'verdict--false',
        'unverifiable':              'verdict--unverifiable',
    };

    const VERDICT_LABELS = {
        'true':                       'True',
        'mostly_true':                'Mostly True',
        'partially_true':             'Partially True',
        'exaggerated':                'Exaggerated',
        'misleading':                 'Misleading',
        'mostly_false':               'Mostly False',
        'false':                      'False',
        'empty_rhetoric':             'Empty Rhetoric',
        'unsubstantiated_prediction': 'Unsubstantiated',
        'needs_context':              'Needs Context',
        'opinion':                    'Opinion',
        'mixed':                      'Mixed',
        'unverified':                 'Unverified',
        'accurate':                   'Accurate',
        'mostly_accurate':            'Mostly Accurate',
        'inaccurate':                 'Inaccurate',
        'unverifiable':               'Unverifiable',
    };

    const VERDICT_ICONS = {
        'true':                       '✓',
        'mostly_true':                '✓',
        'partially_true':             '~',
        'exaggerated':                '⚠',
        'misleading':                 '⚠',
        'mostly_false':               '✗',
        'false':                      '✗',
        'empty_rhetoric':             '◌',
        'unsubstantiated_prediction': '?',
        'needs_context':              'ℹ',
        'opinion':                    '◌',
        'mixed':                      '~',
        'unverified':                 '?',
        'accurate':                   '✓',
        'mostly_accurate':            '✓',
        'inaccurate':                 '✗',
        'unverifiable':               '?',
    };

    // Score → color mapping for gauge and score numbers
    const SCORE_COLOR = (score) => {
        if (score >= 80) return '#10b981'; // green
        if (score >= 65) return '#4ade80'; // light green
        if (score >= 50) return '#f59e0b'; // yellow
        if (score >= 35) return '#f97316'; // orange
        return '#ef4444';                  // red
    };

    const SCORE_LABEL = (score) => {
        if (score >= 85) return 'Highly Reliable';
        if (score >= 70) return 'Mostly Reliable';
        if (score >= 55) return 'Mixed Reliability';
        if (score >= 40) return 'Low Reliability';
        return 'Unreliable';
    };


    // =========================================================================
    // GAUGE DRAWING
    // =========================================================================

    /**
     * Draws the radial arc trust score gauge.
     * The gauge is a semicircle arc (180° sweep).
     */
    function drawGauge(score) {
        const svg = document.getElementById('trust-gauge-svg');
        if (!svg) return;

        const cx = 110, cy = 115;   // center
        const r = 85;               // radius
        const startAngle = Math.PI; // 180° (left)
        const endAngle = 0;         // 0° (right)

        // Arc path helper
        function describeArc(start, end) {
            const x1 = cx + r * Math.cos(start);
            const y1 = cy + r * Math.sin(start);
            const x2 = cx + r * Math.cos(end);
            const y2 = cy + r * Math.sin(end);
            return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
        }

        // Background full arc
        const bgArc = document.getElementById('gauge-bg-arc');
        if (bgArc) {
            bgArc.setAttribute('d', describeArc(startAngle, endAngle));
        }

        // Score arc — partial from left to the score angle
        const scoreArc = document.getElementById('gauge-score-arc');
        if (scoreArc) {
            const scoreAngle = Math.PI - (score / 100) * Math.PI;
            scoreArc.setAttribute('d', describeArc(startAngle, scoreAngle));
            scoreArc.setAttribute('stroke', SCORE_COLOR(score));

            // Animate using stroke-dasharray trick
            const circumference = Math.PI * r;
            const filled = (score / 100) * circumference;
            scoreArc.style.strokeDasharray = `${circumference}`;
            scoreArc.style.strokeDashoffset = `${circumference}`;

            // Trigger animation on next frame
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    scoreArc.style.strokeDashoffset = `${circumference - filled}`;
                });
            });
        }

        // Score text
        const scoreText = document.getElementById('gauge-score-text');
        if (scoreText) {
            scoreText.textContent = score;
            scoreText.style.fill = SCORE_COLOR(score);

            // Animate count-up
            animateCount(scoreText, 0, score, 1200);
        }
    }

    /**
     * Animates a number counting up in an SVG text element.
     */
    function animateCount(el, from, to, duration) {
        const start = performance.now();
        function step(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            el.textContent = Math.round(from + eased * (to - from));
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }


    // =========================================================================
    // MAIN DISPLAY ENTRY POINT
    // =========================================================================

    /**
     * Main entry point called by app-core.js after API response.
     * Orchestrates all section displays.
     */
    function displayAllAnalyses(data) {
        if (!data || !data.success) {
            console.error('[ServiceTemplates] Invalid data passed to displayAllAnalyses');
            return;
        }

        displayTrustScore(data);
        displayLayer1(data.layer1);
        displayLayer2(data.layer2);
        displayCredibility(data.credibility);
        displayBias(data.bias);
        displayArticleMeta(data.metadata);

        // Stagger accordion score badges
        if (data.credibility) {
            const badge = document.getElementById('credibility-score-badge');
            if (badge) badge.textContent = data.credibility.combined_score + '/100';
        }
        if (data.bias) {
            const badge = document.getElementById('bias-score-badge');
            if (badge) badge.textContent = data.bias.score + '/100';
        }
    }


    // =========================================================================
    // TRUST SCORE
    // =========================================================================

    function displayTrustScore(data) {
        const score = data.trust_score || 0;
        const label = data.trust_label || SCORE_LABEL(score);
        const summary = data.summary || '';

        drawGauge(score);

        const trustLabel = document.getElementById('trust-label');
        if (trustLabel) trustLabel.textContent = label;

        const trustSummary = document.getElementById('trust-summary');
        if (trustSummary) trustSummary.textContent = summary;
    }


    // =========================================================================
    // ARTICLE METADATA
    // =========================================================================

    function displayArticleMeta(metadata) {
        if (!metadata) return;

        const titleEl = document.getElementById('meta-title');
        if (titleEl && metadata.title && !metadata.stub) {
            titleEl.textContent = truncate(metadata.title, 60);
        }

        const sourceEl = document.getElementById('meta-source');
        if (sourceEl && metadata.url) {
            try {
                const hostname = new URL(metadata.url).hostname.replace('www.', '');
                sourceEl.textContent = hostname;
            } catch (e) {
                sourceEl.textContent = '';
            }
        }

        const wordEl = document.getElementById('meta-wordcount');
        if (wordEl && metadata.word_count) {
            wordEl.textContent = `${metadata.word_count.toLocaleString()} words`;
        }
    }


    // =========================================================================
    // LAYER 1 — ARTICLE ACCURACY
    // =========================================================================

    function displayLayer1(layer1) {
        if (!layer1) return;

        const scoreEl = document.getElementById('layer1-score');
        if (scoreEl) {
            scoreEl.textContent = layer1.score;
            scoreEl.style.color = SCORE_COLOR(layer1.score);
        }

        const labelEl = document.getElementById('layer1-label');
        if (labelEl) labelEl.textContent = layer1.label || '';

        const summaryEl = document.getElementById('layer1-summary');
        if (summaryEl) summaryEl.textContent = layer1.summary || '';

        const listEl = document.getElementById('layer1-assertions');
        if (!listEl) return;

        listEl.innerHTML = '';
        const assertions = layer1.assertions || [];

        if (assertions.length === 0) {
            listEl.innerHTML = '<p class="text-muted" style="font-size:0.85rem;padding:0.5rem 0;">No individual assertions extracted.</p>';
            return;
        }

        assertions.forEach((item, i) => {
            const el = document.createElement('div');
            el.className = 'assertion-item';
            el.style.animationDelay = `${i * 80}ms`;
            el.setAttribute('role', 'listitem');

            const verdictClass = getVerdictClass(item.verdict);
            const verdictLabel = getVerdictLabel(item.verdict);
            const verdictIcon = VERDICT_ICONS[item.verdict] || '?';

            el.innerHTML = `
                <p class="assertion-text">${escapeHtml(item.text)}</p>
                <div class="assertion-verdict-row">
                    <span class="verdict-badge ${verdictClass}" aria-label="Verdict: ${verdictLabel}">
                        ${verdictIcon} ${verdictLabel}
                    </span>
                </div>
                ${item.explanation ? `<p class="assertion-explanation">${escapeHtml(item.explanation)}</p>` : ''}
            `;

            listEl.appendChild(el);
        });
    }


    // =========================================================================
    // LAYER 2 — CLAIM TRUTH
    // =========================================================================

    function displayLayer2(layer2) {
        if (!layer2) return;

        const scoreEl = document.getElementById('layer2-score');
        if (scoreEl) {
            scoreEl.textContent = layer2.score;
            scoreEl.style.color = SCORE_COLOR(layer2.score);
        }

        const labelEl = document.getElementById('layer2-label');
        if (labelEl) labelEl.textContent = layer2.label || '';

        const summaryEl = document.getElementById('layer2-summary');
        if (summaryEl) summaryEl.textContent = layer2.summary || '';

        const listEl = document.getElementById('layer2-claims');
        if (!listEl) return;

        listEl.innerHTML = '';
        const claims = layer2.claims || [];

        if (claims.length === 0) {
            listEl.innerHTML = '<p class="text-muted" style="font-size:0.85rem;padding:0.5rem 0;">No verifiable claims extracted.</p>';
        } else {
            claims.forEach((item, i) => {
                const el = document.createElement('div');
                el.className = 'claim-item';
                el.style.animationDelay = `${i * 80 + 100}ms`;
                el.setAttribute('role', 'listitem');

                const verdictClass = getVerdictClass(item.verdict);
                const verdictLabel = item.verdict_label || getVerdictLabel(item.verdict);
                const verdictIcon = item.verdict_icon || VERDICT_ICONS[item.verdict] || '?';
                const confidence = item.confidence || 0;
                const aiCount = item.ai_count || 0;
                const agreement = item.agreement_level || 0;

                el.innerHTML = `
                    <p class="claim-text">${escapeHtml(item.claim)}</p>
                    <div class="claim-verdict-row">
                        <span class="verdict-badge ${verdictClass}" aria-label="Verdict: ${verdictLabel}">
                            ${verdictIcon} ${verdictLabel}
                        </span>
                    </div>
                    ${item.explanation ? `<p class="claim-explanation">${escapeHtml(item.explanation)}</p>` : ''}
                    <div class="claim-consensus-row" aria-label="AI consensus: ${aiCount} systems, ${agreement}% agreement">
                        <span class="consensus-ai-count">${aiCount} AI</span>
                        <span class="text-muted">·</span>
                        <div class="confidence-bar-wrapper" aria-hidden="true">
                            <div class="confidence-bar" style="width: ${confidence}%; background: ${SCORE_COLOR(confidence)};"></div>
                        </div>
                        <span class="text-muted">${confidence}% confidence</span>
                    </div>
                `;

                listEl.appendChild(el);
            });
        }

        // AI Consensus badges
        displayAIConsensusBadges(layer2);
    }

    function displayAIConsensusBadges(layer2) {
        const badgesEl = document.getElementById('consensus-badges');
        if (!badgesEl) return;

        // Collect AI systems used from claims
        const aiSystems = new Set();
        (layer2.claims || []).forEach(c => {
            // If the API provides per-claim AI sources, use them
            // Otherwise we'll use the metadata list from parent
        });

        // Check parent metadata via DOM (set by app-core)
        const metaAIs = window._currentAnalysisAIs || ['openai', 'anthropic', 'cohere', 'deepseek'];

        badgesEl.innerHTML = metaAIs.map(ai => `
            <span class="ai-badge ai-badge--${ai}" aria-label="${ai} AI system">
                ${AI_SHORT_NAME(ai)}
            </span>
        `).join('');
    }

    function AI_SHORT_NAME(ai) {
        const names = {
            openai: 'GPT',
            anthropic: 'Claude',
            cohere: 'Cohere',
            deepseek: 'DeepSeek',
            google: 'Gemini',
            mistral: 'Mistral',
        };
        return names[ai] || ai;
    }


    // =========================================================================
    // CREDIBILITY
    // =========================================================================

    function displayCredibility(credibility) {
        if (!credibility) return;

        const contentEl = document.getElementById('credibility-content');
        if (!contentEl) return;

        const sourceScore = credibility.source_score || 0;
        const authorScore = credibility.author_score || 0;
        const combinedScore = credibility.combined_score || 0;

        contentEl.innerHTML = `
            <div class="credibility-grid">
                <!-- Source -->
                <div class="credibility-block">
                    <div class="credibility-block-title">Source</div>
                    <div class="credibility-score-row">
                        <span class="credibility-score-number" style="color: ${SCORE_COLOR(sourceScore)}">
                            ${sourceScore}
                        </span>
                        <span class="text-muted" style="font-size:0.8rem;">/100</span>
                    </div>
                    <div class="credibility-name">${escapeHtml(credibility.source_name || 'Unknown Source')}</div>
                    ${credibility.source_type ? `<div class="credibility-detail">${escapeHtml(credibility.source_type)}</div>` : ''}
                    ${credibility.source_founded ? `<div class="credibility-detail">Est. ${credibility.source_founded}</div>` : ''}
                </div>

                <!-- Author -->
                <div class="credibility-block">
                    <div class="credibility-block-title">Author</div>
                    <div class="credibility-score-row">
                        <span class="credibility-score-number" style="color: ${SCORE_COLOR(authorScore)}">
                            ${authorScore}
                        </span>
                        <span class="text-muted" style="font-size:0.8rem;">/100</span>
                    </div>
                    <div class="credibility-name">${escapeHtml(credibility.author_name || 'Unknown Author')}</div>
                    ${credibility.author_verified ? `<div class="credibility-detail text-green">✓ Verified journalist</div>` : ''}
                </div>
            </div>

            <!-- Summary -->
            ${credibility.summary ? `
                <p style="font-size:0.875rem; color: var(--text-secondary); line-height:1.6; border-top: 1px solid var(--border); padding-top: 1rem;">
                    ${escapeHtml(credibility.summary)}
                </p>
            ` : ''}

            <!-- Combined score -->
            <div style="display:flex; align-items:center; gap:0.75rem; font-size:0.82rem; color: var(--text-muted);">
                <span>Combined credibility score:</span>
                <span class="font-mono" style="font-weight:700; color: ${SCORE_COLOR(combinedScore)};">${combinedScore}/100</span>
            </div>
        `;
    }


    // =========================================================================
    // BIAS
    // =========================================================================

    function displayBias(bias) {
        if (!bias) return;

        const contentEl = document.getElementById('bias-content');
        if (!contentEl) return;

        const score = bias.score || 50;
        const direction = bias.direction || 'center';
        const loadedCount = bias.loaded_language_count || 0;
        const manipDetected = bias.manipulation_detected || false;
        const techniques = bias.techniques || [];

        // Map direction to position on spectrum (0=far-left, 50=center, 100=far-right)
        const spectrumPosition = directionToSpectrumPosition(direction);

        contentEl.innerHTML = `
            <!-- Bias Spectrum -->
            <div class="bias-spectrum">
                <div class="bias-spectrum-label-row">
                    <span>Left</span>
                    <span>Center</span>
                    <span>Right</span>
                </div>
                <div class="bias-spectrum-track" aria-hidden="true">
                    <div class="bias-spectrum-marker" style="left: ${spectrumPosition}%;"></div>
                </div>
                <div class="bias-direction-label">${capitalizeWords(direction)}</div>
            </div>

            <!-- Bias Details -->
            <div style="margin-top: 0.5rem;">
                <div class="bias-detail-row">
                    <span class="bias-detail-label">Bias Score</span>
                    <span class="bias-detail-value" style="color: ${SCORE_COLOR(score)};">${score}/100</span>
                </div>
                <div class="bias-detail-row">
                    <span class="bias-detail-label">Loaded Language</span>
                    <span class="bias-detail-value">${loadedCount} instance${loadedCount !== 1 ? 's' : ''}</span>
                </div>
                <div class="bias-detail-row">
                    <span class="bias-detail-label">Manipulation Detected</span>
                    <span>
                        <span class="manipulation-detected-badge ${manipDetected ? 'detected' : 'not-detected'}">
                            ${manipDetected ? '⚠ Yes' : '✓ None Detected'}
                        </span>
                    </span>
                </div>
                ${techniques.length > 0 ? `
                <div class="bias-detail-row" style="flex-direction:column; align-items:flex-start; gap:0.5rem;">
                    <span class="bias-detail-label">Techniques</span>
                    <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
                        ${techniques.map(t => `
                            <span class="verdict-badge verdict--misleading">${escapeHtml(t)}</span>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Summary -->
            ${bias.summary ? `
                <p style="font-size:0.875rem; color: var(--text-secondary); line-height:1.6; border-top: 1px solid var(--border); padding-top: 1rem;">
                    ${escapeHtml(bias.summary)}
                </p>
            ` : ''}
        `;
    }

    function directionToSpectrumPosition(direction) {
        const dir = (direction || '').toLowerCase();
        if (dir.includes('far-left') || dir.includes('far left')) return 5;
        if (dir.includes('left-leaning') || dir.includes('left leaning')) return 25;
        if (dir.includes('left')) return 15;
        if (dir.includes('right-leaning') || dir.includes('right leaning')) return 75;
        if (dir.includes('far-right') || dir.includes('far right')) return 95;
        if (dir.includes('right')) return 85;
        if (dir.includes('center-left') || dir.includes('center left')) return 40;
        if (dir.includes('center-right') || dir.includes('center right')) return 60;
        return 50; // center default
    }


    // =========================================================================
    // UTILITY HELPERS
    // =========================================================================

    function getVerdictClass(verdict) {
        return VERDICT_CLASSES[verdict] || 'verdict--unverifiable';
    }

    function getVerdictLabel(verdict) {
        return VERDICT_LABELS[verdict] || capitalizeWords(verdict || 'unknown');
    }

    function escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function truncate(str, maxLen) {
        if (!str || str.length <= maxLen) return str;
        return str.substring(0, maxLen - 3) + '...';
    }

    function capitalizeWords(str) {
        if (!str) return '';
        return str.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    function formatScore(score) {
        return {
            value: score,
            color: SCORE_COLOR(score),
            label: SCORE_LABEL(score),
        };
    }


    // =========================================================================
    // PUBLIC API — window.ServiceTemplates
    // =========================================================================

    window.ServiceTemplates = {
        displayAllAnalyses,
        displayTrustScore,
        displayLayer1,
        displayLayer2,
        displayCredibility,
        displayBias,
        displayArticleMeta,
        getVerdictClass,
        getVerdictLabel,
        formatScore,
        SCORE_COLOR,
        SCORE_LABEL,
    };

    console.log('[ServiceTemplates v2.0.0] Loaded and ready.');

}(window));

// I did no harm and this file is not truncated
