/* ==========================================
   FORECAST!SANS SIM — BATTLE ENGINE V0.2
========================================== */

const Battle = (() => {

    let canvas;
    let ctx;

    let width = 0;
    let height = 0;

    let running = false;

    /* ======================================
       TURN SYSTEM
    ====================================== */

    let turn = "FORECAST";
    let turnStarted = 0;

    const FORECAST_TURN_TIME = 8000;
    const ENEMY_TURN_TIME = 6000;
    const TRANSITION_TIME = 900;

    let transitionUntil = 0;


    /* ======================================
       FORECAST
    ====================================== */

    const forecast = {
        x: 0,
        y: 0,

        radius: 18,

        speed: 250,

        vx: 0,
        vy: 0,

        invulnerableUntil: 0
    };


    /* ======================================
       PROTAGONIST
    ====================================== */

    const enemy = {
        x: 0,
        y: 0,

        radius: 10,

        hp: 100,
        maxHP: 100,

        speed: 125,

        targetX: 0,
        targetY: 0,

        nextMove: 0,

        frozenUntil: 0
    };


    /* ======================================
       OBJECTS
    ====================================== */

    let bossProjectiles = [];
    let enemyProjectiles = [];

    let effects = [];
    let hazards = [];
    let illusions = [];

    let scythe = null;
    let gasterBeam = null;
    let decoy = null;


    /* ======================================
       POWER STATES
    ====================================== */

    let heroismUntil = 0;
    let observeUntil = 0;
    let momentUntil = 0;
    let deadlockUntil = 0;
    let domainUntil = 0;
    let evolutionUntil = 0;

    let targetLineUntil = 0;


    /* ======================================
       INITIALIZE
    ====================================== */

    function init(canvasElement) {

        canvas = canvasElement;

        ctx = canvas.getContext(
            "2d"
        );

        resize();

        reset();

        window.addEventListener(
            "resize",
            resize
        );

        running = true;

        requestAnimationFrame(loop);
    }


    function resize() {

        if (!canvas) {
            return;
        }

        const dpr =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );

        width =
            window.innerWidth;

        height =
            window.innerHeight;

        canvas.width =
            Math.floor(width * dpr);

        canvas.height =
            Math.floor(height * dpr);

        canvas.style.width =
            width + "px";

        canvas.style.height =
            height + "px";

        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );
    }


    /* ======================================
       RESET
    ====================================== */

    function reset() {

        const now =
            performance.now();

        forecast.x =
            width * 0.27;

        forecast.y =
            height * 0.40;

        forecast.vx = 0;
        forecast.vy = 0;


        enemy.x =
            width * 0.70;

        enemy.y =
            height * 0.40;

        enemy.hp =
            enemy.maxHP;

        enemy.frozenUntil = 0;


        chooseEnemyTarget();


        bossProjectiles = [];
        enemyProjectiles = [];

        effects = [];
        hazards = [];
        illusions = [];

        scythe = null;
        gasterBeam = null;
        decoy = null;


        heroismUntil = 0;
        observeUntil = 0;
        momentUntil = 0;
        deadlockUntil = 0;
        domainUntil = 0;
        evolutionUntil = 0;


        turn = "FORECAST";

        turnStarted = now;

        transitionUntil = 0;


        updateEnemyHUD();
        updateTurnHUD();

        say(
            "Another possibility enters your sight."
        );
    }


    /* ======================================
       MAIN LOOP
    ====================================== */

    let previousTime =
        performance.now();


    function loop(time) {

        if (!running) {
            return;
        }


        let dt =
            (time - previousTime)
            / 1000;

        previousTime = time;


        dt =
            Math.min(
                dt,
                0.04
            );


        update(
            dt,
            time
        );

        draw(time);


        requestAnimationFrame(loop);
    }


    /* ======================================
       UPDATE
    ====================================== */

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

        updateBossProjectiles(
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

        updateEffects(
            dt,
            now
        );
    }


    /* ======================================
       TURN SYSTEM
    ====================================== */

    function updateTurn(now) {

        if (turn === "TRANSITION") {

            if (
                now >=
                transitionUntil
            ) {

                startForecastTurn();

            }

            return;
        }


        const elapsed =
            now - turnStarted;


        if (
            turn === "FORECAST" &&
            elapsed >=
            FORECAST_TURN_TIME
        ) {

            startEnemyTurn();

        }


        else if (
            turn === "ENEMY" &&
            elapsed >=
            ENEMY_TURN_TIME
        ) {

            startForecastTurn();

        }
    }


    function startForecastTurn() {

        turn =
            "FORECAST";

        turnStarted =
            performance.now();

        enemyProjectiles = [];

        updateTurnHUD();

        say(
            "Your turn. Choose the future."
        );
    }


    function startEnemyTurn() {

        turn =
            "ENEMY";

        turnStarted =
            performance.now();

        bossProjectiles = [];
        hazards = [];

        updateTurnHUD();

        say(
            "The protagonist attacks."
        );

        beginEnemyPattern();
    }


    function startTransition() {

        turn =
            "TRANSITION";

        transitionUntil =
            performance.now() +
            TRANSITION_TIME;

        bossProjectiles = [];
        enemyProjectiles = [];

        hazards = [];

        updateTurnHUD();
    }


    /* ======================================
       FORECAST MOVEMENT
    ====================================== */

    function setMovement(x, y) {

        forecast.vx = x;
        forecast.vy = y;
    }


    function updateForecast(
        dt,
        now
    ) {

        let multiplier = 1;


        if (
            now <
            momentUntil
        ) {

            /*
             Forecast itself remains fast
             while the arena slows.
            */

            multiplier = 1.08;
        }


        let dx =
            forecast.vx;

        let dy =
            forecast.vy;


        const length =
            Math.hypot(
                dx,
                dy
            );


        if (length > 1) {

            dx /= length;
            dy /= length;
        }


        forecast.x +=
            dx *
            forecast.speed *
            multiplier *
            dt;

        forecast.y +=
            dy *
            forecast.speed *
            multiplier *
            dt;


        const margin = 35;


        forecast.x =
            clamp(
                forecast.x,
                margin,
                width - margin
            );


        forecast.y =
            clamp(
                forecast.y,
                90,
                Math.max(
                    100,
                    height - 250
                )
            );
    }


    /* ======================================
       ENEMY AI
    ====================================== */

    function chooseEnemyTarget() {

        enemy.targetX =
            width * (
                0.54 +
                Math.random() *
                0.30
            );

        enemy.targetY =
            height * (
                0.23 +
                Math.random() *
                0.30
            );

        enemy.nextMove =
            performance.now() +
            500 +
            Math.random() *
            800;
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
            now <
            deadlockUntil
        ) {

            dt *= 0.28;
        }


        if (
            now <
            momentUntil
        ) {

            dt *= 0.35;
        }


        if (
            now >
            enemy.nextMove
        ) {

            chooseEnemyTarget();
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


        if (distance > 3) {

            enemy.x +=
                dx /
                distance *
                enemy.speed *
                dt;

            enemy.y +=
                dy /
                distance *
                enemy.speed *
                dt;
        }
    }


    /* ======================================
       ENEMY ATTACK PATTERN
    ====================================== */

    function beginEnemyPattern() {

        const phase =
            ForecastPhases
                .getPhaseIndex();


        /*
         Higher phases make the protagonist
         attack more aggressively.
        */

        const shots =
            Math.min(
                4 + phase,
                11
            );


        for (
            let i = 0;
            i < shots;
            i++
        ) {

            window.setTimeout(
                () => {

                    if (
                        turn !==
                        "ENEMY"
                    ) {
                        return;
                    }

                    spawnEnemyProjectile();

                },

                350 +
                i * 430
            );
        }
    }


    function spawnEnemyProjectile() {

        const sourceX =
            enemy.x;

        const sourceY =
            enemy.y;


        /*
         PARADOX can make the AI aim
         at the fake Forecast instead.
        */

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
            sourceX;

        const dy =
            targetY -
            sourceY;

        const length =
            Math.hypot(
                dx,
                dy
            ) || 1;


        enemyProjectiles.push({

            x: sourceX,
            y: sourceY,

            vx:
                dx /
                length *
                270,

            vy:
                dy /
                length *
                270,

            radius: 7,

            life: 4
        });
    }


    /* ======================================
       ENEMY PROJECTILES
    ====================================== */

    function updateEnemyProjectiles(
        dt,
        now
    ) {

        let timeScale = 1;


        if (
            now <
            momentUntil
        ) {

            timeScale = 0.32;
        }


        for (
            let i =
                enemyProjectiles.length - 1;

            i >= 0;

            i--
        ) {

            const projectile =
                enemyProjectiles[i];


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


            if (
                projectile.life <= 0
            ) {

                enemyProjectiles.splice(
                    i,
                    1
                );

                continue;
            }


            if (
                circleCollision(
                    projectile.x,
                    projectile.y,
                    projectile.radius,
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


    /* ======================================
       FORECAST GETS HIT
    ====================================== */

    function hitForecast(now) {

        if (
            turn !== "ENEMY"
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


        /*
         THIS is the only normal place
         where protagonist attacks advance
         Forecast's phase.
        */

        const advanced =
            ForecastPhases
                .confirmedHit();


        if (advanced) {

            startTransition();

        }


        /*
         Phase 5 does not automatically
         become Phase 6.

         Its final defeat condition will
         be implemented separately.
        */
    }


    /* ======================================
       BOSS PROJECTILES
    ====================================== */

    function spawnBossProjectile(config) {

        if (
            turn !==
            "FORECAST"
        ) {
            return;
        }


        const count =
            config.count || 1;

        const spread =
            config.spread || 0;


        const baseAngle =
            Math.atan2(
                enemy.y -
                forecast.y,

                enemy.x -
                forecast.x
            );


        for (
            let i = 0;
            i < count;
            i++
        ) {

            let offset = 0;


            if (count > 1) {

                offset =
                    (
                        i /
                        (count - 1)
                        - 0.5
                    ) *
                    spread;
            }

            else {

                offset =
                    spread;
            }


            const angle =
                baseAngle +
                offset;


            bossProjectiles.push({

                x:
                    forecast.x,

                y:
                    forecast.y,

                vx:
                    Math.cos(angle) *
                    config.speed,

                vy:
                    Math.sin(angle) *
                    config.speed,

                radius:
                    config.size || 5,

                damage:
                    config.damage || 5,

                life:
                    config.life || 2,

                type:
                    config.type ||
                    "round"
            });
        }
    }


    function updateBossProjectiles(
        dt,
        now
    ) {

        for (
            let i =
                bossProjectiles.length - 1;

            i >= 0;

            i--
        ) {

            const projectile =
                bossProjectiles[i];


            projectile.x +=
                projectile.vx *
                dt;

            projectile.y +=
                projectile.vy *
                dt;

            projectile.life -= dt;


            if (
                projectile.life <= 0
            ) {

                bossProjectiles.splice(
                    i,
                    1
                );

                continue;
            }


            if (
                circleCollision(
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


                bossProjectiles.splice(
                    i,
                    1
                );
            }
        }
    }


    /* ======================================
       DAMAGE PROTAGONIST
    ====================================== */

    function damageEnemy(amount) {

        if (
            performance.now() <
            heroismUntil
        ) {

            amount *= 1.35;
        }


        enemy.hp -= amount;

        enemy.hp =
            Math.max(
                0,
                enemy.hp
            );


        updateEnemyHUD();


        effects.push({

            type: "hit",

            x: enemy.x,
            y: enemy.y,

            life: 0.22
        });


        if (
            enemy.hp <= 0
        ) {

            enemy.hp = 0;

            bossProjectiles = [];
            enemyProjectiles = [];

            turn = "ENDED";

            updateTurnHUD();

            say(
                "Possibility terminated."
            );
        }
    }


    /* ======================================
       SCYTHE
    ====================================== */

    function spawnScytheAttack(config) {

        if (
            turn !==
            "FORECAST"
        ) {
            return;
        }


        const now =
            performance.now();


        scythe = {

            start: now,

            until:
                now +
                config.duration,

            reach:
                config.reach,

            damage:
                config.damage,

            hit: false
        };
    }


    /* ======================================
       GASTER HAND
    ====================================== */

    function spawnGasterHand(config) {

        if (
            turn !==
            "FORECAST"
        ) {
            return;
        }


        const now =
            performance.now();


        gasterBeam = {

            chargeUntil:
                now +
                config.chargeTime,

            until:
                now +
                config.chargeTime +
                config.duration,

            damage:
                config.damage,

            width:
                config.width,

            hit: false
        };
    }


    /* ======================================
       TECHNIQUES
    ====================================== */

    function spawnBoneAttack(config) {

        for (
            let i = 0;
            i < config.count;
            i++
        ) {

            window.setTimeout(
                () => {

                    if (
                        turn !==
                        "FORECAST"
                    ) {
                        return;
                    }


                    spawnBossProjectile({

                        type: "bone",

                        speed:
                            config.speed,

                        damage:
                            config.damage,

                        size: 7,

                        count: 1,

                        spread:
                            (
                                Math.random()
                                - 0.5
                            ) *
                            config.spread,

                        life: 2.2
                    });

                },

                i * 90
            );
        }
    }


    function spawnBoneWall(config) {

        const targetX =
            enemy.x;


        for (
            let i = 0;
            i < config.count;
            i++
        ) {

            hazards.push({

                type: "boneWarning",

                x:
                    targetX -
                    80 +
                    i * 20,

                y:
                    enemy.y,

                damage:
                    config.damage,

                activateAt:
                    performance.now() +
                    config.warningTime,

                life:
                    1.3,

                hit: false
            });
        }
    }


    function spawnIllusions(config) {

        illusions = [];


        for (
            let i = 0;
            i < config.count;
            i++
        ) {

            illusions.push({

                x:
                    Math.random() *
                    width,

                y:
                    100 +
                    Math.random() *
                    Math.max(
                        100,
                        height - 360
                    ),

                until:
                    performance.now() +
                    config.duration
            });
        }
    }


    function spawnConstructs(config) {

        for (
            let i = 0;
            i < config.count;
            i++
        ) {

            hazards.push({

                type: "construct",

                x:
                    enemy.x +
                    (
                        Math.random() -
                        0.5
                    ) *
                    180,

                y:
                    enemy.y +
                    (
                        Math.random() -
                        0.5
                    ) *
                    130,

                damage:
                    config.damage,

                activateAt:
                    performance.now() +
                    550,

                life:
                    config.duration /
                    1000,

                hit: false
            });
        }
    }


    function spawnGasterAttack(config) {

        spawnGasterHand({

            chargeTime:
                config.chargeTime,

            duration:
                config.duration,

            damage:
                config.damage,

            width: 40
        });
    }


    function spawnForecastTrap(config) {

        hazards.push({

            type: "forecastTrap",

            x:
                enemy.targetX,

            y:
                enemy.targetY,

            radius:
                config.radius,

            damage:
                config.damage,

            activateAt:
                performance.now() +
                config.predictionTime,

            life:
                2,

            hit: false
        });
    }


    function spawnCrossfire(config) {

        for (
            let wave = 0;
            wave < config.waves;
            wave++
        ) {

            window.setTimeout(
                () => {

                    if (
                        turn !==
                        "FORECAST"
                    ) {
                        return;
                    }


                    for (
                        let i = 0;
                        i < 8;
                        i++
                    ) {

                        const angle =
                            (
                                Math.PI *
                                2 /
                                8
                            ) *
                            i;


                        const distance =
                            180;


                        const x =
                            enemy.x +
                            Math.cos(angle) *
                            distance;

                        const y =
                            enemy.y +
                            Math.sin(angle) *
                            distance;


                        const dx =
                            enemy.x - x;

                        const dy =
                            enemy.y - y;

                        const len =
                            Math.hypot(
                                dx,
                                dy
                            ) || 1;


                        bossProjectiles.push({

                            x,
                            y,

                            vx:
                                dx /
                                len *
                                330,

                            vy:
                                dy /
                                len *
                                330,

                            radius: 5,

                            damage:
                                config.damage,

                            life: 1.5,

                            type:
                                "crossfire"
                        });
                    }

                },

                wave *
                config.interval
            );
        }
    }


    function spawnFalseFuture(config) {

        effects.push({

            type:
                "fakeTarget",

            x:
                enemy.targetX,

            y:
                enemy.targetY,

            life:
                config.realDelay /
                1000
        });


        window.setTimeout(
            () => {

                if (
                    turn !==
                    "FORECAST"
                ) {
                    return;
                }


                hazards.push({

                    type:
                        "forecastTrap",

                    x:
                        enemy.x,

                    y:
                        enemy.y,

                    radius: 50,

                    damage:
                        config.damage,

                    activateAt:
                        performance.now() +
                        200,

                    life: 1,

                    hit: false
                });

            },

            config.realDelay
        );
    }


    function spawnInevitable(config) {

        for (
            let wave = 0;
            wave < config.waves;
            wave++
        ) {

            window.setTimeout(
                () => {

                    if (
                        turn !==
                        "FORECAST"
                    ) {
                        return;
                    }


                    /*
                     Aim slightly ahead of the
                     protagonist's current path.
                    */

                    const futureX =
                        enemy.x +
                        (
                            enemy.targetX -
                            enemy.x
                        ) *
                        0.45;

                    const futureY =
                        enemy.y +
                        (
                            enemy.targetY -
                            enemy.y
                        ) *
                        0.45;


                    hazards.push({

                        type:
                            "inevitable",

                        x:
                            futureX,

                        y:
                            futureY,

                        radius:
                            38 +
                            wave * 4,

                        damage:
                            config.baseDamage,

                        activateAt:
                            performance.now() +
                            450,

                        life: 1.2,

                        hit: false
                    });

                },

                wave * 550
            );
        }
    }


    /* ======================================
       HAZARDS
    ====================================== */

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


            if (hazard.hit) {
                continue;
            }


            let radius =
                hazard.radius || 18;


            if (
                hazard.type ===
                "boneWarning"
            ) {

                radius = 14;
            }


            if (
                circleCollision(
                    hazard.x,
                    hazard.y,
                    radius,
                    enemy.x,
                    enemy.y,
                    enemy.radius
                )
            ) {

                hazard.hit = true;

                damageEnemy(
                    hazard.damage
                );
            }
        }
    }


    /* ======================================
       EYES
    ====================================== */

    function freezeEnemy(duration) {

        enemy.frozenUntil =
            performance.now() +
            duration;
    }


    function activatePocketDomain(
        duration
    ) {

        domainUntil =
            performance.now() +
            duration;
    }


    function activateHeroism(
        duration
    ) {

        heroismUntil =
            performance.now() +
            duration;
    }


    function activateDeadlock(
        duration
    ) {

        deadlockUntil =
            performance.now() +
            duration;
    }


    function nullifyEnemyAttacks() {

        enemyProjectiles = [];

        effects.push({

            type: "null",

            x: forecast.x,
            y: forecast.y,

            life: 0.6
        });
    }


    function spawnForecastDecoy(
        duration
    ) {

        decoy = {

            x:
                clamp(
                    forecast.x +
                    100,
                    30,
                    width - 30
                ),

            y:
                clamp(
                    forecast.y -
                    50,
                    100,
                    height - 260
                ),

            until:
                performance.now() +
                duration
        };
    }


    function activateObserve(
        duration
    ) {

        observeUntil =
            performance.now() +
            duration;
    }


    function redirectProjectiles() {

        bossProjectiles.forEach(
            projectile => {

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
                    dx /
                    length *
                    speed;

                projectile.vy =
                    dy /
                    length *
                    speed;
            }
        );
    }


    function activateMoment(
        duration
    ) {

        momentUntil =
            performance.now() +
            duration;
    }


    function activateEvolution(
        duration
    ) {

        evolutionUntil =
            performance.now() +
            duration;

        effects.push({

            type: "evolution",

            x: forecast.x,
            y: forecast.y,

            life:
                duration /
                1000
        });
    }


    /* ======================================
       TARGET LINE
    ====================================== */

    function flashTargetLine(
        duration
    ) {

        targetLineUntil =
            performance.now() +
            duration;
    }


    /* ======================================
       EFFECT UPDATE
    ====================================== */

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
                illusion =>
                    now <
                    illusion.until
            );


        if (
            decoy &&
            now >=
            decoy.until
        ) {

            decoy = null;
        }


        updateSpecialAttacks(now);
    }


    /* ======================================
       SCYTHE + GASTER COLLISION
    ====================================== */

    function updateSpecialAttacks(now) {

        if (scythe) {

            if (
                now >
                scythe.until
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
                    distance <
                    scythe.reach
                ) {

                    scythe.hit = true;

                    damageEnemy(
                        scythe.damage
                    );
                }
            }
        }


        if (gasterBeam) {

            if (
                now >
                gasterBeam.until
            ) {

                gasterBeam = null;
            }

            else if (
                now >=
                gasterBeam.chargeUntil &&
                !gasterBeam.hit
            ) {

                /*
                 Beam is represented by a
                 line from Forecast to the
                 protagonist.
                */

                gasterBeam.hit = true;

                damageEnemy(
                    gasterBeam.damage
                );
            }
        }
    }


    /* ======================================
       DRAW
    ====================================== */

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

        drawBossProjectiles();

        drawEnemyProjectiles(now);

        drawScythe(now);

        drawGaster(now);

        drawDecoy(now);

        drawForecast(now);

        drawEnemy(now);

        drawEffects(now);
    }


    /* ======================================
       ARENA
    ====================================== */

    function drawArena(now) {

        ctx.save();


        if (
            now <
            domainUntil
        ) {

            ctx.fillStyle =
                "rgba(90,0,0,0.15)";

            ctx.fillRect(
                0,
                0,
                width,
                height
            );
        }


        ctx.strokeStyle =
            now <
            domainUntil
            ? "#ff2020"
            : "#444";

        ctx.lineWidth = 2;


        ctx.strokeRect(
            24,
            82,
            width - 48,
            Math.max(
                120,
                height - 330
            )
        );


        ctx.restore();
    }


    /* ======================================
       FORECAST CHARACTER
    ====================================== */

    function drawForecast(now) {

        ctx.save();

        ctx.translate(
            forecast.x,
            forecast.y
        );


        /*
         Hood silhouette
        */

        ctx.fillStyle =
            "#050505";

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            22,
            Math.PI,
            Math.PI * 2
        );

        ctx.lineTo(
            20,
            27
        );

        ctx.lineTo(
            -20,
            27
        );

        ctx.closePath();

        ctx.fill();


        ctx.strokeStyle =
            "#eeeeee";

        ctx.lineWidth = 2;

        ctx.stroke();


        /*
         Face
        */

        ctx.fillStyle =
            "#e9e9e9";

        ctx.beginPath();

        ctx.arc(
            0,
            3,
            13,
            0,
            Math.PI * 2
        );

        ctx.fill();


        /*
         Black eye
        */

        ctx.fillStyle =
            "#111";

        ctx.fillRect(
            3,
            -1,
            5,
            4
        );


        /*
         Red Forecast eye
        */

        ctx.fillStyle =
            "#ff2020";

        ctx.shadowColor =
            "#ff2020";

        ctx.shadowBlur =
            now <
            evolutionUntil
            ? 18
            : 8;

        ctx.fillRect(
            -8,
            -2,
            5,
            5
        );


        ctx.restore();
    }


    /* ======================================
       PROTAGONIST HEART
    ====================================== */

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
            "#ff2020";


        ctx.beginPath();

        ctx.moveTo(
            0,
            11
        );

        ctx.lineTo(
            -11,
            -1
        );

        ctx.bezierCurveTo(
            -14,
            -12,
            -2,
            -14,
            0,
            -6
        );

        ctx.bezierCurveTo(
            2,
            -14,
            14,
            -12,
            11,
            -1
        );

        ctx.closePath();

        ctx.fill();


        ctx.restore();
    }


    /* ======================================
       PROJECTILE DRAWING
    ====================================== */

    function drawBossProjectiles() {

        bossProjectiles.forEach(
            projectile => {

                ctx.save();


                if (
                    projectile.type ===
                    "bone"
                ) {

                    ctx.fillStyle =
                        "#f2f2f2";

                    ctx.fillRect(
                        projectile.x - 3,
                        projectile.y - 11,
                        6,
                        22
                    );

                }

                else {

                    ctx.fillStyle =
                        projectile.type ===
                        "crossfire"
                        ? "#ff2020"
                        : "#eeeeee";

                    ctx.beginPath();

                    ctx.arc(
                        projectile.x,
                        projectile.y,
                        projectile.radius,
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
            projectile => {

                ctx.save();


                ctx.strokeStyle =
                    "#ff2020";

                ctx.lineWidth = 2;


                ctx.beginPath();

                ctx.arc(
                    projectile.x,
                    projectile.y,
                    projectile.radius,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();


                /*
                 OBSERVE shows where an
                 enemy projectile is going.
                */

                if (
                    now <
                    observeUntil
                ) {

                    ctx.globalAlpha =
                        0.25;

                    ctx.beginPath();

                    ctx.moveTo(
                        projectile.x,
                        projectile.y
                    );

                    ctx.lineTo(
                        projectile.x +
                        projectile.vx *
                        0.6,

                        projectile.y +
                        projectile.vy *
                        0.6
                    );

                    ctx.stroke();
                }


                ctx.restore();
            }
        );
    }


    /* ======================================
       PREDICTION
    ====================================== */

    function drawPrediction(now) {

        if (
            now >
            targetLineUntil &&
            now >
            observeUntil
        ) {
            return;
        }


        ctx.save();

        ctx.setLineDash(
            [5, 7]
        );

        ctx.strokeStyle =
            "rgba(255,32,32,0.55)";

        ctx.lineWidth = 1;


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


    /* ======================================
       HAZARDS
    ====================================== */

    function drawHazards(now) {

        hazards.forEach(
            hazard => {

                ctx.save();


                const active =
                    now >=
                    hazard.activateAt;


                if (!active) {

                    ctx.strokeStyle =
                        "rgba(255,32,32,.55)";

                    ctx.setLineDash(
                        [4, 5]
                    );

                }

                else {

                    ctx.strokeStyle =
                        "#ff2020";
                }


                ctx.lineWidth = 2;


                if (
                    hazard.type ===
                    "boneWarning"
                ) {

                    ctx.beginPath();

                    ctx.moveTo(
                        hazard.x,
                        hazard.y + 28
                    );

                    ctx.lineTo(
                        hazard.x,
                        hazard.y - 28
                    );

                    ctx.stroke();

                }

                else {

                    ctx.beginPath();

                    ctx.arc(
                        hazard.x,
                        hazard.y,
                        hazard.radius || 25,
                        0,
                        Math.PI * 2
                    );

                    ctx.stroke();
                }


                ctx.restore();
            }
        );
    }


    /* ======================================
       ILLUSIONS
    ====================================== */

    function drawIllusions(now) {

        illusions.forEach(
            illusion => {

                ctx.save();

                ctx.globalAlpha =
                    0.18 +
                    Math.sin(
                        now * 0.01
                    ) *
                    0.07;


                ctx.strokeStyle =
                    "#ff2020";

                ctx.strokeRect(
                    illusion.x - 13,
                    illusion.y - 13,
                    26,
                    26
                );


                ctx.restore();
            }
        );
    }


    /* ======================================
       SCYTHE
    ====================================== */

    function drawScythe(now) {

        if (!scythe) {
            return;
        }


        const progress =
            1 -
            (
                scythe.until -
                now
            ) /
            (
                scythe.until -
                scythe.start
            );


        const angle =
            -1.7 +
            progress *
            3.2;


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
            scythe.reach,
            0
        );

        ctx.stroke();


        ctx.strokeStyle =
            "#ff2020";

        ctx.lineWidth = 7;


        ctx.beginPath();

        ctx.arc(
            scythe.reach,
            -18,
            28,
            0.4,
            2.7
        );

        ctx.stroke();


        ctx.restore();
    }


    /* ======================================
       GASTER
    ====================================== */

    function drawGaster(now) {

        if (!gasterBeam) {
            return;
        }


        ctx.save();


        if (
            now <
            gasterBeam.chargeUntil
        ) {

            ctx.strokeStyle =
                "rgba(255,32,32,.5)";

            ctx.setLineDash(
                [5, 7]
            );

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

        }

        else {

            ctx.strokeStyle =
                "#ff2020";

            ctx.shadowColor =
                "#ff2020";

            ctx.shadowBlur = 15;

            ctx.lineWidth =
                gasterBeam.width;


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
        }


        ctx.restore();
    }


    /* ======================================
       DECOY
    ====================================== */

    function drawDecoy(now) {

        if (!decoy) {
            return;
        }


        ctx.save();

        ctx.globalAlpha =
            0.32;

        ctx.strokeStyle =
            "#ff2020";

        ctx.beginPath();

        ctx.arc(
            decoy.x,
            decoy.y,
            18,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.restore();
    }


    /* ======================================
       EFFECTS
    ====================================== */

    function drawEffects(now) {

        effects.forEach(
            effect => {

                ctx.save();


                if (
                    effect.type ===
                    "hit"
                ) {

                    ctx.strokeStyle =
                        "#fff";

                    ctx.beginPath();

                    ctx.arc(
                        effect.x,
                        effect.y,
                        25 *
                        (
                            1 -
                            effect.life
                        ),
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
                        "#ff2020";

                    ctx.beginPath();

                    ctx.arc(
                        effect.x,
                        effect.y,
                        80 *
                        (
                            1 -
                            effect.life
                        ),
                        0,
                        Math.PI * 2
                    );

                    ctx.stroke();
                }


                else if (
                    effect.type ===
                    "fakeTarget"
                ) {

                    ctx.strokeStyle =
                        "rgba(255,32,32,.4)";

                    ctx.setLineDash(
                        [4, 4]
                    );

                    ctx.beginPath();

                    ctx.arc(
                        effect.x,
                        effect.y,
                        35,
                        0,
                        Math.PI * 2
                    );

                    ctx.stroke();
                }


                ctx.restore();
            }
        );
    }


    /* ======================================
       HUD
    ====================================== */

    function updateEnemyHUD() {

        const bar =
            document.getElementById(
                "enemyHP"
            );


        if (!bar) {
            return;
        }


        const percent =
            (
                enemy.hp /
                enemy.maxHP
            ) *
            100;


        bar.style.width =
            percent + "%";
    }


    function updateTurnHUD() {

        const text =
            document.getElementById(
                "turnText"
            );


        if (!text) {
            return;
        }


        switch (turn) {

            case "FORECAST":

                text.textContent =
                    "YOUR TURN";

                break;


            case "ENEMY":

                text.textContent =
                    "DODGE";

                break;


            case "TRANSITION":

                text.textContent =
                    "PHASE SHIFT";

                break;


            case "ENDED":

                text.textContent =
                    "BATTLE ENDED";

                break;
        }
    }


    function say(message) {

        const text =
            document.getElementById(
                "dialogueText"
            );


        if (text) {

            text.textContent =
                message;
        }
    }


    /* ======================================
       PHASE CALLBACKS
    ====================================== */

    function onPhaseChanged(
        phase,
        index
    ) {

        say(
            `Forecast enters Phase ${phase}.`
        );
    }


    function onFinalPhaseHit() {

        /*
         IMPORTANT:

         Phase 5's actual defeat condition
         is intentionally NOT decided here.

         No Phase 6.
        */

        say(
            "The final phase refuses to break."
        );
    }


    /* ======================================
       UTILITIES
    ====================================== */

    function circleCollision(
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
            dy * dy
            <=
            radius * radius
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


    /* ======================================
       PUBLIC API
    ====================================== */

    return {

        init,
        reset,

        setMovement,

        say,

        spawnBossProjectile,
        spawnScytheAttack,
        spawnGasterHand,

        spawnBoneAttack,
        spawnBoneWall,
        spawnIllusions,
        spawnConstructs,
        spawnGasterAttack,
        spawnForecastTrap,
        spawnCrossfire,
        spawnFalseFuture,
        spawnInevitable,

        freezeEnemy,
        activatePocketDomain,
        activateHeroism,
        activateDeadlock,
        nullifyEnemyAttacks,
        spawnForecastDecoy,
        activateObserve,
        redirectProjectiles,
        activateMoment,
        activateEvolution,

        flashTargetLine,

        onPhaseChanged,
        onFinalPhaseHit

    };

})();