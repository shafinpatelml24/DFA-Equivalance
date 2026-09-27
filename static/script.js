/* =========================================================
   DFA EQUIVALENCE TESTER
   Complete Interactive JavaScript Engine & Enhanced SVG Renderer
   ========================================================= */

/**
 * Extract clean array of states and alphabet from inputs
 */
function getInputValues(dfaNumber) {
    const statesElement = document.getElementById("states" + dfaNumber);
    const alphabetElement = document.getElementById("alphabet" + dfaNumber);

    const states = statesElement
        ? statesElement.value
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
        : [];

    const alphabet = alphabetElement
        ? alphabetElement.value
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
        : [];

    return { states, alphabet };
}

/**
 * Generate transition table based on states and alphabet
 */
function generateTable(dfaNumber) {
    const tableContainer = document.getElementById("table" + dfaNumber);
    const diagramContainer = document.getElementById("diagram" + dfaNumber);

    if (!tableContainer) {
        alert("Transition table container not found.");
        return;
    }

    const { states, alphabet } = getInputValues(dfaNumber);

    if (states.length === 0) {
        alert("Please enter states for DFA " + dfaNumber + " (e.g. q0, q1).");
        return;
    }

    if (alphabet.length === 0) {
        alert("Please enter alphabet for DFA " + dfaNumber + " (e.g. 0, 1).");
        return;
    }

    // Retain any existing transition selections if re-generating
    const existingTransitions = {};
    const oldSelects = tableContainer.querySelectorAll('.transition-select[data-dfa="' + dfaNumber + '"]');
    oldSelects.forEach(sel => {
        const st = sel.getAttribute("data-state");
        const sym = sel.getAttribute("data-symbol");
        if (!existingTransitions[st]) existingTransitions[st] = {};
        existingTransitions[st][sym] = sel.value;
    });

    let html = `
        <table class="transition-table">
            <thead>
                <tr>
                    <th>STATE</th>
    `;

    alphabet.forEach(symbol => {
        html += `<th>Input '${escapeHTML(symbol)}'</th>`;
    });

    html += `
                </tr>
            </thead>
            <tbody>
    `;

    states.forEach(state => {
        html += `
            <tr>
                <td><strong>${escapeHTML(state)}</strong></td>
        `;

        alphabet.forEach(symbol => {
            const currentVal = existingTransitions[state] && existingTransitions[state][symbol]
                ? existingTransitions[state][symbol]
                : "";

            html += `
                <td>
                    <select
                        class="transition-select"
                        data-dfa="${dfaNumber}"
                        data-state="${escapeAttribute(state)}"
                        data-symbol="${escapeAttribute(symbol)}"
                    >
                        <option value="">Select State</option>
            `;

            states.forEach(nextState => {
                const selected = nextState === currentVal ? " selected" : "";
                html += `
                    <option value="${escapeAttribute(nextState)}"${selected}>
                        ${escapeHTML(nextState)}
                    </option>
                `;
            });

            html += `
                    </select>
                </td>
            `;
        });

        html += `</tr>`;
    });

    html += `
            </tbody>
        </table>
    `;

    tableContainer.innerHTML = html;

    // Listen for transition changes to immediately update SVG
    const selects = tableContainer.querySelectorAll(".transition-select");
    selects.forEach(select => {
        select.addEventListener("change", () => {
            createDFADiagram(dfaNumber);
        });
    });

    // Initial Diagram Render
    createDFADiagram(dfaNumber);
}

/**
 * ENHANCED DFA DIAGRAM RENDERER
 * - Circular, outward-facing self loops with arrowheads & pills
 * - Grouped multi-symbol transitions (e.g. "0, 1") avoiding duplicate lines
 * - Opposing curves for bidirectional transitions
 * - Standard automata theory double concentric circles for accepting states
 * - Start arrow with marker
 */
function createDFADiagram(dfaNumber) {
    const diagramContainer = document.getElementById("diagram" + dfaNumber);
    if (!diagramContainer) return;

    const dfa = getDFA(dfaNumber);

    if (dfa.states.length === 0) {
        diagramContainer.innerHTML = `
            <div class="diagram-box">
                <div class="diagram-header">
                    <strong>DFA ${dfaNumber} DIAGRAM</strong>
                    <span>Visual Automaton</span>
                </div>
                <div class="diagram-canvas">
                    <div class="diagram-message">Enter states and generate table to render diagram.</div>
                </div>
            </div>
        `;
        return;
    }

    const width = 860;
    const height = 520;
    const centerX = width / 2;
    const centerY = height / 2;
    const stateRadius = 36;
    const N = dfa.states.length;

    // Dynamic layout radius depending on state count
    let layoutRadius = 180;
    if (N === 2) layoutRadius = 190;
    else if (N === 3) layoutRadius = 175;
    else if (N >= 4) layoutRadius = Math.min(220, 150 + N * 12);

    // Calculate positions and outward normal angles for all states
    const positions = {};
    const outwardAngles = {};

    dfa.states.forEach((state, i) => {
        let x, y, angle;
        if (N === 1) {
            x = centerX;
            y = centerY;
            angle = -Math.PI / 2; // Point up
        } else if (N === 2) {
            angle = i === 0 ? Math.PI : 0;
            x = centerX + layoutRadius * (i === 0 ? -0.85 : 0.85);
            y = centerY;
        } else {
            angle = (-Math.PI / 2) + (2 * Math.PI * i / N);
            x = centerX + layoutRadius * Math.cos(angle);
            y = centerY + layoutRadius * Math.sin(angle);
        }

        positions[state] = { x, y };
        outwardAngles[state] = Math.atan2(y - centerY, x - centerX);
    });

    // 1. Group transitions by (source -> destination) to avoid overlapping duplicate arrows
    const edgeMap = new Map(); // key: "fromState-->toState" => Array of symbols
    Object.keys(dfa.transitions).forEach(src => {
        Object.entries(dfa.transitions[src]).forEach(([sym, dest]) => {
            if (!dest || !positions[dest]) return;
            const key = `${src}-->${dest}`;
            if (!edgeMap.has(key)) {
                edgeMap.set(key, []);
            }
            edgeMap.get(key).push(sym);
        });
    });

    // SVG Marker Defs
    let svgContent = `
        <defs>
            <!-- Standard Transition Arrowhead -->
            <marker
                id="arrowhead-${dfaNumber}"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto"
                markerUnits="strokeWidth"
            >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#4f46e5" />
            </marker>

            <!-- Self-Loop Arrowhead -->
            <marker
                id="loop-arrow-${dfaNumber}"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto"
                markerUnits="strokeWidth"
            >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#4f46e5" />
            </marker>

            <!-- Start State Arrowhead -->
            <marker
                id="start-arrow-${dfaNumber}"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto"
                markerUnits="strokeWidth"
            >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#111827" />
            </marker>
        </defs>
    `;

    // 2. Render Edges (Transitions)
    edgeMap.forEach((symbols, key) => {
        const [source, dest] = key.split("-->");
        const p1 = positions[source];
        const p2 = positions[dest];
        if (!p1 || !p2) return;

        const label = symbols.join(", ");
        const pillWidth = Math.max(26, label.length * 8.5 + 14);
        const pillHeight = 20;

        // ================= A. SELF LOOP =================
        if (source === dest) {
            let outAngle = outwardAngles[source];
            if (N === 1) outAngle = -Math.PI / 2; // Always face up for single state

            // Angular offset where loop leaves and re-enters the state circle
            const delta = 0.52; // ~30 degrees
            const a1 = outAngle - delta;
            const a2 = outAngle + delta;

            const startX = p1.x + stateRadius * Math.cos(a1);
            const startY = p1.y + stateRadius * Math.sin(a1);
            const endX = p1.x + (stateRadius + 2) * Math.cos(a2);
            const endY = p1.y + (stateRadius + 2) * Math.sin(a2);

            // Control points for a smooth, outward circular bubble
            const loopDist = 72;
            const c1x = startX + loopDist * Math.cos(a1 - 0.25);
            const c1y = startY + loopDist * Math.sin(a1 - 0.25);
            const c2x = endX + loopDist * Math.cos(a2 + 0.25);
            const c2y = endY + loopDist * Math.sin(a2 + 0.25);

            // Label position at loop peak
            const labelX = p1.x + (stateRadius + 58) * Math.cos(outAngle);
            const labelY = p1.y + (stateRadius + 58) * Math.sin(outAngle);

            svgContent += `
                <!-- Self Loop for ${escapeHTML(source)} -->
                <path
                    d="M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}"
                    fill="none"
                    stroke="#4f46e5"
                    stroke-width="2.5"
                    marker-end="url(#loop-arrow-${dfaNumber})"
                    class="diagram-edge"
                />
                <g class="diagram-pill" transform="translate(${labelX.toFixed(1)}, ${labelY.toFixed(1)})">
                    <rect
                        x="${(-pillWidth / 2).toFixed(1)}"
                        y="${(-pillHeight / 2).toFixed(1)}"
                        width="${pillWidth}"
                        height="${pillHeight}"
                        rx="6"
                        fill="#ffffff"
                        stroke="#c7d2fe"
                        stroke-width="1.5"
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
                    />
                    <text
                        x="0"
                        y="0"
                        text-anchor="middle"
                        dominant-baseline="central"
                        class="edge-label"
                    >${escapeHTML(label)}</text>
                </g>
            `;
            return;
        }

        // ================= B. INTER-STATE TRANSITION =================
        const revKey = `${dest}-->${source}`;
        const hasReverse = edgeMap.has(revKey);

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        if (dist === 0) return;

        const ux = dx / dist;
        const uy = dy / dist;
        // Normal vector pointing to the right of the direction vector
        const nx = -uy;
        const ny = ux;

        let pathD = "";
        let midX = 0, midY = 0;

        if (hasReverse) {
            // Curvature offset so A->B and B->A curve nicely away from each other
            const curveOffset = 38;
            const cx = (p1.x + p2.x) / 2 + curveOffset * nx;
            const cy = (p1.y + p2.y) / 2 + curveOffset * ny;

            // Start point along direction towards control point
            const d1 = Math.hypot(cx - p1.x, cy - p1.y);
            const startX = p1.x + stateRadius * ((cx - p1.x) / d1);
            const startY = p1.y + stateRadius * ((cy - p1.y) / d1);

            // End point along direction from control point towards target
            const d2 = Math.hypot(p2.x - cx, p2.y - cy);
            const endX = p2.x - (stateRadius + 3) * ((p2.x - cx) / d2);
            const endY = p2.y - (stateRadius + 3) * ((p2.y - cy) / d2);

            pathD = `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;

            // Midpoint on quadratic bezier at t = 0.5
            midX = 0.25 * startX + 0.5 * cx + 0.25 * endX;
            midY = 0.25 * startY + 0.5 * cy + 0.25 * endY;
        } else {
            // Single-direction edge: straight line with slight midpoint check
            const startX = p1.x + stateRadius * ux;
            const startY = p1.y + stateRadius * uy;
            const endX = p2.x - (stateRadius + 3) * ux;
            const endY = p2.y - (stateRadius + 3) * uy;

            pathD = `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`;
            midX = (startX + endX) / 2;
            midY = (startY + endY) / 2;
        }

        svgContent += `
            <path
                d="${pathD}"
                fill="none"
                stroke="#4f46e5"
                stroke-width="2.5"
                marker-end="url(#arrowhead-${dfaNumber})"
                class="diagram-edge"
            />
            <g class="diagram-pill" transform="translate(${midX.toFixed(1)}, ${midY.toFixed(1)})">
                <rect
                    x="${(-pillWidth / 2).toFixed(1)}"
                    y="${(-pillHeight / 2).toFixed(1)}"
                    width="${pillWidth}"
                    height="${pillHeight}"
                    rx="6"
                    fill="#ffffff"
                    stroke="#c7d2fe"
                    stroke-width="1.5"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
                />
                <text
                    x="0"
                    y="0"
                    text-anchor="middle"
                    dominant-baseline="central"
                    class="edge-label"
                >${escapeHTML(label)}</text>
            </g>
        `;
    });

    // 3. Render Start State Arrow
    if (dfa.start && positions[dfa.start]) {
        const pStart = positions[dfa.start];
        const outAngle = outwardAngles[dfa.start];

        let arrowStartX, arrowStartY, arrowEndX, arrowEndY;
        if (N === 1) {
            arrowStartX = pStart.x - 90;
            arrowStartY = pStart.y;
            arrowEndX = pStart.x - stateRadius - 3;
            arrowEndY = pStart.y;
        } else {
            // Incoming arrow from outward direction
            const distFromNode = 65;
            arrowStartX = pStart.x + (stateRadius + distFromNode) * Math.cos(outAngle);
            arrowStartY = pStart.y + (stateRadius + distFromNode) * Math.sin(outAngle);
            arrowEndX = pStart.x + (stateRadius + 3) * Math.cos(outAngle);
            arrowEndY = pStart.y + (stateRadius + 3) * Math.sin(outAngle);
        }

        svgContent += `
            <!-- Start Pointer -->
            <line
                x1="${arrowStartX.toFixed(1)}"
                y1="${arrowStartY.toFixed(1)}"
                x2="${arrowEndX.toFixed(1)}"
                y2="${arrowEndY.toFixed(1)}"
                stroke="#111827"
                stroke-width="2.8"
                marker-end="url(#start-arrow-${dfaNumber})"
            />
            <text
                x="${arrowStartX.toFixed(1)}"
                y="${(arrowStartY - 8).toFixed(1)}"
                text-anchor="middle"
                font-size="11"
                font-weight="800"
                fill="#111827"
                letter-spacing="1"
            >START</text>
        `;
    }

    // 4. Render State Nodes (Circles + Concentric Inner Rings for Accepting States)
    dfa.states.forEach(state => {
        const p = positions[state];
        const isFinal = dfa.finalStates.includes(state);
        const isStart = state === dfa.start;

        svgContent += `
            <g class="state-group" tabindex="0">
                <!-- Outer Node Circle (Pure White Background) -->
                <circle
                    cx="${p.x.toFixed(1)}"
                    cy="${p.y.toFixed(1)}"
                    r="${stateRadius}"
                    fill="#ffffff"
                    stroke="#4f46e5"
                    stroke-width="2.8"
                    class="state-circle-svg"
                />
        `;

        // Double Concentric Ring for Final/Accepting States (Automata Standard)
        if (isFinal) {
            svgContent += `
                <circle
                    cx="${p.x.toFixed(1)}"
                    cy="${p.y.toFixed(1)}"
                    r="${stateRadius - 7}"
                    fill="none"
                    stroke="#4f46e5"
                    stroke-width="2.2"
                    class="state-inner-circle-svg"
                />
            `;
        }

        svgContent += `
                <!-- State Label -->
                <text
                    x="${p.x.toFixed(1)}"
                    y="${p.y.toFixed(1)}"
                    text-anchor="middle"
                    dominant-baseline="central"
                    class="state-text-svg"
                >${escapeHTML(state)}</text>
            </g>
        `;
    });

    const html = `
        <div class="diagram-box">
            <div class="diagram-header">
                <strong>DFA ${dfaNumber} DIAGRAM</strong>
                <span>${N} state${N > 1 ? 's' : ''} • ${dfa.alphabet.join(', ')}</span>
            </div>
            <div class="diagram-canvas">
                <svg
                    class="graph-svg"
                    viewBox="0 0 ${width} ${height}"
                    preserveAspectRatio="xMidYMid meet"
                >
                    ${svgContent}
                </svg>
            </div>
        </div>
    `;

    diagramContainer.innerHTML = html;
}

/**
 * Retrieve DFA model from input fields and transition dropdowns
 */
function getDFA(dfaNumber) {
    const statesElement = document.getElementById("states" + dfaNumber);
    const alphabetElement = document.getElementById("alphabet" + dfaNumber);
    const startElement = document.getElementById("start" + dfaNumber);
    const finalElement = document.getElementById("final" + dfaNumber);

    const states = statesElement
        ? statesElement.value
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
        : [];

    const alphabet = alphabetElement
        ? alphabetElement.value
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
        : [];

    const start = startElement ? startElement.value.trim() : "";

    const finalStates = finalElement
        ? finalElement.value
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
        : [];

    const transitions = {};
    const selects = document.querySelectorAll('.transition-select[data-dfa="' + dfaNumber + '"]');

    selects.forEach(select => {
        const state = select.getAttribute("data-state");
        const symbol = select.getAttribute("data-symbol");
        const destination = select.value;

        if (!transitions[state]) {
            transitions[state] = {};
        }
        transitions[state][symbol] = destination;
    });

    return {
        states,
        alphabet,
        start,
        finalStates,
        transitions
    };
}

/**
 * Validate DFA completeness and consistency
 */
function validateDFA(dfa, number) {
    if (dfa.states.length === 0) {
        return `DFA ${number}: States are required.`;
    }

    if (dfa.alphabet.length === 0) {
        return `DFA ${number}: Alphabet is required.`;
    }

    if (!dfa.start) {
        return `DFA ${number}: Start state is required.`;
    }

    if (!dfa.states.includes(dfa.start)) {
        return `DFA ${number}: Start state "${dfa.start}" does not exist in States list.`;
    }

    for (const finalState of dfa.finalStates) {
        if (!dfa.states.includes(finalState)) {
            return `DFA ${number}: Accepting state "${finalState}" does not exist in States list.`;
        }
    }

    for (const state of dfa.states) {
        if (!dfa.transitions[state]) {
            return `DFA ${number}: Transition table is missing for state "${state}".`;
        }

        for (const symbol of dfa.alphabet) {
            const destination = dfa.transitions[state][symbol];
            if (!destination) {
                return `DFA ${number}: Please select a transition for state "${state}" on input "${symbol}".`;
            }
            if (!dfa.states.includes(destination)) {
                return `DFA ${number}: Invalid destination state "${destination}" for transition (${state}, ${symbol}).`;
            }
        }
    }

    return null;
}

/**
 * Test Equivalence using BFS on the Product Automaton M1 x M2
 */
function testEquivalence() {
    const dfa1 = getDFA(1);
    const dfa2 = getDFA(2);

    const error1 = validateDFA(dfa1, 1);
    if (error1) {
        alert(error1);
        return;
    }

    const error2 = validateDFA(dfa2, 2);
    if (error2) {
        alert(error2);
        return;
    }

    // Alphabet check
    const alph1 = dfa1.alphabet.slice().sort();
    const alph2 = dfa2.alphabet.slice().sort();
    if (JSON.stringify(alph1) !== JSON.stringify(alph2)) {
        alert("Both DFAs must share the same alphabet (e.g. both '0, 1').");
        return;
    }

    // Product Automaton BFS exploration
    const queue = [
        {
            state1: dfa1.start,
            state2: dfa2.start,
            string: ""
        }
    ];

    const visited = new Set();
    const jointStates = [];
    let transitionsChecked = 0;
    let mismatch = null;

    while (queue.length > 0) {
        const current = queue.shift();
        const { state1, state2, string: currentString } = current;
        const pairKey = `${state1}|${state2}`;

        if (visited.has(pairKey)) continue;
        visited.add(pairKey);

        const isFinal1 = dfa1.finalStates.includes(state1);
        const isFinal2 = dfa2.finalStates.includes(state2);

        const pair = {
            state1,
            state2,
            isFinal1,
            isFinal2,
            string: currentString,
            transitions: {}
        };

        // Check acceptance condition discrepancy
        if (isFinal1 !== isFinal2) {
            mismatch = pair;
            jointStates.push(pair);
            break;
        }

        // Explore transitions
        for (const symbol of dfa1.alphabet) {
            const next1 = dfa1.transitions[state1][symbol];
            const next2 = dfa2.transitions[state2][symbol];
            transitionsChecked++;

            pair.transitions[symbol] = {
                next1,
                next2
            };

            const nextKey = `${next1}|${next2}`;
            const nextString = currentString + symbol;

            if (!visited.has(nextKey)) {
                queue.push({
                    state1: next1,
                    state2: next2,
                    string: nextString
                });
            }
        }

        jointStates.push(pair);
    }

    const equivalent = mismatch === null;
    displayResult(equivalent, mismatch, jointStates, transitionsChecked, dfa1, dfa2);
}

/**
 * Product Graph reachable sequence breadcrumbs
 */
function createProductGraph(jointStates) {
    let html = `
        <div class="product-graph-box">
            <div class="joint-header">
                <strong>PRODUCT DFA PATH EXPLORATION</strong>
                <span>Reachable Sequence Order (${jointStates.length})</span>
            </div>
            <div class="product-graph">
    `;

    if (jointStates.length === 0) {
        html += `<div class="diagram-message">No reachable states found.</div>`;
    }

    jointStates.forEach((pair, index) => {
        const isMismatch = pair.isFinal1 !== pair.isFinal2;
        let stateClass = "product-state";
        if (index === 0) stateClass += " start-node";
        if (isMismatch) stateClass += " mismatch-node";

        html += `
            <div class="product-node">
                <div class="${stateClass}">
                    (${escapeHTML(pair.state1)}, ${escapeHTML(pair.state2)})
                    <span class="product-input">
                        Path: ${pair.string === "" ? "ε (empty)" : escapeHTML(pair.string)}
                    </span>
                    ${isMismatch ? `<span class="product-warning">MISMATCH DETECTED</span>` : ""}
                </div>
        `;

        if (index < jointStates.length - 1) {
            const nextPair = jointStates[index + 1];
            let transitionSymbol = "";

            Object.entries(pair.transitions).forEach(([sym, dest]) => {
                if (dest.next1 === nextPair.state1 && dest.next2 === nextPair.state2) {
                    transitionSymbol = sym;
                }
            });

            html += `
                <div class="product-arrow">
                    <div class="product-arrow-symbol">→</div>
                    <div class="product-arrow-label">${transitionSymbol ? escapeHTML(transitionSymbol) : "step"}</div>
                </div>
            `;
        }

        html += `</div>`;
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

/**
 * EQUIVALENCE TRANSITION DIAGRAM (SVG)
 * Complete visual transition graph for the Product Automaton M1 x M2.
 * - Circular outward self-loops
 * - Clean white background for all state nodes
 * - Double concentric circles for accepting/matching final states (or mismatch)
 * - Directed transition arrows labeled with input symbols
 * - Incoming START arrow
 */
function createEquivalenceDiagram(jointStates, dfa1, dfa2, mismatch, equivalent) {
    if (!jointStates || jointStates.length === 0) return "";

    const width = 920;
    const height = 560;
    const centerX = width / 2;
    const centerY = height / 2;
    const nodeRadius = 40;
    const K = jointStates.length;

    let layoutRadius = 190;
    if (K === 2) layoutRadius = 180;
    else if (K >= 3) layoutRadius = Math.min(235, 155 + K * 12);

    const positions = {};
    const outwardAngles = {};

    jointStates.forEach((pair, i) => {
        const key = `(${pair.state1},${pair.state2})`;
        let x, y, angle;

        if (K === 1) {
            x = centerX;
            y = centerY;
            angle = -Math.PI / 2;
        } else if (K === 2) {
            angle = i === 0 ? Math.PI : 0;
            x = centerX + (i === 0 ? -180 : 180);
            y = centerY;
        } else {
            angle = (-Math.PI / 2) + (2 * Math.PI * i / K);
            x = centerX + layoutRadius * Math.cos(angle);
            y = centerY + layoutRadius * Math.sin(angle);
        }

        positions[key] = { x, y };
        outwardAngles[key] = Math.atan2(y - centerY, x - centerX);
    });

    // 1. Group transitions by (sourceKey --> destKey)
    const edgeMap = new Map();
    jointStates.forEach(pair => {
        const srcKey = `(${pair.state1},${pair.state2})`;
        Object.entries(pair.transitions).forEach(([sym, dest]) => {
            const destKey = `(${dest.next1},${dest.next2})`;
            if (!positions[destKey]) return;
            const edgeKey = `${srcKey}-->${destKey}`;
            if (!edgeMap.has(edgeKey)) {
                edgeMap.set(edgeKey, []);
            }
            edgeMap.get(edgeKey).push(sym);
        });
    });

    // Marker Defs
    let svgContent = `
        <defs>
            <marker
                id="eq-arrowhead"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto"
                markerUnits="strokeWidth"
            >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#4f46e5" />
            </marker>
            <marker
                id="eq-loop-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto"
                markerUnits="strokeWidth"
            >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#4f46e5" />
            </marker>
            <marker
                id="eq-start-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto"
                markerUnits="strokeWidth"
            >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#111827" />
            </marker>
        </defs>
    `;

    // 2. Render Transitions
    edgeMap.forEach((symbols, edgeKey) => {
        const [srcKey, destKey] = edgeKey.split("-->");
        const p1 = positions[srcKey];
        const p2 = positions[destKey];
        if (!p1 || !p2) return;

        const label = symbols.join(", ");
        const pillWidth = Math.max(28, label.length * 8.5 + 14);
        const pillHeight = 20;

        // A. Self-Loop on joint state
        if (srcKey === destKey) {
            let outAngle = outwardAngles[srcKey];
            if (K === 1) outAngle = -Math.PI / 2;

            const delta = 0.52;
            const a1 = outAngle - delta;
            const a2 = outAngle + delta;

            const startX = p1.x + nodeRadius * Math.cos(a1);
            const startY = p1.y + nodeRadius * Math.sin(a1);
            const endX = p1.x + (nodeRadius + 2) * Math.cos(a2);
            const endY = p1.y + (nodeRadius + 2) * Math.sin(a2);

            const loopDist = 72;
            const c1x = startX + loopDist * Math.cos(a1 - 0.25);
            const c1y = startY + loopDist * Math.sin(a1 - 0.25);
            const c2x = endX + loopDist * Math.cos(a2 + 0.25);
            const c2y = endY + loopDist * Math.sin(a2 + 0.25);

            const labelX = p1.x + (nodeRadius + 60) * Math.cos(outAngle);
            const labelY = p1.y + (nodeRadius + 60) * Math.sin(outAngle);

            svgContent += `
                <path
                    d="M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}"
                    fill="none"
                    stroke="#4f46e5"
                    stroke-width="2.5"
                    marker-end="url(#eq-loop-arrow)"
                    class="diagram-edge"
                />
                <g class="diagram-pill" transform="translate(${labelX.toFixed(1)}, ${labelY.toFixed(1)})">
                    <rect
                        x="${(-pillWidth / 2).toFixed(1)}"
                        y="${(-pillHeight / 2).toFixed(1)}"
                        width="${pillWidth}"
                        height="${pillHeight}"
                        rx="6"
                        fill="#ffffff"
                        stroke="#c7d2fe"
                        stroke-width="1.5"
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
                    />
                    <text
                        x="0"
                        y="0"
                        text-anchor="middle"
                        dominant-baseline="central"
                        class="edge-label"
                    >${escapeHTML(label)}</text>
                </g>
            `;
            return;
        }

        // B. Inter-state transition
        const revKey = `${destKey}-->${srcKey}`;
        const hasReverse = edgeMap.has(revKey);

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        if (dist === 0) return;

        const ux = dx / dist;
        const uy = dy / dist;
        const nx = -uy;
        const ny = ux;

        let pathD = "";
        let midX = 0, midY = 0;

        if (hasReverse) {
            const curveOffset = 40;
            const cx = (p1.x + p2.x) / 2 + curveOffset * nx;
            const cy = (p1.y + p2.y) / 2 + curveOffset * ny;

            const d1 = Math.hypot(cx - p1.x, cy - p1.y);
            const startX = p1.x + nodeRadius * ((cx - p1.x) / d1);
            const startY = p1.y + nodeRadius * ((cy - p1.y) / d1);

            const d2 = Math.hypot(p2.x - cx, p2.y - cy);
            const endX = p2.x - (nodeRadius + 3) * ((p2.x - cx) / d2);
            const endY = p2.y - (nodeRadius + 3) * ((p2.y - cy) / d2);

            pathD = `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
            midX = 0.25 * startX + 0.5 * cx + 0.25 * endX;
            midY = 0.25 * startY + 0.5 * cy + 0.25 * endY;
        } else {
            const startX = p1.x + nodeRadius * ux;
            const startY = p1.y + nodeRadius * uy;
            const endX = p2.x - (nodeRadius + 3) * ux;
            const endY = p2.y - (nodeRadius + 3) * uy;

            pathD = `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`;
            midX = (startX + endX) / 2;
            midY = (startY + endY) / 2;
        }

        svgContent += `
            <path
                d="${pathD}"
                fill="none"
                stroke="#4f46e5"
                stroke-width="2.5"
                marker-end="url(#eq-arrowhead)"
                class="diagram-edge"
            />
            <g class="diagram-pill" transform="translate(${midX.toFixed(1)}, ${midY.toFixed(1)})">
                <rect
                    x="${(-pillWidth / 2).toFixed(1)}"
                    y="${(-pillHeight / 2).toFixed(1)}"
                    width="${pillWidth}"
                    height="${pillHeight}"
                    rx="6"
                    fill="#ffffff"
                    stroke="#c7d2fe"
                    stroke-width="1.5"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
                />
                <text
                    x="0"
                    y="0"
                    text-anchor="middle"
                    dominant-baseline="central"
                    class="edge-label"
                >${escapeHTML(label)}</text>
            </g>
        `;
    });

    // 3. Start Arrow pointing to (dfa1.start, dfa2.start)
    const startKey = `(${dfa1.start},${dfa2.start})`;
    if (positions[startKey]) {
        const pStart = positions[startKey];
        const outAngle = outwardAngles[startKey] !== undefined ? outwardAngles[startKey] : Math.PI;

        let arrowStartX, arrowStartY, arrowEndX, arrowEndY;
        if (K === 1) {
            arrowStartX = pStart.x - 90;
            arrowStartY = pStart.y;
            arrowEndX = pStart.x - nodeRadius - 3;
            arrowEndY = pStart.y;
        } else {
            const distFromNode = 65;
            arrowStartX = pStart.x + (nodeRadius + distFromNode) * Math.cos(outAngle);
            arrowStartY = pStart.y + (nodeRadius + distFromNode) * Math.sin(outAngle);
            arrowEndX = pStart.x + (nodeRadius + 3) * Math.cos(outAngle);
            arrowEndY = pStart.y + (nodeRadius + 3) * Math.sin(outAngle);
        }

        svgContent += `
            <line
                x1="${arrowStartX.toFixed(1)}"
                y1="${arrowStartY.toFixed(1)}"
                x2="${arrowEndX.toFixed(1)}"
                y2="${arrowEndY.toFixed(1)}"
                stroke="#111827"
                stroke-width="2.8"
                marker-end="url(#eq-start-arrow)"
            />
            <text
                x="${arrowStartX.toFixed(1)}"
                y="${(arrowStartY - 8).toFixed(1)}"
                text-anchor="middle"
                font-size="11"
                font-weight="800"
                fill="#111827"
                letter-spacing="1"
            >START</text>
        `;
    }

    // 4. Render Joint State Nodes (White background, double circle for accepting or mismatch)
    jointStates.forEach(pair => {
        const key = `(${pair.state1},${pair.state2})`;
        const p = positions[key];
        if (!p) return;

        const isMismatch = pair.isFinal1 !== pair.isFinal2;
        const isBothFinal = pair.isFinal1 && pair.isFinal2;
        const hasDoubleCircle = isBothFinal || isMismatch;
        const strokeColor = isMismatch ? "#e11d48" : "#4f46e5";

        svgContent += `
            <g class="state-group" tabindex="0">
                <!-- Pure White Background Circle -->
                <circle
                    cx="${p.x.toFixed(1)}"
                    cy="${p.y.toFixed(1)}"
                    r="${nodeRadius}"
                    fill="#ffffff"
                    stroke="${strokeColor}"
                    stroke-width="2.8"
                    class="state-circle-svg"
                />
        `;

        if (hasDoubleCircle) {
            svgContent += `
                <!-- Concentric Double Circle for Final / Accepting State -->
                <circle
                    cx="${p.x.toFixed(1)}"
                    cy="${p.y.toFixed(1)}"
                    r="${nodeRadius - 7}"
                    fill="none"
                    stroke="${strokeColor}"
                    stroke-width="2.2"
                    class="state-inner-circle-svg"
                />
            `;
        }

        svgContent += `
                <!-- Joint State Label -->
                <text
                    x="${p.x.toFixed(1)}"
                    y="${p.y.toFixed(1)}"
                    text-anchor="middle"
                    dominant-baseline="central"
                    font-size="12.5"
                    font-weight="800"
                    fill="#111827"
                    class="state-text-svg"
                >(${escapeHTML(pair.state1)}, ${escapeHTML(pair.state2)})</text>
        `;

        if (isMismatch) {
            svgContent += `
                <g transform="translate(${p.x.toFixed(1)}, ${(p.y + nodeRadius + 14).toFixed(1)})">
                    <rect
                        x="-36"
                        y="-8"
                        width="72"
                        height="16"
                        rx="4"
                        fill="#fee2e2"
                        stroke="#fca5a5"
                        stroke-width="1.2"
                    />
                    <text
                        x="0"
                        y="0"
                        text-anchor="middle"
                        dominant-baseline="central"
                        font-size="8.5"
                        font-weight="900"
                        fill="#be123c"
                        letter-spacing="0.5"
                    >MISMATCH</text>
                </g>
            `;
        }

        svgContent += `</g>`;
    });

    return `
        <div class="diagram-box equivalence-diagram-box">
            <div class="diagram-header">
                <div>
                    <strong>EQUIVALENCE TRANSITION DIAGRAM (PRODUCT DFA M₁ × M₂)</strong>
                    <span style="display:block; font-size: 10px; color: #6b7280; margin-top: 3px;">
                        ${K} reachable joint state${K > 1 ? 's' : ''} • Complete product transitions over Σ = {${dfa1.alphabet.join(', ')}}
                    </span>
                </div>
                <div class="equivalence-legend">
                    <span class="legend-item"><span class="legend-double-ring"></span> Accepting Joint State</span>
                    ${mismatch ? '<span class="legend-item mismatch-legend"><span class="legend-double-ring mismatch"></span> Mismatch State</span>' : ''}
                </div>
            </div>
            <div class="diagram-canvas">
                <svg
                    class="graph-svg equivalence-svg"
                    viewBox="0 0 ${width} ${height}"
                    preserveAspectRatio="xMidYMid meet"
                >
                    ${svgContent}
                </svg>
            </div>
        </div>
    `;
}

/**
 * Display Final Equivalence Test Result and Tables
 */
function displayResult(equivalent, mismatch, jointStates, transitionsChecked, dfa1, dfa2) {
    const statesExploredEl = document.getElementById("statesExplored");
    const pairsGeneratedEl = document.getElementById("pairsGenerated");
    const transitionsCheckedEl = document.getElementById("transitionsChecked");
    const resultStatusEl = document.getElementById("resultStatus");
    const resultEl = document.getElementById("result");

    if (statesExploredEl) statesExploredEl.textContent = jointStates.length;
    if (pairsGeneratedEl) pairsGeneratedEl.textContent = jointStates.length;
    if (transitionsCheckedEl) transitionsCheckedEl.textContent = transitionsChecked;
    if (resultStatusEl) {
        resultStatusEl.textContent = equivalent ? "EQUIVALENT" : "NOT EQUIVALENT";
        resultStatusEl.style.color = equivalent ? "#16a34a" : "#e11d48";
    }

    let html = "";

    if (equivalent) {
        html += `
            <div class="result-message success">
                <div class="result-icon">✓</div>
                <div>
                    <h3>The DFAs are Equivalent!</h3>
                    <p>
                        Both DFAs accept exactly the same regular language: <strong>L(M₁) = L(M₂)</strong>.
                        Every reachable joint state pair in the product automaton has matching acceptance behavior.
                    </p>
                </div>
            </div>
        `;
    } else {
        const witness = mismatch.string;
        const displayWitness = witness === "" ? "ε (the empty string)" : `"${escapeHTML(witness)}"`;

        html += `
            <div class="result-message failure">
                <div class="result-icon">✕</div>
                <div>
                    <h3>The DFAs are NOT Equivalent</h3>
                    <p>
                        A reachable joint state with conflicting acceptance behavior was discovered in the product automaton.
                    </p>
                </div>
            </div>

            <div class="result-message failure">
                <div class="result-icon witness-icon">⚡</div>
                <div>
                    <div class="result-label">DISTINGUISHING WITNESS STRING</div>
                    <h3>${displayWitness}</h3>
                    <p>
                        DFA 1 &rarr; <strong>${mismatch.isFinal1 ? "ACCEPTS" : "REJECTS"}</strong>
                        &nbsp;&nbsp;|&nbsp;&nbsp;
                        DFA 2 &rarr; <strong>${mismatch.isFinal2 ? "ACCEPTS" : "REJECTS"}</strong>
                    </p>
                    <p style="margin-top: 6px; font-size: 11px; opacity: 0.85;">
                        This counterexample string proves that the two automata accept different languages.
                    </p>
                </div>
            </div>
        `;
    }

    // Render EQUIVALENCE TRANSITION DIAGRAM (SVG)
    if (dfa1 && dfa2) {
        html += createEquivalenceDiagram(jointStates, dfa1, dfa2, mismatch, equivalent);
    }

    // Render Product Graph Breadcrumbs
    html += createProductGraph(jointStates);

    // Render Joint State Table
    html += `
        <div class="joint-table-box">
            <div class="joint-header">
                <strong>JOINT STATE TABLE</strong>
                <span>Explored Product Automaton States</span>
            </div>
            <div style="overflow-x:auto;">
                <table class="joint-table">
                    <thead>
                        <tr>
                            <th>JOINT STATE (q, p)</th>
                            <th>REACHED VIA STRING</th>
                            <th>TRANSITIONS</th>
                            <th>ACCEPTANCE STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    jointStates.forEach(pair => {
        let transitionHTML = "";
        Object.entries(pair.transitions).forEach(([symbol, dest]) => {
            transitionHTML += `
                <div>
                    <strong>${escapeHTML(symbol)}</strong> &rarr; (${escapeHTML(dest.next1)}, ${escapeHTML(dest.next2)})
                </div>
            `;
        });

        const acceptanceMatch = pair.isFinal1 === pair.isFinal2;

        html += `
            <tr>
                <td><strong>(${escapeHTML(pair.state1)}, ${escapeHTML(pair.state2)})</strong></td>
                <td><code>${pair.string === "" ? "ε" : escapeHTML(pair.string)}</code></td>
                <td>${transitionHTML || "—"}</td>
                <td>
                    <span class="${acceptanceMatch ? 'match' : 'mismatch'}">
                        ${acceptanceMatch ? 'MATCH' : 'MISMATCH'}
                    </span>
                    <small style="display:block; margin-top: 4px; color: #6b7280;">
                        DFA 1: ${pair.isFinal1 ? 'Accept' : 'Reject'} | DFA 2: ${pair.isFinal2 ? 'Accept' : 'Reject'}
                    </small>
                </td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    if (resultEl) {
        resultEl.innerHTML = html;
    }

    const resultsSection = document.getElementById("results");
    if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: "smooth" });
    }
}

/**
 * Escaping utilities
 */
function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHTML(value);
}

// Global initialization
console.log("Enhanced DFA Equivalence Tester JavaScript loaded.");