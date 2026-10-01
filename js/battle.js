/* =========================================
   FORECAST!SANS — BATTLE ENGINE V0.4.1
   REAL FORECAST SPRITE + AUTO-DODGE
========================================= */

const Battle = (() => {

    let canvas = null;
    let ctx = null;

    let width = 0;
    let height = 0;
    let dpr = 1;

    let running = false;
    let lastFrame = 0;


    /* =====================================
       FORECAST!SANS SPRITE SHEET
    ===================================== */

    const forecastSheet = new Image();

    forecastSheet.src =
        "./Forecast!Sans Pixel Character Sheet.png";

    let forecastSheetReady = false;


    forecastSheet.addEventListener(
        "load",
        () => {

            forecastSheetReady = true;

            console.log(
                "Forecast!Sans sprite sheet loaded."
            );
        }
    );


    forecastSheet.addEventListener(
        "error",
        () => {

            console.error(
                "Could not load Forecast!Sans sprite sheet."
            );

            message(
                "Forecast sprite failed to load."
            );
        }
    );


    /*
        PHASE 1 crop from the Phase Evolution
        row of our Forecast!Sans sheet.

        We can fine-tune this crop after seeing
        the first in-game result.
    */

    const FORECAST_SPRITES = {

        "1": {
            x: 34,
            y: 674,
            width: 128,
            height: 145
        },

        "1.5": {
            x: 166,
            y: 674,
            width: 139,
            height: 145
        },

        "2": {
            x: 309,
            y: 674,
            width: 148,
            height: 145
        },

        "2.5": {
            x: 462,
            y: 674,
            width: 148,
            height: 145
        },

        "3": {
            x: 614,
            y: 674,
            width: 151,
            height: 145
        },

        "3.5": {
            x: 770,
            y: 674,
            width: 148,
            height: 145
        },

        "4": {
            x: 922,
            y: 674,
            width: 149,
            height: 145
        },

        "4.5": {
            x: 1076,
            y: 674,
            width: 148,
            height: 145
        },

        "5": {
            x: 1228,
            y: 674,
            width: 296,
            height: 145
        }
    };


    /* =====================================
       TURN SYSTEM
    ===================================== */

    const TURN = {

        FORECAST: "FORECAST",

        ENEMY: "ENEMY",

        TRANSITION: "TRANSITION",

        ENDED: "ENDED"
    };


    let turn =
        TURN.FORECAST;


    let turnStarted =
        0;


    const FORECAST_TURN_LENGTH =
        8000;


    const ENEMY_TURN_LENGTH =
        6000;


    let transitionUntil =
        0;


    /* =====================================
       ARENA
    ===================================== */

    const arena = {

        left: 28,

        top: 120,

        right: 0,

        bottom: 0
    };


    /* =====================================
       FORECAST!SANS
    ===================================== */

    const forecast = {

        x: 0,

        y: 0,

        radius: 23,

        invulnerableUntil: 0
    };


    /*
        Forecast's resting boss position.

        This is the top-center area you
        circled in the screenshot.
    */

    function getForecastHomePosition() {

        return {

            x:
                width * 0.5,

            y:
                arena.top + 70
        };
    }


    /* =====================================
       AUTO-DODGE / STAMINA
    ===================================== */

    const STAMINA_MAX =
        100;


    const STAMINA_REGEN_PER_SECOND =
        16;


    const BASE_DODGE_COST =
        12;


    const DODGE_DISTANCE =
        78;


    const DODGE_INVULNERABILITY =
        260;


    let stamina =
        STAMINA_MAX;


    let dodgeChain =
        0;


    let lastDodgeAt =
        0;


    let dodgeAfterimages =
        [];


    /* =====================================
       PROTAGONIST
    ===================================== */

    const enemy = {

        x: 0,

        y: 0,

        radius: 10,

        hp: 100,

        maxHP: 100,

        speed: 115,

        targetX: 0,

        targetY: 0,

        nextTargetAt: 0,

        frozenUntil: 0
    };


    /* =====================================
       BATTLE OBJECTS
    ===================================== */

    let forecastProjectiles =
        [];


    let enemyProjectiles =
        [];


    let hazards =
        [];


    let effects =
        [];


    let illusions =
        [];


    let scythe =
        null;


    let beam =
        null;


    let decoy =
        null;


    /* =====================================
       EYE STATES
    ===================================== */

    let domainUntil =
        0;


    let heroismUntil =
        0;


    let deadlockUntil =
        0;


    let observeUntil =
        0;


    let vectorUntil =
        0;


    let momentUntil =
        0;


    let evolutionUntil =
        0;


    /* =====================================
       ADAPTATION
    ===================================== */

    const adaptation = {

        aimedShotsSeen: 0,

        spreadShotsSeen: 0,

        speedBonus: 0
    };


    /* =====================================
       PREDICTION
    ===================================== */

    let predictionUntil =
        0;


    /* =====================================
       INITIALIZATION
    ===================================== */

    function init(canvasElement) {

        if (!canvasElement) {

            throw new Error(
                "Battle.init: canvas missing"
            );
        }


        canvas =
            canvasElement;


        ctx =
            canvas.getContext(
                "2d"
            );


        if (!ctx) {

            throw new Error(
                "Battle.init: 2D canvas unavailable"
            );
        }


        resize();


        window.addEventListener(
            "resize",
            resize
        );


        installEvents();


        reset();


        running =
            true;


        lastFrame =
            performance.now();


        requestAnimationFrame(
            loop
        );
    }


    /* =====================================
       RESIZE
    ===================================== */

    function resize() {

        if (!canvas) {
            return;
        }


        width =
            window.innerWidth;


        height =
            window.innerHeight;


        dpr =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );


        canvas.width =
            Math.floor(
                width * dpr
            );


        canvas.height =
            Math.floor(
                height * dpr
            );


        canvas.style.width =
            `${width}px`;


        canvas.style.height =
            `${height}px`;


        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );


        arena.right =
            width - 28;


        arena.bottom =
            Math.max(
                arena.top + 120,
                height - 290
            );


        /*
            V0.4.1

            Forecast is NOT clamped like a
            player character anymore.

            He has a boss position.
        */

        const home =
            getForecastHomePosition();


        forecast.x =
            home.x;


        forecast.y =
            home.y;


        enemy.x =
            clamp(
                enemy.x ||
                    width * 0.5,

                arena.left + 25,

                arena.right - 25
            );


        enemy.y =
            clamp(
                enemy.y ||
                    arena.top +
                    (
                        arena.bottom -
                        arena.top
                    ) * 0.65,

                arena.top + 120,

                arena.bottom - 25
            );
    }


    /* =====================================
       EVENTS
    ===================================== */

    let eventsInstalled =
        false;


    function installEvents() {

        if (
            eventsInstalled
        ) {
            return;
        }


        eventsInstalled =
            true;


        window.addEventListener(
            "forecast-weapon-fire",
            event => {

                useWeapon(
                    event.detail.attack
                );
            }
        );


        window.addEventListener(
            "forecast-eye-activate",
            event => {

                useEye(
                    event.detail
                );
            }
        );


        window.addEventListener(
            "forecast-technique-activate",
            event => {

                useTechnique(
                    event.detail.attack
                );
            }
        );


        window.addEventListener(
            "forecast-phase-change",
            event => {

                onPhaseChanged(
                    event.detail
                );
            }
        );
    }


    /* =====================================
       RESET
    ===================================== */

    function reset() {

        const now =
            performance.now();


        const home =
            getForecastHomePosition();


        forecast.x =
            home.x;


        forecast.y =
            home.y;


        forecast.invulnerableUntil =
            0;


        stamina =
            STAMINA_MAX;


        dodgeChain =
            0;


        lastDodgeAt =
            0;


        dodgeAfterimages =
            [];


        /*
            Protagonist begins lower in the
            battle arena, underneath Forecast.
        */

        enemy.x =
            width * 0.5;


        enemy.y =
            arena.top +
            (
                arena.bottom -
                arena.top
            ) * 0.68;


        enemy.hp =
            enemy.maxHP;


        enemy.frozenUntil =
            0;


        chooseEnemyTarget();


        forecastProjectiles =
            [];


        enemyProjectiles =
            [];


        hazards =
            [];


        effects =
            [];


        illusions =
            [];


        scythe =
            null;


        beam =
            null;


        decoy =
            null;


        domainUntil =
            0;


        heroismUntil =
            0;


        deadlockUntil =
            0;


        observeUntil =
            0;


        vectorUntil =
            0;


        momentUntil =
            0;


        evolutionUntil =
            0;


        predictionUntil =
            0;


        adaptation.aimedShotsSeen =
            0;


        adaptation.spreadShotsSeen =
            0;


        adaptation.speedBonus =
            0;


        turn =
            TURN.FORECAST;


        turnStarted =
            now;


        updateEnemyHUD();

        updateStaminaHUD();

        updateTurnHUD();
    }


    /* =====================================
       MAIN LOOP
    ===================================== */

    function loop(now) {

        if (!running) {
            return;
        }


        let dt =
            (
                now -
                lastFrame
            ) / 1000;


        lastFrame =
            now;


        dt =
            Math.min(
                dt,
                0.04
            );


        update(
            dt,
            now
        );


        draw(
            now
        );


        requestAnimationFrame(
            loop
        );
    }


    function update(
        dt,
        now
    ) {

        updateTurn(
            now
        );


        updateForecast(
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


        updateSpecialAttacks(
            now
        );


        updateEffects(
            dt,
            now
        );
    }


    /* =====================================
       TURN SYSTEM
    ===================================== */

    function updateTurn(now) {

        if (
            turn ===
            TURN.ENDED
        ) {
            return;
        }


        if (
            turn ===
            TURN.TRANSITION
        ) {

            if (
                now >=
                transitionUntil
            ) {

                startForecastTurn();
            }


            return;
        }


        const elapsed =
            now -
            turnStarted;


        if (
            turn ===
                TURN.FORECAST &&

            elapsed >=
                FORECAST_TURN_LENGTH
        ) {

            startEnemyTurn();
        }


        else if (
            turn ===
                TURN.ENEMY &&

            elapsed >=
                ENEMY_TURN_LENGTH
        ) {

            startForecastTurn();
        }
    }


    function startForecastTurn() {

        if (
            turn ===
            TURN.ENDED
        ) {
            return;
        }


        turn =
            TURN.FORECAST;


        turnStarted =
            performance.now();


        enemyProjectiles =
            [];


        /*
            Return Forecast to his normal
            boss stance after dodging.
        */

        const home =
            getForecastHomePosition();


        forecast.x =
            home.x;


        forecast.y =
            home.y;


        updateTurnHUD();


        message(
            "Your turn. Choose a possibility."
        );
    }


    function startEnemyTurn() {

        if (
            turn ===
            TURN.ENDED
        ) {
            return;
        }


        turn =
            TURN.ENEMY;


        turnStarted =
            performance.now();


        forecastProjectiles =
            [];


        hazards =
            [];


        updateTurnHUD();


        message(
            "The protagonist attacks. Forecast takes over."
        );


        beginEnemyPattern();
    }


    function startTransition() {

        turn =
            TURN.TRANSITION;


        transitionUntil =
            performance.now() +
            1200;


        enemyProjectiles =
            [];


        forecastProjectiles =
            [];


        hazards =
            [];


        updateTurnHUD();
    }


    function getTurn() {

        return turn;
    }


    function isForecastTurn() {

        return (
            turn ===
            TURN.FORECAST
        );
    }


    /* =====================================
       NO MANUAL MOVEMENT
    ===================================== */

    function setMovement() {

        /*
            Compatibility only.

            Forecast is the boss.

            There is no WASD or D-pad movement.
        */
    }


    /* =====================================
       FORECAST UPDATE
    ===================================== */

    function updateForecast(
        dt,
        now
    ) {

        const regenMultiplier =

            turn ===
            TURN.FORECAST

                ? 1.35

                : 1;


        stamina =
            Math.min(

                STAMINA_MAX,

                stamina +

                STAMINA_REGEN_PER_SECOND *

                regenMultiplier *

                dt
            );


        if (
            now -
            lastDodgeAt >
            900
        ) {

            dodgeChain =
                0;
        }


        dodgeAfterimages =
            dodgeAfterimages.filter(
                image =>
                    image &&
                    now <
                    image.until
            );


        updateStaminaHUD();
    }


    /* =====================================
       DODGE COST
    ===================================== */

    function getDodgeCost(now) {

        let cost =

            BASE_DODGE_COST +

            Math.min(
                dodgeChain * 3,
                15
            );


        if (
            now <
            evolutionUntil
        ) {

            cost *=
                0.68;
        }


        if (
            adaptation
                .aimedShotsSeen >=
            8
        ) {

            cost *=
                0.9;
        }


        if (
            now <
                predictionUntil ||

            now <
                observeUntil
        ) {

            cost *=
                0.85;
        }


        return Math.max(
            5,
            Math.round(
                cost
            )
        );
    }


    /* =====================================
       AUTO-DODGE
    ===================================== */

    function tryAutoDodge(
        projectile,
        now
    ) {

        if (
            turn !==
            TURN.ENEMY
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
            ForecastPhases
                .isLocked()
        ) {

            return true;
        }


        const cost =
            getDodgeCost(
                now
            );


        /*
            No stamina = attack lands.
        */

        if (
            stamina <
            cost
        ) {

            stamina =
                Math.max(
                    0,
                    stamina
                );


            updateStaminaHUD(
                "EXHAUSTED — HIT INCOMING"
            );


            return false;
        }


        const oldX =
            forecast.x;


        const oldY =
            forecast.y;


        const projectileSpeed =
            Math.hypot(
                projectile.vx,
                projectile.vy
            ) || 1;


        /*
            Perpendicular dodge.
        */

        const perpendicularX =
            -projectile.vy /
            projectileSpeed;


        /*
            Forecast mainly dodges sideways,
            like a boss avoiding an incoming
            protagonist attack.
        */

        let direction =

            perpendicularX >= 0

                ? 1

                : -1;


        /*
            Alternate directions during chains
            so he doesn't repeatedly snap into
            one edge of the screen.
        */

        if (
            dodgeChain % 2 ===
            1
        ) {

            direction *=
                -1;
        }


        const home =
            getForecastHomePosition();


        let dodgeDistance =

            DODGE_DISTANCE +

            Math.min(
                ForecastPhases
                    .getPhaseIndex() *
                    4,

                30
            );


        if (
            now <
            evolutionUntil
        ) {

            dodgeDistance +=
                12;
        }


        forecast.x =
            clamp(

                oldX +
                dodgeDistance *
                direction,

                arena.left +
                60,

                arena.right -
                60
            );


        /*
            Keep Forecast in his boss row.
        */

        forecast.y =
            home.y;


        stamina =
            Math.max(
                0,
                stamina -
                cost
            );


        dodgeChain++;


        lastDodgeAt =
            now;


        forecast.invulnerableUntil =

            now +

            DODGE_INVULNERABILITY;


        dodgeAfterimages.push({

            x: oldX,

            y: oldY,

            phase:
                ForecastPhases
                    .getPhase(),

            until:
                now + 260
        });


        effects.push({

            type:
                "dodge",

            x:
                oldX,

            y:
                oldY,

            life:
                0.26
        });


        updateStaminaHUD(
            `AUTO-DODGE  -${cost}`
        );


        return true;
    }


    /* =====================================
       PROTAGONIST AI
    ===================================== */

    function chooseEnemyTarget() {

        enemy.targetX =
            random(
                arena.left + 80,
                arena.right - 80
            );


        /*
            Keep the protagonist in the
            lower portion of the arena.

            Forecast owns the upper boss row.
        */

        const playableTop =
            arena.top + 145;


        enemy.targetY =
            random(
                playableTop,
                arena.bottom - 35
            );


        enemy.nextTargetAt =

            performance.now() +

            random(
                550,
                1150
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


        let scale =
            1;


        if (
            now <
            deadlockUntil
        ) {

            scale *=
                0.25;
        }


        if (
            now <
            momentUntil
        ) {

            scale *=
                0.32;
        }


        if (
            now <
            domainUntil
        ) {

            scale *=
                0.68;
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
            );


        if (
            distance >
            2
        ) {

            enemy.x +=

                dx /
                distance *

                enemy.speed *

                scale *

                dt;


            enemy.y +=

                dy /
                distance *

                enemy.speed *

                scale *

                dt;
        }
    }


    /* =====================================
       PROTAGONIST ATTACK PATTERN
    ===================================== */

    function beginEnemyPattern() {

        const phase =
            ForecastPhases
                .getPhaseIndex();


        const shots =
            Math.min(
                4 + phase,
                12
            );


        for (
            let i = 0;
            i < shots;
            i++
        ) {

            setTimeout(
                () => {

                    if (
                        turn !==
                        TURN.ENEMY
                    ) {
                        return;
                    }


                    spawnEnemyShot();
                },

                350 +
                i * 430
            );
        }
    }


    function spawnEnemyShot() {

        let targetX =
            forecast.x;


        let targetY =
            forecast.y;


        if (
            decoy &&
            performance.now() <
                decoy.until &&
            Math.random() <
                0.7
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


        const length =
            Math.hypot(
                dx,
                dy
            ) || 1;


        const speed =

            250 +

            ForecastPhases
                .getPhaseIndex() *
            7;


        enemyProjectiles.push({

            x:
                enemy.x,

            y:
                enemy.y,

            vx:
                dx /
                length *
                speed,

            vy:
                dy /
                length *
                speed,

            radius:
                7,

            life:
                4,

            type:
                "aimed"
        });


        adaptation
            .aimedShotsSeen++;
    }


    /* =====================================
       ENEMY PROJECTILES
    ===================================== */

    function updateEnemyProjectiles(
        dt,
        now
    ) {

        let timeScale =
            1;


        if (
            now <
            momentUntil
        ) {

            timeScale =
                0.32;
        }


        for (
            let i =
                enemyProjectiles.length -
                1;

            i >= 0;

            i--
        ) {

            const projectile =
                enemyProjectiles[
                    i
                ];


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
                We don't use the old arena-only
                projectile deletion here because
                Forecast occupies the upper boss
                row.

                Only delete after it leaves the
                actual screen.
            */

            if (
                projectile.life <= 0 ||

                projectile.x <
                    -100 ||

                projectile.x >
                    width + 100 ||

                projectile.y <
                    -100 ||

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


                if (
                    !dodged
                ) {

                    hitForecast(
                        now
                    );

                    return;
                }
            }
        }
    }


    /* =====================================
       FORECAST HIT
    ===================================== */

    function hitForecast(now) {

        if (
            turn !==
            TURN.ENEMY
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
            ForecastPhases
                .isLocked()
        ) {
            return;
        }


        forecast.invulnerableUntil =

            now +

            1300;


        const result =
            ForecastPhases
                .confirmedHit();


        if (
            result.advanced
        ) {

            stamina =
                Math.min(
                    STAMINA_MAX,
                    stamina + 22
                );


            updateStaminaHUD();


            startTransition();


            return;
        }


        if (
            result.reason ===
            "final-phase"
        ) {

            message(
                "Phase 5 holds."
            );


            enemyProjectiles =
                [];
        }
    }


    /* =====================================
       WEAPONS
    ===================================== */

    function useWeapon(type) {

        if (
            !isForecastTurn()
        ) {

            message(
                "Forecast is auto-dodging."
            );

            return;
        }


        switch (type) {

            case "glock":

                fireAtEnemy({

                    speed: 500,

                    damage: 12,

                    radius: 5,

                    type: "shot"
                });

                break;


            case "smg":

                burst(
                    6,
                    70,
                    {
                        speed: 530,

                        damage: 4,

                        radius: 4,

                        type: "shot"
                    }
                );

                break;


            case "ar":

                burst(
                    3,
                    110,
                    {
                        speed: 580,

                        damage: 7,

                        radius: 5,

                        type: "shot"
                    }
                );

                break;


            case "dmr":

                predictionUntil =

                    performance.now() +

                    250;


                setTimeout(
                    () => {

                        if (
                            isForecastTurn()
                        ) {

                            fireAtEnemy({

                                speed: 760,

                                damage: 21,

                                radius: 6,

                                type:
                                    "precision"
                            });
                        }
                    },

                    220
                );

                break;


            case "shotgun":

                spreadShot();

                break;


            case "gasterHand":

                createBeam(
                    420,
                    550,
                    28
                );

                break;


            case "scythe":

                createScythe();

                break;
        }
    }


    function fireAtEnemy(
        config
    ) {

        const dx =
            enemy.x -
            forecast.x;


        const dy =
            enemy.y -
            forecast.y;


        const length =
            Math.hypot(
                dx,
                dy
            ) || 1;


        forecastProjectiles.push({

            x:
                forecast.x,

            y:
                forecast.y,

            vx:
                dx /
                length *
                config.speed,

            vy:
                dy /
                length *
                config.speed,

            radius:
                config.radius,

            damage:
                config.damage,

            life:
                2.5,

            type:
                config.type
        });
    }


    function burst(
        count,
        interval,
        config
    ) {

        for (
            let i = 0;
            i < count;
            i++
        ) {

            setTimeout(
                () => {

                    if (
                        isForecastTurn()
                    ) {

                        fireAtEnemy(
                            config
                        );
                    }
                },

                i *
                interval
            );
        }
    }


    function spreadShot() {

        const base =
            Math.atan2(

                enemy.y -
                forecast.y,

                enemy.x -
                forecast.x
            );


        for (
            let i = -3;
            i <= 3;
            i++
        ) {

            const angle =

                base +

                i *
                0.09;


            forecastProjectiles.push({

                x:
                    forecast.x,

                y:
                    forecast.y,

                vx:
                    Math.cos(
                        angle
                    ) *
                    430,

                vy:
                    Math.sin(
                        angle
                    ) *
                    430,

                radius:
                    4,

                damage:
                    5,

                life:
                    0.9,

                type:
                    "pellet"
            });
        }
    }


    /* =====================================
       FORECAST PROJECTILES
    ===================================== */

    function updateForecastProjectiles(
        dt,
        now
    ) {

        for (
            let i =
                forecastProjectiles.length -
                1;

            i >= 0;

            i--
        ) {

            const projectile =
                forecastProjectiles[
                    i
                ];


            /*
                Fix for the old undefined.x crash.
            */

            if (!projectile) {

                forecastProjectiles.splice(
                    i,
                    1
                );

                continue;
            }


            if (
                now <
                vectorUntil
            ) {

                const dx =
                    enemy.x -
                    projectile.x;


                const dy =
                    enemy.y -
                    projectile.y;


                const length =
                    Math.hypot(
                        dx,
                        dy
                    ) || 1;


                const speed =
                    Math.hypot(
                        projectile.vx,
                        projectile.vy
                    );


                projectile.vx =

                    projectile.vx *
                    0.88 +

                    dx /
                    length *
                    speed *
                    0.12;


                projectile.vy =

                    projectile.vy *
                    0.88 +

                    dy /
                    length *
                    speed *
                    0.12;
            }


            projectile.x +=

                projectile.vx *
                dt;


            projectile.y +=

                projectile.vy *
                dt;


            projectile.life -=
                dt;


            if (
                projectile.life <=
                0 ||

                projectile.x <
                    -100 ||

                projectile.x >
                    width + 100 ||

                projectile.y <
                    -100 ||

                projectile.y >
                    height + 100
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


                forecastProjectiles.splice(
                    i,
                    1
                );
            }
        }
    }


    /* =====================================
       SCYTHE
    ===================================== */

    function createScythe() {

        const now =
            performance.now();


        scythe = {

            started:
                now,

            until:
                now + 520,

            reach:
                105,

            damage:
                28,

            hit:
                false
        };
    }


    /* =====================================
       BEAM / GASTER
    ===================================== */

    function createBeam(
        charge,
        duration,
        damage
    ) {

        const now =
            performance.now();


        beam = {

            chargeUntil:
                now + charge,

            until:
                now +
                charge +
                duration,

            damage,

            hit:
                false
        };
    }


    /* =====================================
       TECHNIQUES
    ===================================== */

    function useTechnique(type) {

        if (
            !isForecastTurn()
        ) {

            message(
                "Forecast is auto-dodging."
            );

            return;
        }


        switch (type) {

            case "bones":

                boneAttack();

                break;


            case "boneWall":

                boneWall();

                break;


            case "illusions":

                createIllusions();

                break;


            case "constructs":

                createConstructs();

                break;


            case "gaster":

                createBeam(
                    650,
                    650,
                    24
                );

                break;


            case "forecastTrap":

                forecastTrap();

                break;


            case "crossfire":

                crossfire();

                break;


            case "falseFuture":

                falseFuture();

                break;


            case "inevitable":

                inevitable();

                break;
        }
    }


    function boneAttack() {

        burst(
            5,
            90,
            {
                speed: 390,

                damage: 6,

                radius: 6,

                type: "bone"
            }
        );
    }


    function boneWall() {

        const startX =
            enemy.targetX -
            60;


        for (
            let i = 0;
            i < 7;
            i++
        ) {

            hazards.push({

                type:
                    "bone",

                x:
                    startX +
                    i * 20,

                y:
                    enemy.targetY,

                radius:
                    12,

                damage:
                    7,

                activateAt:
                    performance.now() +
                    550,

                life:
                    1.5,

                hit:
                    false
            });
        }
    }


    function createIllusions() {

        illusions =
            [];


        for (
            let i = 0;
            i < 6;
            i++
        ) {

            illusions.push({

                x:
                    random(
                        arena.left + 50,
                        arena.right - 50
                    ),

                y:
                    random(
                        arena.top + 150,
                        arena.bottom - 40
                    ),

                until:
                    performance.now() +
                    3000
            });
        }
    }


    function createConstructs() {

        for (
            let i = 0;
            i < 4;
            i++
        ) {

            hazards.push({

                type:
                    "construct",

                x:
                    enemy.x +
                    random(
                        -100,
                        100
                    ),

                y:
                    enemy.y +
                    random(
                        -75,
                        75
                    ),

                radius:
                    24,

                damage:
                    9,

                activateAt:
                    performance.now() +
                    600,

                life:
                    2.4,

                hit:
                    false
            });
        }
    }


    function forecastTrap() {

        hazards.push({

            type:
                "trap",

            x:
                enemy.targetX,

            y:
                enemy.targetY,

            radius:
                38,

            damage:
                17,

            activateAt:
                performance.now() +
                800,

            life:
                1.8,

            hit:
                false
        });
    }


    function crossfire() {

        for (
            let wave = 0;
            wave < 3;
            wave++
        ) {

            setTimeout(
                () => {

                    if (
                        !isForecastTurn()
                    ) {
                        return;
                    }


                    for (
                        let i = 0;
                        i < 8;
                        i++
                    ) {

                        const angle =

                            i /
                            8 *

                            Math.PI *
                            2;


                        const x =

                            enemy.x +

                            Math.cos(
                                angle
                            ) *
                            150;


                        const y =

                            enemy.y +

                            Math.sin(
                                angle
                            ) *
                            150;


                        const dx =
                            enemy.x -
                            x;


                        const dy =
                            enemy.y -
                            y;


                        const length =
                            Math.hypot(
                                dx,
                                dy
                            ) || 1;


                        forecastProjectiles.push({

                            x,

                            y,

                            vx:
                                dx /
                                length *
                                300,

                            vy:
                                dy /
                                length *
                                300,

                            radius:
                                5,

                            damage:
                                7,

                            life:
                                1.3,

                            type:
                                "crossfire"
                        });
                    }
                },

                wave *
                350
            );
        }
    }


    function falseFuture() {

        effects.push({

            type:
                "fakePrediction",

            x:
                enemy.targetX,

            y:
                enemy.targetY,

            life:
                1.2
        });


        setTimeout(
            () => {

                if (
                    !isForecastTurn()
                ) {
                    return;
                }


                hazards.push({

                    type:
                        "trap",

                    x:
                        enemy.x,

                    y:
                        enemy.y,

                    radius:
                        42,

                    damage:
                        21,

                    activateAt:
                        performance.now() +
                        180,

                    life:
                        1.2,

                    hit:
                        false
                });
            },

            850
        );
    }


    function inevitable() {

        for (
            let i = 0;
            i < 4;
            i++
        ) {

            setTimeout(
                () => {

                    if (
                        !isForecastTurn()
                    ) {
                        return;
                    }


                    const amount =

                        0.35 +

                        i *
                        0.1;


                    hazards.push({

                        type:
                            "inevitable",

                        x:
                            enemy.x +
                            (
                                enemy.targetX -
                                enemy.x
                            ) *
                            amount,

                        y:
                            enemy.y +
                            (
                                enemy.targetY -
                                enemy.y
                            ) *
                            amount,

                        radius:
                            30 +
                            i * 5,

                        damage:
                            11,

                        activateAt:
                            performance.now() +
                            450,

                        life:
                            1.4,

                        hit:
                            false
                    });
                },

                i *
                500
            );
        }
    }


    /* =====================================
       HAZARDS
    ===================================== */

    function updateHazards(
        dt,
        now
    ) {

        for (
            let i =
                hazards.length -
                1;

            i >= 0;

            i--
        ) {

            const hazard =
                hazards[
                    i
                ];


            if (!hazard) {

                hazards.splice(
                    i,
                    1
                );

                continue;
            }


            hazard.life -=
                dt;


            if (
                hazard.life <=
                0
            ) {

                hazards.splice(
                    i,
                    1
                );

                continue;
            }


            if (
                now <
                    hazard.activateAt ||

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

                hazard.hit =
                    true;


                damageEnemy(
                    hazard.damage
                );
            }
        }
    }


    /* =====================================
       EYES
    ===================================== */

    function useEye(data) {

        if (!data) {
            return;
        }


        const now =
            performance.now();


        switch (
            data.effect
        ) {

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


                adaptation.speedBonus =

                    Math.min(

                        45,

                        adaptation
                            .aimedShotsSeen *
                        2
                    );


                message(
                    "EVOLUTION — Forecast adapts."
                );

                break;


            case "deadlock":

                deadlockUntil =

                    now +

                    data.duration;

                break;


            case "null":

                enemyProjectiles =
                    [];


                effects.push({

                    type:
                        "null",

                    x:
                        forecast.x,

                    y:
                        forecast.y,

                    life:
                        0.6
                });

                break;


            case "paradox":

                decoy = {

                    x:
                        clamp(

                            forecast.x +
                            110,

                            arena.left +
                            60,

                            arena.right -
                            60
                        ),

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
    }    /* =====================================
       SPECIAL ATTACKS
    ===================================== */

    function updateSpecialAttacks(now) {

        if (scythe) {

            if (
                now >=
                scythe.until
            ) {

                scythe =
                    null;
            }

            else if (
                !scythe.hit
            ) {

                const distance =
                    Math.hypot(

                        enemy.x -
                        forecast.x,

                        enemy.y -
                        forecast.y
                    );


                if (
                    distance <=
                    scythe.reach
                ) {

                    scythe.hit =
                        true;


                    damageEnemy(
                        scythe.damage
                    );
                }
            }
        }


        if (beam) {

            if (
                now >=
                beam.until
            ) {

                beam =
                    null;
            }

            else if (
                now >=
                    beam.chargeUntil &&

                !beam.hit
            ) {

                beam.hit =
                    true;


                damageEnemy(
                    beam.damage
                );
            }
        }
    }


    /* =====================================
       DAMAGE PROTAGONIST
    ===================================== */

    function damageEnemy(amount) {

        if (
            turn !==
            TURN.FORECAST
        ) {
            return;
        }


        if (
            performance.now() <
            heroismUntil
        ) {

            amount *=
                1.3;
        }


        enemy.hp =
            Math.max(

                0,

                enemy.hp -
                amount
            );


        updateEnemyHUD();


        effects.push({

            type:
                "hit",

            x:
                enemy.x,

            y:
                enemy.y,

            life:
                0.25
        });


        if (
            enemy.hp <=
            0
        ) {

            turn =
                TURN.ENDED;


            forecastProjectiles =
                [];


            enemyProjectiles =
                [];


            hazards =
                [];


            updateTurnHUD();


            message(
                "Possibility terminated."
            );
        }
    }


    /* =====================================
       PHASE CHANGE
    ===================================== */

    function onPhaseChanged(data) {

        enemyProjectiles =
            [];


        /*
            Return Forecast to his center
            boss stance for the transformation.
        */

        const home =
            getForecastHomePosition();


        forecast.x =
            home.x;


        forecast.y =
            home.y;


        effects.push({

            type:
                "phase",

            x:
                forecast.x,

            y:
                forecast.y,

            life:
                0.8
        });


        if (
            data &&
            data.final
        ) {

            message(
                "Phase 5. The final possibility."
            );
        }
    }


    /* =====================================
       EFFECT UPDATE
    ===================================== */

    function updateEffects(
        dt,
        now
    ) {

        for (
            let i =
                effects.length -
                1;

            i >= 0;

            i--
        ) {

            const effect =
                effects[
                    i
                ];


            if (!effect) {

                effects.splice(
                    i,
                    1
                );

                continue;
            }


            effect.life -=
                dt;


            if (
                effect.life <=
                0
            ) {

                effects.splice(
                    i,
                    1
                );
            }
        }


        illusions =
            illusions.filter(
                item =>
                    item &&
                    now <
                    item.until
            );


        dodgeAfterimages =
            dodgeAfterimages.filter(
                item =>
                    item &&
                    now <
                    item.until
            );


        if (
            decoy &&
            now >=
                decoy.until
        ) {

            decoy =
                null;
        }
    }


    /* =====================================
       DRAW
    ===================================== */

    function draw(now) {

        if (!ctx) {
            return;
        }


        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        drawArena(
            now
        );


        drawPrediction(
            now
        );


        drawIllusions(
            now
        );


        drawHazards(
            now
        );


        drawForecastProjectiles();


        drawEnemyProjectiles(
            now
        );


        drawBeam(
            now
        );


        drawScythe(
            now
        );


        drawDecoy();


        drawDodgeAfterimages(
            now
        );


        /*
            REAL FORECAST!SANS
        */

        drawForecast(
            now
        );


        drawEnemy(
            now
        );


        drawEffects();
    }


    /* =====================================
       ARENA
    ===================================== */

    function drawArena(now) {

        ctx.save();


        if (
            now <
            domainUntil
        ) {

            ctx.fillStyle =
                "rgba(110,0,0,0.13)";


            ctx.fillRect(

                arena.left,

                arena.top,

                arena.right -
                    arena.left,

                arena.bottom -
                    arena.top
            );
        }


        ctx.strokeStyle =

            now <
            domainUntil

                ? "#ff2424"

                : "#383838";


        ctx.lineWidth =
            2;


        ctx.strokeRect(

            arena.left,

            arena.top,

            arena.right -
                arena.left,

            arena.bottom -
                arena.top
        );


        ctx.restore();
    }


    /* =====================================
       REAL FORECAST!SANS SPRITE
    ===================================== */

    function drawForecast(now) {

        /*
            NO placeholder.

            If the sheet isn't loaded yet,
            Forecast simply waits for it.
        */

        if (
            !forecastSheetReady
        ) {
            return;
        }


        const phase =
            String(
                ForecastPhases
                    .getPhase()
            );


        const sprite =

            FORECAST_SPRITES[
                phase
            ] ||

            FORECAST_SPRITES[
                "1"
            ];


        /*
            Idle breathing / cloak motion.

            Only a couple pixels so he still
            feels like he's standing there.
        */

        const idleY =

            Math.sin(
                now *
                0.0028
            ) *

            2;


        /*
            Phase 5 artwork is wider than
            the normal Forecast sprites.
        */

        let drawWidth =
            phase === "5"
                ? 190
                : 112;


        let drawHeight =
            132;


        /*
            Slight size growth as Forecast
            advances through phases.
        */

        const phaseIndex =
            ForecastPhases
                .getPhaseIndex();


        if (
            phase !==
            "5"
        ) {

            const scale =

                1 +

                phaseIndex *
                0.018;


            drawWidth *=
                scale;


            drawHeight *=
                scale;
        }


        const drawX =

            forecast.x -

            drawWidth /
            2;


        const drawY =

            forecast.y -

            drawHeight /
            2 +

            idleY;


        ctx.save();


        /*
            CRITICAL for pixel art.
        */

        ctx.imageSmoothingEnabled =
            false;


        /*
            Phase aura.
        */

        if (
            phaseIndex >=
            1
        ) {

            const auraStrength =

                Math.min(

                    0.08 +

                    phaseIndex *
                    0.025,

                    0.27
                );


            ctx.save();


            ctx.globalAlpha =
                auraStrength;


            ctx.fillStyle =
                "#ff2424";


            ctx.shadowColor =
                "#ff2424";


            ctx.shadowBlur =

                16 +

                phaseIndex *
                3;


            ctx.beginPath();


            ctx.ellipse(

                forecast.x,

                forecast.y +
                    4,

                drawWidth *
                    0.43,

                drawHeight *
                    0.47,

                0,

                0,

                Math.PI *
                    2
            );


            ctx.fill();


            ctx.restore();
        }


        /*
            Draw the ACTUAL character from:

            Forecast!Sans Pixel Character Sheet.png
        */

        ctx.drawImage(

            forecastSheet,

            sprite.x,
            sprite.y,
            sprite.width,
            sprite.height,

            drawX,
            drawY,
            drawWidth,
            drawHeight
        );


        /*
            Extra red eye glow.

            The sprite already has the eye,
            this just makes it pop in-game.
        */

        ctx.save();


        ctx.globalAlpha =

            0.18 +

            Math.sin(
                now *
                0.008
            ) *
            0.05;


        ctx.fillStyle =
            "#ff2424";


        ctx.shadowColor =
            "#ff2424";


        ctx.shadowBlur =
            15;


        ctx.beginPath();


        ctx.arc(

            forecast.x +
                drawWidth *
                0.08,

            forecast.y -
                drawHeight *
                0.12 +
                idleY,

            5,

            0,

            Math.PI *
                2
        );


        ctx.fill();


        ctx.restore();


        ctx.restore();
    }


    /* =====================================
       DODGE AFTERIMAGES

       These now use Forecast's actual
       phase sprite too.
    ===================================== */

    function drawDodgeAfterimages(now) {

        if (
            !forecastSheetReady
        ) {
            return;
        }


        dodgeAfterimages.forEach(
            image => {

                if (!image) {
                    return;
                }


                const remaining =

                    Math.max(

                        0,

                        (
                            image.until -
                            now
                        ) /
                        260
                    );


                const sprite =

                    FORECAST_SPRITES[
                        String(
                            image.phase
                        )
                    ] ||

                    FORECAST_SPRITES[
                        "1"
                    ];


                const phase5 =

                    String(
                        image.phase
                    ) ===
                    "5";


                const drawWidth =

                    phase5
                        ? 190
                        : 112;


                const drawHeight =
                    132;


                ctx.save();


                ctx.imageSmoothingEnabled =
                    false;


                ctx.globalAlpha =

                    remaining *
                    0.28;


                ctx.shadowColor =
                    "#ff2424";


                ctx.shadowBlur =
                    16;


                ctx.drawImage(

                    forecastSheet,

                    sprite.x,
                    sprite.y,
                    sprite.width,
                    sprite.height,

                    image.x -
                        drawWidth /
                        2,

                    image.y -
                        drawHeight /
                        2,

                    drawWidth,
                    drawHeight
                );


                ctx.restore();
            }
        );
    }


    /* =====================================
       PROTAGONIST HEART
    ===================================== */

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

            ctx.globalAlpha =
                0.55;
        }


        ctx.fillStyle =
            "#ff2424";


        ctx.shadowColor =
            "#ff2424";


        ctx.shadowBlur =
            5;


        ctx.beginPath();


        ctx.moveTo(
            0,
            10
        );


        ctx.lineTo(
            -10,
            0
        );


        ctx.bezierCurveTo(
            -14,
            -10,
            -3,
            -14,
            0,
            -6
        );


        ctx.bezierCurveTo(
            3,
            -14,
            14,
            -10,
            10,
            0
        );


        ctx.closePath();


        ctx.fill();


        ctx.restore();
    }


    /* =====================================
       FORECAST PROJECTILES
    ===================================== */

    function drawForecastProjectiles() {

        forecastProjectiles.forEach(
            projectile => {

                if (!projectile) {
                    return;
                }


                ctx.save();


                if (
                    projectile.type ===
                    "bone"
                ) {

                    ctx.fillStyle =
                        "#eeeeee";


                    ctx.fillRect(

                        projectile.x -
                            3,

                        projectile.y -
                            10,

                        6,

                        20
                    );
                }

                else {

                    ctx.fillStyle =

                        projectile.type ===
                        "crossfire"

                            ? "#ff2424"

                            : "#eeeeee";


                    ctx.beginPath();


                    ctx.arc(

                        projectile.x,

                        projectile.y,

                        projectile.radius,

                        0,

                        Math.PI *
                            2
                    );


                    ctx.fill();
                }


                ctx.restore();
            }
        );
    }


    /* =====================================
       ENEMY PROJECTILES
    ===================================== */

    function drawEnemyProjectiles(now) {

        enemyProjectiles.forEach(
            projectile => {

                if (!projectile) {
                    return;
                }


                ctx.save();


                ctx.strokeStyle =
                    "#ff2424";


                ctx.shadowColor =
                    "#ff2424";


                ctx.shadowBlur =
                    5;


                ctx.lineWidth =
                    2;


                ctx.beginPath();


                ctx.arc(

                    projectile.x,

                    projectile.y,

                    projectile.radius,

                    0,

                    Math.PI *
                        2
                );


                ctx.stroke();


                if (
                    now <
                    observeUntil
                ) {

                    ctx.globalAlpha =
                        0.3;


                    ctx.setLineDash(
                        [4, 5]
                    );


                    ctx.beginPath();


                    ctx.moveTo(

                        projectile.x,

                        projectile.y
                    );


                    ctx.lineTo(

                        projectile.x +
                            projectile.vx *
                            0.7,

                        projectile.y +
                            projectile.vy *
                            0.7
                    );


                    ctx.stroke();
                }


                ctx.restore();
            }
        );
    }


    /* =====================================
       PREDICTION
    ===================================== */

    function drawPrediction(now) {

        if (
            now >=
                predictionUntil &&

            now >=
                observeUntil
        ) {

            return;
        }


        ctx.save();


        ctx.strokeStyle =
            "rgba(255,36,36,0.55)";


        ctx.setLineDash(
            [5, 7]
        );


        ctx.beginPath();


        ctx.moveTo(
            forecast.x,
            forecast.y
        );


        ctx.lineTo(
            enemy.targetX,
            enemy.targetY
        );


        ctx.stroke();


        ctx.restore();
    }


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


    /* =====================================
       HAZARDS
    ===================================== */

    function drawHazards(now) {

        hazards.forEach(
            hazard => {

                if (!hazard) {
                    return;
                }


                ctx.save();


                const active =

                    now >=
                    hazard.activateAt;


                ctx.strokeStyle =

                    active

                        ? "#ff2424"

                        : "rgba(255,36,36,.45)";


                ctx.lineWidth =
                    2;


                if (!active) {

                    ctx.setLineDash(
                        [4, 5]
                    );
                }


                ctx.beginPath();


                ctx.arc(

                    hazard.x,

                    hazard.y,

                    hazard.radius,

                    0,

                    Math.PI *
                        2
                );


                ctx.stroke();


                ctx.restore();
            }
        );
    }


    /* =====================================
       ILLUSIONS
    ===================================== */

    function drawIllusions(now) {

        illusions.forEach(
            item => {

                if (!item) {
                    return;
                }


                ctx.save();


                ctx.globalAlpha =

                    0.16 +

                    Math.sin(
                        now *
                        0.012
                    ) *
                    0.05;


                ctx.strokeStyle =
                    "#ff2424";


                ctx.strokeRect(

                    item.x -
                        13,

                    item.y -
                        13,

                    26,

                    26
                );


                ctx.restore();
            }
        );
    }


    /* =====================================
       DECOY
    ===================================== */

    function drawDecoy() {

        if (!decoy) {
            return;
        }


        ctx.save();


        ctx.globalAlpha =
            0.25;


        ctx.strokeStyle =
            "#ff2424";


        ctx.shadowColor =
            "#ff2424";


        ctx.shadowBlur =
            8;


        ctx.lineWidth =
            2;


        ctx.beginPath();


        ctx.arc(

            decoy.x,

            decoy.y,

            forecast.radius,

            0,

            Math.PI *
                2
        );


        ctx.stroke();


        ctx.restore();
    }


    /* =====================================
       SCYTHE
    ===================================== */

    function drawScythe(now) {

        if (!scythe) {
            return;
        }


        const total =

            scythe.until -
            scythe.started;


        const elapsed =

            now -
            scythe.started;


        const progress =
            clamp(

                elapsed /
                total,

                0,
                1
            );


        const angle =

            -1.5 +

            progress *
            Math.PI;


        ctx.save();


        ctx.translate(
            forecast.x,
            forecast.y
        );


        ctx.rotate(
            angle
        );


        ctx.strokeStyle =
            "#eeeeee";


        ctx.lineWidth =
            4;


        ctx.beginPath();


        ctx.moveTo(
            0,
            0
        );


        ctx.lineTo(
            scythe.reach,
            0
        );


        ctx.stroke();


        ctx.strokeStyle =
            "#ff2424";


        ctx.shadowColor =
            "#ff2424";


        ctx.shadowBlur =
            10;


        ctx.lineWidth =
            6;


        ctx.beginPath();


        ctx.arc(

            scythe.reach,

            -15,

            25,

            0.4,

            2.7
        );


        ctx.stroke();


        ctx.restore();
    }


    /* =====================================
       BEAM
    ===================================== */

    function drawBeam(now) {

        if (!beam) {
            return;
        }


        ctx.save();


        if (
            now <
            beam.chargeUntil
        ) {

            ctx.strokeStyle =
                "rgba(255,36,36,.5)";


            ctx.setLineDash(
                [5, 7]
            );


            ctx.lineWidth =
                2;
        }

        else {

            ctx.strokeStyle =
                "#ff2424";


            ctx.shadowColor =
                "#ff2424";


            ctx.shadowBlur =
                15;


            ctx.lineWidth =
                25;
        }


        ctx.beginPath();


        ctx.moveTo(
            forecast.x,
            forecast.y
        );


        ctx.lineTo(
            enemy.x,
            enemy.y
        );


        ctx.stroke();


        ctx.restore();
    }


    /* =====================================
       EFFECTS
    ===================================== */

    function drawEffects() {

        effects.forEach(
            effect => {

                if (!effect) {
                    return;
                }


                ctx.save();


                if (
                    effect.type ===
                    "hit"
                ) {

                    ctx.strokeStyle =
                        "#ffffff";


                    ctx.beginPath();


                    ctx.arc(

                        effect.x,

                        effect.y,

                        18 +
                            effect.life *
                            25,

                        0,

                        Math.PI *
                            2
                    );


                    ctx.stroke();
                }


                else if (
                    effect.type ===
                    "phase"
                ) {

                    ctx.strokeStyle =
                        "#ff2424";


                    ctx.shadowColor =
                        "#ff2424";


                    ctx.shadowBlur =
                        18;


                    ctx.lineWidth =
                        3;


                    ctx.beginPath();


                    ctx.arc(

                        effect.x,

                        effect.y,

                        35 +
                            effect.life *
                            70,

                        0,

                        Math.PI *
                            2
                    );


                    ctx.stroke();
                }


                else if (
                    effect.type ===
                    "null"
                ) {

                    ctx.strokeStyle =
                        "#ff2424";


                    ctx.beginPath();


                    ctx.arc(

                        effect.x,

                        effect.y,

                        30 +
                            effect.life *
                            90,

                        0,

                        Math.PI *
                            2
                    );


                    ctx.stroke();
                }


                else if (
                    effect.type ===
                    "dodge"
                ) {

                    ctx.strokeStyle =
                        "rgba(255,36,36,.75)";


                    ctx.lineWidth =
                        2;


                    ctx.beginPath();


                    ctx.arc(

                        effect.x,

                        effect.y,

                        16 +
                            effect.life *
                            70,

                        0,

                        Math.PI *
                            2
                    );


                    ctx.stroke();
                }


                else if (
                    effect.type ===
                    "fakePrediction"
                ) {

                    ctx.strokeStyle =
                        "rgba(255,36,36,.5)";


                    ctx.setLineDash(
                        [4, 4]
                    );


                    ctx.beginPath();


                    ctx.arc(

                        effect.x,

                        effect.y,

                        34,

                        0,

                        Math.PI *
                            2
                    );


                    ctx.stroke();
                }


                ctx.restore();
            }
        );
    }


    /* =====================================
       ENEMY HUD
    ===================================== */

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

            enemy.hp /

            enemy.maxHP *

            100;


        if (fill) {

            fill.style.width =
                `${percent}%`;
        }


        if (text) {

            text.textContent =
                `${Math.ceil(enemy.hp)} / ${enemy.maxHP}`;
        }
    }


    /* =====================================
       STAMINA HUD
    ===================================== */

    function updateStaminaHUD(
        statusText = null
    ) {

        const hud =
            document.getElementById(
                "staminaHUD"
            );


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
            clamp(

                stamina /

                STAMINA_MAX *

                100,

                0,

                100
            );


        if (fill) {

            fill.style.width =
                `${percent}%`;
        }


        if (text) {

            text.textContent =
                `${Math.ceil(stamina)} / ${STAMINA_MAX}`;
        }


        if (hud) {

            hud.classList.toggle(
                "low",
                stamina <= 30
            );


            hud.classList.toggle(
                "empty",
                stamina <
                    BASE_DODGE_COST
            );
        }


        if (status) {

            if (
                statusText
            ) {

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


    /* =====================================
       TURN HUD
    ===================================== */

    function updateTurnHUD() {

        const banner =
            document.getElementById(
                "turnBanner"
            );


        updateStaminaHUD();


        if (!banner) {
            return;
        }


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


    /* =====================================
       MESSAGE
    ===================================== */

    function message(text) {

        window.dispatchEvent(

            new CustomEvent(
                "forecast-message",

                {
                    detail: {

                        message:
                            text
                    }
                }
            )
        );
    }


    /* =====================================
       UTILITIES
    ===================================== */

    function circlesTouch(
        ax,
        ay,
        ar,
        bx,
        by,
        br
    ) {

        const dx =
            ax -
            bx;


        const dy =
            ay -
            by;


        const radius =
            ar +
            br;


        return (

            dx * dx +

            dy * dy

            <=

            radius *
            radius
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


    /* =====================================
       PUBLIC API
    ===================================== */

    return {

        init,

        reset,

        setMovement,

        getTurn,

        isForecastTurn,

        getStamina:
            () =>
                stamina,

        getMaxStamina:
            () =>
                STAMINA_MAX,

        activatePrediction
    };

})();
