/* =========================================
   FORECAST!SANS — GAME CONTROLLER V0.4
   AUTO-DODGE EDITION
========================================= */

(() => {

    /* =====================================
       STATE
    ===================================== */

    let currentCategory = "weapon";

    let selected = {
        weapon: "GLOCK",
        eyes: "RED EYE",
        technique: "BONES",
        forecast: "PREDICT"
    };


    /* =====================================
       FORECAST ABILITIES
    ===================================== */

    const FORECAST_ABILITIES = {

        "PREDICT": {
            requiredPhase: "1.5",
            duration: 1800,
            description:
                "Displays the protagonist's predicted movement."
        },

        "DEEP FORECAST": {
            requiredPhase: "3",
            duration: 3200,
            description:
                "Extends Forecast's prediction window."
        },

        "ABSOLUTE FORECAST": {
            requiredPhase: "4.5",
            duration: 5200,
            description:
                "Displays an extended future trajectory."
        }

    };


    /* =====================================
       DOM
    ===================================== */

    let canvas = null;

    let abilityList = null;

    let actionButton = null;

    let selectedDisplay = null;

    let dialogueText = null;

    let categoryButtons = [];

    let combatStatusTitle = null;

    let combatStatusText = null;

    let phaseLabel = null;

    let phaseNodes = [];


    /* =====================================
       START
    ===================================== */

    window.addEventListener(
        "DOMContentLoaded",
        start
    );


    function start() {

        try {

            cacheElements();

            verifyModules();


            /*
                Reset all game-data modules.
            */

            ForecastPhases.reset();

            Weapons.reset();

            Eyes.reset();

            Techniques.reset();


            /*
                V0.4:

                There are NO movement controls.

                Forecast automatically dodges
                protagonist attacks using stamina.
            */

            installCategoryControls();

            installActionButton();

            installKeyboard();

            installGameEvents();


            /*
                Battle starts after the UI is
                ready to receive its events.
            */

            Battle.init(canvas);


            setCategory(
                "weapon"
            );


            syncPhaseHUD();

            updateSelectedDisplay();

            updateCombatStatus();


            setDialogue(
                "Another possibility enters your sight."
            );
        }

        catch (error) {

            showFatalError(
                error
            );

            throw error;
        }
    }


    /* =====================================
       CACHE DOM
    ===================================== */

    function cacheElements() {

        canvas =
            document.getElementById(
                "gameCanvas"
            );


        abilityList =
            document.getElementById(
                "abilityList"
            );


        actionButton =
            document.getElementById(
                "actionButton"
            );


        selectedDisplay =
            document.getElementById(
                "selectedDisplay"
            );


        dialogueText =
            document.getElementById(
                "dialogueText"
            );


        categoryButtons =
            Array.from(
                document.querySelectorAll(
                    ".category-button"
                )
            );


        combatStatusTitle =
            document.getElementById(
                "combatStatusTitle"
            );


        combatStatusText =
            document.getElementById(
                "combatStatusText"
            );


        phaseLabel =
            document.getElementById(
                "phaseLabel"
            );


        phaseNodes =
            Array.from(
                document.querySelectorAll(
                    ".phase-node"
                )
            );


        if (
            !canvas ||
            !abilityList ||
            !actionButton ||
            !dialogueText
        ) {

            throw new Error(
                "Required game UI element is missing."
            );
        }
    }


    /* =====================================
       MODULE CHECK
    ===================================== */

    function verifyModules() {

        const required = [

            [
                "ForecastPhases",
                typeof ForecastPhases
            ],

            [
                "Weapons",
                typeof Weapons
            ],

            [
                "Eyes",
                typeof Eyes
            ],

            [
                "Techniques",
                typeof Techniques
            ],

            [
                "Battle",
                typeof Battle
            ]
        ];


        const missing =
            required
                .filter(
                    item =>
                        item[1] ===
                        "undefined"
                )
                .map(
                    item =>
                        item[0]
                );


        if (
            missing.length
        ) {

            throw new Error(
                "Missing module(s): " +
                missing.join(", ")
            );
        }
    }


    /* =====================================
       CATEGORY MENU
    ===================================== */

    function installCategoryControls() {

        categoryButtons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        setCategory(
                            button.dataset.category
                        );
                    }
                );
            }
        );
    }


    function setCategory(category) {

        const allowed = [
            "weapon",
            "eyes",
            "technique",
            "forecast"
        ];


        if (
            !allowed.includes(
                category
            )
        ) {
            return;
        }


        currentCategory =
            category;


        categoryButtons.forEach(
            button => {

                button.classList.toggle(
                    "active",

                    button.dataset.category ===
                    category
                );
            }
        );


        renderAbilityList();

        updateSelectedDisplay();

        updateActionLabel();

        updateCombatStatus();
    }


    /* =====================================
       ABILITY LIST
    ===================================== */

    function renderAbilityList() {

        if (
            !abilityList
        ) {
            return;
        }


        abilityList.innerHTML =
            "";


        const names =
            getCurrentList();


        names.forEach(
            name => {

                const data =
                    getData(
                        currentCategory,
                        name
                    );


                if (
                    !data
                ) {
                    return;
                }


                const unlocked =
                    isUnlocked(
                        currentCategory,
                        name
                    );


                const button =
                    document.createElement(
                        "button"
                    );


                button.className =
                    "ability-button";


                if (
                    selected[
                        currentCategory
                    ] === name
                ) {

                    button.classList.add(
                        "selected"
                    );
                }


                if (
                    !unlocked
                ) {

                    button.classList.add(
                        "locked"
                    );


                    button.textContent =
                        `${name} — LOCKED: PHASE ${data.requiredPhase}`;
                }

                else {

                    button.textContent =
                        name;
                }


                button.addEventListener(
                    "click",
                    () => {

                        chooseAbility(
                            name
                        );
                    }
                );


                abilityList.appendChild(
                    button
                );
            }
        );
    }


    function getCurrentList() {

        switch (
            currentCategory
        ) {

            case "weapon":

                return Weapons.getList();


            case "eyes":

                return Eyes.getList();


            case "technique":

                return Techniques.getList();


            case "forecast":

                return Object.keys(
                    FORECAST_ABILITIES
                );


            default:

                return [];
        }
    }


    /* =====================================
       DATA
    ===================================== */

    function getData(
        category,
        name
    ) {

        switch (
            category
        ) {

            case "weapon":

                return Weapons.getData(
                    name
                );


            case "eyes":

                return Eyes.getData(
                    name
                );


            case "technique":

                return Techniques.getData(
                    name
                );


            case "forecast":

                return (
                    FORECAST_ABILITIES[
                        name
                    ] || null
                );


            default:

                return null;
        }
    }


    function isUnlocked(
        category,
        name
    ) {

        switch (
            category
        ) {

            case "weapon":

                return Weapons
                    .isUnlocked(
                        name
                    );


            case "eyes":

                return Eyes
                    .isUnlocked(
                        name
                    );


            case "technique":

                return Techniques
                    .isUnlocked(
                        name
                    );


            case "forecast": {

                const ability =
                    FORECAST_ABILITIES[
                        name
                    ];


                if (
                    !ability
                ) {
                    return false;
                }


                return ForecastPhases
                    .isPhaseUnlocked(
                        ability.requiredPhase
                    );
            }


            default:

                return false;
        }
    }


    /* =====================================
       SELECT ABILITY
    ===================================== */

    function chooseAbility(name) {

        const data =
            getData(
                currentCategory,
                name
            );


        if (
            !data
        ) {
            return;
        }


        if (
            !isUnlocked(
                currentCategory,
                name
            )
        ) {

            setDialogue(
                `${name} unlocks at Phase ${data.requiredPhase}.`
            );

            return;
        }


        let success =
            true;


        switch (
            currentCategory
        ) {

            case "weapon":

                success =
                    Weapons.select(
                        name
                    );

                break;


            case "eyes":

                success =
                    Eyes.select(
                        name
                    );

                break;


            case "technique":

                success =
                    Techniques.select(
                        name
                    );

                break;


            case "forecast":

                selected.forecast =
                    name;

                break;
        }


        if (
            !success
        ) {
            return;
        }


        selected[
            currentCategory
        ] = name;


        renderAbilityList();

        updateSelectedDisplay();

        updateActionLabel();

        updateCombatStatus();


        if (
            data.description
        ) {

            setDialogue(
                data.description
            );
        }
    }


    /* =====================================
       ACTION BUTTON
    ===================================== */

    function installActionButton() {

        actionButton.addEventListener(
            "click",
            useSelectedAbility
        );
    }


    function useSelectedAbility() {

        switch (
            currentCategory
        ) {

            case "weapon":

                if (
                    !Battle.isForecastTurn()
                ) {

                    setDialogue(
                        "Forecast is auto-dodging. Attack when your turn returns."
                    );

                    return;
                }


                Weapons.fire();

                break;


            case "eyes":

                Eyes.activate();

                break;


            case "technique":

                if (
                    !Battle.isForecastTurn()
                ) {

                    setDialogue(
                        "Forecast is auto-dodging. Techniques return on your turn."
                    );

                    return;
                }


                Techniques.activate();

                break;


            case "forecast":

                activateForecast();

                break;
        }


        updateCombatStatus();
    }


    /* =====================================
       FORECAST ABILITIES
    ===================================== */

    function activateForecast() {

        const name =
            selected.forecast;


        const ability =
            FORECAST_ABILITIES[
                name
            ];


        if (
            !ability
        ) {
            return;
        }


        if (
            !ForecastPhases
                .isPhaseUnlocked(
                    ability.requiredPhase
                )
        ) {

            setDialogue(
                `${name} unlocks at Phase ${ability.requiredPhase}.`
            );

            return;
        }


        Battle.activatePrediction(
            ability.duration
        );


        switch (name) {

            case "PREDICT":

                setDialogue(
                    "Forecast: movement possibility detected."
                );

                break;


            case "DEEP FORECAST":

                setDialogue(
                    "Forecast: multiple possibilities overlap."
                );

                break;


            case "ABSOLUTE FORECAST":

                setDialogue(
                    "Forecast: the path ahead becomes visible."
                );

                break;
        }
    }


    /* =====================================
       ACTION LABEL
    ===================================== */

    function updateActionLabel() {

        if (
            !actionButton
        ) {
            return;
        }


        switch (
            currentCategory
        ) {

            case "weapon":

                actionButton.textContent =
                    "ATTACK";

                break;


            case "eyes":

                actionButton.textContent =
                    "ACTIVATE";

                break;


            case "technique":

                actionButton.textContent =
                    "USE";

                break;


            case "forecast":

                actionButton.textContent =
                    "PREDICT";

                break;
        }
    }


    function updateSelectedDisplay() {

        if (
            !selectedDisplay
        ) {
            return;
        }


        selectedDisplay.textContent =
            selected[
                currentCategory
            ] || "";
    }


    /* =====================================
       KEYBOARD

       NO WASD.
       NO ARROWS.
       NO MANUAL MOVEMENT.
    ===================================== */

    function installKeyboard() {

        window.addEventListener(
            "keydown",
            event => {

                /*
                    Space / Enter:
                    use selected ability.
                */

                if (
                    event.key === " " ||
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    useSelectedAbility();

                    return;
                }


                /*
                    1 — Weapon
                    2 — Eyes
                    3 — Technique
                    4 — Forecast
                */

                if (
                    event.key === "1"
                ) {

                    setCategory(
                        "weapon"
                    );

                    return;
                }


                if (
                    event.key === "2"
                ) {

                    setCategory(
                        "eyes"
                    );

                    return;
                }


                if (
                    event.key === "3"
                ) {

                    setCategory(
                        "technique"
                    );

                    return;
                }


                if (
                    event.key === "4"
                ) {

                    setCategory(
                        "forecast"
                    );
                }
            }
        );
    }


    /* =====================================
       GLOBAL GAME EVENTS
    ===================================== */

    function installGameEvents() {

        window.addEventListener(
            "forecast-message",
            event => {

                if (
                    event.detail &&
                    event.detail.message
                ) {

                    setDialogue(
                        event.detail.message
                    );
                }


                updateCombatStatus();
            }
        );


        window.addEventListener(
            "forecast-phase-change",
            event => {

                const detail =
                    event.detail || {};


                const phase =
                    detail.phase ||
                    ForecastPhases.getPhase();


                /*
                    New phase can unlock
                    new abilities.
                */

                renderAbilityList();

                updateSelectedDisplay();

                syncPhaseHUD();

                updateCombatStatus();


                if (
                    phase === "5"
                ) {

                    setDialogue(
                        "Phase 5. Every unlocked possibility is now available."
                    );
                }

                else {

                    setDialogue(
                        `Phase ${phase}. New possibilities detected.`
                    );
                }
            }
        );
    }


    /* =====================================
       PHASE HUD

       phases.js V0.3 used an older HUD ID.
       V0.4 keeps this synced independently.
    ===================================== */

    function syncPhaseHUD() {

        const phase =
            String(
                ForecastPhases
                    .getPhase()
            );


        if (
            phaseLabel
        ) {

            phaseLabel.textContent =
                `PHASE ${phase}`;
        }


        const phases =
            typeof ForecastPhases
                .getAllPhases === "function"
                ? ForecastPhases.getAllPhases()
                : [
                    "1",
                    "1.5",
                    "2",
                    "2.5",
                    "3",
                    "3.5",
                    "4",
                    "4.5",
                    "5"
                ];


        const currentIndex =
            phases.indexOf(
                phase
            );


        phaseNodes.forEach(
            (
                node,
                index
            ) => {

                node.classList.toggle(
                    "active",
                    index === currentIndex
                );


                node.classList.toggle(
                    "passed",
                    index < currentIndex
                );
            }
        );
    }


    /* =====================================
       COMBAT STATUS
    ===================================== */

    function updateCombatStatus() {

        if (
            !combatStatusTitle &&
            !combatStatusText
        ) {
            return;
        }


        const forecastTurn =
            Battle &&
            typeof Battle
                .isForecastTurn ===
                "function"
                ? Battle.isForecastTurn()
                : true;


        if (
            forecastTurn
        ) {

            if (
                combatStatusTitle
            ) {

                combatStatusTitle.textContent =
                    "YOUR TURN";
            }


            if (
                combatStatusText
            ) {

                combatStatusText.textContent =
                    "Choose an attack, eye, technique, or Forecast ability.";
            }
        }

        else {

            if (
                combatStatusTitle
            ) {

                combatStatusTitle.textContent =
                    "AUTO-DODGE";
            }


            if (
                combatStatusText
            ) {

                const stamina =
                    typeof Battle.getStamina ===
                        "function"
                        ? Math.ceil(
                            Battle.getStamina()
                        )
                        : "?";


                combatStatusText.textContent =
                    `Forecast is evading automatically. Stamina: ${stamina}/100`;
            }
        }
    }


    /*
        Battle's turn changes happen internally,
        so periodically refresh only the small
        combat-status text.

        This does NOT control gameplay.
    */

    window.setInterval(
        () => {

            try {

                if (
                    typeof Battle !==
                    "undefined"
                ) {

                    updateCombatStatus();
                }
            }

            catch (_) {

                /*
                    Ignore status refresh errors.
                    Actual game errors still use
                    the normal fatal-error system.
                */
            }
        },

        250
    );


    /* =====================================
       DIALOGUE
    ===================================== */

    function setDialogue(message) {

        if (
            !dialogueText
        ) {
            return;
        }


        dialogueText.textContent =
            message;
    }


    /* =====================================
       FATAL ERROR DISPLAY
    ===================================== */

    function showFatalError(error) {

        const box =
            document.getElementById(
                "errorBox"
            );


        if (
            !box
        ) {
            return;
        }


        box.style.display =
            "block";


        box.textContent =
            "GAME ERROR\n\n" +
            (
                error &&
                error.message
                    ? error.message
                    : String(error)
            );
    }

})();
