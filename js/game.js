/* =========================================
   FORECAST!SANS — GAME CONTROLLER V0.3
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

    const movement = {
        up: false,
        down: false,
        left: false,
        right: false
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
       ELEMENTS
    ===================================== */

    let canvas;
    let abilityList;
    let actionButton;
    let selectedDisplay;
    let dialogueText;
    let categoryButtons;


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
                Reset data systems before
                starting the battle.
            */

            ForecastPhases.reset();
            Weapons.reset();
            Eyes.reset();
            Techniques.reset();

            installCategoryControls();
            installActionButton();
            installMovementControls();
            installKeyboard();
            installGameEvents();

            /*
                Battle starts last so the UI
                is already ready to receive
                its events.
            */

            Battle.init(canvas);

            setCategory("weapon");

            updateSelectedDisplay();

            setDialogue(
                "Another possibility enters your sight."
            );

        }

        catch (error) {

            showFatalError(error);

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
            document.querySelectorAll(
                ".category-button"
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
            ["ForecastPhases", typeof ForecastPhases],
            ["Weapons", typeof Weapons],
            ["Eyes", typeof Eyes],
            ["Techniques", typeof Techniques],
            ["Battle", typeof Battle]
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


        if (missing.length) {

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
            !allowed.includes(category)
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
    }


    /* =====================================
       ABILITY LIST
    ===================================== */

    function renderAbilityList() {

        abilityList.innerHTML = "";


        const names =
            getCurrentList();


        names.forEach(
            name => {

                const data =
                    getData(
                        currentCategory,
                        name
                    );


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


                if (!unlocked) {

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

        switch (category) {

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
                return FORECAST_ABILITIES[
                    name
                ] || null;

            default:
                return null;
        }
    }


    function isUnlocked(
        category,
        name
    ) {

        switch (category) {

            case "weapon":

                return Weapons
                    .isUnlocked(name);


            case "eyes":

                return Eyes
                    .isUnlocked(name);


            case "technique":

                return Techniques
                    .isUnlocked(name);


            case "forecast": {

                const ability =
                    FORECAST_ABILITIES[
                        name
                    ];


                if (!ability) {
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


        if (!data) {
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


        let success = true;


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


        if (!success) {
            return;
        }


        selected[
            currentCategory
        ] = name;


        renderAbilityList();

        updateSelectedDisplay();
        updateActionLabel();


        if (data.description) {

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
                        "Dodge first. Attack when Forecast's turn begins."
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
                        "Dodge first. Techniques return on Forecast's turn."
                    );

                    return;
                }


                Techniques.activate();

                break;


            case "forecast":

                activateForecast();

                break;
        }
    }


    /* =====================================
       FORECAST
    ===================================== */

    function activateForecast() {

        const name =
            selected.forecast;


        const ability =
            FORECAST_ABILITIES[
                name
            ];


        if (!ability) {
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

        if (!selectedDisplay) {
            return;
        }


        selectedDisplay.textContent =
            selected[
                currentCategory
            ] || "";
    }


    /* =====================================
       MOVEMENT — MOBILE
    ===================================== */

    function installMovementControls() {

        bindMoveButton(
            "upButton",
            "up"
        );

        bindMoveButton(
            "downButton",
            "down"
        );

        bindMoveButton(
            "leftButton",
            "left"
        );

        bindMoveButton(
            "rightButton",
            "right"
        );
    }


    function bindMoveButton(
        id,
        direction
    ) {

        const button =
            document.getElementById(
                id
            );


        if (!button) {
            return;
        }


        const press =
            event => {

                event.preventDefault();

                movement[
                    direction
                ] = true;

                updateMovement();
            };


        const release =
            event => {

                event.preventDefault();

                movement[
                    direction
                ] = false;

                updateMovement();
            };


        button.addEventListener(
            "pointerdown",
            press
        );

        button.addEventListener(
            "pointerup",
            release
        );

        button.addEventListener(
            "pointercancel",
            release
        );

        button.addEventListener(
            "pointerleave",
            release
        );
    }


    /* =====================================
       KEYBOARD
    ===================================== */

    function installKeyboard() {

        window.addEventListener(
            "keydown",
            event => {

                const direction =
                    keyToDirection(
                        event.key
                    );


                if (direction) {

                    event.preventDefault();

                    movement[
                        direction
                    ] = true;

                    updateMovement();

                    return;
                }


                if (
                    event.key === " " ||
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    useSelectedAbility();
                }


                if (event.key === "1") {
                    setCategory(
                        "weapon"
                    );
                }


                if (event.key === "2") {
                    setCategory(
                        "eyes"
                    );
                }


                if (event.key === "3") {
                    setCategory(
                        "technique"
                    );
                }


                if (event.key === "4") {
                    setCategory(
                        "forecast"
                    );
                }
            }
        );


        window.addEventListener(
            "keyup",
            event => {

                const direction =
                    keyToDirection(
                        event.key
                    );


                if (!direction) {
                    return;
                }


                event.preventDefault();

                movement[
                    direction
                ] = false;

                updateMovement();
            }
        );


        /*
            Prevent stuck movement when
            switching apps/tabs.
        */

        window.addEventListener(
            "blur",
            clearMovement
        );
    }


    function keyToDirection(key) {

        switch (
            key.toLowerCase()
        ) {

            case "w":
            case "arrowup":
                return "up";

            case "s":
            case "arrowdown":
                return "down";

            case "a":
            case "arrowleft":
                return "left";

            case "d":
            case "arrowright":
                return "right";

            default:
                return null;
        }
    }


    function updateMovement() {

        const x =
            (
                movement.right
                ? 1
                : 0
            ) -
            (
                movement.left
                ? 1
                : 0
            );


        const y =
            (
                movement.down
                ? 1
                : 0
            ) -
            (
                movement.up
                ? 1
                : 0
            );


        Battle.setMovement(
            x,
            y
        );
    }


    function clearMovement() {

        movement.up = false;
        movement.down = false;
        movement.left = false;
        movement.right = false;

        updateMovement();
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
            }
        );


        window.addEventListener(
            "forecast-phase-change",
            event => {

                const phase =
                    event.detail.phase;


                /*
                    New phase means new
                    abilities may have become
                    available.
                */

                renderAbilityList();

                updateSelectedDisplay();


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
       DIALOGUE
    ===================================== */

    function setDialogue(message) {

        if (!dialogueText) {
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


        if (!box) {
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