/* =========================================================
   FORECAST!SANS — SAME END ANYWAY
   GAME CONTROLLER V1.1

   SELECT ABILITY
        ↓
   TOUCH / CLICK CANVAS
        ↓
   DRAG TO AIM
        ↓
   RELEASE
        ↓
   ATTACK EXACT DRAG TARGET

   NO ATTACK BUTTON
   NO AUTO-AIM BRIDGE
========================================================= */

(() => {
    "use strict";


    /* =====================================================
       DOM
    ===================================================== */

    const canvas =
        document.getElementById("gameCanvas");

    if (!canvas) {
        console.error(
            "FORECAST: #gameCanvas is missing."
        );
        return;
    }


    const phaseLabel =
        document.getElementById("phaseLabel");

    const phaseTrack =
        document.getElementById("phaseTrack");

    const turnBanner =
        document.getElementById("turnBanner");

    const staminaFill =
        document.getElementById("staminaFill");

    const staminaText =
        document.getElementById("staminaText");

    const enemyHealthFill =
        document.getElementById("enemyHealthFill");

    const enemyHealthText =
        document.getElementById("enemyHealthText");

    const dialogue =
        document.getElementById("dialogue");

    const dialogueText =
        document.getElementById("dialogueText");

    const categoryNav =
        document.getElementById("categoryNav");

    const abilityPanel =
        document.getElementById("abilityPanel");

    const phaseSplash =
        document.getElementById("phaseSplash");


    /*
        Old HTML may still contain the USE button.

        Remove it at runtime so we don't need
        another HTML rewrite before testing.
    */

    const oldControls =
        document.getElementById("controls");

    if (oldControls) {
        oldControls.remove();
    }


    const oldActionButton =
        document.getElementById("actionButton");

    if (oldActionButton) {
        oldActionButton.remove();
    }


    /* =====================================================
       CATEGORIES
    ===================================================== */

    const CATEGORIES = [
        "WEAPON",
        "EYES",
        "TECHNIQUE",
        "FORECAST",
        "OWNER"
    ];

    let selectedCategory = "WEAPON";
    let ownerUnlocked = false;
    let selectedOwner = "ADMIN EYE";

    const OWNER_ABILITIES = {
        "ADMIN EYE": {name:"ADMIN EYE",phase:"1",description:"Reveals the protagonist's predicted path.",attack:"adminEye"},
        "TIMELINE DELETE": {name:"TIMELINE DELETE",phase:"1",description:"Clears active protagonist attacks.",attack:"timelineDelete"},
        "PHASE SHIFT": {name:"PHASE SHIFT",phase:"1",description:"Advances one phase for owner testing.",attack:"phaseShift"},
        "OMNIFORECAST": {name:"OMNIFORECAST",phase:"1",description:"Displays multiple possible movement futures.",attack:"omniforecast"},
        "REDLINE SCYTHE": {name:"REDLINE SCYTHE",phase:"1",description:"Owner variant of the Execution Scythe.",attack:"redlineScythe"},
        "DEV BONES": {name:"DEV BONES",phase:"1",description:"Owner-only experimental bone pattern.",attack:"devBones"},
        "THE SAME END": {name:"THE SAME END",phase:"1",description:"Owner-only prediction collapse sequence.",attack:"sameEnd"}
    };
    const OWNER_ORDER = Object.keys(OWNER_ABILITIES);


    /* =====================================================
       FORECAST ABILITIES
    ===================================================== */

    const FORECAST_ABILITIES = {

        "PREDICT": {
            name: "PREDICT",
            phase: "1",
            cooldown: 1800,
            description:
                "Reads the protagonist's immediate movement."
        },

        "DEEP FORECAST": {
            name: "DEEP FORECAST",
            phase: "3",
            cooldown: 3200,
            description:
                "Extends prediction and restores stamina."
        },

        "ABSOLUTE FORECAST": {
            name: "ABSOLUTE FORECAST",
            phase: "4.5",
            cooldown: 5200,
            description:
                "Pushes Forecast's prediction to its maximum."
        }
    };


    const FORECAST_ORDER = [
        "PREDICT",
        "DEEP FORECAST",
        "ABSOLUTE FORECAST"
    ];


    let selectedForecast = "PREDICT";

    const forecastCooldowns = {};


    /* =====================================================
       DRAG STATE
    ===================================================== */

    const drag = {
        active: false,
        pointerId: null,

        startX: 0,
        startY: 0,

        x: 0,
        y: 0,

        moved: false
    };


    /*
        Stops tiny accidental taps from firing.
    */

    const MIN_DRAG_DISTANCE = 8;


    /* =====================================================
       MESSAGE
    ===================================================== */

    let messageTimer = null;


    function showMessage(
        message,
        duration = 1600
    ) {
        if (!message) return;


        if (dialogueText) {
            dialogueText.textContent =
                message;
        }
        else if (dialogue) {
            dialogue.textContent =
                message;
        }


        if (dialogue) {
            dialogue.classList.add(
                "visible"
            );
        }


        if (messageTimer) {
            clearTimeout(
                messageTimer
            );
        }


        messageTimer =
            setTimeout(() => {

                if (dialogue) {
                    dialogue.classList.remove(
                        "visible"
                    );
                }

            }, duration);
    }


    /* =====================================================
       PHASE HELPERS
    ===================================================== */

    function getPhase() {
        if (
            typeof ForecastPhases ===
            "undefined"
        ) {
            return "1";
        }


        return ForecastPhases.getPhase();
    }


    function isPhaseUnlocked(
        requiredPhase
    ) {
        if (
            typeof ForecastPhases ===
            "undefined"
        ) {
            return requiredPhase === "1";
        }


        return ForecastPhases
            .isPhaseUnlocked(
                requiredPhase
            );
    }


    /* =====================================================
       CATEGORY NAVIGATION
    ===================================================== */

    function buildCategoryNav() {
        if (!categoryNav) return;


        let buttons =
            categoryNav.querySelectorAll(
                "[data-category]"
            );


        /*
            If index.html somehow doesn't
            already contain category buttons,
            create them automatically.
        */

        if (!buttons.length) {

            categoryNav.innerHTML = "";


            for (
                const category of
                CATEGORIES
            ) {
                const button =
                    document.createElement(
                        "button"
                    );


                button.type = "button";

                button.className =
                    "category-button";

                button.dataset.category =
                    category;

                button.textContent =
                    category;


                categoryNav.appendChild(
                    button
                );
            }


            buttons =
                categoryNav.querySelectorAll(
                    "[data-category]"
                );
        }


        buttons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const category =
                        String(button.dataset.category || "")
                            .toUpperCase();


                    if (
                        !CATEGORIES.includes(
                            category
                        )
                    ) {
                        return;
                    }


                    selectedCategory =
                        category;


                    updateCategoryButtons();

                    renderAbilities();
                }
            );
        });


        updateCategoryButtons();
    }


    function updateCategoryButtons() {
        if (!categoryNav) return;


        const buttons =
            categoryNav.querySelectorAll(
                "[data-category]"
            );


        buttons.forEach(button => {

            button.classList.toggle(
                "active",

                String(button.dataset.category || "").toUpperCase() ===
                    selectedCategory
            );
        });
    }


    /* =====================================================
       GET ABILITIES
    ===================================================== */

    function getAbilitiesForCategory() {

        switch (selectedCategory) {

            case "WEAPON":

                if (
                    typeof ForecastWeapons ===
                    "undefined"
                ) {
                    return [];
                }

                return ForecastWeapons
                    .getList();


            case "EYES":

                if (
                    typeof ForecastEyes ===
                    "undefined"
                ) {
                    return [];
                }

                return ForecastEyes
                    .getList();


            case "TECHNIQUE":

                if (
                    typeof ForecastTechniques ===
                    "undefined"
                ) {
                    return [];
                }

                return ForecastTechniques
                    .getList();


            case "OWNER":
                return ownerUnlocked ? OWNER_ORDER.map(name => ({...OWNER_ABILITIES[name]})) : [];

            case "FORECAST":

                return FORECAST_ORDER.map(
                    name => ({
                        ...FORECAST_ABILITIES[
                            name
                        ]
                    })
                );


            default:
                return [];
        }
    }


    /* =====================================================
       CURRENT SELECTION
    ===================================================== */

    function getSelectedName() {

        switch (selectedCategory) {

            case "WEAPON":

                return (
                    typeof ForecastWeapons !==
                    "undefined"
                )
                    ? ForecastWeapons
                        .getSelected()
                    : "";


            case "EYES":

                return (
                    typeof ForecastEyes !==
                    "undefined"
                )
                    ? ForecastEyes
                        .getSelected()
                    : "";


            case "TECHNIQUE":

                return (
                    typeof ForecastTechniques !==
                    "undefined"
                )
                    ? ForecastTechniques
                        .getSelected()
                    : "";


            case "OWNER":
                return selectedOwner;

            case "FORECAST":

                return selectedForecast;


            default:
                return "";
        }
    }


    /* =====================================================
       SELECT ABILITY
    ===================================================== */

    function selectAbility(name) {

        switch (selectedCategory) {

            case "WEAPON":

                if (
                    typeof ForecastWeapons !==
                    "undefined"
                ) {
                    ForecastWeapons.select(
                        name
                    );
                }

                break;


            case "EYES":

                if (
                    typeof ForecastEyes !==
                    "undefined"
                ) {
                    ForecastEyes.select(
                        name
                    );
                }

                break;


            case "TECHNIQUE":

                if (
                    typeof ForecastTechniques !==
                    "undefined"
                ) {
                    ForecastTechniques.select(
                        name
                    );
                }

                break;


            case "OWNER":
                if (ownerUnlocked && OWNER_ABILITIES[name]) selectedOwner = name;
                break;

            case "FORECAST": {

                const ability =
                    FORECAST_ABILITIES[
                        name
                    ];


                if (!ability) return;


                if (
                    !isPhaseUnlocked(
                        ability.phase
                    )
                ) {
                    showMessage(
                        `LOCKED — PHASE ${ability.phase}`
                    );

                    return;
                }


                selectedForecast =
                    ability.name;

                break;
            }
        }


        renderAbilities();
    }


    /* =====================================================
       COOLDOWN
    ===================================================== */

    function getCooldownRemaining(
        ability
    ) {
        if (!ability) return 0;


        switch (selectedCategory) {

            case "WEAPON":

                return (
                    typeof ForecastWeapons !==
                    "undefined"
                )
                    ? ForecastWeapons
                        .getCooldownRemaining(
                            ability.name
                        )
                    : 0;


            case "EYES":

                return (
                    typeof ForecastEyes !==
                    "undefined"
                )
                    ? ForecastEyes
                        .getCooldownRemaining(
                            ability.name
                        )
                    : 0;


            case "TECHNIQUE":

                return (
                    typeof ForecastTechniques !==
                    "undefined"
                )
                    ? ForecastTechniques
                        .getCooldownRemaining(
                            ability.name
                        )
                    : 0;


            case "FORECAST": {

                const lastUsed =
                    forecastCooldowns[
                        ability.name
                    ] || 0;


                return Math.max(
                    0,

                    ability.cooldown -
                    (
                        performance.now() -
                        lastUsed
                    )
                );
            }


            default:
                return 0;
        }
    }


    /* =====================================================
       RENDER ARSENAL
    ===================================================== */

    function renderAbilities() {
        if (!abilityPanel) return;


        const abilities =
            getAbilitiesForCategory();

        const selected =
            getSelectedName();


        abilityPanel.innerHTML = "";


        for (
            const ability of
            abilities
        ) {
            const unlocked =
                isPhaseUnlocked(
                    ability.phase
                );


            const cooldown =
                getCooldownRemaining(
                    ability
                );


            const button =
                document.createElement(
                    "button"
                );


            button.type = "button";

            button.className =
                "ability-button";


            if (
                selected ===
                ability.name
            ) {
                button.classList.add(
                    "selected"
                );
            }


            if (!unlocked) {
                button.classList.add(
                    "locked"
                );
            }


            if (
                unlocked &&
                cooldown > 0
            ) {
                button.classList.add(
                    "cooldown"
                );
            }


            const title =
                document.createElement(
                    "span"
                );


            title.className =
                "ability-name";

            title.textContent =
                ability.name;


            const info =
                document.createElement(
                    "span"
                );


            info.className =
                "ability-info";


            if (!unlocked) {

                info.textContent =
                    `LOCKED — PHASE ${ability.phase}`;

            }
            else if (
                cooldown > 0
            ) {

                info.textContent =
                    `${(
                        cooldown / 1000
                    ).toFixed(1)}s`;

            }
            else {

                info.textContent =
                    ability.description ||
                    "READY";
            }


            button.appendChild(
                title
            );

            button.appendChild(
                info
            );


            button.addEventListener(
                "click",
                () => {

                    if (!unlocked) {

                        showMessage(
                            `LOCKED — PHASE ${ability.phase}`
                        );

                        return;
                    }


                    selectAbility(
                        ability.name
                    );
                }
            );


            abilityPanel.appendChild(
                button
            );
        }
    }


    /* =====================================================
       POINTER → CANVAS COORDINATES
    ===================================================== */

    function pointerToCanvas(event) {

        const rect =
            canvas.getBoundingClientRect();


        /*
            battle.js draws in CSS-pixel
            coordinates even on Retina displays,
            so use the CSS dimensions here.
        */

        const x =
            event.clientX -
            rect.left;

        const y =
            event.clientY -
            rect.top;


        return {
            x,
            y
        };
    }


    /* =====================================================
       CLAMP TARGET TO BATTLE BOX
    ===================================================== */

    function clampTargetToArena(target) {

        if (
            typeof ForecastBattle ===
            "undefined"
        ) {
            return target;
        }


        const status =
            ForecastBattle.getStatus();


        if (
            !status ||
            !status.arena
        ) {
            return target;
        }


        return {

            x: Math.max(
                status.arena.left,

                Math.min(
                    status.arena.right,
                    target.x
                )
            ),


            y: Math.max(
                status.arena.top,

                Math.min(
                    status.arena.bottom,
                    target.y
                )
            )
        };
    }


    /* =====================================================
       BEGIN DRAG
    ===================================================== */

    function beginDrag(event) {

        if (
            typeof ForecastBattle ===
            "undefined"
        ) {
            return;
        }


        const status =
            ForecastBattle.getStatus();


        if (
            !status ||
            status.battleEnded
        ) {
            return;
        }


        if (
            status.turn !==
            "FORECAST"
        ) {
            showMessage(
                "PROTAGONIST TURN"
            );

            return;
        }


        const point =
            pointerToCanvas(
                event
            );


        drag.active = true;

        drag.pointerId =
            event.pointerId;

        drag.startX =
            point.x;

        drag.startY =
            point.y;

        drag.x =
            point.x;

        drag.y =
            point.y;

        drag.moved = false;


        try {

            canvas.setPointerCapture(
                event.pointerId
            );

        }
        catch (_) {}


        const target =
            clampTargetToArena(
                point
            );


        ForecastBattle
            .setAimPreview(
                target
            );


        event.preventDefault();
    }


    /* =====================================================
       MOVE DRAG
    ===================================================== */

    function moveDrag(event) {

        if (
            !drag.active ||
            event.pointerId !==
                drag.pointerId
        ) {
            return;
        }


        const point =
            pointerToCanvas(
                event
            );


        drag.x = point.x;
        drag.y = point.y;


        const movedDistance =
            Math.hypot(

                drag.x -
                drag.startX,

                drag.y -
                drag.startY
            );


        if (
            movedDistance >=
            MIN_DRAG_DISTANCE
        ) {
            drag.moved = true;
        }


        ForecastBattle
            .setAimPreview(

                clampTargetToArena(
                    point
                )
            );


        event.preventDefault();
    }


    /* =====================================================
       RELEASE DRAG
    ===================================================== */

    function endDrag(event) {

        if (
            !drag.active ||
            event.pointerId !==
                drag.pointerId
        ) {
            return;
        }


        const point =
            pointerToCanvas(
                event
            );


        const target =
            clampTargetToArena(
                point
            );


        try {

            canvas.releasePointerCapture(
                event.pointerId
            );

        }
        catch (_) {}


        ForecastBattle
            .setAimPreview(
                null
            );


        const shouldFire =
            drag.moved;


        drag.active = false;

        drag.pointerId = null;


        event.preventDefault();


        /*
            Tap = nothing.
            Drag + release = attack.
        */

        if (!shouldFire) {
            return;
        }


        fireSelected(
            target
        );
    }


    /* =====================================================
       CANCEL DRAG
    ===================================================== */

    function cancelDrag(event) {

        if (!drag.active) {
            return;
        }


        if (
            event &&
            event.pointerId !==
                drag.pointerId
        ) {
            return;
        }


        drag.active = false;

        drag.pointerId = null;


        if (
            typeof ForecastBattle !==
            "undefined"
        ) {
            ForecastBattle
                .setAimPreview(
                    null
                );
        }
    }


    /* =====================================================
       FIRE SELECTED ABILITY
    ===================================================== */

    function fireSelected(target) {

        if (
            typeof ForecastBattle ===
            "undefined"
        ) {
            return;
        }


        const status =
            ForecastBattle.getStatus();


        if (
            !status ||
            status.battleEnded
        ) {
            return;
        }


        if (
            status.turn !==
            "FORECAST"
        ) {
            showMessage(
                "PROTAGONIST TURN"
            );

            return;
        }


        /* =================================================
           WEAPON
        ================================================= */

        if (
            selectedCategory ===
            "WEAPON"
        ) {
            if (
                typeof ForecastWeapons ===
                "undefined"
            ) {
                return;
            }


            const weapon =
                ForecastWeapons
                    .getSelectedData();


            if (!weapon) return;


            /*
                PATCHED weapons.js accepts:

                fire(target, weaponName)

                It emits exactly ONE event,
                including the drag target.

                battle.js catches that event
                and creates the attack.
            */

            const result =
                ForecastWeapons.fire(
                    target,
                    weapon.name
                );


            if (
                !result.fired
            ) {
                handleFailedUse(
                    result,
                    weapon.phase
                );
            }


            renderAbilities();

            return;
        }


        /* =================================================
           EYE
        ================================================= */

        if (
            selectedCategory ===
            "EYES"
        ) {
            if (
                typeof ForecastEyes ===
                "undefined"
            ) {
                return;
            }


            const eye =
                ForecastEyes
                    .getSelectedData();


            if (!eye) return;


            const result =
                ForecastEyes.activate(
                    target,
                    eye.name
                );


            if (
                !result.activated
            ) {
                handleFailedUse(
                    result,
                    eye.phase
                );
            }


            renderAbilities();

            return;
        }


        /* =================================================
           TECHNIQUE
        ================================================= */

        if (
            selectedCategory ===
            "TECHNIQUE"
        ) {
            if (
                typeof ForecastTechniques ===
                "undefined"
            ) {
                return;
            }


            const technique =
                ForecastTechniques
                    .getSelectedData();


            if (!technique) return;


            const result =
                ForecastTechniques
                    .activate(
                        target,
                        technique.name
                    );


            if (
                !result.activated
            ) {
                handleFailedUse(
                    result,
                    technique.phase
                );
            }


            renderAbilities();

            return;
        }


        /* =================================================
           FORECAST
        ================================================= */

        if (
            selectedCategory ===
            "FORECAST"
        ) {
            const ability =
                FORECAST_ABILITIES[
                    selectedForecast
                ];


            if (!ability) return;


            if (
                !isPhaseUnlocked(
                    ability.phase
                )
            ) {
                showMessage(
                    `LOCKED — PHASE ${ability.phase}`
                );

                return;
            }


            const lastUsed =
                forecastCooldowns[
                    ability.name
                ] || 0;


            const remaining =
                Math.max(

                    0,

                    ability.cooldown -
                    (
                        performance.now() -
                        lastUsed
                    )
                );


            if (
                remaining > 0
            ) {
                showMessage(
                    `COOLDOWN ${(
                        remaining / 1000
                    ).toFixed(1)}s`
                );

                return;
            }


            const success =
                ForecastBattle
                    .useForecastAbility(
                        ability.name,
                        target
                    );


            if (success) {

                forecastCooldowns[
                    ability.name
                ] =
                    performance.now();
            }


            renderAbilities();
        }
    }


    /* =====================================================
       FAILED ABILITY USE
    ===================================================== */

    function handleFailedUse(
        result,
        requiredPhase
    ) {
        if (!result) return;


        if (
            result.reason ===
            "cooldown"
        ) {
            showMessage(
                `COOLDOWN ${(
                    result.remaining /
                    1000
                ).toFixed(1)}s`
            );

            return;
        }


        if (
            result.reason ===
            "locked"
        ) {
            showMessage(
                `LOCKED — PHASE ${requiredPhase}`
            );
        }
    }


    /* =====================================================
       POINTER EVENTS
    ===================================================== */

    canvas.addEventListener(
        "pointerdown",
        beginDrag,
        {
            passive: false
        }
    );


    canvas.addEventListener(
        "pointermove",
        moveDrag,
        {
            passive: false
        }
    );


    canvas.addEventListener(
        "pointerup",
        endDrag,
        {
            passive: false
        }
    );


    canvas.addEventListener(
        "pointercancel",
        cancelDrag,
        {
            passive: false
        }
    );


    canvas.addEventListener(
        "lostpointercapture",
        () => {

            if (drag.active) {
                cancelDrag();
            }
        }
    );


    canvas.addEventListener(
        "contextmenu",
        event => {
            event.preventDefault();
        }
    );


    /*
        VERY important for iPhone.

        Dragging the battle canvas should
        aim instead of scrolling the page.
    */

    canvas.style.touchAction =
        "none";


    /* =====================================================
       HUD
    ===================================================== */

    function updateHUD() {

        if (
            typeof ForecastBattle ===
            "undefined"
        ) {
            return;
        }


        const status =
            ForecastBattle.getStatus();


        if (!status) return;


        /* ---------------- PHASE ---------------- */

        const phase =
            getPhase();


        if (phaseLabel) {

            phaseLabel.textContent =
                `PHASE ${phase}`;
        }


        updatePhaseTrack(
            phase
        );


        /* ---------------- TURN ---------------- */

        if (turnBanner) {

            turnBanner.textContent =
                status.turn ===
                "FORECAST"

                    ? "FORECAST TURN"

                    : "PROTAGONIST TURN";


            turnBanner.dataset.turn =
                status.turn;
        }


        /* ---------------- STAMINA ---------------- */

        const staminaPercent =
            Math.max(

                0,

                Math.min(

                    100,

                    (
                        status.stamina /
                        status.maxStamina
                    ) * 100
                )
            );


        if (staminaFill) {

            staminaFill.style.width =
                `${staminaPercent}%`;
        }


        if (staminaText) {

            staminaText.textContent =
                `${Math.round(
                    status.stamina
                )} / ${status.maxStamina}`;
        }


        /* ---------------- ENEMY HP ---------------- */

        const hpPercent =
            Math.max(

                0,

                Math.min(

                    100,

                    (
                        status.protagonistHP /
                        status.protagonistMaxHP
                    ) * 100
                )
            );


        if (enemyHealthFill) {

            enemyHealthFill.style.width =
                `${hpPercent}%`;
        }


        if (enemyHealthText) {

            enemyHealthText.textContent =
                `${Math.ceil(
                    status.protagonistHP
                )} / ${status.protagonistMaxHP}`;
        }
    }


    /* =====================================================
       PHASE TRACK
    ===================================================== */

    function updatePhaseTrack(
        currentPhase
    ) {
        if (!phaseTrack) return;


        const phases =
            typeof ForecastPhases !==
            "undefined"

                ? ForecastPhases
                    .getAllPhases()

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
                currentPhase
            );


        const nodes =
            phaseTrack.querySelectorAll(
                ".phase-node, [data-phase]"
            );


        nodes.forEach(
            (node, fallbackIndex) => {

                const textPhase =
                    node.textContent
                        .trim()
                        .replace(
                            /^PHASE\s*/i,
                            ""
                        );


                const nodePhase =
                    node.dataset.phase ||
                    textPhase;


                let nodeIndex =
                    phases.indexOf(
                        nodePhase
                    );


                if (
                    nodeIndex < 0
                ) {
                    nodeIndex =
                        fallbackIndex;
                }


                node.classList.toggle(
                    "active",

                    nodeIndex ===
                        currentIndex
                );


                node.classList.toggle(
                    "passed",

                    nodeIndex <
                        currentIndex
                );
            }
        );
    }


    /* =====================================================
       PHASE SPLASH
    ===================================================== */

    let splashTimer = null;


    function showPhaseSplash(phase) {

        if (!phaseSplash) return;


        phaseSplash.textContent =
            `PHASE ${phase}`;


        phaseSplash.classList.add(
            "visible"
        );


        if (splashTimer) {

            clearTimeout(
                splashTimer
            );
        }


        splashTimer =
            setTimeout(
                () => {

                    phaseSplash
                        .classList
                        .remove(
                            "visible"
                        );

                },
                900
            );
    }


    function bindDialogue() {
        const box = document.getElementById("dialogue");
        const speaker = document.getElementById("speaker");
        if (!box || typeof ForecastDialogue === "undefined") return;

        box.addEventListener("click", () => {
            if (ForecastDialogue.isActive()) ForecastDialogue.next();
        });

        window.addEventListener("forecast-dialogue-line", event => {
            const line = event.detail || {};
            if (speaker) speaker.textContent = line.speaker || "";
            if (dialogueText) dialogueText.textContent = line.text || "";
            box.classList.add("dialogue-active");
        });

        window.addEventListener("forecast-dialogue-state", event => {
            const active = !!(event.detail && event.detail.active);
            box.classList.toggle("dialogue-active", active);
        });

        window.addEventListener("forecast-phase-change", event => {
            const phase = event.detail && event.detail.phase;
            if (phase) setTimeout(() => ForecastDialogue.play(String(phase)), 120);
        });
    }

    function bindOwnerUnlock() {
        const open=document.getElementById("ownerUnlockButton");
        const panel=document.getElementById("ownerCodePanel");
        const input=document.getElementById("ownerCodeInput");
        const submit=document.getElementById("ownerCodeSubmit");
        const tab=document.querySelector('[data-category="OWNER"]');
        if(!open||!panel||!input||!submit||!tab)return;
        open.addEventListener("click",()=>{panel.hidden=!panel.hidden;if(!panel.hidden)input.focus();});
        const unlock=()=>{
            if(input.value==="3214"){
                ownerUnlocked=true; tab.hidden=false; panel.hidden=true; open.hidden=true;
                selectedCategory="OWNER"; updateCategoryButtons(); renderAbilities();
                showMessage("OWNER ACCESS GRANTED");
            } else { input.value=""; showMessage("ACCESS DENIED"); }
        };
        submit.addEventListener("click",unlock);
        input.addEventListener("keydown",e=>{if(e.key==="Enter")unlock();});
    }

    function bindArsenalToggle() {
        const arsenal = document.getElementById("arsenal");
        const toggle = document.getElementById("arsenalToggle");
        const icon = document.getElementById("arsenalToggleIcon");
        if (!arsenal || !toggle) return;
        toggle.addEventListener("click", () => {
            const closed = arsenal.classList.toggle("closed");
            toggle.setAttribute("aria-expanded", String(!closed));
            if (icon) icon.textContent = closed ? "+" : "−";
        });
    }

    /* =====================================================
       EVENTS
    ===================================================== */

    window.addEventListener(
        "forecast-message",
        event => {

            const message =
                event.detail &&
                event.detail.message;


            if (message) {

                showMessage(
                    message
                );
            }
        }
    );


    window.addEventListener(
        "forecast-phase-change",
        event => {

            const phase =
                event.detail &&
                event.detail.phase

                    ? event.detail.phase

                    : getPhase();


            showPhaseSplash(
                phase
            );


            renderAbilities();

            updateHUD();
        }
    );


    window.addEventListener(
        "forecast-phase-reset",
        () => {

            renderAbilities();

            updateHUD();
        }
    );


    window.addEventListener(
        "forecast-weapon-selected",
        () => {

            if (
                selectedCategory ===
                "WEAPON"
            ) {
                renderAbilities();
            }
        }
    );


    window.addEventListener(
        "forecast-eye-selected",
        () => {

            if (
                selectedCategory ===
                "EYES"
            ) {
                renderAbilities();
            }
        }
    );


    window.addEventListener(
        "forecast-technique-selected",
        () => {

            if (
                selectedCategory ===
                "TECHNIQUE"
            ) {
                renderAbilities();
            }
        }
    );


    /* =====================================================
       UI LOOP
    ===================================================== */

    let lastAbilityRefresh = 0;


    function uiLoop(time) {

        updateHUD();


        /*
            Cooldown text refreshes around
            6 times per second instead of
            rebuilding the arsenal every frame.
        */

        if (
            time -
            lastAbilityRefresh >=
            160
        ) {
            lastAbilityRefresh =
                time;


            renderAbilities();
        }


        requestAnimationFrame(
            uiLoop
        );
    }


    /* =====================================================
       MODULE CHECK
    ===================================================== */

    function checkModules() {

        const missing = [];


        if (
            typeof ForecastPhases ===
            "undefined"
        ) {
            missing.push(
                "phases.js"
            );
        }


        if (
            typeof ForecastWeapons ===
            "undefined"
        ) {
            missing.push(
                "weapons.js"
            );
        }


        if (
            typeof ForecastEyes ===
            "undefined"
        ) {
            missing.push(
                "eyes.js"
            );
        }


        if (
            typeof ForecastTechniques ===
            "undefined"
        ) {
            missing.push(
                "techniques.js"
            );
        }


        if (
            typeof ForecastBattle ===
            "undefined"
        ) {
            missing.push(
                "battle.js"
            );
        }


        if (
            missing.length
        ) {
            console.error(
                "FORECAST missing modules:",
                missing
            );


            showMessage(
                `FAILED TO LOAD: ${missing.join(", ")}`,
                5000
            );


            return false;
        }


        return true;
    }


    /* =====================================================
       INIT
    ===================================================== */

    function init() {

        if (!checkModules()) {
            return;
        }


        buildCategoryNav();
        bindArsenalToggle();
        bindOwnerUnlock();
        bindDialogue();


        /*
            Reset the data modules BEFORE
            battle initialization.
        */

        ForecastPhases.reset();

        ForecastWeapons.reset();

        ForecastEyes.reset();

        ForecastTechniques.reset();


        /*
            Start battle engine.
        */

        const started =
            ForecastBattle.init();


        if (!started) {

            showMessage(
                "BATTLE ENGINE FAILED TO START",
                5000
            );

            return;
        }


        renderAbilities();

        updateHUD();


        if (typeof ForecastDialogue !== "undefined") {
            ForecastDialogue.play("opening", () => {
                showMessage("DRAG TO AIM — RELEASE TO ATTACK", 2400);
            });
        } else {
            showMessage("DRAG TO AIM — RELEASE TO ATTACK", 2400);
        }


        requestAnimationFrame(
            uiLoop
        );
    }


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );
    }
    else {
        init();
    }

})();