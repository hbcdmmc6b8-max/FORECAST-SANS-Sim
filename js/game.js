/* =========================================================
   FORECAST!SANS — SAME END ANYWAY
   V1 GAME / UI / INPUT CONTROLLER

   - Connects all modules
   - NO USE / ATTACK BUTTON
   - Touch + mouse drag aiming
   - Release = attack
   - Arsenal selection
   - Locked abilities stay visible
   - Cooldown display
   - Phase / stamina / HP UI
   - Only #gameCanvas is required
========================================================= */

(() => {
    "use strict";


    /* =====================================================
       DOM
    ===================================================== */

    const canvas =
        document.getElementById(
            "gameCanvas"
        );

    const phaseLabel =
        document.getElementById(
            "phaseLabel"
        );

    const phaseTrack =
        document.getElementById(
            "phaseTrack"
        );

    const turnBanner =
        document.getElementById(
            "turnBanner"
        );

    const staminaFill =
        document.getElementById(
            "staminaFill"
        );

    const staminaText =
        document.getElementById(
            "staminaText"
        );

    const enemyHealthFill =
        document.getElementById(
            "enemyHealthFill"
        );

    const enemyHealthText =
        document.getElementById(
            "enemyHealthText"
        );

    const dialogue =
        document.getElementById(
            "dialogue"
        );

    const dialogueText =
        document.getElementById(
            "dialogueText"
        );

    const categoryNav =
        document.getElementById(
            "categoryNav"
        );

    const abilityPanel =
        document.getElementById(
            "abilityPanel"
        );

    const phaseSplash =
        document.getElementById(
            "phaseSplash"
        );


    /* =====================================================
       REQUIRED ELEMENT

       Nothing else is allowed to crash the game.
    ===================================================== */

    if (!canvas) {
        console.error(
            "FORECAST: #gameCanvas is missing."
        );

        return;
    }


    /* =====================================================
       CATEGORY STATE
    ===================================================== */

    const CATEGORIES = [
        "WEAPON",
        "EYES",
        "TECHNIQUE",
        "FORECAST"
    ];


    let selectedCategory =
        "WEAPON";


    /*
        Forecast abilities don't need their
        own separate JS file.
    */

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


    let selectedForecast =
        "PREDICT";


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
        Prevent a tiny accidental tap from
        immediately firing.

        The user should actually drag.
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


        return ForecastPhases
            .getPhase();
    }


    function isPhaseUnlocked(
        requiredPhase
    ) {
        if (
            typeof ForecastPhases ===
            "undefined"
        ) {
            return (
                requiredPhase ===
                "1"
            );
        }


        return ForecastPhases
            .isPhaseUnlocked(
                requiredPhase
            );
    }


    /* =====================================================
       CATEGORY BUTTONS

       Works even if the HTML buttons already exist.
       If they don't, we create them.
    ===================================================== */

    function buildCategoryNav() {
        if (!categoryNav) {
            return;
        }


        let buttons =
            categoryNav.querySelectorAll(
                "[data-category]"
            );


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


                button.type =
                    "button";

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
                        button.dataset
                            .category;


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
        if (!categoryNav) {
            return;
        }


        const buttons =
            categoryNav.querySelectorAll(
                "[data-category]"
            );


        buttons.forEach(button => {

            button.classList.toggle(
                "active",

                button.dataset.category ===
                    selectedCategory
            );
        });
    }


    /* =====================================================
       ABILITY LIST
    ===================================================== */

    function getAbilitiesForCategory() {
        switch (
            selectedCategory
        ) {

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
        switch (
            selectedCategory
        ) {

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
        switch (
            selectedCategory
        ) {

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


            case "FORECAST": {

                const ability =
                    FORECAST_ABILITIES[
                        name
                    ];


                if (!ability) {
                    return;
                }


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
        if (!ability) {
            return 0;
        }


        switch (
            selectedCategory
        ) {

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
       RENDER ABILITIES
    ===================================================== */

    function renderAbilities() {
        if (!abilityPanel) {
            return;
        }


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


            button.type =
                "button";


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
       CANVAS COORDINATES
    ===================================================== */

    function pointerToCanvas(
        event
    ) {
        const rect =
            canvas.getBoundingClientRect();


        const scaleX =
            canvas.clientWidth /
            rect.width;

        const scaleY =
            canvas.clientHeight /
            rect.height;


        return {
            x:
                (
                    event.clientX -
                    rect.left
                ) * scaleX,

            y:
                (
                    event.clientY -
                    rect.top
                ) * scaleY
        };
    }


    /* =====================================================
       TARGET LIMITS

       The released target is constrained to
       the protagonist battle box.
    ===================================================== */

    function clampTargetToArena(
        target
    ) {
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
            x:
                Math.max(
                    status.arena.left,
                    Math.min(
                        status.arena.right,
                        target.x
                    )
                ),

            y:
                Math.max(
                    status.arena.top,
                    Math.min(
                        status.arena.bottom,
                        target.y
                    )
                )
        };
    }


    /* =====================================================
       DRAG START
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


        /*
            You can only attack during
            Forecast's turn.
        */

        if (
            !status ||
            status.battleEnded ||
            status.turn !==
                "FORECAST"
        ) {
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
        catch (_) {
            /*
                Some mobile browsers may
                reject capture. Drag still works.
            */
        }


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
       DRAG MOVE
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


        drag.x =
            point.x;

        drag.y =
            point.y;


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
       DRAG RELEASE = FIRE
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
            A tiny tap does NOT fire.
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
        if (
            !drag.active
        ) {
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
       FIRE CURRENT SELECTION
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


        switch (
            selectedCategory
        ) {

            /* =============================================
               WEAPON
            ============================================= */

            case "WEAPON": {

                if (
                    typeof ForecastWeapons ===
                    "undefined"
                ) {
                    return;
                }


                const weapon =
                    ForecastWeapons
                        .getSelectedData();


                if (!weapon) {
                    return;
                }


                if (
                    !ForecastWeapons
                        .isUnlocked(
                            weapon.name
                        )
                ) {
                    showMessage(
                        `LOCKED — PHASE ${weapon.phase}`
                    );

                    return;
                }


                const remaining =
                    ForecastWeapons
                        .getCooldownRemaining(
                            weapon.name
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


                /*
                    IMPORTANT:

                    We use ForecastWeapons.fire()
                    to register the cooldown.

                    But the older weapons module
                    doesn't carry the target in
                    its event.

                    So we suppress the event's
                    battle effect by using the
                    direct battle call below.

                    The event itself may still
                    fire, so battle.js needs a
                    target. To avoid duplicate
                    attacks entirely, we use the
                    helper below.
                */


                fireWeaponSafely(
                    weapon,
                    target
                );

                break;
            }


            /* =============================================
               EYES
            ============================================= */

            case "EYES": {

                if (
                    typeof ForecastEyes ===
                    "undefined"
                ) {
                    return;
                }


                const eye =
                    ForecastEyes
                        .getSelectedData();


                if (!eye) {
                    return;
                }


                /*
                    eyes.js already carries
                    target data in its event.
                */

                const result =
                    ForecastEyes.activate(
                        target,
                        eye.name
                    );


                if (
                    !result.activated &&
                    result.reason ===
                        "cooldown"
                ) {
                    showMessage(
                        `COOLDOWN ${(
                            result.remaining /
                            1000
                        ).toFixed(1)}s`
                    );
                }


                break;
            }


            /* =============================================
               TECHNIQUE
            ============================================= */

            case "TECHNIQUE": {

                if (
                    typeof ForecastTechniques ===
                    "undefined"
                ) {
                    return;
                }


                const technique =
                    ForecastTechniques
                        .getSelectedData();


                if (!technique) {
                    return;
                }


                /*
                    techniques.js already carries
                    the target in the event.
                */

                const result =
                    ForecastTechniques
                        .activate(
                            target,
                            technique.name
                        );


                if (
                    !result.activated &&
                    result.reason ===
                        "cooldown"
                ) {
                    showMessage(
                        `COOLDOWN ${(
                            result.remaining /
                            1000
                        ).toFixed(1)}s`
                    );
                }


                break;
            }


            /* =============================================
               FORECAST
            ============================================= */

            case "FORECAST": {

                const ability =
                    FORECAST_ABILITIES[
                        selectedForecast
                    ];


                if (!ability) {
                    return;
                }


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


                const used =
                    ForecastBattle
                        .useForecastAbility(
                            ability.name,
                            target
                        );


                if (used) {
                    forecastCooldowns[
                        ability.name
                    ] =
                        performance.now();
                }


                break;
            }
        }


        renderAbilities();
    }


    /* =====================================================
       WEAPON BRIDGE

       V1 weapons.js was written before we
       finalized drag-target firing.

       This records its cooldown without
       allowing a duplicate projectile.

       We temporarily intercept the weapon
       event, attach the target, and let
       battle.js receive exactly ONE shot.
    ===================================================== */

    function fireWeaponSafely(
        weapon,
        target
    ) {
        /*
            Easiest clean solution:
            use the weapons module for cooldown,
            intercept its event before battle.js
            sees it, then manually fire once.

            However event listener ordering would
            make that unnecessarily fragile.

            So for this V1 bridge we temporarily
            stop battle's listener from being
            relevant by passing the target through
            a one-shot global bridge.
        */


        window.__forecastDragTarget =
            target;


        const result =
            ForecastWeapons.fire(
                weapon.name
            );


        /*
            weapons.js emits the attack once.
            battle.js receives it, but because
            old weapons.js does not include target,
            battle.js falls back to the current
            protagonist position.

            We therefore DO NOT fire a second
            projectile here.

            Step after the first test will be a
            tiny weapons.js patch so its event
            carries target directly.
        */


        window.__forecastDragTarget =
            null;


        if (
            !result.fired &&
            result.reason ===
                "cooldown"
        ) {
            showMessage(
                `COOLDOWN ${(
                    result.remaining /
                    1000
                ).toFixed(1)}s`
            );
        }
    }


    /* =====================================================
       POINTER EVENTS

       Pointer events work for:
       - iPhone touch
       - iPad
       - mouse
       - stylus
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
        "contextmenu",
        event =>
            event.preventDefault()
    );


    /*
        Important on mobile:
        browser should not scroll/zoom while
        dragging inside the battle canvas.
    */

    canvas.style.touchAction =
        "none";


    /* =====================================================
       HUD UPDATE
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


        if (!status) {
            return;
        }


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


        /* ---------------- PROTAGONIST HP ---------------- */

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
        if (!phaseTrack) {
            return;
        }


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
            (node, index) => {

                const nodePhase =
                    node.dataset.phase ||
                    node.textContent
                        .trim()
                        .replace(
                            /^PHASE\s*/i,
                            ""
                        );


                const nodeIndex =
                    phases.indexOf(
                        nodePhase
                    );


                const resolvedIndex =
                    nodeIndex >= 0
                        ? nodeIndex
                        : index;


                node.classList.toggle(
                    "active",

                    resolvedIndex ===
                        currentIndex
                );


                node.classList.toggle(
                    "passed",

                    resolvedIndex <
                        currentIndex
                );
            }
        );
    }


    /* =====================================================
       PHASE SPLASH
    ===================================================== */

    let splashTimer = null;


    function showPhaseSplash(
        phase
    ) {
        if (!phaseSplash) {
            return;
        }


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
            setTimeout(() => {

                phaseSplash.classList.remove(
                    "visible"
                );

            }, 900);
    }


    /* =====================================================
       GLOBAL EVENTS
    ===================================================== */

    window.addEventListener(
        "forecast-message",
        event => {

            if (
                event.detail &&
                event.detail.message
            ) {
                showMessage(
                    event.detail.message
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
        renderAbilities
    );


    window.addEventListener(
        "forecast-eye-selected",
        renderAbilities
    );


    window.addEventListener(
        "forecast-technique-selected",
        renderAbilities
    );


    /* =====================================================
       UI REFRESH LOOP

       Keeps cooldown labels moving without
       rebuilding them 60 times per second.
    ===================================================== */

    let lastAbilityRefresh = 0;


    function uiLoop(time) {
        updateHUD();


        if (
            time -
            lastAbilityRefresh >
            150
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
       INIT
    ===================================================== */

    function init() {
        /*
            Check modules individually,
            but DON'T kill the page over
            optional UI elements.
        */

        if (
            typeof ForecastBattle ===
            "undefined"
        ) {
            console.error(
                "FORECAST: battle.js did not load."
            );

            showMessage(
                "battle.js failed to load."
            );

            return;
        }


        buildCategoryNav();


        if (
            typeof ForecastWeapons !==
            "undefined"
        ) {
            ForecastWeapons.reset();
        }


        if (
            typeof ForecastEyes !==
            "undefined"
        ) {
            ForecastEyes.reset();
        }


        if (
            typeof ForecastTechniques !==
            "undefined"
        ) {
            ForecastTechniques.reset();
        }


        const battleStarted =
            ForecastBattle.init();


        if (!battleStarted) {
            showMessage(
                "Battle canvas failed to start."
            );

            return;
        }


        renderAbilities();

        updateHUD();


        showMessage(
            "DRAG TO AIM — RELEASE TO ATTACK",
            2400
        );


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