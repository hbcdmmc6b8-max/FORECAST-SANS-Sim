/* =========================================
   FORECAST!SANS — BATTLE ENGINE V0.3
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
       TURN SYSTEM
    ===================================== */

    const TURN = {
        FORECAST: "FORECAST",
        ENEMY: "ENEMY",
        TRANSITION: "TRANSITION",
        ENDED: "ENDED"
    };

    let turn = TURN.FORECAST;
    let turnStarted = 0;

    const FORECAST_TURN_LENGTH = 8000;
    const ENEMY_TURN_LENGTH = 6000;

    let transitionUntil = 0;


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
       FORECAST
    ===================================== */

    const forecast = {
        x: 160,
        y: 260,

        radius: 17,
        speed: 245,

        moveX: 0,
        moveY: 0,

        invulnerableUntil: 0
    };


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
       OBJECTS
    ===================================== */

    let forecastProjectiles = [];
    let enemyProjectiles = [];
    let hazards = [];
    let effects = [];
    let illusions = [];

    let scythe = null;
    let beam = null;
    let decoy = null;


    /* =====================================
       EYE STATES
    ===================================== */

    let domainUntil = 0;
    let heroismUntil = 0;
    let deadlockUntil = 0;
    let observeUntil = 0;
    let vectorUntil = 0;
    let momentUntil = 0;
    let evolutionUntil = 0;


    /* =====================================
       EVOLUTION / ADAPTATION
    ===================================== */

    const adaptation = {
        aimedShotsSeen: 0,
        spreadShotsSeen: 0,
        speedBonus: 0
    };


    /* =====================================
       FORECAST DISPLAY
    ===================================== */

    let predictionUntil = 0;


    /* =====================================
       INITIALIZATION
    ===================================== */

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

        running = true;

        lastFrame = performance.now();

        requestAnimationFrame(loop);
    }


    function resize() {

        if (!canvas) {
            return;
        }

        width = window.innerWidth;
        height = window.innerHeight;

        dpr = Math.min(
            window.devicePixelRatio || 1,
            2
        );

        canvas.width =
            Math.floor(width * dpr);

        canvas.height =
            Math.floor(height * dpr);

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

        /*
            Keep gameplay above the UI.
        */

        arena.bottom =
            Math.max(
                arena.top + 120,
                height - 290
            );

        forecast.x =
            clamp(
                forecast.x,
                arena.left + 25,
                arena.right - 25
            );

        forecast.y =
            clamp(
                forecast.y,
                arena.top + 25,
                arena.bottom - 25
            );

        enemy.x =
            clamp(
                enemy.x || width * 0.72,
                arena.left + 25,
                arena.right - 25
            );

        enemy.y =
            clamp(
                enemy.y || height * 0.35,
                arena.top + 25,
                arena.bottom - 25
            );
    }


    /* =====================================
       EVENTS FROM OTHER MODULES
    ===================================== */

    let eventsInstalled = false;

    function installEvents() {

        if (eventsInstalled) {
            return;
        }

        eventsInstalled = true;


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

        forecast.x =
            width * 0.28;

        forecast.y =
            Math.min(
                height * 0.37,
                arena.bottom - 30
            );

        forecast.moveX = 0;
        forecast.moveY = 0;
        forecast.invulnerableUntil = 0;


        enemy.x =
            width * 0.72;

        enemy.y =
            Math.min(
                height * 0.37,
                arena.bottom - 30
            );

        enemy.hp = enemy.maxHP;
        enemy.frozenUntil = 0;

        chooseEnemyTarget();


        forecastProjectiles = [];
        enemyProjectiles = [];
        hazards = [];
        effects = [];
        illusions = [];

        scythe = null;
        beam = null;
        decoy = null;


        domainUntil = 0;
        heroismUntil = 0;
        deadlockUntil = 0;
        observeUntil = 0;
        vectorUntil = 0;
        momentUntil = 0;
        evolutionUntil = 0;

        predictionUntil = 0;


        adaptation.aimedShotsSeen = 0;
        adaptation.spreadShotsSeen = 0;
        adaptation.speedBonus = 0;


        turn = TURN.FORECAST;
        turnStarted = now;

        updateEnemyHUD();
        updateTurnHUD();
    }


    /* =====================================
       LOOP
    ===================================== */

    function loop(now) {

        if (!running) {
            return;
        }

        let dt =
            (now - lastFrame) / 1000;

        lastFrame = now;

        dt = Math.min(dt, 0.04);

        update(dt, now);
        draw(now);

        requestAnimationFrame(loop);
    }


    function update(dt, now) {

        updateTurn(now);

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

        updateSpecialAttacks(now);

        updateEffects(dt, now);
    }


    /* =====================================
       TURN SYSTEM
    ===================================== */

    function updateTurn(now) {

        if (turn === TURN.ENDED) {
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
            elapsed >=
            FORECAST_TURN_LENGTH
        ) {

            startEnemyTurn();
        }


        else if (
            turn === TURN.ENEMY &&
            elapsed >=
            ENEMY_TURN_LENGTH
        ) {

            startForecastTurn();
        }
    }


    function startForecastTurn() {

        if (turn === TURN.ENDED) {
            return;
        }

        turn = TURN.FORECAST;

        turnStarted =
            performance.now();

        enemyProjectiles = [];

        updateTurnHUD();

        message(
            "Your turn. Choose a possibility."
        );
    }


    function startEnemyTurn() {

        if (turn === TURN.ENDED) {
            return;
        }

        turn = TURN.ENEMY;

        turnStarted =
            performance.now();

        forecastProjectiles = [];
        hazards = [];

        updateTurnHUD();

        message(
            "The protagonist attacks. Dodge."
        );

        beginEnemyPattern();
    }


    function startTransition() {

        turn = TURN.TRANSITION;

        transitionUntil =
            performance.now() + 1200;

        enemyProjectiles = [];
        forecastProjectiles = [];
        hazards = [];

        updateTurnHUD();
    }


    function getTurn() {
        return turn;
    }


    function isForecastTurn() {
        return turn === TURN.FORECAST;
    }


    /* =====================================
       MOVEMENT
    ===================================== */

    function setMovement(x, y) {

        forecast.moveX = x;
        forecast.moveY = y;
    }


    function updateForecast(dt, now) {

        let x = forecast.moveX;
        let y = forecast.moveY;

        const length =
            Math.hypot(x, y);

        if (length > 1) {
            x /= length;
            y /= length;
        }


        let speed =
            forecast.speed +
            adaptation.speedBonus;


        if (
            now < evolutionUntil
        ) {
            speed += 20;
        }


        forecast.x +=
            x * speed * dt;

        forecast.y +=
            y * speed * dt;


        forecast.x =
            clamp(
                forecast.x,
                arena.left +
                forecast.radius,
                arena.right -
                forecast.radius
            );

        forecast.y =
            clamp(
                forecast.y,
                arena.top +
                forecast.radius,
                arena.bottom -
                forecast.radius
            );
    }


    /* =====================================
       PROTAGONIST AI
    ===================================== */

    function chooseEnemyTarget() {

        enemy.targetX =
            random(
                arena.left + 60,
                arena.right - 40
            );

        enemy.targetY =
            random(
                arena.top + 35,
                arena.bottom - 35
            );

        enemy.nextTargetAt =
            performance.now() +
            random(550, 1150);
    }


    function updateEnemy(dt, now) {

        if (
            now < enemy.frozenUntil
        ) {
            return;
        }


        if (
            now >= enemy.nextTargetAt
        ) {

            chooseEnemyTarget();
        }


        let scale = 1;


        if (
            now < deadlockUntil
        ) {
            scale *= 0.25;
        }


        if (
            now < momentUntil
        ) {
            scale *= 0.32;
        }


        if (
            now < domainUntil
        ) {
            scale *= 0.68;
        }


        const dx =
            enemy.targetX -
            enemy.x;

        const dy =
            enemy.targetY -
            enemy.y;

        const distance =
            Math.hypot(dx, dy);


        if (distance > 2) {

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
       PROTAGONIST ATTACK
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
                        turn !== TURN.ENEMY
                    ) {
                        return;
                    }

                    spawnEnemyShot();

                },
                350 + i * 430
            );
        }
    }


    function spawnEnemyShot() {

        let targetX =
            forecast.x;

        let targetY =
            forecast.y;


        /*
            PARADOX decoy.
        */

        if (
            decoy &&
            performance.now() <
            decoy.until &&
            Math.random() < 0.7
        ) {

            targetX = decoy.x;
            targetY = decoy.y;
        }


        const dx =
            targetX - enemy.x;

        const dy =
            targetY - enemy.y;

        const length =
            Math.hypot(dx, dy) || 1;


        let speed =
            250 +
            ForecastPhases
                .getPhaseIndex() * 7;


        enemyProjectiles.push({

            x: enemy.x,
            y: enemy.y,

            vx:
                dx / length *
                speed,

            vy:
                dy / length *
                speed,

            radius: 7,

            life: 4,

            type: "aimed"
        });


        adaptation.aimedShotsSeen++;
    }


    function updateEnemyProjectiles(
        dt,
        now
    ) {

        let timeScale = 1;


        if (
            now < momentUntil
        ) {
            timeScale = 0.32;
        }


        for (
            let i =
                enemyProjectiles.length - 1;

            i >= 0;

            i--
        ) {

            const p =
                enemyProjectiles[i];


            p.x +=
                p.vx *
                dt *
                timeScale;

            p.y +=
                p.vy *
                dt *
                timeScale;

            p.life -=
                dt *
                timeScale;


            if (
                p.life <= 0 ||
                outsideArena(p)
            ) {

                enemyProjectiles.splice(
                    i,
                    1
                );

                continue;
            }


            if (
                circlesTouch(
                    p.x,
                    p.y,
                    p.radius,

                    forecast.x,
                    forecast.y,
                    forecast.radius
                )
            ) {

                enemyProjectiles.splice(
                    i,
                    1
                );

                hitForecast(now);

                return;
            }
        }
    }


    /* =====================================
       FORECAST HIT
    ===================================== */

    function hitForecast(now) {

        /*
            Phase advancement ONLY happens
            here after a real collision
            during the enemy turn.
        */

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


        const result =
            ForecastPhases
                .confirmedHit();


        if (result.advanced) {

            startTransition();

            return;
        }


        /*
            We are already in Phase 5.

            No Phase 6 is created.
            The final defeat condition
            comes later.
        */

        if (
            result.reason ===
            "final-phase"
        ) {

            message(
                "Phase 5 holds."
            );

            enemyProjectiles = [];
        }
    }


    /* =====================================
       WEAPONS
    ===================================== */

    function useWeapon(type) {

        if (!isForecastTurn()) {

            message(
                "You can't attack during the protagonist's turn."
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
                                type: "precision"
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


    function fireAtEnemy(config) {

        const dx =
            enemy.x -
            forecast.x;

        const dy =
            enemy.y -
            forecast.y;

        const length =
            Math.hypot(dx, dy) || 1;


        forecastProjectiles.push({

            x: forecast.x,
            y: forecast.y,

            vx:
                dx / length *
                config.speed,

            vy:
                dy / length *
                config.speed,

            radius:
                config.radius,

            damage:
                config.damage,

            life: 2.5,

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
                i * interval
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
                base + i * 0.09;


            forecastProjectiles.push({

                x: forecast.x,
                y: forecast.y,

                vx:
                    Math.cos(angle) *
                    430,

                vy:
                    Math.sin(angle) *
                    430,

                radius: 4,

                damage: 5,

                life: 0.9,

                type: "pellet"
            });
        }
    }


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

            const p =
                forecastProjectiles[i];


            /*
                VECTOR continuously bends
                attacks toward the target.
            */

            if (
                now < vectorUntil
            ) {

                const dx =
                    enemy.x - p.x;

                const dy =
                    enemy.y - p.y;

                const length =
                    Math.hypot(dx, dy) || 1;

                const speed =
                    Math.hypot(
                        p.vx,
                        p.vy
                    );


                p.vx =
                    p.vx * 0.88 +
                    dx /
                    length *
                    speed *
                    0.12;

                p.vy =
                    p.vy * 0.88 +
                    dy /
                    length *
                    speed *
                    0.12;
            }


            p.x += p.vx * dt;
            p.y += p.vy * dt;

            p.life -= dt;


            if (
                p.life <= 0 ||
                outsideArena(p)
            ) {

                forecastProjectiles.splice(
                    i,
                    1
                );

                continue;
            }


            if (
                circlesTouch(
                    p.x,
                    p.y,
                    p.radius,

                    enemy.x,
                    enemy.y,
                    enemy.radius
                )
            ) {

                damageEnemy(
                    p.damage
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
            started: now,
            until: now + 520,

            reach: 105,
            damage: 28,

            hit: false
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

            hit: false
        };
    }


    /* =====================================
       TECHNIQUES
    ===================================== */

    function useTechnique(type) {

        if (!isForecastTurn()) {

            message(
                "Techniques are unavailable while dodging."
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
            enemy.targetX - 60;


        for (
            let i = 0;
            i < 7;
            i++
        ) {

            hazards.push({

                type: "bone",

                x:
                    startX +
                    i * 20,

                y:
                    enemy.targetY,

                radius: 12,

                damage: 7,

                activateAt:
                    performance.now() +
                    550,

                life: 1.5,

                hit: false
            });
        }
    }


    function createIllusions() {

        illusions = [];


        for (
            let i = 0;
            i < 6;
            i++
        ) {

            illusions.push({

                x:
                    random(
                        arena.left,
                        arena.right
                    ),

                y:
                    random(
                        arena.top,
                        arena.bottom
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
                        -75,
                        75
                    ),

                radius: 24,

                damage: 9,

                activateAt:
                    performance.now() +
                    600,

                life: 2.4,

                hit: false
            });
        }
    }


    function forecastTrap() {

        hazards.push({

            type: "trap",

            x: enemy.targetX,
            y: enemy.targetY,

            radius: 38,

            damage: 17,

            activateAt:
                performance.now() +
                800,

            life: 1.8,

            hit: false
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
                            Math.cos(angle) *
                            150;

                        const y =
                            enemy.y +
                            Math.sin(angle) *
                            150;

                        const dx =
                            enemy.x - x;

                        const dy =
                            enemy.y - y;

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

                            radius: 5,

                            damage: 7,

                            life: 1.3,

                            type: "crossfire"
                        });
                    }

                },
                wave * 350
            );
        }
    }


    function falseFuture() {

        effects.push({

            type: "fakePrediction",

            x: enemy.targetX,
            y: enemy.targetY,

            life: 1.2
        });


        setTimeout(
            () => {

                if (
                    !isForecastTurn()
                ) {
                    return;
                }


                hazards.push({

                    type: "trap",

                    x: enemy.x,
                    y: enemy.y,

                    radius: 42,

                    damage: 21,

                    activateAt:
                        performance.now() +
                        180,

                    life: 1.2,

                    hit: false
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


                    /*
                        Aim between current and
                        intended future position.
                    */

                    const amount =
                        0.35 +
                        i * 0.1;


                    hazards.push({

                        type: "inevitable",

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

                        damage: 11,

                        activateAt:
                            performance.now() +
                            450,

                        life: 1.4,

                        hit: false
                    });

                },
                i * 500
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
                hazards.length - 1;

            i >= 0;

            i--
        ) {

            const h =
                hazards[i];


            h.life -= dt;


            if (h.life <= 0) {

                hazards.splice(
                    i,
                    1
                );

                continue;
            }


            if (
                now < h.activateAt ||
                h.hit
            ) {
                continue;
            }


            if (
                circlesTouch(
                    h.x,
                    h.y,
                    h.radius,

                    enemy.x,
                    enemy.y,
                    enemy.radius
                )
            ) {

                h.hit = true;

                damageEnemy(
                    h.damage
                );
            }
        }
    }


    /* =====================================
       EYES
    ===================================== */

    function useEye(data) {

        const now =
            performance.now();


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

                /*
                    The more aimed attacks
                    Forecast has observed,
                    the stronger the movement
                    adaptation becomes.
                */

                adaptation.speedBonus =
                    Math.min(
                        45,
                        adaptation
                            .aimedShotsSeen *
                        2
                    );

                break;


            case "deadlock":

                deadlockUntil =
                    now +
                    data.duration;

                break;


            case "null":

                enemyProjectiles = [];

                effects.push({
                    type: "null",
                    x: forecast.x,
                    y: forecast.y,
                    life: 0.6
                });

                break;


            case "paradox":

                decoy = {

                    x:
                        clamp(
                            forecast.x + 90,
                            arena.left + 20,
                            arena.right - 20
                        ),

                    y:
                        clamp(
                            forecast.y - 55,
                            arena.top + 20,
                            arena.bottom - 20
                        ),

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
    }


    /* =====================================
       SPECIAL ATTACK COLLISIONS
    ===================================== */

    function updateSpecialAttacks(now) {

        if (scythe) {

            if (
                now >= scythe.until
            ) {

                scythe = null;
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

                    scythe.hit = true;

                    damageEnemy(
                        scythe.damage
                    );
                }
            }
        }


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

                beam.hit = true;

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
            turn !== TURN.FORECAST
        ) {
            return;
        }


        if (
            performance.now() <
            heroismUntil
        ) {

            amount *= 1.3;
        }


        enemy.hp =
            Math.max(
                0,
                enemy.hp - amount
            );


        updateEnemyHUD();


        effects.push({

            type: "hit",

            x: enemy.x,
            y: enemy.y,

            life: 0.25
        });


        if (enemy.hp <= 0) {

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


    /* =====================================
       PHASE CHANGE
    ===================================== */

    function onPhaseChanged(data) {

        /*
            Phase advancement clears the
            current protagonist attack so
            one hit cannot chain into another.
        */

        enemyProjectiles = [];

        effects.push({

            type: "phase",

            x: forecast.x,
            y: forecast.y,

            life: 0.7
        });


        if (data.final) {

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
                effects.length - 1;

            i >= 0;

            i--
        ) {

            effects[i].life -= dt;


            if (
                effects[i].life <= 0
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
                    now < item.until
            );


        if (
            decoy &&
            now >= decoy.until
        ) {

            decoy = null;
        }
    }


    /* =====================================
       DRAW
    ===================================== */

    function draw(now) {

        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        drawArena(now);
        drawPrediction(now);
        drawIllusions(now);
        drawHazards(now);

        drawForecastProjectiles();
        drawEnemyProjectiles(now);

        drawBeam(now);
        drawScythe(now);

        drawDecoy();

        drawForecast(now);
        drawEnemy(now);

        drawEffects();
    }


    /* =====================================
       ARENA
    ===================================== */

    function drawArena(now) {

        ctx.save();


        if (
            now < domainUntil
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
            now < domainUntil
            ? "#ff2424"
            : "#383838";

        ctx.lineWidth = 2;


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
       FORECAST PLACEHOLDER SPRITE
    ===================================== */

    function drawForecast(now) {

        ctx.save();

        ctx.translate(
            forecast.x,
            forecast.y
        );


        /*
            Hood
        */

        ctx.fillStyle = "#050505";

        ctx.strokeStyle = "#eeeeee";

        ctx.lineWidth = 2;


        ctx.beginPath();

        ctx.arc(
            0,
            -3,
            21,
            Math.PI,
            Math.PI * 2
        );

        ctx.lineTo(18, 25);
        ctx.lineTo(-18, 25);

        ctx.closePath();

        ctx.fill();
        ctx.stroke();


        /*
            Skull
        */

        ctx.fillStyle = "#ededed";

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            12,
            0,
            Math.PI * 2
        );

        ctx.fill();


        /*
            Right socket
        */

        ctx.fillStyle = "#111";

        ctx.fillRect(
            3,
            -3,
            5,
            4
        );


        /*
            Forecast eye
        */

        ctx.fillStyle = "#ff2424";

        ctx.shadowColor = "#ff2424";

        ctx.shadowBlur =
            now < evolutionUntil
            ? 18
            : 8;

        ctx.fillRect(
            -8,
            -3,
            5,
            5
        );


        ctx.restore();
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

            ctx.globalAlpha = 0.55;
        }


        ctx.fillStyle = "#ff2424";


        ctx.beginPath();

        ctx.moveTo(0, 10);

        ctx.lineTo(-10, 0);

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
       PROJECTILES
    ===================================== */

    function drawForecastProjectiles() {

        forecastProjectiles.forEach(
            p => {

                ctx.save();


                if (
                    p.type === "bone"
                ) {

                    ctx.fillStyle =
                        "#eeeeee";

                    ctx.fillRect(
                        p.x - 3,
                        p.y - 10,
                        6,
                        20
                    );

                }

                else {

                    ctx.fillStyle =
                        p.type ===
                        "crossfire"
                        ? "#ff2424"
                        : "#eeeeee";


                    ctx.beginPath();

                    ctx.arc(
                        p.x,
                        p.y,
                        p.radius,
                        0,
                        Math.PI * 2
                    );

                    ctx.fill();
                }


                ctx.restore();
            }
        );
    }


    function drawEnemyProjectiles(now) {

        enemyProjectiles.forEach(
            p => {

                ctx.save();

                ctx.strokeStyle =
                    "#ff2424";

                ctx.lineWidth = 2;


                ctx.beginPath();

                ctx.arc(
                    p.x,
                    p.y,
                    p.radius,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();


                if (
                    now < observeUntil
                ) {

                    ctx.globalAlpha = 0.3;

                    ctx.setLineDash(
                        [4, 5]
                    );


                    ctx.beginPath();

                    ctx.moveTo(
                        p.x,
                        p.y
                    );

                    ctx.lineTo(
                        p.x +
                        p.vx * 0.7,

                        p.y +
                        p.vy * 0.7
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
            now >= predictionUntil &&
            now >= observeUntil
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
            h => {

                ctx.save();


                const active =
                    now >=
                    h.activateAt;


                ctx.strokeStyle =
                    active
                    ? "#ff2424"
                    : "rgba(255,36,36,.45)";

                ctx.lineWidth = 2;


                if (!active) {

                    ctx.setLineDash(
                        [4, 5]
                    );
                }


                ctx.beginPath();

                ctx.arc(
                    h.x,
                    h.y,
                    h.radius,
                    0,
                    Math.PI * 2
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

                ctx.save();

                ctx.globalAlpha =
                    0.16 +
                    Math.sin(
                        now * 0.012
                    ) *
                    0.05;

                ctx.strokeStyle =
                    "#ff2424";

                ctx.strokeRect(
                    item.x - 13,
                    item.y - 13,
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

        ctx.globalAlpha = 0.28;

        ctx.strokeStyle =
            "#ff2424";

        ctx.lineWidth = 2;


        ctx.beginPath();

        ctx.arc(
            decoy.x,
            decoy.y,
            forecast.radius,
            0,
            Math.PI * 2
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
                elapsed / total,
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

        ctx.rotate(angle);


        ctx.strokeStyle = "#eee";

        ctx.lineWidth = 4;


        ctx.beginPath();

        ctx.moveTo(0, 0);

        ctx.lineTo(
            scythe.reach,
            0
        );

        ctx.stroke();


        ctx.strokeStyle =
            "#ff2424";

        ctx.lineWidth = 6;


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
            now < beam.chargeUntil
        ) {

            ctx.strokeStyle =
                "rgba(255,36,36,.5)";

            ctx.setLineDash(
                [5, 7]
            );

            ctx.lineWidth = 2;

        }

        else {

            ctx.strokeStyle =
                "#ff2424";

            ctx.shadowColor =
                "#ff2424";

            ctx.shadowBlur = 15;

            ctx.lineWidth = 25;
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

                ctx.save();


                if (
                    effect.type ===
                    "hit"
                ) {

                    ctx.strokeStyle = "#fff";

                    ctx.beginPath();

                    ctx.arc(
                        effect.x,
                        effect.y,
                        18 +
                        effect.life * 25,
                        0,
                        Math.PI * 2
                    );

                    ctx.stroke();
                }


                else if (
                    effect.type ===
                    "phase"
                ) {

                    ctx.strokeStyle =
                        "#ff2424";

                    ctx.beginPath();

                    ctx.arc(
                        effect.x,
                        effect.y,
                        35 +
                        effect.life * 60,
                        0,
                        Math.PI * 2
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
                        effect.life * 90,
                        0,
                        Math.PI * 2
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
                        Math.PI * 2
                    );

                    ctx.stroke();
                }


                ctx.restore();
            }
        );
    }


    /* =====================================
       HUD
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


    function updateTurnHUD() {

        const banner =
            document.getElementById(
                "turnBanner"
            );


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
                    "DODGE";

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
                        message: text
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

        const dx = ax - bx;
        const dy = ay - by;

        const radius =
            ar + br;


        return (
            dx * dx +
            dy * dy
            <=
            radius * radius
        );
    }


    function outsideArena(p) {

        return (
            p.x <
            arena.left - 80 ||

            p.x >
            arena.right + 80 ||

            p.y <
            arena.top - 80 ||

            p.y >
            arena.bottom + 80
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


    function random(min, max) {

        return (
            min +
            Math.random() *
            (max - min)
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

        activatePrediction

    };

})();