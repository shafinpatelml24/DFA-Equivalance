/* =========================================================
   DFA EQUIVALENCE TESTER
   Complete Interactive JavaScript
   ========================================================= */


/* =========================================================
   HELPER
   ========================================================= */

function getInputValues(dfaNumber) {

    const statesElement =
        document.getElementById(
            "states" + dfaNumber
        );

    const alphabetElement =
        document.getElementById(
            "alphabet" + dfaNumber
        );

    const states =
        statesElement.value
            .split(",")
            .map(function (item) {
                return item.trim();
            })
            .filter(Boolean);

    const alphabet =
        alphabetElement.value
            .split(",")
            .map(function (item) {
                return item.trim();
            })
            .filter(Boolean);

    return {
        states: states,
        alphabet: alphabet
    };
}


/* =========================================================
   GENERATE TRANSITION TABLE
   ========================================================= */

function generateTable(dfaNumber) {

    const tableContainer =
        document.getElementById(
            "table" + dfaNumber
        );

    const diagramContainer =
        document.getElementById(
            "diagram" + dfaNumber
        );


    if (!tableContainer) {

        alert(
            "Transition table container not found."
        );

        return;
    }


    const data =
        getInputValues(dfaNumber);


    const states =
        data.states;

    const alphabet =
        data.alphabet;


    if (states.length === 0) {

        alert(
            "Please enter states for DFA " +
            dfaNumber +
            "."
        );

        return;
    }


    if (alphabet.length === 0) {

        alert(
            "Please enter alphabet for DFA " +
            dfaNumber +
            "."
        );

        return;
    }


    /* =====================================================
       CREATE TABLE
       ===================================================== */

    let html = `

        <table class="transition-table">

            <thead>

                <tr>

                    <th>
                        STATE
                    </th>

    `;


    alphabet.forEach(function (symbol) {

        html += `

                    <th>
                        ${escapeHTML(symbol)}
                    </th>

        `;

    });


    html += `

                </tr>

            </thead>

            <tbody>

    `;


    states.forEach(function (state) {

        html += `

                <tr>

                    <td>

                        <strong>
                            ${escapeHTML(state)}
                        </strong>

                    </td>

        `;


        alphabet.forEach(function (symbol) {

            html += `

                    <td>

                        <select
                            class="transition-select"
                            data-dfa="${dfaNumber}"
                            data-state="${escapeAttribute(state)}"
                            data-symbol="${escapeAttribute(symbol)}"
                        >

                            <option value="">
                                Select
                            </option>

            `;


            states.forEach(function (nextState) {

                html += `

                            <option value="${escapeAttribute(nextState)}">
                                ${escapeHTML(nextState)}
                            </option>

                `;

            });


            html += `

                        </select>

                    </td>

            `;

        });


        html += `

                </tr>

        `;

    });


    html += `

            </tbody>

        </table>

    `;


    tableContainer.innerHTML =
        html;


    /* =====================================================
       CLEAR OLD DIAGRAM
       ===================================================== */

    if (diagramContainer) {

        diagramContainer.innerHTML = "";

    }


    /* =====================================================
       LISTEN FOR TRANSITION CHANGES
       ===================================================== */

    const selects =
        tableContainer.querySelectorAll(
            ".transition-select"
        );


    selects.forEach(function (select) {

        select.addEventListener(
            "change",
            function () {

                createDFADiagram(
                    dfaNumber
                );

            }
        );

    });


    /* Create initial diagram */

    createDFADiagram(
        dfaNumber
    );
}


/* =========================================================
   CREATE DFA DIAGRAM
   ========================================================= */

function createDFADiagram(dfaNumber) {

    const diagramContainer =
        document.getElementById(
            "diagram" + dfaNumber
        );


    if (!diagramContainer) {
        return;
    }


    const dfa =
        getDFA(dfaNumber);


    if (dfa.states.length === 0) {
        return;
    }


    if (dfa.alphabet.length === 0) {
        return;
    }


    const startState =
        dfa.start;


    let html = `

        <div class="diagram-box">

            <div class="diagram-header">

                <strong>
                    DFA ${dfaNumber} TRANSITION DIAGRAM
                </strong>

                <span>
                    Automatically generated
                </span>

            </div>

            <div class="diagram-canvas">

    `;


    const hasTransitions =
        Object.keys(
            dfa.transitions
        ).some(function (state) {

            return Object.keys(
                dfa.transitions[state]
            ).some(function (symbol) {

                return dfa.transitions[state][symbol];

            });

        });


    if (!hasTransitions) {

        html += `

            <div class="diagram-message">

                Select transitions above
                to build the diagram.

            </div>

        `;

    }

    else {

        html += `

            <div class="diagram-flow">

        `;


        dfa.states.forEach(
            function (state, index) {

                const isFinal =
                    dfa.finalStates.includes(
                        state
                    );


                const isStart =
                    state === startState;


                let stateClasses =
                    "diagram-state";


                if (isFinal) {

                    stateClasses +=
                        " final";

                }


                if (isStart) {

                    stateClasses +=
                        " start";

                }


                html += `

                    <div class="diagram-state-wrap">

                        <div class="${stateClasses}">

                            ${escapeHTML(state)}

                        </div>

                `;


                if (
                    index <
                    dfa.states.length - 1
                ) {

                    const currentState =
                        state;


                    let transitionLabels = [];


                    if (
                        dfa.transitions[
                            currentState
                        ]
                    ) {

                        Object.entries(
                            dfa.transitions[
                                currentState
                            ]
                        ).forEach(
                            function (
                                entry
                            ) {

                                const symbol =
                                    entry[0];

                                const destination =
                                    entry[1];


                                if (
                                    destination
                                ) {

                                    transitionLabels.push(
                                        symbol +
                                        " → " +
                                        destination
                                    );

                                }

                            }
                        );

                    }


                    if (
                        transitionLabels.length >
                        0
                    ) {

                        html += `

                            <div class="diagram-arrow">

                                <div class="arrow-line">
                                    →
                                </div>

                                <div class="arrow-label">
                                    ${
                                        escapeHTML(
                                            transitionLabels.join(
                                                " , "
                                            )
                                        )
                                    }
                                </div>

                            </div>

                        `;

                    }

                }


                html += `

                    </div>

                `;

            }
        );


        html += `

            </div>

        `;

    }


    html += `

            </div>

        </div>

    `;


    diagramContainer.innerHTML =
        html;
}


/* =========================================================
   GET DFA
   ========================================================= */

function getDFA(dfaNumber) {

    const statesElement =
        document.getElementById(
            "states" + dfaNumber
        );


    const alphabetElement =
        document.getElementById(
            "alphabet" + dfaNumber
        );


    const startElement =
        document.getElementById(
            "start" + dfaNumber
        );


    const finalElement =
        document.getElementById(
            "final" + dfaNumber
        );


    const states =
        statesElement.value
            .split(",")
            .map(function (item) {
                return item.trim();
            })
            .filter(Boolean);


    const alphabet =
        alphabetElement.value
            .split(",")
            .map(function (item) {
                return item.trim();
            })
            .filter(Boolean);


    const start =
        startElement.value.trim();


    const finalStates =
        finalElement.value
            .split(",")
            .map(function (item) {
                return item.trim();
            })
            .filter(Boolean);


    const transitions = {};


    const selects =
        document.querySelectorAll(
            '.transition-select[data-dfa="' +
            dfaNumber +
            '"]'
        );


    selects.forEach(function (select) {

        const state =
            select.getAttribute(
                "data-state"
            );


        const symbol =
            select.getAttribute(
                "data-symbol"
            );


        const destination =
            select.value;


        if (!transitions[state]) {

            transitions[state] = {};

        }


        transitions[state][symbol] =
            destination;

    });


    return {

        states: states,

        alphabet: alphabet,

        start: start,

        finalStates: finalStates,

        transitions: transitions

    };
}


/* =========================================================
   VALIDATE DFA
   ========================================================= */

function validateDFA(
    dfa,
    number
) {

    if (
        dfa.states.length === 0
    ) {

        return (
            "DFA " +
            number +
            ": States are required."
        );

    }


    if (
        dfa.alphabet.length === 0
    ) {

        return (
            "DFA " +
            number +
            ": Alphabet is required."
        );

    }


    if (!dfa.start) {

        return (
            "DFA " +
            number +
            ": Start state is required."
        );

    }


    if (
        !dfa.states.includes(
            dfa.start
        )
    ) {

        return (
            "DFA " +
            number +
            ': Start state "' +
            dfa.start +
            '" does not exist.'
        );

    }


    for (
        const finalState
        of dfa.finalStates
    ) {

        if (
            !dfa.states.includes(
                finalState
            )
        ) {

            return (
                "DFA " +
                number +
                ': Final state "' +
                finalState +
                '" does not exist.'
            );

        }

    }


    for (
        const state
        of dfa.states
    ) {

        if (
            !dfa.transitions[state]
        ) {

            return (
                "DFA " +
                number +
                ': Transition table is missing for state "' +
                state +
                '".'
            );

        }


        for (
            const symbol
            of dfa.alphabet
        ) {

            const destination =
                dfa.transitions[
                    state
                ][symbol];


            if (!destination) {

                return (
                    "DFA " +
                    number +
                    ": Please select a transition for " +
                    state +
                    ' on "' +
                    symbol +
                    '".'
                );

            }


            if (
                !dfa.states.includes(
                    destination
                )
            ) {

                return (
                    "DFA " +
                    number +
                    ": Invalid destination state " +
                    destination +
                    "."
                );

            }

        }

    }


    return null;
}


/* =========================================================
   EQUIVALENCE TEST
   ========================================================= */

function testEquivalence() {

    const dfa1 =
        getDFA(1);


    const dfa2 =
        getDFA(2);


    /* Validate */

    const error1 =
        validateDFA(
            dfa1,
            1
        );


    if (error1) {

        alert(error1);

        return;
    }


    const error2 =
        validateDFA(
            dfa2,
            2
        );


    if (error2) {

        alert(error2);

        return;
    }


    /* Alphabet */

    const alphabet1 =
        dfa1.alphabet
            .slice()
            .sort();


    const alphabet2 =
        dfa2.alphabet
            .slice()
            .sort();


    if (
        JSON.stringify(
            alphabet1
        ) !==
        JSON.stringify(
            alphabet2
        )
    ) {

        alert(
            "Both DFAs must have the same alphabet."
        );

        return;
    }


    /* =====================================================
       BFS
       ===================================================== */

    const queue = [

        {

            state1:
                dfa1.start,

            state2:
                dfa2.start,

            string:
                ""

        }

    ];


    const visited =
        new Set();


    const jointStates =
        [];


    let transitionsChecked =
        0;


    let mismatch =
        null;


    while (
        queue.length > 0
    ) {

        const current =
            queue.shift();


        const state1 =
            current.state1;


        const state2 =
            current.state2;


        const currentString =
            current.string;


        const pairKey =
            state1 +
            "|" +
            state2;


        if (
            visited.has(
                pairKey
            )
        ) {

            continue;

        }


        visited.add(
            pairKey
        );


        const isFinal1 =
            dfa1.finalStates.includes(
                state1
            );


        const isFinal2 =
            dfa2.finalStates.includes(
                state2
            );


        const pair = {

            state1:
                state1,

            state2:
                state2,

            isFinal1:
                isFinal1,

            isFinal2:
                isFinal2,

            string:
                currentString,

            transitions:
                {}

        };


        /* Check mismatch */

        if (
            isFinal1 !==
            isFinal2
        ) {

            mismatch =
                pair;


            jointStates.push(
                pair
            );


            break;

        }


        /* Explore transitions */

        for (
            const symbol
            of dfa1.alphabet
        ) {

            const next1 =
                dfa1.transitions[
                    state1
                ][symbol];


            const next2 =
                dfa2.transitions[
                    state2
                ][symbol];


            transitionsChecked++;


            pair.transitions[
                symbol
            ] = {

                next1:
                    next1,

                next2:
                    next2

            };


            const nextKey =
                next1 +
                "|" +
                next2;


            const nextString =
                currentString +
                symbol;


            if (
                !visited.has(
                    nextKey
                )
            ) {

                queue.push({

                    state1:
                        next1,

                    state2:
                        next2,

                    string:
                        nextString

                });

            }

        }


        jointStates.push(
            pair
        );

    }


    const equivalent =
        mismatch === null;


    displayResult(

        equivalent,

        mismatch,

        jointStates,

        transitionsChecked

    );
}


/* =========================================================
   PRODUCT GRAPH
   ========================================================= */

function createProductGraph(
    jointStates
) {

    let html = `

        <div class="product-graph-box">

            <div class="joint-header">

                <strong>
                    PRODUCT DFA GRAPH
                </strong>

                <span>
                    Reachable Joint States
                </span>

            </div>

            <div class="product-graph">

    `;


    if (
        jointStates.length === 0
    ) {

        html += `

            <div class="diagram-message">
                No reachable states found.
            </div>

        `;

    }


    jointStates.forEach(
        function (
            pair,
            index
        ) {

            const isMismatch =
                pair.isFinal1 !==
                pair.isFinal2;


            let stateClass =
                "product-state";


            if (
                index === 0
            ) {

                stateClass +=
                    " start-node";

            }


            if (
                isMismatch
            ) {

                stateClass +=
                    " mismatch-node";

            }


            html += `

                <div class="product-node">

                    <div class="${stateClass}">

                        (${escapeHTML(
                            pair.state1
                        )},
                        ${escapeHTML(
                            pair.state2
                        )})

                        <span class="product-input">

                            Input:
                            ${
                                pair.string === ""
                                    ? "ε"
                                    : escapeHTML(
                                        pair.string
                                      )
                            }

                        </span>

            `;


            if (
                isMismatch
            ) {

                html += `

                        <span class="product-warning">
                            MISMATCH
                        </span>

                `;

            }


            html += `

                    </div>

            `;


            if (
                index <
                jointStates.length - 1
            ) {

                const nextPair =
                    jointStates[
                        index + 1
                    ];


                let transitionSymbol =
                    "";


                Object.entries(
                    pair.transitions
                ).forEach(
                    function (
                        entry
                    ) {

                        const symbol =
                            entry[0];

                        const destination =
                            entry[1];


                        if (
                            destination.next1 ===
                            nextPair.state1 &&
                            destination.next2 ===
                            nextPair.state2
                        ) {

                            transitionSymbol =
                                symbol;

                        }

                    }
                );


                html += `

                    <div class="product-arrow">

                        <div class="product-arrow-symbol">
                            →
                        </div>

                        <div class="product-arrow-label">

                            ${
                                transitionSymbol
                                    ? escapeHTML(
                                        transitionSymbol
                                      )
                                    : "next"
                            }

                        </div>

                    </div>

                `;

            }


            html += `

                </div>

            `;

        }
    );


    html += `

            </div>

        </div>

    `;


    return html;
}


/* =========================================================
   DISPLAY RESULT
   ========================================================= */

function displayResult(

    equivalent,

    mismatch,

    jointStates,

    transitionsChecked

) {

    document.getElementById(
        "statesExplored"
    ).textContent =
        jointStates.length;


    document.getElementById(
        "pairsGenerated"
    ).textContent =
        jointStates.length;


    document.getElementById(
        "transitionsChecked"
    ).textContent =
        transitionsChecked;


    document.getElementById(
        "resultStatus"
    ).textContent =

        equivalent
            ? "EQUIVALENT"
            : "NOT EQUIVALENT";


    let html = "";


    /* =====================================================
       RESULT STATUS
       ===================================================== */

    if (equivalent) {

        html += `

            <div class="result-message success">

                <div class="result-icon">
                    ✓
                </div>

                <div>

                    <h3>
                        The DFAs are Equivalent
                    </h3>

                    <p>

                        Both DFAs accept the same regular
                        language. Every reachable joint state
                        has matching acceptance behavior.

                    </p>

                </div>

            </div>

        `;

    }

    else {

        html += `

            <div class="result-message failure">

                <div class="result-icon">
                    !
                </div>

                <div>

                    <h3>
                        The DFAs are Not Equivalent
                    </h3>

                    <p>

                        A reachable joint state with
                        different acceptance behavior
                        was found.

                    </p>

                </div>

            </div>

        `;


        const witness =
            mismatch.string;


        const displayWitness =
            witness === ""
                ? "ε (empty string)"
                : escapeHTML(
                    witness
                  );


        html += `

            <div class="result-message failure">

                <div class="result-icon">
                    W
                </div>

                <div>

                    <div class="result-label">
                        DISTINGUISHING STRING / WITNESS
                    </div>

                    <h3>
                        ${displayWitness}
                    </h3>

                    <p>

                        DFA 1 →

                        <strong>
                            ${
                                mismatch.isFinal1
                                    ? "ACCEPT"
                                    : "REJECT"
                            }
                        </strong>

                        &nbsp;&nbsp;|&nbsp;&nbsp;

                        DFA 2 →

                        <strong>
                            ${
                                mismatch.isFinal2
                                    ? "ACCEPT"
                                    : "REJECT"
                            }
                        </strong>

                    </p>

                    <p>

                        This string proves that the two
                        DFAs accept different languages.

                    </p>

                </div>

            </div>

        `;

    }


    /* =====================================================
       PRODUCT GRAPH
       ===================================================== */

    html += createProductGraph(
        jointStates
    );


    /* =====================================================
       JOINT TABLE
       ===================================================== */

    html += `

        <div class="joint-table-box">

            <div class="joint-header">

                <strong>
                    JOINT STATE TABLE
                </strong>

                <span>
                    Reachable product states
                </span>

            </div>

            <div style="overflow-x:auto;">

                <table class="joint-table">

                    <thead>

                        <tr>

                            <th>
                                JOINT STATE
                            </th>

                            <th>
                                INPUT STRING
                            </th>

                            <th>
                                TRANSITIONS
                            </th>

                            <th>
                                ACCEPTANCE
                            </th>

                        </tr>

                    </thead>

                    <tbody>

    `;


    jointStates.forEach(
        function (pair) {

            let transitionHTML =
                "";


            Object.entries(
                pair.transitions
            ).forEach(
                function (
                    entry
                ) {

                    const symbol =
                        entry[0];


                    const destination =
                        entry[1];


                    transitionHTML += `

                        <div>

                            ${escapeHTML(symbol)}

                            →

                            (${escapeHTML(
                                destination.next1
                            )},
                            ${escapeHTML(
                                destination.next2
                            )})

                        </div>

                    `;

                }
            );


            const acceptanceMatch =
                pair.isFinal1 ===
                pair.isFinal2;


            html += `

                <tr>

                    <td>

                        <strong>

                            (${escapeHTML(
                                pair.state1
                            )},
                            ${escapeHTML(
                                pair.state2
                            )})

                        </strong>

                    </td>


                    <td>

                        ${
                            pair.string === ""
                                ? "ε"
                                : escapeHTML(
                                    pair.string
                                  )
                        }

                    </td>


                    <td>

                        ${
                            transitionHTML ||
                            "—"
                        }

                    </td>


                    <td>

                        <span class="${
                            acceptanceMatch
                                ? "match"
                                : "mismatch"
                        }">

                            ${
                                acceptanceMatch
                                    ? "MATCH"
                                    : "MISMATCH"
                            }

                        </span>

                    </td>

                </tr>

            `;

        }
    );


    html += `

                    </tbody>

                </table>

            </div>

        </div>

    `;


    document.getElementById(
        "result"
    ).innerHTML =
        html;


    /* Scroll */

    document.getElementById(
        "results"
    ).scrollIntoView({

        behavior:
            "smooth"

    });
}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


function escapeAttribute(value) {

    return escapeHTML(
        value
    );
}


/* =========================================================
   STARTUP TEST
   ========================================================= */

console.log(
    "DFA Equivalence Tester JavaScript loaded successfully."
);