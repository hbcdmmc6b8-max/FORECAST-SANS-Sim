/* ==========================================================
   FORECAST!SANS — BATTLE ENGINE V0.5
   "SAME END ANYWAY"
========================================================== */

const Battle = (() => {
    "use strict";

    let canvas = null;
    let ctx = null;

    let width = 0;
    let height = 0;
    let dpr = 1;

    let running = false;
    let lastFrame = 0;
    let eventsInstalled = false;


    /* ======================================================
       TURN SYSTEM
    ====================================================== */

    const TURN = {
        FORECAST: "FORECAST",
        ENEMY: "ENEMY",
        TRANSITION: "TRANSITION",
        ENDED: "ENDED"
    };

    let turn = TURN.FORECAST;
    let turnStarted = 0;
    let transitionUntil = 0;

    const FORECAST_TURN_LENGTH = 8000;
    const ENEMY_TURN_LENGTH = 6000;


    /* ======================================================
       BATTLE BOX
    ====================================================== */

    const arena = {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
    };


    /* ======================================================
       FORECAST

       IMPORTANT:
       His x/y NEVER change during auto-dodge.
    ====================================================== */

    const forecast = {
        x: 0,
        y: 0,
        radius: 23,

        invulnerableUntil: 0,

        animation: "idle",
        animationStarted: 0,
        animationUntil: 0
    };


    /* ======================================================
       ANIMATION SYSTEM

       These names will map directly to clean sprite frames
       when the finished animation assets are imported.

       NO giant random character-sheet crop.
    ====================================================== */

    const FORECAST_ANIMATIONS = {
        idle: {
            fps: 5,
            loop: true
        },

        blink: {
            fps: 8,
            loop: false
        },

        look_down: {
            fps: 6,
            loop: false
        },

        look_up: {
            fps: 6,
            loop: false
        },

        cloak_flow: {
            fps: 7,
            loop: true
        },

        dodge_left: {
            fps: 12,
            loop: false
        },

        dodge_right: {
            fps: 12,
            loop: false
        },

        glock_fire: {
            fps: 12,
            loop: false
        },

        smg_fire: {
            fps: 15,
            loop: false
        },

        ar_fire: {
            fps: 12,
            loop: false
        },

        dmr_fire: {
            fps: 10,
            loop: false
        },

        shotgun_fire: {
            fps: 10,
            loop: false
        },

        scythe_summon: {
            fps: 10,
            loop: false
        },

        scythe_swing: {
            fps: 14,
            loop: false
        },

        gaster_charge: {
            fps: 8,
            loop: false
        },

        gaster_fire: {
            fps: 12,
            loop: false
        },

        bone_control: {
            fps: 10,
            loop: false
        },

        eye_activate: {
            fps: 9,
            loop: false
        },

        phase_change: {
            fps: 10,
            loop: false
        },

        low_stamina: {
            fps: 6,
            loop: true
        },

        exhausted: {
            fps: 5,
            loop: true
        },

        hit: {
            fps: 10,
            loop: false
        }
    };


    function playForecastAnimation(
        name,
        duration = 300
    ) {
        if (!FORECAST_ANIMATIONS[name]) {
            name = "idle";
        }

        const now = performance.now();

        forecast.animation = name;
        forecast.animationStarted = now;
        forecast.animationUntil = now + duration;
    }


    function updateForecastAnimation(now) {
        if (
            forecast.animation !== "idle" &&
            now >= forecast.animationUntil
        ) {
            forecast.animation = "idle";
            forecast.animationStarted = now;
        }
    }


    /* ======================================================
       FIXED BOSS POSITION
    ====================================================== */

    function positionForecast() {
        forecast.x = width * 0.5;

        // Boss stands ABOVE the protagonist battle box.
        forecast.y = Math.max(
            72,
            arena.top - 82
        );
    }


    /* ======================================================
       PROTAGONIST
    ====================================================== */

    const enemy = {
        x: 0,
        y: 0,

        radius: 10,

        hp: 100,
        maxHP: 100,

        speed: 120,

        targetX: 0,
        targetY: 0,

        nextTargetAt: 0,
        frozenUntil: 0
    };


    /* ======================================================
       STAMINA
    ====================================================== */

    const STAMINA_MAX = 100;
    const STAMINA_REGEN = 16;

    const BASE_DODGE_COST = 12;
    const DODGE_INVULNERABILITY = 280;

    let stamina = STAMINA_MAX;

    let dodgeChain = 0;
    let lastDodgeAt = 0;


    /* ======================================================
       COMBAT OBJECTS
    ====================================================== */

    let forecastProjectiles = [];
    let enemyProjectiles = [];

    let hazards = [];
    let effects = [];
    let illusions = [];

    let beam = null;
    let scythe = null;
    let decoy = null;


    /* ======================================================
       SPECIAL STATES
    ====================================================== */

    let predictionUntil = 0;

    let domainUntil = 0;
    let heroismUntil = 0;
    let evolutionUntil = 0;
    let deadlockUntil = 0;

    let observeUntil = 0;
    let vectorUntil = 0;
    let momentUntil = 0;


    const adaptation = {
        aimedShotsSeen: 0,
        spreadShotsSeen: 0
    };


    /* ======================================================
       INIT
    ====================================================== */

    function init(canvasElement) {
        if (!canvasElement) {
            throw new Error(
                "Battle.init: canvas missing"
            );
        }

        canvas = canvasElement;
        ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error(
                "Battle.init: 2D context unavailable"
            );
        }

        ctx.imageSmoothingEnabled = false;

        resize();

        window.addEventListener(
            "resize",
            resize
        );

        installEvents();

        reset();

        running = true;
        lastFrame = performance.now();

        requestAnimationFrame(loop);
    }


    /* ======================================================
       RESPONSIVE LAYOUT
    ====================================================== */

    function resize() {
        if (!canvas) return;

        width = window.innerWidth;
        height = window.innerHeight;

        dpr = Math.min(
            window.devicePixelRatio || 1,
            2
        );

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);

        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );

        const horizontalMargin = Math.max(
            24,
            width * 0.09
        );

        arena.left = horizontalMargin;
        arena.right = width - horizontalMargin;

        /*
            Dedicated space above the battle box
            for Forecast.
        */

        arena.top = Math.max(
            225,
            height * 0.31
        );

        arena.bottom = Math.min(
            height - 220,
            arena.top + Math.max(
                190,
                height * 0.31
            )
        );

        if (
            arena.bottom <
            arena.top + 150
        ) {
            arena.bottom =
                arena.top + 150;
        }

        positionForecast();

        enemy.x = clamp(
            enemy.x || width * 0.5,
            arena.left + 25,
            arena.right - 25
        );

        enemy.y = clamp(
            enemy.y ||
            (
                arena.top +
                arena.bottom
            ) / 2,
            arena.top + 25,
            arena.bottom - 25
        );
    }


    /* ======================================================
       EVENTS
    ====================================================== */

    function installEvents() {
        if (eventsInstalled) return;

        eventsInstalled = true;

        window.addEventListener(
            "forecast-weapon-fire",
            event => {
                useWeapon(
                    event.detail?.attack
                );
            }
        );

        window.addEventListener(
            "forecast-eye-activate",
            event => {
                useEye(
                    event.detail || {}
                );
            }
        );

        window.addEventListener(
            "forecast-technique-activate",
            event => {
                useTechnique(
                    event.detail?.attack
                );
            }
        );

        window.addEventListener(
            "forecast-phase-change",
            event => {
                onPhaseChanged(
                    event.detail || {}
                );
            }
        );
    }


    /* ======================================================
       RESET
    ====================================================== */

    function reset() {
        const now = performance.now();

        positionForecast();

        forecast.invulnerableUntil = 0;

        playForecastAnimation(
            "idle",
            1
        );

        stamina = STAMINA_MAX;

        dodgeChain = 0;
        lastDodgeAt = 0;

        enemy.x = width * 0.5;

        enemy.y =
            arena.top +
            (
                arena.bottom -
                arena.top
            ) * 0.62;

        enemy.hp = enemy.maxHP;
        enemy.frozenUntil = 0;

        chooseEnemyTarget();

        forecastProjectiles = [];
        enemyProjectiles = [];

        hazards = [];
        effects = [];
        illusions = [];

        beam = null;
        scythe = null;
        decoy = null;

        predictionUntil = 0;

        domainUntil = 0;
        heroismUntil = 0;
        evolutionUntil = 0;
        deadlockUntil = 0;

        observeUntil = 0;
        vectorUntil = 0;
        momentUntil = 0;

        adaptation.aimedShotsSeen = 0;
        adaptation.spreadShotsSeen = 0;

        turn = TURN.FORECAST;
        turnStarted = now;

        updateEnemyHUD();
        updateStaminaHUD();
        updateTurnHUD();
    }


    /* ======================================================
       MAIN LOOP
    ====================================================== */

    function loop(now) {
        if (!running) return;

        let dt =
            (now - lastFrame) /
            1000;

        lastFrame = now;

        dt = Math.min(
            dt,
            0.04
        );

        update(
            dt,
            now
        );

        draw(now);

        requestAnimationFrame(loop);
    }


    function update(
        dt,
        now
    ) {
        updateTurn(now);

        /*
            Reapply Forecast's FIXED position.

            There is deliberately no velocity,
            movement input or dodge displacement.
        */

        positionForecast();

        updateForecastAnimation(now);

        regenerateStamina(
            dt,
            now
        );

        updateEnemy(
            dt,
            now
        );

        updateForecastProjectiles(
            dt,
            now
        );

        updateEnemyProjectiles(
            dt,
            now
        );

        updateHazards(
            dt,
            now
        );

        updateSpecialAttacks(now);

        updateEffects(
            dt,
            now
        );

        updateStaminaHUD();
    }


    /* ======================================================
       TURNS
    ====================================================== */

    function updateTurn(now) {
        if (
            turn === TURN.ENDED
        ) {
            return;
        }

        if (
            turn === TURN.TRANSITION
        ) {
            if (
                now >= transitionUntil
            ) {
                startForecastTurn();
            }

            return;
        }

        const elapsed =
            now - turnStarted;

        if (
            turn === TURN.FORECAST &&
            elapsed >= FORECAST_TURN_LENGTH
        ) {
            startEnemyTurn();
        }

        else if (
            turn === TURN.ENEMY &&
            elapsed >= ENEMY_TURN_LENGTH
        ) {
            startForecastTurn();
        }
    }


    function startForecastTurn() {
        if (
            turn === TURN.ENDED
        ) {
            return;
        }

        turn = TURN.FORECAST;

        turnStarted =
            performance.now();

        enemyProjectiles = [];

        positionForecast();

        playForecastAnimation(
            "idle",
            1
        );

        updateTurnHUD();

        message(
            "Your turn. Choose a possibility."
        );
    }


    function startEnemyTurn() {
        if (
            turn === TURN.ENDED
        ) {
            return;
        }

        turn = TURN.ENEMY;

        turnStarted =
            performance.now();

        forecastProjectiles = [];
        hazards = [];

        positionForecast();

        updateTurnHUD();

        message(
            "The protagonist attacks. Auto-dodge engaged."
        );

        beginEnemyPattern();
    }


    function startTransition() {
        turn = TURN.TRANSITION;

        transitionUntil =
            performance.now() +
            1200;

        enemyProjectiles = [];
        forecastProjectiles = [];
        hazards = [];

        positionForecast();

        updateTurnHUD();
    }


    function getTurn() {
        return turn;
    }


    function isForecastTurn() {
        return (
            turn === TURN.FORECAST
        );
    }


    /*
        Compatibility function.

        Old game.js can call this all it wants.
        Forecast WILL NOT MOVE.
    */

    function setMovement() {}


    /* ======================================================
       STAMINA REGEN
    ====================================================== */

    function regenerateStamina(
        dt,
        now
    ) {
        const multiplier =
            turn === TURN.FORECAST
                ? 1.35
                : 1;

        stamina = Math.min(
            STAMINA_MAX,

            stamina +
            STAMINA_REGEN *
            multiplier *
            dt
        );

        if (
            now - lastDodgeAt >
            900
        ) {
            dodgeChain = 0;
        }

        if (
            stamina <= 20 &&
            forecast.animation === "idle"
        ) {
            playForecastAnimation(
                "low_stamina",
                300
            );
        }
    }


    /* ======================================================
       AUTO-DODGE COST
    ====================================================== */

    function getDodgeCost(now) {
        let cost =
            BASE_DODGE_COST +
            Math.min(
                dodgeChain * 3,
                15
            );

        if (
            now < evolutionUntil
        ) {
            cost *= 0.68;
        }

        if (
            adaptation.aimedShotsSeen >= 8
        ) {
            cost *= 0.9;
        }

        if (
            now < predictionUntil ||
            now < observeUntil
        ) {
            cost *= 0.85;
        }

        return Math.max(
            5,
            Math.round(cost)
        );
    }


    /* ======================================================
       AUTO-DODGE

       Animation changes.
       Afterimage changes.
       Stamina changes.

       Forecast.x DOES NOT.
       Forecast.y DOES NOT.
    ====================================================== */

    function tryAutoDodge(
        projectile,
        now
    ) {
        if (
            turn !== TURN.ENEMY
        ) {
            return false;
        }

        if (
            now <
            forecast.invulnerableUntil
        ) {
            return true;
        }

        if (
            ForecastPhases.isLocked()
        ) {
            return true;
        }

        const cost =
            getDodgeCost(now);

        if (
            stamina < cost
        ) {
            playForecastAnimation(
                "exhausted",
                500
            );

            updateStaminaHUD(
                "EXHAUSTED — HIT"
            );

            return false;
        }

        stamina -= cost;

        dodgeChain++;

        lastDodgeAt = now;

        forecast.invulnerableUntil =
            now +
            DODGE_INVULNERABILITY;

        const dodgeAnimation =
            projectile &&
            projectile.x <
            forecast.x
                ? "dodge_right"
                : "dodge_left";

        playForecastAnimation(
            dodgeAnimation,
            260
        );

        /*
            VISUAL afterimage only.
            This does not alter collision coordinates.
        */

        effects.push({
            type: "dodgeAfterimage",

            x: forecast.x,
            y: forecast.y,

            direction:
                dodgeAnimation ===
                "dodge_left"
                    ? -1
                    : 1,

            life: 0.28,
            maxLife: 0.28
        });

        updateStaminaHUD(
            `AUTO-DODGE -${cost}`
        );

        return true;
    }


    /* ======================================================
       PROTAGONIST AI
    ====================================================== */

    function chooseEnemyTarget() {
        enemy.targetX = random(
            arena.left + 35,
            arena.right - 35
        );

        enemy.targetY = random(
            arena.top + 35,
            arena.bottom - 35
        );

        enemy.nextTargetAt =
            performance.now() +
            random(
                500,
                1100
            );
    }


    function updateEnemy(
        dt,
        now
    ) {
        if (
            now <
            enemy.frozenUntil
        ) {
            return;
        }

        if (
            now >=
            enemy.nextTargetAt
        ) {
            chooseEnemyTarget();
        }

        let speedMultiplier = 1;

        if (
            now < deadlockUntil
        ) {
            speedMultiplier *= 0.25;
        }

        if (
            now < momentUntil
        ) {
            speedMultiplier *= 0.32;
        }

        if (
            now < domainUntil
        ) {
            speedMultiplier *= 0.68;
        }

        const dx =
            enemy.targetX -
            enemy.x;

        const dy =
            enemy.targetY -
            enemy.y;

        const distance =
            Math.hypot(
                dx,
                dy
            ) || 1;

        enemy.x +=
            (
                dx /
                distance
            ) *
            enemy.speed *
            speedMultiplier *
            dt;

        enemy.y +=
            (
                dy /
                distance
            ) *
            enemy.speed *
            speedMultiplier *
            dt;

        enemy.x = clamp(
            enemy.x,
            arena.left + 18,
            arena.right - 18
        );

        enemy.y = clamp(
            enemy.y,
            arena.top + 18,
            arena.bottom - 18
        );
    }


    /* ======================================================
       PROTAGONIST ATTACK
    ====================================================== */

    function beginEnemyPattern() {
        const phaseIndex =
            ForecastPhases.getPhaseIndex();

        const shotCount =
            Math.min(
                4 + phaseIndex,
                12
            );

        for (
            let i = 0;
            i < shotCount;
            i++
        ) {
            setTimeout(
                () => {
                    if (
                        turn ===
                        TURN.ENEMY
                    ) {
                        spawnEnemyShot(i);
                    }
                },

                300 +
                i * 430
            );
        }
    }


    function spawnEnemyShot(index = 0) {
        let targetX =
            forecast.x;

        let targetY =
            forecast.y;

        if (
            decoy &&
            performance.now() <
            decoy.until &&
            Math.random() < 0.7
        ) {
            targetX =
                decoy.x;

            targetY =
                decoy.y;
        }

        const dx =
            targetX -
            enemy.x;

        const dy =
            targetY -
            enemy.y;

        const distance =
            Math.hypot(
                dx,
                dy
            ) || 1;

        const speed =
            255 +
            ForecastPhases
                .getPhaseIndex() *
            8;

        enemyProjectiles.push({
            x: enemy.x,
            y: enemy.y,

            vx:
                (
                    dx /
                    distance
                ) *
                speed,

            vy:
                (
                    dy /
                    distance
                ) *
                speed,

            radius:
                index % 4 === 3
                    ? 8
                    : 6,

            life: 4,

            type:
                index % 4 === 3
                    ? "heavy"
                    : "aimed"
        });

        adaptation
            .aimedShotsSeen++;
    }


    function updateEnemyProjectiles(
        dt,
        now
    ) {
        const timeScale =
            now < momentUntil
                ? 0.32
                : 1;

        for (
            let i =
                enemyProjectiles.length - 1;

            i >= 0;

            i--
        ) {
            const projectile =
                enemyProjectiles[i];

            if (!projectile) {
                enemyProjectiles.splice(
                    i,
                    1
                );

                continue;
            }

            projectile.x +=
                projectile.vx *
                dt *
                timeScale;

            projectile.y +=
                projectile.vy *
                dt *
                timeScale;

            projectile.life -=
                dt *
                timeScale;

            /*
                DO NOT destroy projectiles at arena.top.

                Forecast is ABOVE arena.top,
                so protagonist shots must be allowed
                to travel into boss space.
            */

            if (
                projectile.life <= 0 ||
                projectile.x < -100 ||
                projectile.x >
                    width + 100 ||
                projectile.y < -100 ||
                projectile.y >
                    height + 100
            ) {
                enemyProjectiles.splice(
                    i,
                    1
                );

                continue;
            }

            if (
                circlesTouch(
                    projectile.x,
                    projectile.y,
                    projectile.radius,

                    forecast.x,
                    forecast.y,
                    forecast.radius
                )
            ) {
                const dodged =
                    tryAutoDodge(
                        projectile,
                        now
                    );

                enemyProjectiles.splice(
                    i,
                    1
                );

                if (!dodged) {
                    hitForecast(now);
                    return;
                }
            }
        }
    }


    /* ======================================================
       FORECAST HIT / PHASE ADVANCEMENT
    ====================================================== */

    function hitForecast(now) {
        if (
            turn !== TURN.ENEMY
        ) {
            return;
        }

        if (
            now <
            forecast.invulnerableUntil
        ) {
            return;
        }

        if (
            ForecastPhases.isLocked()
        ) {
            return;
        }

        forecast.invulnerableUntil =
            now + 1300;

        playForecastAnimation(
            "hit",
            350
        );

        const result =
            ForecastPhases
                .confirmedHit();

        if (
            result &&
            result.advanced
        ) {
            stamina =
                Math.min(
                    STAMINA_MAX,
                    stamina + 22
                );

            startTransition();
        }

        else if (
            result &&
            result.reason ===
                "final-phase"
        ) {
            message(
                "Phase 5 holds."
            );

            enemyProjectiles = [];
        }
    }


    /* ======================================================
       WEAPON DEFINITIONS

       Different weapons now create DIFFERENT
       projectile types instead of recolored circles.
    ====================================================== */

    const SHOT_TYPES = {
        glock: {
            speed: 570,
            damage: 12,
            radius: 3,
            type: "glockBullet"
        },

        smg: {
            speed: 540,
            damage: 4,
            radius: 2,
            type: "smgBullet"
        },

        ar: {
            speed: 650,
            damage: 7,
            radius: 3,
            type: "arTracer"
        },

        dmr: {
            speed: 900,
            damage: 21,
            radius: 4,
            type: "dmrRound"
        }
    };


    /* ======================================================
       WEAPON FIRING
    ====================================================== */

    function useWeapon(type) {
        if (
            !type ||
            !isForecastTurn()
        ) {
            return;
        }

        switch (type) {

            case "glock":
                playForecastAnimation(
                    "glock_fire",
                    180
                );

                fireAtEnemy(
                    SHOT_TYPES.glock
                );
                break;


            case "smg":
                playForecastAnimation(
                    "smg_fire",
                    500
                );

                fireBurst(
                    7,
                    65,
                    SHOT_TYPES.smg,
                    0.025
                );
                break;


            case "ar":
                playForecastAnimation(
                    "ar_fire",
                    420
                );

                fireBurst(
                    4,
                    105,
                    SHOT_TYPES.ar,
                    0.012
                );
                break;


            case "dmr":
                playForecastAnimation(
                    "dmr_fire",
                    350
                );

                effects.push({
                    type: "predictionLine",

                    x: forecast.x,
                    y: forecast.y,

                    targetX:
                        enemy.x,

                    targetY:
                        enemy.y,

                    life: 0.22,
                    maxLife: 0.22
                });

                setTimeout(
                    () => {
                        if (
                            turn ===
                            TURN.FORECAST
                        ) {
                            fireAtEnemy(
                                SHOT_TYPES.dmr
                            );
                        }
                    },

                    180
                );
                break;


            case "shotgun":
                playForecastAnimation(
                    "shotgun_fire",
                    350
                );

                fireShotgun();
                break;


            case "gasterHand":
                playForecastAnimation(
                    "gaster_charge",
                    350
                );

                setTimeout(
                    () => {
                        if (
                            turn !==
                            TURN.FORECAST
                        ) {
                            return;
                        }

                        playForecastAnimation(
                            "gaster_fire",
                            520
                        );

                        createBeam(
                            0,
                            520,
                            28
                        );
                    },

                    350
                );
                break;


            case "scythe":
                playForecastAnimation(
                    "scythe_summon",
                    220
                );

                setTimeout(
                    () => {
                        if (
                            turn !==
                            TURN.FORECAST
                        ) {
                            return;
                        }

                        playForecastAnimation(
                            "scythe_swing",
                            600
                        );

                        const now =
                            performance.now();

                        scythe = {
                            started: now,
                            until:
                                now + 600,

                            damage: 28,
                            hit: false
                        };
                    },

                    200
                );
                break;
        }
    }


    function fireAtEnemy(
        config,
        angleOffset = 0
    ) {
        const angle =
            Math.atan2(
                enemy.y -
                forecast.y,

                enemy.x -
                forecast.x
            ) +
            angleOffset;

        forecastProjectiles.push({
            x: forecast.x,
            y: forecast.y,

            vx:
                Math.cos(angle) *
                config.speed,

            vy:
                Math.sin(angle) *
                config.speed,

            damage:
                config.damage,

            radius:
                config.radius,

            type:
                config.type,

            life: 2.5
        });
    }


    function fireBurst(
        count,
        gap,
        config,
        spread
    ) {
        for (
            let i = 0;
            i < count;
            i++
        ) {
            setTimeout(
                () => {
                    if (
                        turn !==
                        TURN.FORECAST
                    ) {
                        return;
                    }

                    fireAtEnemy(
                        config,
                        random(
                            -spread,
                            spread
                        )
                    );
                },

                i * gap
            );
        }
    }


    function fireShotgun() {
        for (
            let i = -4;
            i <= 4;
            i++
        ) {
            fireAtEnemy(
                {
                    speed: 480,
                    damage: 4,
                    radius: 2,
                    type:
                        "shotgunPellet"
                },

                i * 0.075
            );
        }

        effects.push({
            type: "muzzleBurst",

            x: forecast.x,
            y: forecast.y + 10,

            life: 0.18,
            maxLife: 0.18
        });
    }


    function createBeam(
        chargeTime,
        duration,
        damage
    ) {
        const now =
            performance.now();

        beam = {
            chargeUntil:
                now + chargeTime,

            until:
                now +
                chargeTime +
                duration,

            damage,
            hit: false
        };
    }


    /* ======================================================
       TECHNIQUES
    ====================================================== */

    function useTechnique(type) {
        if (
            !type ||
            !isForecastTurn()
        ) {
            return;
        }

        switch (type) {

            case "bones":
                playForecastAnimation(
                    "bone_control",
                    550
                );

                for (
                    let i = -2;
                    i <= 2;
                    i++
                ) {
                    fireAtEnemy(
                        {
                            speed: 390,
                            damage: 6,
                            radius: 5,
                            type: "bone"
                        },

                        i * 0.09
                    );
                }
                break;


            case "boneWall":
                playForecastAnimation(
                    "bone_control",
                    650
                );

                for (
                    let i = 0;
                    i < 7;
                    i++
                ) {
                    hazards.push({
                        type: "boneWall",

                        x:
                            enemy.x -
                            60 +
                            i * 20,

                        y:
                            enemy.y,

                        radius: 12,
                        damage: 7,

                        activateAt:
                            performance.now() +
                            350 +
                            i * 45,

                        life: 1.6,
                        hit: false
                    });
                }
                break;


            case "illusions":
                for (
                    let i = 0;
                    i < 6;
                    i++
                ) {
                    illusions.push({
                        x: random(
                            arena.left + 30,
                            arena.right - 30
                        ),

                        y: random(
                            arena.top + 30,
                            arena.bottom - 30
                        ),

                        until:
                            performance.now() +
                            3000
                    });
                }
                break;


            case "constructs":
                for (
                    let i = 0;
                    i < 4;
                    i++
                ) {
                    hazards.push({
                        type: "construct",

                        x:
                            enemy.x +
                            random(
                                -100,
                                100
                            ),

                        y:
                            enemy.y +
                            random(
                                -70,
                                70
                            ),

                        radius: 22,
                        damage: 9,

                        activateAt:
                            performance.now() +
                            500,

                        life: 2.3,
                        hit: false
                    });
                }
                break;


            case "gaster":
                playForecastAnimation(
                    "gaster_charge",
                    500
                );

                setTimeout(
                    () => {
                        if (
                            turn !==
                            TURN.FORECAST
                        ) {
                            return;
                        }

                        playForecastAnimation(
                            "gaster_fire",
                            700
                        );

                        createBeam(
                            0,
                            650,
                            24
                        );
                    },

                    500
                );
                break;


            case "forecastTrap":
                hazards.push({
                    type: "forecastTrap",

                    /*
                        Attack the position the
                        protagonist is moving toward.
                    */

                    x:
                        enemy.targetX,

                    y:
                        enemy.targetY,

                    radius: 36,
                    damage: 17,

                    activateAt:
                        performance.now() +
                        700,

                    life: 1.8,
                    hit: false
                });
                break;


            case "crossfire":
                createCrossfire();
                break;


            case "falseFuture":
                createFalseFuture();
                break;


            case "inevitable":
                createInevitable();
                break;
        }
    }


    function createCrossfire() {
        const amount = 8;

        for (
            let i = 0;
            i < amount;
            i++
        ) {
            const angle =
                (
                    i /
                    amount
                ) *
                Math.PI *
                2;

            const spawnX =
                enemy.x +
                Math.cos(angle) *
                150;

            const spawnY =
                enemy.y +
                Math.sin(angle) *
                150;

            const dx =
                enemy.x -
                spawnX;

            const dy =
                enemy.y -
                spawnY;

            const distance =
                Math.hypot(
                    dx,
                    dy
                ) || 1;

            forecastProjectiles.push({
                x: spawnX,
                y: spawnY,

                vx:
                    (
                        dx /
                        distance
                    ) *
                    330,

                vy:
                    (
                        dy /
                        distance
                    ) *
                    330,

                damage: 7,
                radius: 4,

                type: "crossfire",

                life: 1.5
            });
        }
    }


    function createFalseFuture() {
        const fakeX =
            enemy.targetX;

        const fakeY =
            enemy.targetY;

        effects.push({
            type: "fakeMarker",

            x: fakeX,
            y: fakeY,

            life: 0.8,
            maxLife: 0.8
        });

        setTimeout(
            () => {
                if (
                    turn !==
                    TURN.FORECAST
                ) {
                    return;
                }

                hazards.push({
                    type:
                        "falseFuture",

                    x:
                        enemy.x,

                    y:
                        enemy.y,

                    radius: 40,
                    damage: 21,

                    activateAt:
                        performance.now() +
                        100,

                    life: 1.2,
                    hit: false
                });
            },

            650
        );
    }


    function createInevitable() {
        for (
            let i = 0;
            i < 4;
            i++
        ) {
            setTimeout(
                () => {
                    if (
                        turn !==
                        TURN.FORECAST
                    ) {
                        return;
                    }

                    hazards.push({
                        type:
                            "inevitable",

                        x:
                            enemy.x,

                        y:
                            enemy.y,

                        radius:
                            28 +
                            i * 6,

                        damage: 11,

                        activateAt:
                            performance.now() +
                            250,

                        life: 1.2,
                        hit: false
                    });
                },

                i * 350
            );
        }
    }


    /* ======================================================
       EYES
    ====================================================== */

    function useEye(data) {
        const now =
            performance.now();

        playForecastAnimation(
            "eye_activate",
            450
        );

        effects.push({
            type: "eyeFlash",

            x: forecast.x,
            y: forecast.y - 15,

            life: 0.45,
            maxLife: 0.45
        });

        switch (data.effect) {

            case "freeze":
                enemy.frozenUntil =
                    now +
                    data.duration;
                break;


            case "domain":
                domainUntil =
                    now +
                    data.duration;
                break;


            case "heroism":
                heroismUntil =
                    now +
                    data.duration;
                break;


            case "evolution":
                evolutionUntil =
                    now +
                    data.duration;
                break;


            case "deadlock":
                deadlockUntil =
                    now +
                    data.duration;
                break;


            case "null":
                enemyProjectiles = [];

                effects.push({
                    type: "nullBurst",

                    x: forecast.x,
                    y: forecast.y,

                    life: 0.6,
                    maxLife: 0.6
                });
                break;


            case "paradox":
                decoy = {
                    x:
                        forecast.x +
                        100,

                    y:
                        forecast.y,

                    until:
                        now +
                        data.duration
                };
                break;


            case "observe":
                observeUntil =
                    now +
                    data.duration;
                break;


            case "vector":
                vectorUntil =
                    now +
                    data.duration;
                break;


            case "moment":
                momentUntil =
                    now +
                    data.duration;
                break;
        }
    }    /* ======================================================
       FORECAST PROJECTILE UPDATE
    ====================================================== */

    function updateForecastProjectiles(
        dt,
        now
    ) {
        for (
            let i =
                forecastProjectiles.length - 1;

            i >= 0;

            i--
        ) {
            const projectile =
                forecastProjectiles[i];

            if (!projectile) {
                forecastProjectiles.splice(
                    i,
                    1
                );

                continue;
            }

            /*
                VECTOR subtly bends projectiles
                toward the protagonist.
            */

            if (
                now < vectorUntil
            ) {
                const angle =
                    Math.atan2(
                        enemy.y -
                        projectile.y,

                        enemy.x -
                        projectile.x
                    );

                const speed =
                    Math.hypot(
                        projectile.vx,
                        projectile.vy
                    );

                projectile.vx =
                    projectile.vx * 0.9 +
                    Math.cos(angle) *
                    speed *
                    0.1;

                projectile.vy =
                    projectile.vy * 0.9 +
                    Math.sin(angle) *
                    speed *
                    0.1;
            }

            projectile.x +=
                projectile.vx * dt;

            projectile.y +=
                projectile.vy * dt;

            projectile.life -= dt;

            if (
                projectile.life <= 0 ||
                projectile.x < -100 ||
                projectile.x > width + 100 ||
                projectile.y < -100 ||
                projectile.y > height + 100
            ) {
                forecastProjectiles.splice(
                    i,
                    1
                );

                continue;
            }

            if (
                circlesTouch(
                    projectile.x,
                    projectile.y,
                    projectile.radius,

                    enemy.x,
                    enemy.y,
                    enemy.radius
                )
            ) {
                damageEnemy(
                    projectile.damage
                );

                createHitEffect(
                    enemy.x,
                    enemy.y
                );

                forecastProjectiles.splice(
                    i,
                    1
                );
            }
        }
    }


    /* ======================================================
       HAZARDS
    ====================================================== */

    function updateHazards(
        dt,
        now
    ) {
        for (
            let i =
                hazards.length - 1;

            i >= 0;

            i--
        ) {
            const hazard =
                hazards[i];

            hazard.life -= dt;

            if (
                hazard.life <= 0
            ) {
                hazards.splice(
                    i,
                    1
                );

                continue;
            }

            if (
                now <
                hazard.activateAt
            ) {
                continue;
            }

            if (
                hazard.hit
            ) {
                continue;
            }

            if (
                circlesTouch(
                    hazard.x,
                    hazard.y,
                    hazard.radius,

                    enemy.x,
                    enemy.y,
                    enemy.radius
                )
            ) {
                hazard.hit = true;

                damageEnemy(
                    hazard.damage
                );

                createHitEffect(
                    enemy.x,
                    enemy.y
                );
            }
        }
    }


    /* ======================================================
       BEAM / SCYTHE
    ====================================================== */

    function updateSpecialAttacks(now) {

        if (beam) {
            if (
                now >= beam.until
            ) {
                beam = null;
            }

            else if (
                now >=
                    beam.chargeUntil &&
                !beam.hit
            ) {
                /*
                    Beam is aimed from Forecast
                    through the protagonist.
                */

                if (
                    distancePointToSegment(
                        enemy.x,
                        enemy.y,

                        forecast.x,
                        forecast.y,

                        enemy.x,
                        enemy.y,

                        width * 2
                    ) < 30
                ) {
                    beam.hit = true;

                    damageEnemy(
                        beam.damage
                    );

                    createHitEffect(
                        enemy.x,
                        enemy.y
                    );
                }
            }
        }


        if (scythe) {
            if (
                now >= scythe.until
            ) {
                scythe = null;
            }

            else if (
                !scythe.hit
            ) {
                /*
                    Large stylized arc.
                    Generous range because Forecast
                    stands above the box.
                */

                const distance =
                    Math.hypot(
                        enemy.x -
                        forecast.x,

                        enemy.y -
                        forecast.y
                    );

                if (
                    distance < 230
                ) {
                    scythe.hit = true;

                    damageEnemy(
                        scythe.damage
                    );

                    createHitEffect(
                        enemy.x,
                        enemy.y
                    );
                }
            }
        }
    }


    /* ======================================================
       ENEMY DAMAGE
    ====================================================== */

    function damageEnemy(amount) {
        if (
            turn !== TURN.FORECAST
        ) {
            return;
        }

        let finalDamage =
            amount;

        if (
            performance.now() <
            heroismUntil
        ) {
            finalDamage *= 1.3;
        }

        enemy.hp =
            Math.max(
                0,
                enemy.hp -
                finalDamage
            );

        updateEnemyHUD();

        if (
            enemy.hp <= 0
        ) {
            turn = TURN.ENDED;

            forecastProjectiles = [];
            enemyProjectiles = [];
            hazards = [];

            updateTurnHUD();

            message(
                "Possibility terminated."
            );
        }
    }


    /* ======================================================
       PHASE CHANGE
    ====================================================== */

    function onPhaseChanged(detail) {

        /*
            IMPORTANT:
            Phase change NEVER changes Forecast's
            gameplay coordinates.
        */

        positionForecast();

        enemyProjectiles = [];
        hazards = [];

        playForecastAnimation(
            "phase_change",
            900
        );

        effects.push({
            type: "phaseBurst",

            x: forecast.x,
            y: forecast.y,

            life: 0.9,
            maxLife: 0.9
        });

        if (
            ForecastPhases.getPhase() ===
            "5"
        ) {
            message(
                "Phase 5."
            );
        }
    }


    /* ======================================================
       EFFECT UPDATE
    ====================================================== */

    function updateEffects(
        dt,
        now
    ) {
        for (
            const effect of effects
        ) {
            effect.life -= dt;
        }

        effects =
            effects.filter(
                effect =>
                    effect.life > 0
            );

        illusions =
            illusions.filter(
                illusion =>
                    now <
                    illusion.until
            );

        if (
            decoy &&
            now >= decoy.until
        ) {
            decoy = null;
        }
    }


    /* ======================================================
       MAIN RENDER
    ====================================================== */

    function draw(now) {
        ctx.clearRect(
            0,
            0,
            width,
            height
        );

        drawArena(now);

        drawPrediction(now);

        drawHazards(now);

        drawIllusions(now);

        drawForecastProjectiles();

        drawEnemyProjectiles();

        drawBeam(now);

        drawScythe(now);

        /*
            Forecast is deliberately rendered AFTER
            attacks so he stays readable as the boss.
        */

        drawForecast(now);

        drawEnemy(now);

        drawEffects(now);
    }


    /* ======================================================
       ARENA
    ====================================================== */

    function drawArena(now) {
        ctx.save();

        ctx.strokeStyle =
            now < domainUntil
                ? "#ff2424"
                : "#eeeeee";

        ctx.lineWidth = 3;

        ctx.strokeRect(
            arena.left,
            arena.top,

            arena.right -
                arena.left,

            arena.bottom -
                arena.top
        );

        if (
            now < domainUntil
        ) {
            ctx.globalAlpha = 0.08;

            ctx.fillStyle =
                "#ff2424";

            ctx.fillRect(
                arena.left,
                arena.top,

                arena.right -
                    arena.left,

                arena.bottom -
                    arena.top
            );
        }

        ctx.restore();
    }


    /* ======================================================
       PREDICTION
    ====================================================== */

    function drawPrediction(now) {
        if (
            now >= predictionUntil &&
            now >= observeUntil
        ) {
            return;
        }

        ctx.save();

        ctx.globalAlpha = 0.45;

        ctx.strokeStyle =
            "#ff3030";

        ctx.lineWidth = 2;

        ctx.setLineDash([
            5,
            5
        ]);

        ctx.beginPath();

        ctx.moveTo(
            enemy.x,
            enemy.y
        );

        ctx.lineTo(
            enemy.targetX,
            enemy.targetY
        );

        ctx.stroke();

        ctx.beginPath();

        ctx.arc(
            enemy.targetX,
            enemy.targetY,
            15,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.restore();
    }


    /* ======================================================
       FORECAST RENDERER

       TEMPORARY CLEAN PIXEL-STYLE RENDERER.

       We are NOT cropping random pieces of the giant
       character sheet anymore.

       The animation states are real and already hooked
       into combat. Clean transparent animation frames
       can later replace THIS renderer only.
    ====================================================== */

    function drawForecast(now) {
        const animation =
            forecast.animation;

        const elapsed =
            (
                now -
                forecast.animationStarted
            ) /
            1000;

        let visualX =
            forecast.x;

        let visualY =
            forecast.y;

        let rotation = 0;
        let alpha = 1;

        let cloakOffset =
            Math.sin(
                now * 0.004
            ) * 2;


        /*
            VISUAL DODGE ONLY.

            These offsets DO NOT touch forecast.x/y.
        */

        if (
            animation ===
            "dodge_left"
        ) {
            visualX -= 10;
            rotation = -0.15;
        }

        else if (
            animation ===
            "dodge_right"
        ) {
            visualX += 10;
            rotation = 0.15;
        }


        if (
            animation ===
            "low_stamina"
        ) {
            visualY += 3;
        }


        if (
            animation ===
            "exhausted"
        ) {
            visualY += 7;

            rotation =
                Math.sin(
                    elapsed * 8
                ) *
                0.025;
        }


        if (
            animation ===
            "hit"
        ) {
            alpha =
                0.55 +
                Math.sin(
                    elapsed * 40
                ) *
                0.25;
        }


        if (
            animation ===
            "phase_change"
        ) {
            const pulse =
                Math.sin(
                    elapsed * 28
                ) *
                3;

            visualY += pulse;
        }


        ctx.save();

        ctx.globalAlpha =
            Math.max(
                0.15,
                alpha
            );

        ctx.translate(
            visualX,
            visualY
        );

        ctx.rotate(rotation);


        /* ------------------------------
           HOOD / CLOAK
        ------------------------------ */

        ctx.shadowColor =
            "#ff2020";

        ctx.shadowBlur =
            animation ===
                "phase_change"
                ? 26
                : 8;


        ctx.fillStyle =
            "#080808";

        ctx.beginPath();

        ctx.moveTo(
            -29,
            28
        );

        ctx.lineTo(
            -25,
            -10
        );

        ctx.quadraticCurveTo(
            -20,
            -38,
            0,
            -40
        );

        ctx.quadraticCurveTo(
            20,
            -38,
            25,
            -10
        );

        ctx.lineTo(
            29,
            28 +
            cloakOffset
        );

        ctx.lineTo(
            10,
            20
        );

        ctx.lineTo(
            0,
            30
        );

        ctx.lineTo(
            -10,
            20
        );

        ctx.closePath();

        ctx.fill();


        /* ------------------------------
           SKULL
        ------------------------------ */

        ctx.shadowBlur = 0;

        ctx.fillStyle =
            "#eeeeee";

        ctx.beginPath();

        ctx.arc(
            0,
            -15,
            17,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.fillRect(
            -11,
            -9,
            22,
            14
        );


        /* ------------------------------
           EYES
        ------------------------------ */

        ctx.fillStyle =
            "#070707";

        ctx.fillRect(
            -11,
            -20,
            8,
            6
        );

        ctx.fillRect(
            4,
            -20,
            8,
            6
        );


        /*
            Forecast eye.
        */

        ctx.shadowColor =
            "#ff2020";

        ctx.shadowBlur = 13;

        ctx.fillStyle =
            "#ff2020";

        ctx.fillRect(
            5,
            -19,
            6,
            4
        );


        if (
            animation ===
                "eye_activate" ||
            animation ===
                "phase_change"
        ) {
            ctx.shadowBlur = 24;

            ctx.fillRect(
                3,
                -21,
                10,
                8
            );
        }


        /* ------------------------------
           MOUTH
        ------------------------------ */

        ctx.shadowBlur = 0;

        ctx.strokeStyle =
            "#090909";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(
            -8,
            -4
        );

        ctx.lineTo(
            8,
            -4
        );

        ctx.stroke();


        /* ------------------------------
           ARMS / ATTACK POSE
        ------------------------------ */

        drawForecastPose(
            animation,
            elapsed
        );

        ctx.restore();
    }


    /* ======================================================
       FORECAST ANIMATION POSES
    ====================================================== */

    function drawForecastPose(
        animation,
        elapsed
    ) {
        ctx.lineWidth = 4;

        ctx.strokeStyle =
            "#eeeeee";


        if (
            animation ===
                "glock_fire" ||
            animation ===
                "smg_fire" ||
            animation ===
                "ar_fire" ||
            animation ===
                "dmr_fire" ||
            animation ===
                "shotgun_fire"
        ) {
            /*
                Stylized game weapon pose.
            */

            ctx.beginPath();

            ctx.moveTo(
                14,
                4
            );

            ctx.lineTo(
                32,
                8
            );

            ctx.stroke();


            ctx.fillStyle =
                "#161616";

            let length = 22;

            if (
                animation ===
                "smg_fire"
            ) {
                length = 30;
            }

            else if (
                animation ===
                "ar_fire"
            ) {
                length = 38;
            }

            else if (
                animation ===
                "dmr_fire"
            ) {
                length = 44;
            }

            else if (
                animation ===
                "shotgun_fire"
            ) {
                length = 42;
            }


            ctx.fillRect(
                27,
                3,
                length,
                7
            );


            if (
                animation !==
                "dmr_fire"
            ) {
                const flash =
                    Math.max(
                        0,
                        Math.sin(
                            elapsed *
                            45
                        )
                    );

                if (
                    flash > 0.35
                ) {
                    ctx.fillStyle =
                        "#ff3030";

                    ctx.beginPath();

                    ctx.moveTo(
                        27 +
                        length,
                        6
                    );

                    ctx.lineTo(
                        38 +
                        length,
                        0
                    );

                    ctx.lineTo(
                        34 +
                        length,
                        7
                    );

                    ctx.lineTo(
                        39 +
                        length,
                        14
                    );

                    ctx.closePath();

                    ctx.fill();
                }
            }
        }


        else if (
            animation ===
            "bone_control"
        ) {
            ctx.strokeStyle =
                "#ff3030";

            ctx.beginPath();

            ctx.moveTo(
                -17,
                4
            );

            ctx.lineTo(
                -35,
                -4
            );

            ctx.moveTo(
                17,
                4
            );

            ctx.lineTo(
                35,
                -4
            );

            ctx.stroke();


            ctx.fillStyle =
                "#eeeeee";

            drawMiniBone(
                -42,
                -8,
                elapsed
            );

            drawMiniBone(
                42,
                -8,
                -elapsed
            );
        }


        else if (
            animation ===
                "gaster_charge" ||
            animation ===
                "gaster_fire"
        ) {
            ctx.strokeStyle =
                "#ff3030";

            ctx.shadowColor =
                "#ff3030";

            ctx.shadowBlur =
                animation ===
                    "gaster_fire"
                    ? 24
                    : 12;

            ctx.beginPath();

            ctx.arc(
                0,
                8,
                20 +
                Math.sin(
                    elapsed * 20
                ) *
                4,
                0,
                Math.PI * 2
            );

            ctx.stroke();

            ctx.shadowBlur = 0;
        }


        else if (
            animation ===
                "scythe_summon"
        ) {
            ctx.strokeStyle =
                "#ff3030";

            ctx.globalAlpha *=
                0.75;

            ctx.beginPath();

            ctx.arc(
                35,
                0,
                25 +
                Math.sin(
                    elapsed * 18
                ) *
                5,
                0,
                Math.PI * 2
            );

            ctx.stroke();
        }


        else if (
            animation ===
                "eye_activate"
        ) {
            ctx.strokeStyle =
                "#ff3030";

            ctx.beginPath();

            ctx.moveTo(
                -20,
                5
            );

            ctx.lineTo(
                -34,
                -3
            );

            ctx.moveTo(
                20,
                5
            );

            ctx.lineTo(
                34,
                -3
            );

            ctx.stroke();
        }
    }


    function drawMiniBone(
        x,
        y,
        phase
    ) {
        ctx.save();

        ctx.translate(
            x,
            y +
            Math.sin(
                phase * 6
            ) *
            4
        );

        ctx.fillRect(
            -8,
            -2,
            16,
            4
        );

        ctx.beginPath();

        ctx.arc(
            -8,
            0,
            4,
            0,
            Math.PI * 2
        );

        ctx.arc(
            8,
            0,
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }


    /* ======================================================
       PROTAGONIST HEART
    ====================================================== */

    function drawEnemy(now) {
        ctx.save();

        ctx.translate(
            enemy.x,
            enemy.y
        );

        if (
            now <
            enemy.frozenUntil
        ) {
            ctx.globalAlpha = 0.65;
        }

        ctx.fillStyle =
            "#ff2020";

        ctx.beginPath();

        ctx.moveTo(
            0,
            11
        );

        ctx.lineTo(
            -10,
            1
        );

        ctx.bezierCurveTo(
            -15,
            -9,
            -4,
            -15,
            0,
            -7
        );

        ctx.bezierCurveTo(
            4,
            -15,
            15,
            -9,
            10,
            1
        );

        ctx.closePath();

        ctx.fill();

        ctx.restore();
    }


    /* ======================================================
       FORECAST PROJECTILES

       EACH WEAPON HAS ITS OWN VISUAL.
    ====================================================== */

    function drawForecastProjectiles() {
        for (
            const projectile of
            forecastProjectiles
        ) {
            ctx.save();

            const angle =
                Math.atan2(
                    projectile.vy,
                    projectile.vx
                );

            ctx.translate(
                projectile.x,
                projectile.y
            );

            ctx.rotate(angle);


            switch (
                projectile.type
            ) {

                /* --------------------------
                   GLOCK
                -------------------------- */

                case "glockBullet":
                    ctx.fillStyle =
                        "#ffffff";

                    ctx.fillRect(
                        -6,
                        -2,
                        13,
                        4
                    );

                    ctx.fillStyle =
                        "#ff3030";

                    ctx.fillRect(
                        -14,
                        -1,
                        8,
                        2
                    );
                    break;


                /* --------------------------
                   SMG
                -------------------------- */

                case "smgBullet":
                    ctx.fillStyle =
                        "#dddddd";

                    ctx.fillRect(
                        -5,
                        -1,
                        10,
                        3
                    );

                    ctx.globalAlpha =
                        0.55;

                    ctx.fillStyle =
                        "#ff3030";

                    ctx.fillRect(
                        -10,
                        -1,
                        5,
                        2
                    );
                    break;


                /* --------------------------
                   AR
                -------------------------- */

                case "arTracer":
                    ctx.strokeStyle =
                        "#ff4040";

                    ctx.lineWidth = 2;

                    ctx.beginPath();

                    ctx.moveTo(
                        -24,
                        0
                    );

                    ctx.lineTo(
                        8,
                        0
                    );

                    ctx.stroke();

                    ctx.fillStyle =
                        "#ffffff";

                    ctx.fillRect(
                        5,
                        -2,
                        9,
                        4
                    );
                    break;


                /* --------------------------
                   DMR
                -------------------------- */

                case "dmrRound":
                    ctx.shadowColor =
                        "#ff3030";

                    ctx.shadowBlur = 8;

                    ctx.strokeStyle =
                        "#ffffff";

                    ctx.lineWidth = 3;

                    ctx.beginPath();

                    ctx.moveTo(
                        -42,
                        0
                    );

                    ctx.lineTo(
                        10,
                        0
                    );

                    ctx.stroke();

                    ctx.fillStyle =
                        "#ff3030";

                    ctx.fillRect(
                        7,
                        -3,
                        13,
                        6
                    );
                    break;


                /* --------------------------
                   SHOTGUN
                -------------------------- */

                case "shotgunPellet":
                    ctx.fillStyle =
                        "#eeeeee";

                    ctx.fillRect(
                        -3,
                        -2,
                        7,
                        4
                    );
                    break;


                /* --------------------------
                   BONE
                -------------------------- */

                case "bone":
                    ctx.fillStyle =
                        "#eeeeee";

                    ctx.fillRect(
                        -12,
                        -3,
                        24,
                        6
                    );

                    ctx.beginPath();

                    ctx.arc(
                        -12,
                        -3,
                        5,
                        0,
                        Math.PI * 2
                    );

                    ctx.arc(
                        -12,
                        3,
                        5,
                        0,
                        Math.PI * 2
                    );

                    ctx.arc(
                        12,
                        -3,
                        5,
                        0,
                        Math.PI * 2
                    );

                    ctx.arc(
                        12,
                        3,
                        5,
                        0,
                        Math.PI * 2
                    );

                    ctx.fill();
                    break;


                /* --------------------------
                   CROSSFIRE
                -------------------------- */

                case "crossfire":
                    ctx.fillStyle =
                        "#ff3030";

                    ctx.beginPath();

                    ctx.moveTo(
                        11,
                        0
                    );

                    ctx.lineTo(
                        -8,
                        -6
                    );

                    ctx.lineTo(
                        -8,
                        6
                    );

                    ctx.closePath();

                    ctx.fill();
                    break;
            }

            ctx.restore();
        }
    }


    /* ======================================================
       PROTAGONIST PROJECTILES
    ====================================================== */

    function drawEnemyProjectiles() {
        for (
            const projectile of
            enemyProjectiles
        ) {
            ctx.save();

            ctx.translate(
                projectile.x,
                projectile.y
            );

            if (
                projectile.type ===
                "heavy"
            ) {
                ctx.strokeStyle =
                    "#ffffff";

                ctx.lineWidth = 4;

                ctx.shadowColor =
                    "#ff3030";

                ctx.shadowBlur = 8;
            }

            else {
                ctx.strokeStyle =
                    "#ff3030";

                ctx.lineWidth = 2;
            }

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                projectile.radius,
                0,
                Math.PI * 2
            );

            ctx.stroke();

            ctx.restore();
        }
    }


    /* ======================================================
       HAZARD RENDERING
    ====================================================== */

    function drawHazards(now) {
        for (
            const hazard of hazards
        ) {
            const active =
                now >=
                hazard.activateAt;

            ctx.save();

            ctx.strokeStyle =
                active
                    ? "#ff3030"
                    : "rgba(255,48,48,0.4)";

            ctx.fillStyle =
                active
                    ? "#eeeeee"
                    : "rgba(238,238,238,0.25)";

            ctx.lineWidth = 2;

            if (!active) {
                ctx.setLineDash([
                    4,
                    5
                ]);
            }


            if (
                hazard.type ===
                "boneWall"
            ) {
                /*
                    Bone rising vertically.
                */

                const rise =
                    active
                        ? 1
                        : 0.35;

                const boneHeight =
                    70 * rise;

                ctx.fillRect(
                    hazard.x - 4,
                    hazard.y -
                        boneHeight /
                        2,

                    8,
                    boneHeight
                );

                ctx.beginPath();

                ctx.arc(
                    hazard.x,
                    hazard.y -
                        boneHeight /
                        2,
                    7,
                    0,
                    Math.PI * 2
                );

                ctx.arc(
                    hazard.x,
                    hazard.y +
                        boneHeight /
                        2,
                    7,
                    0,
                    Math.PI * 2
                );

                ctx.fill();
            }


            else if (
                hazard.type ===
                "construct"
            ) {
                ctx.translate(
                    hazard.x,
                    hazard.y
                );

                ctx.rotate(
                    performance.now() *
                    0.002
                );

                ctx.strokeRect(
                    -18,
                    -18,
                    36,
                    36
                );

                ctx.rotate(
                    Math.PI / 4
                );

                ctx.strokeRect(
                    -10,
                    -10,
                    20,
                    20
                );
            }


            else if (
                hazard.type ===
                "forecastTrap"
            ) {
                ctx.beginPath();

                ctx.arc(
                    hazard.x,
                    hazard.y,
                    hazard.radius,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();

                ctx.beginPath();

                ctx.moveTo(
                    hazard.x -
                        hazard.radius,
                    hazard.y
                );

                ctx.lineTo(
                    hazard.x +
                        hazard.radius,
                    hazard.y
                );

                ctx.moveTo(
                    hazard.x,
                    hazard.y -
                        hazard.radius
                );

                ctx.lineTo(
                    hazard.x,
                    hazard.y +
                        hazard.radius
                );

                ctx.stroke();
            }


            else if (
                hazard.type ===
                "falseFuture"
            ) {
                ctx.strokeStyle =
                    active
                        ? "#ffffff"
                        : "#ff3030";

                ctx.lineWidth =
                    active
                        ? 5
                        : 2;

                ctx.beginPath();

                ctx.arc(
                    hazard.x,
                    hazard.y,
                    hazard.radius,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();
            }


            else if (
                hazard.type ===
                "inevitable"
            ) {
                ctx.shadowColor =
                    "#ff3030";

                ctx.shadowBlur =
                    active
                        ? 20
                        : 5;

                ctx.beginPath();

                ctx.arc(
                    hazard.x,
                    hazard.y,
                    hazard.radius,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();

                ctx.beginPath();

                ctx.arc(
                    hazard.x,
                    hazard.y,
                    hazard.radius *
                    0.55,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();
            }

            ctx.restore();
        }
    }


    /* ======================================================
       ILLUSIONS
    ====================================================== */

    function drawIllusions(now) {
        for (
            const illusion of
            illusions
        ) {
            ctx.save();

            ctx.globalAlpha =
                0.18 +
                Math.sin(
                    now * 0.012 +
                    illusion.x
                ) *
                0.07;

            ctx.strokeStyle =
                "#ff3030";

            ctx.lineWidth = 2;

            ctx.strokeRect(
                illusion.x - 18,
                illusion.y - 25,
                36,
                50
            );

            ctx.beginPath();

            ctx.arc(
                illusion.x,
                illusion.y - 12,
                10,
                0,
                Math.PI * 2
            );

            ctx.stroke();

            ctx.restore();
        }
    }


    /* ======================================================
       GASTER BEAM
    ====================================================== */

    function drawBeam(now) {
        if (!beam) return;

        ctx.save();

        const charging =
            now <
            beam.chargeUntil;

        ctx.strokeStyle =
            charging
                ? "rgba(255,48,48,0.45)"
                : "#ff3030";

        ctx.lineWidth =
            charging
                ? 2
                : 26;

        ctx.shadowColor =
            "#ff3030";

        ctx.shadowBlur =
            charging
                ? 6
                : 24;

        if (charging) {
            ctx.setLineDash([
                6,
                7
            ]);
        }

        const angle =
            Math.atan2(
                enemy.y -
                    forecast.y,

                enemy.x -
                    forecast.x
            );

        const beamLength =
            Math.max(
                width,
                height
            ) *
            1.5;

        ctx.beginPath();

        ctx.moveTo(
            forecast.x,
            forecast.y
        );

        ctx.lineTo(
            forecast.x +
                Math.cos(angle) *
                beamLength,

            forecast.y +
                Math.sin(angle) *
                beamLength
        );

        ctx.stroke();

        if (!charging) {
            ctx.strokeStyle =
                "#ffffff";

            ctx.lineWidth = 7;

            ctx.shadowBlur = 0;

            ctx.stroke();
        }

        ctx.restore();
    }


    /* ======================================================
       EXECUTION SCYTHE
    ====================================================== */

    function drawScythe(now) {
        if (!scythe) return;

        const progress =
            clamp(
                (
                    now -
                    scythe.started
                ) /
                (
                    scythe.until -
                    scythe.started
                ),

                0,
                1
            );

        const angle =
            -1.8 +
            progress *
            Math.PI *
            1.55;

        ctx.save();

        ctx.translate(
            forecast.x,
            forecast.y
        );

        ctx.rotate(angle);

        ctx.strokeStyle =
            "#eeeeee";

        ctx.lineWidth = 5;

        ctx.beginPath();

        ctx.moveTo(
            0,
            0
        );

        ctx.lineTo(
            120,
            0
        );

        ctx.stroke();


        ctx.strokeStyle =
            "#ff3030";

        ctx.shadowColor =
            "#ff3030";

        ctx.shadowBlur = 15;

        ctx.lineWidth = 8;

        ctx.beginPath();

        ctx.arc(
            113,
            -20,
            34,
            0.25,
            2.8
        );

        ctx.stroke();

        ctx.restore();


        /*
            Swing trail.
        */

        ctx.save();

        ctx.globalAlpha =
            0.3;

        ctx.strokeStyle =
            "#ff3030";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            forecast.x,
            forecast.y,
            125,
            -1.8,
            angle
        );

        ctx.stroke();

        ctx.restore();
    }


    /* ======================================================
       EFFECTS
    ====================================================== */

    function drawEffects(now) {
        for (
            const effect of effects
        ) {
            const ratio =
                effect.maxLife
                    ? effect.life /
                      effect.maxLife
                    : effect.life;

            ctx.save();


            if (
                effect.type ===
                "dodgeAfterimage"
            ) {
                ctx.globalAlpha =
                    Math.max(
                        0,
                        ratio * 0.55
                    );

                ctx.strokeStyle =
                    "#ff3030";

                ctx.lineWidth = 2;

                const offset =
                    effect.direction *
                    34 *
                    (
                        1 -
                        ratio
                    );

                ctx.strokeRect(
                    effect.x -
                        22 +
                        offset,

                    effect.y -
                        31,

                    44,
                    62
                );
            }


            else if (
                effect.type ===
                "predictionLine"
            ) {
                ctx.globalAlpha =
                    Math.max(
                        0,
                        ratio
                    );

                ctx.strokeStyle =
                    "#ffffff";

                ctx.lineWidth = 2;

                ctx.setLineDash([
                    4,
                    4
                ]);

                ctx.beginPath();

                ctx.moveTo(
                    effect.x,
                    effect.y
                );

                ctx.lineTo(
                    effect.targetX,
                    effect.targetY
                );

                ctx.stroke();
            }


            else if (
                effect.type ===
                "muzzleBurst"
            ) {
                ctx.globalAlpha =
                    ratio;

                ctx.fillStyle =
                    "#ff3030";

                ctx.beginPath();

                ctx.arc(
                    effect.x,
                    effect.y,
                    10 +
                    (
                        1 -
                        ratio
                    ) *
                    20,
                    0,
                    Math.PI * 2
                );

                ctx.fill();
            }


            else if (
                effect.type ===
                "eyeFlash"
            ) {
                ctx.globalAlpha =
                    ratio;

                ctx.strokeStyle =
                    "#ff3030";

                ctx.shadowColor =
                    "#ff3030";

                ctx.shadowBlur = 20;

                ctx.lineWidth = 3;

                ctx.beginPath();

                ctx.arc(
                    effect.x,
                    effect.y,
                    12 +
                    (
                        1 -
                        ratio
                    ) *
                    30,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();
            }


            else if (
                effect.type ===
                "phaseBurst"
            ) {
                ctx.globalAlpha =
                    ratio;

                ctx.strokeStyle =
                    "#ff3030";

                ctx.shadowColor =
                    "#ff3030";

                ctx.shadowBlur = 25;

                ctx.lineWidth = 4;

                const radius =
                    20 +
                    (
                        1 -
                        ratio
                    ) *
                    100;

                ctx.beginPath();

                ctx.arc(
                    effect.x,
                    effect.y,
                    radius,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();
            }


            else if (
                effect.type ===
                "nullBurst"
            ) {
                ctx.globalAlpha =
                    ratio;

                ctx.strokeStyle =
                    "#ffffff";

                ctx.lineWidth = 4;

                ctx.beginPath();

                ctx.arc(
                    effect.x,
                    effect.y,
                    25 +
                    (
                        1 -
                        ratio
                    ) *
                    150,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();
            }


            else if (
                effect.type ===
                "fakeMarker"
            ) {
                ctx.globalAlpha =
                    ratio;

                ctx.strokeStyle =
                    "#ff3030";

                ctx.setLineDash([
                    5,
                    5
                ]);

                ctx.strokeRect(
                    effect.x - 25,
                    effect.y - 25,
                    50,
                    50
                );
            }


            else if (
                effect.type ===
                "hit"
            ) {
                ctx.globalAlpha =
                    Math.min(
                        1,
                        ratio * 3
                    );

                ctx.strokeStyle =
                    "#ffffff";

                ctx.lineWidth = 3;

                ctx.beginPath();

                ctx.moveTo(
                    effect.x - 15,
                    effect.y - 15
                );

                ctx.lineTo(
                    effect.x + 15,
                    effect.y + 15
                );

                ctx.moveTo(
                    effect.x + 15,
                    effect.y - 15
                );

                ctx.lineTo(
                    effect.x - 15,
                    effect.y + 15
                );

                ctx.stroke();
            }


            ctx.restore();
        }
    }


    function createHitEffect(
        x,
        y
    ) {
        effects.push({
            type: "hit",

            x,
            y,

            life: 0.25,
            maxLife: 0.25
        });
    }


    /* ======================================================
       HUD
    ====================================================== */

    function updateEnemyHUD() {
        const fill =
            document.getElementById(
                "enemyHPFill"
            );

        const text =
            document.getElementById(
                "enemyHPText"
            );

        const percent =
            (
                enemy.hp /
                enemy.maxHP
            ) *
            100;

        if (fill) {
            fill.style.width =
                `${percent}%`;
        }

        if (text) {
            text.textContent =
                `${Math.ceil(
                    enemy.hp
                )} / ${enemy.maxHP}`;
        }
    }


    function updateStaminaHUD(
        statusText = null
    ) {
        const fill =
            document.getElementById(
                "staminaFill"
            );

        const text =
            document.getElementById(
                "staminaText"
            );

        const status =
            document.getElementById(
                "dodgeStatus"
            );

        const percent =
            (
                stamina /
                STAMINA_MAX
            ) *
            100;

        if (fill) {
            fill.style.width =
                `${percent}%`;
        }

        if (text) {
            text.textContent =
                `${Math.ceil(
                    stamina
                )} / ${STAMINA_MAX}`;
        }

        if (status) {
            if (statusText) {
                status.textContent =
                    statusText;
            }

            else if (
                stamina <
                BASE_DODGE_COST
            ) {
                status.textContent =
                    "AUTO-DODGE EXHAUSTED";
            }

            else if (
                turn ===
                TURN.ENEMY
            ) {
                status.textContent =
                    "AUTO-DODGE ACTIVE";
            }

            else {
                status.textContent =
                    "AUTO-DODGE READY";
            }
        }
    }


    function updateTurnHUD() {
        const banner =
            document.getElementById(
                "turnBanner"
            );

        if (!banner) return;

        switch (turn) {
            case TURN.FORECAST:
                banner.textContent =
                    "FORECAST TURN";
                break;

            case TURN.ENEMY:
                banner.textContent =
                    "AUTO-DODGE";
                break;

            case TURN.TRANSITION:
                banner.textContent =
                    "PHASE SHIFT";
                break;

            case TURN.ENDED:
                banner.textContent =
                    "BATTLE END";
                break;
        }
    }


    /* ======================================================
       FORECAST ABILITY
    ====================================================== */

    function activatePrediction(
        duration = 1800
    ) {
        predictionUntil =
            Math.max(
                predictionUntil,
                performance.now() +
                duration
            );
    }


    /* ======================================================
       MESSAGE EVENT
    ====================================================== */

    function message(text) {
        window.dispatchEvent(
            new CustomEvent(
                "forecast-message",
                {
                    detail: {
                        message: text
                    }
                }
            )
        );
    }


    /* ======================================================
       HELPERS
    ====================================================== */

    function circlesTouch(
        ax,
        ay,
        ar,

        bx,
        by,
        br
    ) {
        const dx =
            ax - bx;

        const dy =
            ay - by;

        const radius =
            ar + br;

        return (
            dx * dx +
            dy * dy <=
            radius * radius
        );
    }


    function distancePointToSegment(
        px,
        py,

        x1,
        y1,

        x2,
        y2
    ) {
        const vx =
            x2 - x1;

        const vy =
            y2 - y1;

        const wx =
            px - x1;

        const wy =
            py - y1;

        const lengthSquared =
            vx * vx +
            vy * vy;

        if (
            lengthSquared === 0
        ) {
            return Math.hypot(
                px - x1,
                py - y1
            );
        }

        let t =
            (
                wx * vx +
                wy * vy
            ) /
            lengthSquared;

        t = clamp(
            t,
            0,
            1
        );

        const closestX =
            x1 + t * vx;

        const closestY =
            y1 + t * vy;

        return Math.hypot(
            px - closestX,
            py - closestY
        );
    }


    function clamp(
        value,
        min,
        max
    ) {
        return Math.max(
            min,
            Math.min(
                max,
                value
            )
        );
    }


    function random(
        min,
        max
    ) {
        return (
            min +
            Math.random() *
            (
                max -
                min
            )
        );
    }


    /* ======================================================
       PUBLIC API
    ====================================================== */

    return {
        init,
        reset,

        /*
            Compatibility only.
            Does NOT move Forecast.
        */

        setMovement,

        getTurn,
        isForecastTurn,

        getStamina() {
            return stamina;
        },

        getMaxStamina() {
            return STAMINA_MAX;
        },

        activatePrediction
    };

})();