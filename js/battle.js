/* =========================================================
   FORECAST!SANS — SAME END ANYWAY
   V1 BATTLE ENGINE

   - Forecast stays ABOVE the arena
   - Protagonist stays INSIDE the arena
   - Forecast does NOT physically move when dodging
   - Sprite-sheet animation system
   - Distinct weapon / technique attacks
   - Protagonist AI
   - Enemy attack patterns
   - Stamina + auto-dodge
   - Phase-hit system
   - Drag target support

   Sprite sheet:
   ./forecast-spritesheet.png

   Sheet:
   6 columns
   193 x 109 per cell
========================================================= */

const ForecastBattle = (() => {
    "use strict";


    /* =====================================================
       CONSTANTS
    ===================================================== */

    const TAU = Math.PI * 2;

    const SPRITE_COLUMNS = 6;
    const SPRITE_CELL_W = 193;
    const SPRITE_CELL_H = 109;

    const MAX_STAMINA = 100;

    const FORECAST_TURN_TIME = 7000;
    const ENEMY_TURN_TIME = 6000;

    const FORECAST_REGEN = 21;
    const ENEMY_REGEN = 16;

    const BASE_DODGE_COST = 12;


    /* =====================================================
       DOM / CANVAS
    ===================================================== */

    let canvas = null;
    let ctx = null;

    let width = 0;
    let height = 0;

    let initialized = false;
    let running = false;

    let previousTime = 0;


    /* =====================================================
       SPRITE SHEET
    ===================================================== */

    const spriteSheet = new Image();

    spriteSheet.src =
        "./forecast-spritesheet.png";


    /*
        EXACT order of the uploaded
        forecast-spritesheet.png.
    */

    const SPRITES = {
        idle_1: 0,
        idle_2: 1,
        idle_3: 2,
        blink: 3,
        look_down: 4,
        look_up: 5,

        cloak_flow: 6,
        dodge_left: 7,
        dodge_right: 8,
        dodge_up: 9,
        dodge_down: 10,
        dodge_afterimage: 11,

        gun_pose: 12,
        gun_fire: 13,
        bone_control: 14,
        eye_activate: 15,
        summon_scythe: 16,
        scythe_ready: 17,

        scythe_swing: 18,
        scythe_finish: 19,
        hit: 20,
        low_stamina: 21,
        exhausted: 22,
        phase_change: 23
    };


    /* =====================================================
       FORECAST
    ===================================================== */

    const forecast = {
        x: 0,
        y: 0,

        radius: 22,

        stamina: MAX_STAMINA,

        invulnerableUntil: 0,

        animation: "idle",
        animationStarted: 0,
        animationUntil: 0,

        dodgeChain: 0,

        prediction: 0,
        observation: 0,
        evolution: 0,

        afterimages: []
    };


    /* =====================================================
       PROTAGONIST
    ===================================================== */

    const protagonist = {
        x: 0,
        y: 0,

        vx: 0,
        vy: 0,

        radius: 9,

        speed: 145,

        hp: 100,
        maxHp: 100,

        frozenUntil: 0,
        deadlockedUntil: 0,

        invulnerableUntil: 0,

        aiChangeAt: 0,

        history: []
    };


    /* =====================================================
       ARENA
    ===================================================== */

    const arena = {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0
    };


    /* =====================================================
       TURN STATE
    ===================================================== */

    let turn = "FORECAST";
    let turnStarted = 0;

    let enemyAttackTimer = 0;

    let battleEnded = false;


    /* =====================================================
       ATTACK ARRAYS
    ===================================================== */

    const playerProjectiles = [];
    const enemyProjectiles = [];

    const effects = [];
    const boneWalls = [];
    const constructs = [];
    const traps = [];
    const beams = [];
    const slashes = [];


    /* =====================================================
       ACTIVE EYE EFFECTS
    ===================================================== */

    const eyeEffects = {
        heroismUntil: 0,
        evolutionUntil: 0,
        observeUntil: 0,
        paradoxUntil: 0,
        vectorUntil: 0,
        momentUntil: 0,
        blackEyeUntil: 0
    };


    /* =====================================================
       HELPERS
    ===================================================== */

    function clamp(value, min, max) {
        return Math.max(
            min,
            Math.min(max, value)
        );
    }


    function distance(
        ax,
        ay,
        bx,
        by
    ) {
        return Math.hypot(
            bx - ax,
            by - ay
        );
    }


    function normalizeVector(
        x,
        y
    ) {
        const length =
            Math.hypot(x, y) || 1;

        return {
            x: x / length,
            y: y / length
        };
    }


    function random(min, max) {
        return (
            min +
            Math.random() *
            (max - min)
        );
    }


    function now() {
        return performance.now();
    }


    function emitMessage(message) {
        window.dispatchEvent(
            new CustomEvent(
                "forecast-message",
                {
                    detail: {
                        message
                    }
                }
            )
        );
    }


    function emitStatus() {
        window.dispatchEvent(
            new CustomEvent(
                "forecast-battle-status",
                {
                    detail:
                        getStatus()
                }
            )
        );
    }


    /* =====================================================
       RESIZE / POSITIONS
    ===================================================== */

    function resize() {
        if (!canvas) return;

        const rect =
            canvas.getBoundingClientRect();

        const dpr =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );

        width =
            Math.max(
                320,
                Math.floor(rect.width)
            );

        height =
            Math.max(
                390,
                Math.floor(rect.height)
            );


        canvas.width =
            Math.floor(width * dpr);

        canvas.height =
            Math.floor(height * dpr);


        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );

        ctx.imageSmoothingEnabled = false;


        /*
            Leave room ABOVE the box
            for Forecast.
        */

        arena.left =
            Math.max(
                22,
                width * 0.08
            );

        arena.right =
            width -
            arena.left;


        arena.top =
            clamp(
                height * 0.35,
                160,
                225
            );

        arena.bottom =
            height - 28;


        arena.width =
            arena.right -
            arena.left;

        arena.height =
            arena.bottom -
            arena.top;


        positionForecast();


        protagonist.x =
            clamp(
                protagonist.x ||
                width * 0.5,
                arena.left + 18,
                arena.right - 18
            );

        protagonist.y =
            clamp(
                protagonist.y ||
                arena.top +
                arena.height * 0.55,
                arena.top + 18,
                arena.bottom - 18
            );
    }


    function positionForecast() {
        /*
            IMPORTANT:
            Forecast's real coordinates
            remain fixed here.

            Dodge animations NEVER alter
            forecast.x / forecast.y.
        */

        forecast.x =
            width * 0.5;

        forecast.y =
            arena.top - 68;
    }


    /* =====================================================
       ANIMATION
    ===================================================== */

    function setAnimation(
        name,
        duration = 300
    ) {
        forecast.animation = name;
        forecast.animationStarted = now();

        forecast.animationUntil =
            forecast.animationStarted +
            duration;
    }


    function updateAnimation(time) {
        if (
            time <
            forecast.animationUntil
        ) {
            return;
        }


        if (
            forecast.stamina <= 5
        ) {
            forecast.animation =
                "exhausted";

            return;
        }


        if (
            forecast.stamina <= 25
        ) {
            forecast.animation =
                "low_stamina";

            return;
        }


        forecast.animation =
            "idle";
    }


    function getAnimationFrame(time) {
        switch (
            forecast.animation
        ) {

            case "idle": {
                const cycle = Math.floor(time / 125) % 48;
                if (cycle === 34) return "blink";
                if (cycle === 41) return "look_down";
                if (cycle === 45) return "look_up";
                const frame = Math.floor(time / 240) % 4;
                return ["idle_1","idle_2","idle_3","idle_2"][frame];
            }


            case "gun":
                return (
                    time -
                    forecast.animationStarted <
                    90
                )
                    ? "gun_pose"
                    : ((Math.floor((time - forecast.animationStarted) / 65) % 2) ? "gun_pose" : "gun_fire");


            case "bones":
                return "bone_control";


            case "eye":
                return "eye_activate";


            case "scythe_summon":
                return "summon_scythe";


            case "scythe_ready":
                return "scythe_ready";


            case "scythe_swing": {
                const age = time - forecast.animationStarted;
                if (age < 90) return "summon_scythe";
                if (age < 180) return "scythe_ready";
                if (age < 360) return "scythe_swing";
                return "scythe_finish";
            }


            case "scythe_finish":
                return "scythe_finish";


            case "dodge_left":
                return "dodge_left";


            case "dodge_right":
                return "dodge_right";


            case "dodge_up":
                return "dodge_up";


            case "dodge_down":
                return "dodge_down";


            case "dodge_afterimage":
                return "dodge_afterimage";


            case "hit":
                return "hit";


            case "phase_change":
                return "phase_change";


            case "low_stamina":
                return "low_stamina";


            case "exhausted":
                return "exhausted";


            default:
                return "idle_1";
        }
    }


    /* =====================================================
       DRAW SPRITE
    ===================================================== */

    function drawForecast(time) {
        const frameName =
            getAnimationFrame(time);

        const index =
            SPRITES[frameName] ?? 0;

        const column =
            index %
            SPRITE_COLUMNS;

        const row =
            Math.floor(
                index /
                SPRITE_COLUMNS
            );

        const sx =
            column *
            SPRITE_CELL_W;

        const sy =
            row *
            SPRITE_CELL_H;


        /*
            Afterimages are visual ONLY.
            They do not alter Forecast's
            collision position.
        */

        for (
            const image of
            forecast.afterimages
        ) {
            const age =
                time -
                image.created;

            const opacity =
                clamp(
                    1 -
                    age / 260,
                    0,
                    1
                ) * 0.28;

            if (
                opacity <= 0
            ) continue;


            ctx.save();

            ctx.globalAlpha =
                opacity;

            drawSpriteFrame(
                image.frame,
                forecast.x +
                    image.offsetX,
                forecast.y +
                    image.offsetY,
                116,
                66
            );

            ctx.restore();
        }


        drawSpriteFrame(
            frameName,
            forecast.x,
            forecast.y,
            124,
            70
        );


        /*
            Phase / eye glow.
        */

        if (
            eyeEffects.heroismUntil >
            time
        ) {
            ctx.save();

            ctx.globalAlpha = 0.45;

            ctx.strokeStyle =
                "#ff2020";

            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.arc(
                forecast.x,
                forecast.y,
                38 +
                Math.sin(time / 90) * 5,
                0,
                TAU
            );

            ctx.stroke();

            ctx.restore();
        }
    }


    function drawSpriteFrame(
        frameName,
        x,
        y,
        drawW,
        drawH
    ) {
        if (
            !spriteSheet.complete ||
            !spriteSheet.naturalWidth
        ) {
            /*
                Fallback so the game still
                works while image loads.
            */

            ctx.save();

            ctx.fillStyle = "#fff";

            ctx.fillRect(
                x - 12,
                y - 20,
                24,
                40
            );

            ctx.restore();

            return;
        }


        const index =
            SPRITES[frameName] ?? 0;

        const column =
            index %
            SPRITE_COLUMNS;

        const row =
            Math.floor(
                index /
                SPRITE_COLUMNS
            );


        ctx.drawImage(
            spriteSheet,

            column *
                SPRITE_CELL_W,

            row *
                SPRITE_CELL_H,

            SPRITE_CELL_W,
            SPRITE_CELL_H,

            x - drawW / 2,
            y - drawH * 0.56,

            drawW,
            drawH
        );
    }


    /* =====================================================
       PROTAGONIST AI
    ===================================================== */

    function updateProtagonist(
        dt,
        time
    ) {
        protagonist.history.push({
            x: protagonist.x,
            y: protagonist.y,
            time
        });


        while (
            protagonist.history.length >
            20
        ) {
            protagonist.history.shift();
        }


        if (
            time <
            protagonist.frozenUntil
        ) {
            return;
        }


        if (
            time >
            protagonist.aiChangeAt
        ) {
            protagonist.aiChangeAt =
                time +
                random(
                    350,
                    900
                );


            const angle =
                random(
                    0,
                    TAU
                );


            let speed =
                protagonist.speed;


            if (
                time <
                protagonist.deadlockedUntil
            ) {
                speed *= 0.35;
            }


            if (
                eyeEffects.paradoxUntil >
                time
            ) {
                speed *= 0.75;
            }


            protagonist.vx =
                Math.cos(angle) *
                speed;

            protagonist.vy =
                Math.sin(angle) *
                speed;
        }


        protagonist.x +=
            protagonist.vx *
            dt;

        protagonist.y +=
            protagonist.vy *
            dt;


        if (
            protagonist.x <
            arena.left +
            protagonist.radius
        ) {
            protagonist.x =
                arena.left +
                protagonist.radius;

            protagonist.vx =
                Math.abs(
                    protagonist.vx
                );
        }


        if (
            protagonist.x >
            arena.right -
            protagonist.radius
        ) {
            protagonist.x =
                arena.right -
                protagonist.radius;

            protagonist.vx =
                -Math.abs(
                    protagonist.vx
                );
        }


        if (
            protagonist.y <
            arena.top +
            protagonist.radius
        ) {
            protagonist.y =
                arena.top +
                protagonist.radius;

            protagonist.vy =
                Math.abs(
                    protagonist.vy
                );
        }


        if (
            protagonist.y >
            arena.bottom -
            protagonist.radius
        ) {
            protagonist.y =
                arena.bottom -
                protagonist.radius;

            protagonist.vy =
                -Math.abs(
                    protagonist.vy
                );
        }
    }


    function predictProtagonist(
        amount = 0.35
    ) {
        return {
            x: clamp(
                protagonist.x +
                protagonist.vx *
                amount,

                arena.left + 10,
                arena.right - 10
            ),

            y: clamp(
                protagonist.y +
                protagonist.vy *
                amount,

                arena.top + 10,
                arena.bottom - 10
            )
        };
    }


    /* =====================================================
       PROJECTILE CREATION
    ===================================================== */

    function createPlayerProjectile({
        x,
        y,
        targetX,
        targetY,
        speed,
        radius,
        damage,
        type,
        life = 2500
    }) {
        const direction =
            normalizeVector(
                targetX - x,
                targetY - y
            );


        effects.push({
            type: "muzzleFlash",
            x, y,
            angle: Math.atan2(targetY - y, targetX - x),
            created: now(),
            life: type === "dmr" ? 120 : 70
        });

        playerProjectiles.push({
            x,
            y,

            vx:
                direction.x *
                speed,

            vy:
                direction.y *
                speed,

            radius,
            damage,
            type,

            created: now(),
            life
        });
    }


    /* =====================================================
       WEAPONS
    ===================================================== */

    function useWeapon(
        attack,
        target
    ) {
        if (
            turn !== "FORECAST" ||
            battleEnded
        ) {
            return;
        }


        target =
            sanitizeTarget(target);


        switch (attack) {

            /* ---------------- GLOCK ---------------- */

            case "glock":

                setAnimation(
                    "gun",
                    220
                );

                createPlayerProjectile({
                    x: forecast.x,
                    y: forecast.y + 18,

                    targetX: target.x,
                    targetY: target.y,

                    speed: 590,
                    radius: 4,
                    damage: 9,

                    type: "glock"
                });

                break;


            /* ---------------- SMG ---------------- */

            case "smg":

                setAnimation(
                    "gun",
                    650
                );

                for (
                    let i = 0;
                    i < 7;
                    i++
                ) {
                    setTimeout(() => {
                        if (
                            battleEnded
                        ) return;


                        createPlayerProjectile({
                            x:
                                forecast.x +
                                random(-3, 3),

                            y:
                                forecast.y + 18,

                            targetX:
                                target.x +
                                random(-12, 12),

                            targetY:
                                target.y +
                                random(-12, 12),

                            speed:
                                500 +
                                random(-20, 30),

                            radius: 3,
                            damage: 3,

                            type: "smg"
                        });

                    }, i * 65);
                }

                break;


            /* ---------------- AR ---------------- */

            case "ar":

                setAnimation(
                    "gun",
                    450
                );

                for (
                    let i = 0;
                    i < 3;
                    i++
                ) {
                    setTimeout(() => {

                        createPlayerProjectile({
                            x: forecast.x,
                            y: forecast.y + 18,

                            targetX:
                                target.x +
                                random(-5, 5),

                            targetY:
                                target.y +
                                random(-5, 5),

                            speed: 650,

                            radius: 5,
                            damage: 7,

                            type: "ar"
                        });

                    }, i * 105);
                }

                break;


            /* ---------------- DMR ---------------- */

            case "dmr":

                setAnimation(
                    "gun",
                    320
                );

                effects.push({
                    type: "aimLine",

                    x1: forecast.x,
                    y1: forecast.y,

                    x2: target.x,
                    y2: target.y,

                    created: now(),
                    life: 150
                });


                setTimeout(() => {

                    createPlayerProjectile({
                        x: forecast.x,
                        y: forecast.y + 16,

                        targetX: target.x,
                        targetY: target.y,

                        speed: 900,
                        radius: 6,
                        damage: 16,

                        type: "dmr",
                        life: 1800
                    });

                }, 120);

                break;


            /* ---------------- SHOTGUN ---------------- */

            case "shotgun":

                setAnimation(
                    "gun",
                    380
                );


                const baseAngle =
                    Math.atan2(
                        target.y -
                        forecast.y,

                        target.x -
                        forecast.x
                    );


                for (
                    let i = -3;
                    i <= 3;
                    i++
                ) {
                    const angle =
                        baseAngle +
                        i * 0.075;


                    const farX =
                        forecast.x +
                        Math.cos(angle) *
                        800;

                    const farY =
                        forecast.y +
                        Math.sin(angle) *
                        800;


                    createPlayerProjectile({
                        x: forecast.x,
                        y: forecast.y + 15,

                        targetX: farX,
                        targetY: farY,

                        speed:
                            520 +
                            random(-35, 35),

                        radius: 3,
                        damage: 4,

                        type: "pellet",
                        life: 900
                    });
                }

                break;


            /* ---------------- GASTER HAND ---------------- */

            case "gasterHand":

                setAnimation(
                    "eye",
                    500
                );

                createBeam(
                    target,
                    "gasterHand",
                    22,
                    18,
                    500
                );

                break;


            /* ---------------- SCYTHE ---------------- */

            case "scythe":

                scytheAttack(
                    target
                );

                break;
        }
    }


    /* =====================================================
       SCYTHE
    ===================================================== */

    function scytheAttack(target) {
        setAnimation(
            "scythe_summon",
            260
        );


        setTimeout(() => {
            setAnimation(
                "scythe_ready",
                180
            );
        }, 240);


        setTimeout(() => {

            setAnimation(
                "scythe_swing",
                360
            );


            const angle =
                Math.atan2(
                    target.y -
                    forecast.y,

                    target.x -
                    forecast.x
                );


            slashes.push({
                x: forecast.x,
                y: forecast.y,

                angle,

                radius: 155,
                width: 38,

                damage: 22,

                created: now(),
                life: 330,

                hit: false
            });

        }, 410);


        setTimeout(() => {

            setAnimation(
                "scythe_finish",
                260
            );

        }, 730);
    }


    /* =====================================================
       TECHNIQUES
    ===================================================== */

    function useTechnique(
        attack,
        target
    ) {
        if (
            turn !== "FORECAST" ||
            battleEnded
        ) {
            return;
        }


        target =
            sanitizeTarget(target);


        switch (attack) {

            /* ---------------- BONES ---------------- */

            case "bones":

                setAnimation(
                    "bones",
                    450
                );


                for (
                    let i = -2;
                    i <= 2;
                    i++
                ) {
                    createPlayerProjectile({
                        x:
                            forecast.x +
                            i * 10,

                        y:
                            forecast.y + 20,

                        targetX:
                            target.x +
                            i * 8,

                        targetY:
                            target.y,

                        speed: 430,

                        radius: 6,
                        damage: 5,

                        type: "bone"
                    });
                }

                break;


            /* ---------------- BONE WALL ---------------- */

            case "boneWall":

                setAnimation(
                    "bones",
                    600
                );


                for (
                    let i = -3;
                    i <= 3;
                    i++
                ) {
                    boneWalls.push({
                        x:
                            clamp(
                                target.x +
                                i * 22,

                                arena.left + 10,
                                arena.right - 10
                            ),

                        y:
                            arena.bottom,

                        targetHeight:
                            70 +
                            Math.abs(i) * 5,

                        height: 0,

                        width: 9,

                        damage: 7,

                        created:
                            now() +
                            Math.abs(i) *
                            55,

                        life: 1100,

                        hit: false
                    });
                }

                break;


            /* ---------------- ILLUSIONS ---------------- */

            case "illusions":

                setAnimation(
                    "eye",
                    500
                );


                for (
                    let i = 0;
                    i < 5;
                    i++
                ) {
                    effects.push({
                        type: "illusion",

                        x:
                            clamp(
                                target.x +
                                random(-90, 90),

                                arena.left + 20,
                                arena.right - 20
                            ),

                        y:
                            clamp(
                                target.y +
                                random(-70, 70),

                                arena.top + 20,
                                arena.bottom - 20
                            ),

                        created: now(),
                        life: 1500
                    });
                }


                /*
                    One of the apparent
                    illusions is real.
                */

                setTimeout(() => {

                    createPlayerProjectile({
                        x: forecast.x,
                        y: forecast.y + 15,

                        targetX: target.x,
                        targetY: target.y,

                        speed: 560,
                        radius: 5,
                        damage: 12,

                        type: "illusionShot"
                    });

                }, 450);

                break;


            /* ---------------- CONSTRUCTS ---------------- */

            case "constructs":

                setAnimation(
                    "bones",
                    550
                );


                for (
                    let i = 0;
                    i < 3;
                    i++
                ) {
                    constructs.push({
                        x:
                            clamp(
                                target.x +
                                (i - 1) * 75,

                                arena.left + 20,
                                arena.right - 20
                            ),

                        y:
                            arena.top + 25,

                        created: now(),

                        expires:
                            now() + 4200,

                        nextShot:
                            now() +
                            i * 240,

                        angle:
                            i * 2.1
                    });
                }

                break;


            /* ---------------- GASTER ---------------- */

            case "gaster":

                setAnimation(
                    "eye",
                    700
                );


                effects.push({
                    type: "warning",

                    x: target.x,
                    y: target.y,

                    created: now(),
                    life: 500
                });


                setTimeout(() => {

                    createBeam(
                        target,
                        "gaster",
                        32,
                        24,
                        650
                    );

                }, 500);

                break;


            /* ---------------- FORECAST TRAP ---------------- */

            case "forecastTrap": {

                setAnimation(
                    "eye",
                    500
                );


                const predicted =
                    predictProtagonist(
                        0.7
                    );


                traps.push({
                    x:
                        clamp(
                            predicted.x,
                            arena.left + 15,
                            arena.right - 15
                        ),

                    y:
                        clamp(
                            predicted.y,
                            arena.top + 15,
                            arena.bottom - 15
                        ),

                    radius: 34,

                    created: now(),

                    triggerAt:
                        now() + 900,

                    expires:
                        now() + 1350,

                    damage: 16,

                    triggered: false
                });

                break;
            }


            /* ---------------- CROSSFIRE ---------------- */

            case "crossfire": {

                setAnimation(
                    "bones",
                    650
                );


                const positions = [
                    {
                        x: arena.left,
                        y: target.y
                    },

                    {
                        x: arena.right,
                        y: target.y
                    },

                    {
                        x: target.x,
                        y: arena.top
                    },

                    {
                        x: target.x,
                        y: arena.bottom
                    }
                ];


                positions.forEach(
                    (position, index) => {

                        setTimeout(() => {

                            createPlayerProjectile({
                                x: position.x,
                                y: position.y,

                                targetX:
                                    target.x,

                                targetY:
                                    target.y,

                                speed: 470,

                                radius: 7,
                                damage: 6,

                                type:
                                    "crossfire"
                            });

                        }, index * 90);
                    }
                );

                break;
            }


            /* ---------------- FALSE FUTURE ---------------- */

            case "falseFuture": {

                setAnimation(
                    "eye",
                    700
                );


                const fake = {
                    x:
                        clamp(
                            target.x +
                            random(-90, 90),

                            arena.left + 25,
                            arena.right - 25
                        ),

                    y:
                        clamp(
                            target.y +
                            random(-80, 80),

                            arena.top + 25,
                            arena.bottom - 25
                        )
                };


                effects.push({
                    type: "warning",

                    x: fake.x,
                    y: fake.y,

                    created: now(),
                    life: 700
                });


                setTimeout(() => {

                    const realTarget =
                        predictProtagonist(
                            0.35
                        );


                    effects.push({
                        type: "realWarning",

                        x: realTarget.x,
                        y: realTarget.y,

                        created: now(),
                        life: 180
                    });


                    setTimeout(() => {

                        createBeam(
                            realTarget,
                            "falseFuture",
                            26,
                            20,
                            500
                        );

                    }, 150);

                }, 650);

                break;
            }


            /* ---------------- INEVITABLE ---------------- */

            case "inevitable":

                inevitableAttack(
                    target
                );

                break;
        }
    }


    /* =====================================================
       INEVITABLE
    ===================================================== */

    function inevitableAttack(target) {
        setAnimation(
            "eye",
            1200
        );


        /*
            Phase-5 attack:
            multiple prediction marks collapse
            onto the final predicted position.
        */

        for (
            let i = 0;
            i < 6;
            i++
        ) {
            setTimeout(() => {

                const prediction =
                    predictProtagonist(
                        0.25 +
                        i * 0.08
                    );


                effects.push({
                    type:
                        "inevitableMark",

                    x:
                        prediction.x,

                    y:
                        prediction.y,

                    created: now(),

                    life:
                        900 -
                        i * 70
                });

            }, i * 110);
        }


        setTimeout(() => {

            const finalTarget =
                predictProtagonist(
                    0.35
                );


            /*
                Four beams converge.
            */

            const origins = [
                {
                    x: arena.left,
                    y: arena.top
                },

                {
                    x: arena.right,
                    y: arena.top
                },

                {
                    x: arena.left,
                    y: arena.bottom
                },

                {
                    x: arena.right,
                    y: arena.bottom
                }
            ];


            origins.forEach(
                origin => {

                    beams.push({
                        x1: origin.x,
                        y1: origin.y,

                        x2: finalTarget.x,
                        y2: finalTarget.y,

                        width: 18,
                        damage: 8,

                        type: "inevitable",

                        created: now(),
                        activeAt:
                            now() + 180,

                        expires:
                            now() + 620,

                        hit: false
                    });
                }
            );

        }, 850);
    }


    /* =====================================================
       BEAMS
    ===================================================== */

    function createBeam(
        target,
        type,
        beamWidth,
        damage,
        duration
    ) {
        beams.push({
            x1: forecast.x,
            y1: forecast.y + 10,

            x2: target.x,
            y2: target.y,

            width: beamWidth,
            damage,

            type,

            created: now(),

            activeAt:
                now() + 180,

            expires:
                now() +
                duration,

            hit: false
        });
    }


    /* =====================================================
       EYES
    ===================================================== */

    function useEye(
        name,
        target
    ) {
        if (
            turn !== "FORECAST" ||
            battleEnded
        ) {
            return;
        }


        const time = now();

        target =
            sanitizeTarget(target);


        setAnimation(
            "eye",
            500
        );


        switch (name) {

            case "RED EYE":

                protagonist.frozenUntil =
                    time + 1300;

                effects.push({
                    type: "eyeTarget",
                    x: target.x,
                    y: target.y,
                    created: time,
                    life: 500
                });

                break;


            case "BLACK EYE":

                eyeEffects.blackEyeUntil =
                    time + 2200;

                break;


            case "HEROISM":

                eyeEffects.heroismUntil =
                    time + 3000;

                break;


            case "EVOLUTION":

                eyeEffects.evolutionUntil =
                    time + 4500;

                forecast.evolution =
                    clamp(
                        forecast.evolution +
                        0.2,
                        0,
                        0.65
                    );

                break;


            case "DEADLOCK":

                protagonist.deadlockedUntil =
                    time + 1800;

                effects.push({
                    type: "deadlock",
                    x: target.x,
                    y: target.y,
                    created: time,
                    life: 1800
                });

                break;


            case "NULL":

                /*
                    Remove hostile projectiles
                    already on screen.
                */

                enemyProjectiles.length = 0;

                effects.push({
                    type: "nullBurst",
                    x: forecast.x,
                    y: forecast.y,
                    created: time,
                    life: 450
                });

                break;


            case "PARADOX":

                eyeEffects.paradoxUntil =
                    time + 3500;

                break;


            case "OBSERVE":

                eyeEffects.observeUntil =
                    time + 5000;

                forecast.observation =
                    clamp(
                        forecast.observation +
                        0.18,
                        0,
                        0.5
                    );

                break;


            case "VECTOR":

                eyeEffects.vectorUntil =
                    time + 3000;

                /*
                    Push existing hostile
                    projectiles sideways.
                */

                for (
                    const projectile of
                    enemyProjectiles
                ) {
                    const oldVX =
                        projectile.vx;

                    projectile.vx =
                        -projectile.vy;

                    projectile.vy =
                        oldVX;
                }

                break;


            case "MOMENT":

                eyeEffects.momentUntil =
                    time + 2500;

                break;
        }
    }


    /* =====================================================
       FORECAST ABILITIES
    ===================================================== */

    function useForecastAbility(
        name,
        target
    ) {
        if (
            turn !== "FORECAST" ||
            battleEnded
        ) {
            return false;
        }


        target =
            sanitizeTarget(target);


        switch (
            String(name)
                .toUpperCase()
        ) {

            case "PREDICT":

                forecast.prediction =
                    clamp(
                        forecast.prediction +
                        0.15,
                        0,
                        0.45
                    );


                effects.push({
                    type: "prediction",

                    x:
                        predictProtagonist(
                            0.45
                        ).x,

                    y:
                        predictProtagonist(
                            0.45
                        ).y,

                    created: now(),
                    life: 1300
                });

                setAnimation(
                    "eye",
                    400
                );

                return true;


            case "DEEP FORECAST":

                forecast.prediction =
                    clamp(
                        forecast.prediction +
                        0.25,
                        0,
                        0.65
                    );


                forecast.stamina =
                    clamp(
                        forecast.stamina + 18,
                        0,
                        MAX_STAMINA
                    );


                effects.push({
                    type: "prediction",

                    x:
                        predictProtagonist(
                            0.7
                        ).x,

                    y:
                        predictProtagonist(
                            0.7
                        ).y,

                    created: now(),
                    life: 1800
                });

                setAnimation(
                    "eye",
                    500
                );

                return true;


            case "ABSOLUTE FORECAST":

                forecast.prediction =
                    0.75;

                forecast.stamina =
                    clamp(
                        forecast.stamina + 30,
                        0,
                        MAX_STAMINA
                    );


                effects.push({
                    type:
                        "absoluteForecast",

                    x: target.x,
                    y: target.y,

                    created: now(),
                    life: 2200
                });

                setAnimation(
                    "phase_change",
                    650
                );

                return true;
        }


        return false;
    }


    /* =====================================================
       TARGET SANITIZER
    ===================================================== */

    function sanitizeTarget(target) {
        if (
            !target ||
            !Number.isFinite(target.x) ||
            !Number.isFinite(target.y)
        ) {
            return {
                x: protagonist.x,
                y: protagonist.y
            };
        }


        return {
            x:
                clamp(
                    target.x,
                    arena.left,
                    arena.right
                ),

            y:
                clamp(
                    target.y,
                    arena.top,
                    arena.bottom
                )
        };
    }


    /* =====================================================
       PLAYER PROJECTILES
    ===================================================== */

    function updatePlayerProjectiles(
        dt,
        time
    ) {
        for (
            let i =
                playerProjectiles.length - 1;

            i >= 0;

            i--
        ) {
            const projectile =
                playerProjectiles[i];


            projectile.x +=
                projectile.vx *
                dt;

            projectile.y +=
                projectile.vy *
                dt;


            if (
                time -
                projectile.created >
                projectile.life
            ) {
                playerProjectiles.splice(
                    i,
                    1
                );

                continue;
            }


            if (
                distance(
                    projectile.x,
                    projectile.y,
                    protagonist.x,
                    protagonist.y
                ) <=
                projectile.radius +
                protagonist.radius
            ) {
                damageProtagonist(
                    projectile.damage
                );


                playerProjectiles.splice(
                    i,
                    1
                );

                continue;
            }


            if (
                projectile.x <
                    arena.left - 100 ||
                projectile.x >
                    arena.right + 100 ||
                projectile.y >
                    arena.bottom + 100 ||
                projectile.y <
                    forecast.y - 120
            ) {
                playerProjectiles.splice(
                    i,
                    1
                );
            }
        }
    }


    /* =====================================================
       BONE WALLS
    ===================================================== */

    function updateBoneWalls(
        dt,
        time
    ) {
        for (
            let i =
                boneWalls.length - 1;

            i >= 0;

            i--
        ) {
            const wall =
                boneWalls[i];


            if (
                time <
                wall.created
            ) {
                continue;
            }


            wall.height =
                Math.min(
                    wall.targetHeight,
                    wall.height +
                    220 * dt
                );


            if (
                !wall.hit &&
                protagonist.x >
                    wall.x -
                    wall.width -
                    protagonist.radius &&
                protagonist.x <
                    wall.x +
                    wall.width +
                    protagonist.radius &&
                protagonist.y >
                    arena.bottom -
                    wall.height -
                    protagonist.radius
            ) {
                wall.hit = true;

                damageProtagonist(
                    wall.damage
                );
            }


            if (
                time -
                wall.created >
                wall.life
            ) {
                boneWalls.splice(
                    i,
                    1
                );
            }
        }
    }


    /* =====================================================
       CONSTRUCTS
    ===================================================== */

    function updateConstructs(
        dt,
        time
    ) {
        for (
            let i =
                constructs.length - 1;

            i >= 0;

            i--
        ) {
            const construct =
                constructs[i];


            if (
                time >
                construct.expires
            ) {
                constructs.splice(
                    i,
                    1
                );

                continue;
            }


            construct.angle +=
                dt * 1.8;


            if (
                time >
                construct.nextShot
            ) {
                construct.nextShot =
                    time + 650;


                const predicted =
                    predictProtagonist(
                        0.18
                    );


                createPlayerProjectile({
                    x: construct.x,
                    y: construct.y,

                    targetX:
                        predicted.x,

                    targetY:
                        predicted.y,

                    speed: 390,
                    radius: 5,
                    damage: 5,

                    type:
                        "construct"
                });
            }
        }
    }


    /* =====================================================
       TRAPS
    ===================================================== */

    function updateTraps(time) {
        for (
            let i =
                traps.length - 1;

            i >= 0;

            i--
        ) {
            const trap =
                traps[i];


            if (
                !trap.triggered &&
                time >=
                trap.triggerAt
            ) {
                trap.triggered =
                    true;


                if (
                    distance(
                        trap.x,
                        trap.y,
                        protagonist.x,
                        protagonist.y
                    ) <
                    trap.radius +
                    protagonist.radius
                ) {
                    damageProtagonist(
                        trap.damage
                    );
                }
            }


            if (
                time >
                trap.expires
            ) {
                traps.splice(
                    i,
                    1
                );
            }
        }
    }


    /* =====================================================
       BEAMS
    ===================================================== */

    function updateBeams(time) {
        for (
            let i =
                beams.length - 1;

            i >= 0;

            i--
        ) {
            const beam =
                beams[i];


            if (
                time >
                beam.expires
            ) {
                beams.splice(
                    i,
                    1
                );

                continue;
            }


            if (
                time <
                beam.activeAt ||
                beam.hit
            ) {
                continue;
            }


            const d =
                pointToSegmentDistance(
                    protagonist.x,
                    protagonist.y,

                    beam.x1,
                    beam.y1,

                    beam.x2,
                    beam.y2
                );


            if (
                d <=
                beam.width / 2 +
                protagonist.radius
            ) {
                beam.hit = true;

                damageProtagonist(
                    beam.damage
                );
            }
        }
    }


    /* =====================================================
       SLASHES
    ===================================================== */

    function updateSlashes(time) {
        for (
            let i =
                slashes.length - 1;

            i >= 0;

            i--
        ) {
            const slash =
                slashes[i];


            const age =
                time -
                slash.created;


            if (
                age >
                slash.life
            ) {
                slashes.splice(
                    i,
                    1
                );

                continue;
            }


            if (
                slash.hit
            ) continue;


            const dx =
                protagonist.x -
                slash.x;

            const dy =
                protagonist.y -
                slash.y;

            const d =
                Math.hypot(
                    dx,
                    dy
                );


            if (
                d >
                slash.radius +
                protagonist.radius
            ) {
                continue;
            }


            const targetAngle =
                Math.atan2(
                    dy,
                    dx
                );


            let difference =
                Math.atan2(
                    Math.sin(
                        targetAngle -
                        slash.angle
                    ),

                    Math.cos(
                        targetAngle -
                        slash.angle
                    )
                );


            if (
                Math.abs(
                    difference
                ) < 0.75
            ) {
                slash.hit = true;

                damageProtagonist(
                    slash.damage
                );
            }
        }
    }


    /* =====================================================
       DAMAGE PROTAGONIST
    ===================================================== */

    function damageProtagonist(
        amount
    ) {
        const time = now();


        if (
            time <
            protagonist.invulnerableUntil
        ) {
            return;
        }


        protagonist.invulnerableUntil =
            time + 180;


        let multiplier = 1;


        if (
            eyeEffects.heroismUntil >
            time
        ) {
            multiplier *= 1.25;
        }


        protagonist.hp =
            Math.max(
                0,
                protagonist.hp -
                amount *
                multiplier
            );


        effects.push({
            type: "enemyHit",

            x: protagonist.x,
            y: protagonist.y,

            created: time,
            life: 220
        });


        if (
            protagonist.hp <= 0
        ) {
            battleEnded = true;

            emitMessage(
                "PROTAGONIST DEFEATED"
            );
        }


        emitStatus();
    }


    /* =====================================================
       ENEMY TURN
    ===================================================== */

    function updateEnemyTurn(
        dt,
        time
    ) {
        if (
            eyeEffects.momentUntil >
            time
        ) {
            return;
        }


        enemyAttackTimer -= dt;


        if (
            enemyAttackTimer <= 0
        ) {
            enemyAttackTimer =
                random(
                    0.42,
                    0.75
                );


            spawnEnemyAttack(
                time
            );
        }
    }


    function spawnEnemyAttack(time) {
        const pattern =
            Math.floor(
                random(0, 4)
            );


        switch (pattern) {

            /*
                Direct shot
            */

            case 0:

                enemyShot(
                    protagonist.x,
                    protagonist.y,
                    forecast.x,
                    forecast.y,
                    280,
                    6
                );

                break;


            /*
                Three-shot spread
            */

            case 1: {

                const base =
                    Math.atan2(
                        forecast.y -
                        protagonist.y,

                        forecast.x -
                        protagonist.x
                    );


                for (
                    let i = -1;
                    i <= 1;
                    i++
                ) {
                    const angle =
                        base +
                        i * 0.16;


                    enemyProjectiles.push({
                        x: protagonist.x,
                        y: protagonist.y,

                        vx:
                            Math.cos(angle) *
                            245,

                        vy:
                            Math.sin(angle) *
                            245,

                        radius: 6,

                        created: time,
                        life: 3000
                    });
                }

                break;
            }


            /*
                Side attack
            */

            case 2:

                enemyShot(
                    arena.left,
                    forecast.y,
                    forecast.x,
                    forecast.y,
                    330,
                    7
                );

                enemyShot(
                    arena.right,
                    forecast.y,
                    forecast.x,
                    forecast.y,
                    330,
                    7
                );

                break;


            /*
                Predictive shot
            */

            case 3: {

                const side =
                    Math.random() <
                    0.5
                        ? -28
                        : 28;


                enemyShot(
                    protagonist.x,
                    protagonist.y,

                    forecast.x + side,
                    forecast.y,

                    360,
                    7
                );

                break;
            }
        }
    }


    function enemyShot(
        x,
        y,
        targetX,
        targetY,
        speed,
        radius
    ) {
        const direction =
            normalizeVector(
                targetX - x,
                targetY - y
            );


        enemyProjectiles.push({
            x,
            y,

            vx:
                direction.x *
                speed,

            vy:
                direction.y *
                speed,

            radius,

            created: now(),
            life: 3200
        });
    }


    /* =====================================================
       ENEMY PROJECTILES
    ===================================================== */

    function updateEnemyProjectiles(
        dt,
        time
    ) {
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
                dt;

            projectile.y +=
                projectile.vy *
                dt;


            if (
                time -
                projectile.created >
                projectile.life
            ) {
                enemyProjectiles.splice(
                    i,
                    1
                );

                continue;
            }


            if (
                distance(
                    projectile.x,
                    projectile.y,
                    forecast.x,
                    forecast.y
                ) <=
                projectile.radius +
                forecast.radius
            ) {
                resolveForecastHit(
                    projectile,
                    time
                );


                enemyProjectiles.splice(
                    i,
                    1
                );
            }
        }
    }


    /* =====================================================
       FORECAST AUTO-DODGE

       CRITICAL:
       Forecast's x/y are NEVER changed here.
    ===================================================== */

    function resolveForecastHit(
        projectile,
        time
    ) {
        if (
            time <
            forecast.invulnerableUntil
        ) {
            return;
        }


        let cost =
            BASE_DODGE_COST +
            forecast.dodgeChain *
            1.7;


        cost *=
            1 -
            forecast.prediction;


        cost *=
            1 -
            forecast.observation;


        cost *=
            1 -
            forecast.evolution;


        if (
            eyeEffects.evolutionUntil >
            time
        ) {
            cost *= 0.72;
        }


        if (
            eyeEffects.observeUntil >
            time
        ) {
            cost *= 0.78;
        }


        cost =
            clamp(
                cost,
                3,
                27
            );


        if (
            forecast.stamina >=
            cost
        ) {
            forecast.stamina -=
                cost;

            forecast.dodgeChain++;


            /*
                Again:
                NO x/y movement.
            */

            const horizontal =
                projectile.vx >= 0
                    ? "dodge_left"
                    : "dodge_right";


            const dodgeAnimation =
                Math.random() < 0.25
                    ? (
                        Math.random() < 0.5
                            ? "dodge_up"
                            : "dodge_down"
                    )
                    : horizontal;


            setAnimation(
                dodgeAnimation,
                220
            );


            forecast.invulnerableUntil =
                time + 180;


            forecast.afterimages.push({
                frame:
                    getAnimationFrame(
                        time
                    ),

                offsetX:
                    projectile.vx >= 0
                        ? -18
                        : 18,

                offsetY:
                    random(-4, 4),

                created: time
            });


            effects.push({
                type: "dodge",

                x: forecast.x,
                y: forecast.y,

                created: time,
                life: 240
            });


            return;
        }


        /*
            No stamina:
            protagonist attack lands.
        */

        forecast.dodgeChain = 0;

        forecast.stamina =
            Math.max(
                0,
                forecast.stamina
            );


        setAnimation(
            "hit",
            280
        );


        forecast.invulnerableUntil =
            time + 950;


        if (
            typeof ForecastPhases !==
            "undefined"
        ) {
            const result =
                ForecastPhases
                    .confirmedHit();


            if (
                result.reason ===
                "final-phase"
            ) {
                emitMessage(
                    "Phase 5 holds."
                );


                enemyProjectiles.length =
                    0;

                return;
            }


            if (
                result.advanced
            ) {
                setAnimation(
                    "phase_change",
                    750
                );


                enemyProjectiles.length =
                    0;


                forecast.stamina =
                    Math.max(
                        forecast.stamina,
                        34
                    );
            }
        }


        emitStatus();
    }


    /* =====================================================
       STAMINA
    ===================================================== */

    function updateStamina(
        dt,
        time
    ) {
        let regen =
            turn === "FORECAST"
                ? FORECAST_REGEN
                : ENEMY_REGEN;


        if (
            eyeEffects.heroismUntil >
            time
        ) {
            regen *= 1.3;
        }


        forecast.stamina =
            clamp(
                forecast.stamina +
                regen * dt,

                0,
                MAX_STAMINA
            );


        /*
            Dodge-chain pressure slowly
            disappears when attacks stop.
        */

        forecast.dodgeChain =
            Math.max(
                0,
                forecast.dodgeChain -
                dt * 0.65
            );
    }


    /* =====================================================
       TURN SYSTEM
    ===================================================== */

    function updateTurn(time) {
        const duration =
            turn === "FORECAST"
                ? FORECAST_TURN_TIME
                : ENEMY_TURN_TIME;


        if (
            time -
            turnStarted <
            duration
        ) {
            return;
        }


        if (
            turn === "FORECAST"
        ) {
            turn = "PROTAGONIST";

            enemyAttackTimer = 0.25;

            emitMessage(
                "PROTAGONIST TURN"
            );
        }
        else {
            turn = "FORECAST";

            enemyProjectiles.length =
                0;

            forecast.dodgeChain = 0;

            emitMessage(
                "FORECAST TURN"
            );
        }


        turnStarted = time;

        emitStatus();
    }


    /* =====================================================
       EFFECT CLEANUP
    ===================================================== */

    function updateEffects(time) {
        for (
            let i =
                effects.length - 1;

            i >= 0;

            i--
        ) {
            if (
                time -
                effects[i].created >
                effects[i].life
            ) {
                effects.splice(
                    i,
                    1
                );
            }
        }


        for (
            let i =
                forecast.afterimages.length -
                1;

            i >= 0;

            i--
        ) {
            if (
                time -
                forecast.afterimages[i]
                    .created >
                280
            ) {
                forecast.afterimages.splice(
                    i,
                    1
                );
            }
        }
    }


    /* =====================================================
       COLLISION HELPER
    ===================================================== */

    function pointToSegmentDistance(
        px,
        py,
        x1,
        y1,
        x2,
        y2
    ) {
        const dx =
            x2 - x1;

        const dy =
            y2 - y1;


        if (
            dx === 0 &&
            dy === 0
        ) {
            return distance(
                px,
                py,
                x1,
                y1
            );
        }


        const t =
            clamp(
                (
                    (px - x1) * dx +
                    (py - y1) * dy
                ) /
                (
                    dx * dx +
                    dy * dy
                ),

                0,
                1
            );


        const x =
            x1 + t * dx;

        const y =
            y1 + t * dy;


        return distance(
            px,
            py,
            x,
            y
        );
    }


    /* =====================================================
       DRAW BACKGROUND / ARENA
    ===================================================== */

    function drawBackground(time) {
        ctx.fillStyle = "#050505";

        ctx.fillRect(
            0,
            0,
            width,
            height
        );


        if (
            eyeEffects.blackEyeUntil >
            time
        ) {
            ctx.save();

            ctx.globalAlpha = 0.18;

            ctx.fillStyle = "#ff2020";

            ctx.fillRect(
                0,
                0,
                width,
                height
            );

            ctx.restore();
        }
    }


    function drawArena() {
        ctx.save();

        ctx.strokeStyle = "#ffffff";

        ctx.lineWidth = 3;

        ctx.strokeRect(
            arena.left,
            arena.top,
            arena.width,
            arena.height
        );

        ctx.restore();
    }


    /* =====================================================
       DRAW PROTAGONIST
    ===================================================== */

    function drawProtagonist(time) {
        ctx.save();


        if (
            time <
            protagonist.invulnerableUntil &&
            Math.floor(time / 45) % 2 === 0
        ) {
            ctx.globalAlpha = 0.35;
        }


        /*
            Heart-style protagonist.
        */

        ctx.translate(
            protagonist.x,
            protagonist.y
        );


        ctx.fillStyle = "#ff2020";

        ctx.beginPath();

        ctx.moveTo(
            0,
            9
        );

        ctx.bezierCurveTo(
            -16,
            -2,
            -10,
            -14,
            0,
            -7
        );

        ctx.bezierCurveTo(
            10,
            -14,
            16,
            -2,
            0,
            9
        );

        ctx.fill();


        ctx.restore();
    }


    /* =====================================================
       DRAW PLAYER PROJECTILES
    ===================================================== */

    function drawPlayerProjectiles() {
        for (
            const projectile of
            playerProjectiles
        ) {
            ctx.save();


            switch (
                projectile.type
            ) {

                case "glock":

                    drawBullet(
                        projectile,
                        11,
                        3
                    );

                    break;


                case "smg":

                    drawBullet(
                        projectile,
                        7,
                        2
                    );

                    break;


                case "ar":

                    drawBullet(
                        projectile,
                        15,
                        4
                    );

                    break;


                case "dmr":

                    drawBullet(
                        projectile,
                        24,
                        4
                    );

                    break;


                case "pellet":

                    ctx.fillStyle =
                        "#ffffff";

                    ctx.fillRect(
                        projectile.x - 2,
                        projectile.y - 2,
                        4,
                        4
                    );

                    break;


                case "bone":

                    drawBone(
                        projectile.x,
                        projectile.y,
                        projectile.vx,
                        projectile.vy
                    );

                    break;


                case "crossfire":

                    drawBone(
                        projectile.x,
                        projectile.y,
                        projectile.vx,
                        projectile.vy
                    );

                    break;


                case "construct": {
                    const a = Math.atan2(projectile.vy, projectile.vx);
                    ctx.translate(projectile.x, projectile.y);
                    ctx.rotate(a);
                    ctx.strokeStyle = "#ff2020";
                    ctx.fillStyle = "#090909";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(8,0); ctx.lineTo(0,-6); ctx.lineTo(-8,0); ctx.lineTo(0,6); ctx.closePath();
                    ctx.fill(); ctx.stroke();
                    break;
                }


                case "illusionShot":

                    ctx.globalAlpha =
                        0.75;

                    drawBullet(
                        projectile,
                        18,
                        3
                    );

                    break;


                default:

                    ctx.fillStyle =
                        "#fff";

                    ctx.beginPath();

                    ctx.arc(
                        projectile.x,
                        projectile.y,
                        projectile.radius,
                        0,
                        TAU
                    );

                    ctx.fill();
            }


            ctx.restore();
        }
    }


    function drawBullet(
        projectile,
        length,
        thickness
    ) {
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


        /*
            Red trail.
        */

        ctx.fillStyle =
            "rgba(255,32,32,.45)";

        ctx.fillRect(
            -length * 1.6,
            -thickness / 2,
            length * 1.6,
            thickness
        );


        /*
            White projectile.
        */

        ctx.fillStyle = "#ffffff";

        ctx.fillRect(
            -length / 2,
            -thickness / 2,
            length,
            thickness
        );
    }


    function drawBone(
        x,
        y,
        vx,
        vy
    ) {
        const angle =
            Math.atan2(
                vy,
                vx
            );


        ctx.translate(
            x,
            y
        );

        ctx.rotate(angle);


        ctx.fillStyle = "#fff";


        /*
            Bone shaft.
        */

        ctx.fillRect(
            -11,
            -3,
            22,
            6
        );


        /*
            Bone ends.
        */

        ctx.fillRect(
            -14,
            -6,
            6,
            5
        );

        ctx.fillRect(
            -14,
            1,
            6,
            5
        );

        ctx.fillRect(
            8,
            -6,
            6,
            5
        );

        ctx.fillRect(
            8,
            1,
            6,
            5
        );
    }


    /* =====================================================
       DRAW ENEMY PROJECTILES
    ===================================================== */

    function drawEnemyProjectiles() {
        for (
            const projectile of
            enemyProjectiles
        ) {
            ctx.save();

            ctx.fillStyle =
                "#ffffff";

            ctx.strokeStyle =
                "#ff2020";

            ctx.lineWidth = 2;


            ctx.beginPath();

            ctx.arc(
                projectile.x,
                projectile.y,
                projectile.radius,
                0,
                TAU
            );

            ctx.fill();
            ctx.stroke();

            ctx.restore();
        }
    }


    /* =====================================================
       DRAW BONE WALLS
    ===================================================== */

    function drawBoneWalls(time) {
        for (
            const wall of
            boneWalls
        ) {
            if (
                time <
                wall.created
            ) continue;


            ctx.save();

            ctx.fillStyle = "#fff";


            ctx.fillRect(
                wall.x -
                    wall.width / 2,

                arena.bottom -
                    wall.height,

                wall.width,
                wall.height
            );


            ctx.fillRect(
                wall.x -
                    wall.width,

                arena.bottom -
                    wall.height,

                wall.width * 2,
                6
            );


            ctx.restore();
        }
    }


    /* =====================================================
       DRAW CONSTRUCTS
    ===================================================== */

    function drawConstructs(time) {
        for (
            const construct of
            constructs
        ) {
            ctx.save();

            ctx.translate(
                construct.x,
                construct.y
            );

            ctx.rotate(
                construct.angle
            );


            ctx.strokeStyle =
                "#ff2020";

            ctx.fillStyle =
                "#080808";

            ctx.lineWidth = 2;


            ctx.beginPath();

            ctx.moveTo(
                0,
                -13
            );

            ctx.lineTo(
                12,
                10
            );

            ctx.lineTo(
                -12,
                10
            );

            ctx.closePath();

            ctx.fill();
            ctx.stroke();


            ctx.restore();
        }
    }


    /* =====================================================
       DRAW TRAPS
    ===================================================== */

    function drawTraps(time) {
        for (
            const trap of
            traps
        ) {
            ctx.save();


            const pulse =
                1 +
                Math.sin(
                    time / 70
                ) * 0.1;


            ctx.strokeStyle =
                trap.triggered
                    ? "#ffffff"
                    : "#ff2020";

            ctx.lineWidth = 2;


            ctx.beginPath();

            ctx.arc(
                trap.x,
                trap.y,

                trap.radius *
                pulse,

                0,
                TAU
            );

            ctx.stroke();


            ctx.beginPath();

            ctx.moveTo(
                trap.x -
                    trap.radius,
                trap.y
            );

            ctx.lineTo(
                trap.x +
                    trap.radius,
                trap.y
            );

            ctx.moveTo(
                trap.x,
                trap.y -
                    trap.radius
            );

            ctx.lineTo(
                trap.x,
                trap.y +
                    trap.radius
            );

            ctx.stroke();


            ctx.restore();
        }
    }


    /* =====================================================
       DRAW BEAMS
    ===================================================== */

    function drawBeams(time) {
        for (
            const beam of
            beams
        ) {
            ctx.save();


            if (
                time <
                beam.activeAt
            ) {
                ctx.globalAlpha =
                    0.55;

                ctx.strokeStyle =
                    "#ff2020";

                ctx.lineWidth = 2;
            }
            else {
                ctx.strokeStyle =
                    "#ffffff";

                ctx.lineWidth =
                    beam.width;


                ctx.shadowBlur = 18;

                ctx.shadowColor =
                    "#ff2020";
            }


            ctx.beginPath();

            ctx.moveTo(
                beam.x1,
                beam.y1
            );

            ctx.lineTo(
                beam.x2,
                beam.y2
            );

            ctx.stroke();


            ctx.restore();
        }
    }


    /* =====================================================
       DRAW SLASHES
    ===================================================== */

    function drawSlashes(time) {
        for (
            const slash of
            slashes
        ) {
            const progress =
                clamp(
                    (
                        time -
                        slash.created
                    ) /
                    slash.life,

                    0,
                    1
                );


            ctx.save();

            ctx.strokeStyle =
                "#ff2020";

            ctx.lineWidth =
                slash.width *
                (1 - progress * 0.55);


            ctx.shadowBlur = 14;

            ctx.shadowColor =
                "#ff2020";


            ctx.beginPath();

            ctx.arc(
                slash.x,
                slash.y,
                slash.radius,

                slash.angle -
                    0.9,

                slash.angle +
                    0.9
            );

            ctx.stroke();


            ctx.restore();
        }
    }


    /* =====================================================
       DRAW EFFECTS
    ===================================================== */

    function drawEffects(time) {
        for (
            const effect of
            effects
        ) {
            const progress =
                clamp(
                    (
                        time -
                        effect.created
                    ) /
                    effect.life,

                    0,
                    1
                );


            ctx.save();


            switch (
                effect.type
            ) {

                case "muzzleFlash": {
                    ctx.globalAlpha = 1 - progress;
                    ctx.translate(effect.x, effect.y);
                    ctx.rotate(effect.angle || 0);
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, -2, 10 + progress * 9, 4);
                    ctx.fillStyle = "#ff2020";
                    ctx.fillRect(2, -4, 6, 8);
                    break;
                }

                case "aimLine":

                    ctx.globalAlpha =
                        1 - progress;

                    ctx.strokeStyle =
                        "#ff2020";

                    ctx.lineWidth = 2;

                    ctx.beginPath();

                    ctx.moveTo(
                        effect.x1,
                        effect.y1
                    );

                    ctx.lineTo(
                        effect.x2,
                        effect.y2
                    );

                    ctx.stroke();

                    break;


                case "warning":
                case "realWarning":

                    ctx.globalAlpha =
                        1 - progress;

                    ctx.strokeStyle =
                        effect.type ===
                        "warning"
                            ? "#ff2020"
                            : "#ffffff";

                    ctx.lineWidth = 2;

                    ctx.beginPath();

                    ctx.arc(
                        effect.x,
                        effect.y,
                        28 +
                        progress * 15,
                        0,
                        TAU
                    );

                    ctx.stroke();

                    break;


                case "illusion":

                    ctx.globalAlpha =
                        (1 - progress) *
                        0.5;

                    ctx.fillStyle =
                        "#ff2020";

                    ctx.fillRect(
                        effect.x - 9,
                        effect.y - 16,
                        18,
                        32
                    );

                    break;


                case "prediction":
                case "inevitableMark":

                    ctx.globalAlpha =
                        1 - progress;

                    ctx.strokeStyle =
                        "#ff2020";

                    ctx.lineWidth = 2;

                    ctx.strokeRect(
                        effect.x - 12,
                        effect.y - 12,
                        24,
                        24
                    );

                    ctx.beginPath();

                    ctx.moveTo(
                        effect.x - 20,
                        effect.y
                    );

                    ctx.lineTo(
                        effect.x + 20,
                        effect.y
                    );

                    ctx.moveTo(
                        effect.x,
                        effect.y - 20
                    );

                    ctx.lineTo(
                        effect.x,
                        effect.y + 20
                    );

                    ctx.stroke();

                    break;


                case "absoluteForecast":

                    ctx.globalAlpha =
                        1 - progress;

                    ctx.strokeStyle =
                        "#ffffff";

                    ctx.lineWidth = 2;

                    for (
                        let i = 0;
                        i < 4;
                        i++
                    ) {
                        ctx.beginPath();

                        ctx.arc(
                            effect.x,
                            effect.y,

                            25 +
                            i * 15 +
                            progress * 25,

                            0,
                            TAU
                        );

                        ctx.stroke();
                    }

                    break;


                case "eyeTarget":
                case "deadlock":

                    ctx.globalAlpha =
                        1 - progress;

                    ctx.strokeStyle =
                        "#ff2020";

                    ctx.lineWidth = 2;

                    ctx.beginPath();

                    ctx.arc(
                        effect.x,
                        effect.y,
                        20,
                        0,
                        TAU
                    );

                    ctx.stroke();

                    break;


                case "nullBurst":

                    ctx.globalAlpha =
                        1 - progress;

                    ctx.strokeStyle =
                        "#ffffff";

                    ctx.lineWidth = 4;

                    ctx.beginPath();

                    ctx.arc(
                        effect.x,
                        effect.y,
                        progress * 130,
                        0,
                        TAU
                    );

                    ctx.stroke();

                    break;


                case "enemyHit":

                    ctx.globalAlpha =
                        1 - progress;

                    ctx.strokeStyle =
                        "#ffffff";

                    ctx.lineWidth = 3;

                    ctx.beginPath();

                    ctx.moveTo(
                        effect.x - 14,
                        effect.y - 14
                    );

                    ctx.lineTo(
                        effect.x + 14,
                        effect.y + 14
                    );

                    ctx.moveTo(
                        effect.x + 14,
                        effect.y - 14
                    );

                    ctx.lineTo(
                        effect.x - 14,
                        effect.y + 14
                    );

                    ctx.stroke();

                    break;


                case "dodge":

                    ctx.globalAlpha =
                        1 - progress;

                    ctx.strokeStyle =
                        "#ff2020";

                    ctx.lineWidth = 2;

                    ctx.beginPath();

                    ctx.arc(
                        effect.x,
                        effect.y,
                        28 +
                        progress * 22,
                        0,
                        TAU
                    );

                    ctx.stroke();

                    break;
            }


            ctx.restore();
        }
    }


    /* =====================================================
       DRAW TARGET PREDICTION

       game.js can set aim preview.
    ===================================================== */

    let aimPreview = null;


    function setAimPreview(target) {
        if (!target) {
            aimPreview = null;
            return;
        }


        aimPreview =
            sanitizeTarget(target);
    }


    function drawAimPreview(time) {
        if (
            !aimPreview ||
            turn !== "FORECAST"
        ) {
            return;
        }


        ctx.save();


        ctx.setLineDash(
            [6, 6]
        );

        ctx.strokeStyle =
            "rgba(255,255,255,.7)";

        ctx.lineWidth = 1.5;


        ctx.beginPath();

        ctx.moveTo(
            forecast.x,
            forecast.y + 15
        );

        ctx.lineTo(
            aimPreview.x,
            aimPreview.y
        );

        ctx.stroke();


        ctx.setLineDash([]);


        ctx.strokeStyle =
            "#ff2020";

        ctx.lineWidth = 2;


        const pulse =
            11 +
            Math.sin(
                time / 80
            ) * 2;


        ctx.beginPath();

        ctx.arc(
            aimPreview.x,
            aimPreview.y,
            pulse,
            0,
            TAU
        );

        ctx.stroke();


        ctx.beginPath();

        ctx.moveTo(
            aimPreview.x - 17,
            aimPreview.y
        );

        ctx.lineTo(
            aimPreview.x + 17,
            aimPreview.y
        );

        ctx.moveTo(
            aimPreview.x,
            aimPreview.y - 17
        );

        ctx.lineTo(
            aimPreview.x,
            aimPreview.y + 17
        );

        ctx.stroke();


        ctx.restore();
    }


    /* =====================================================
       RENDER
    ===================================================== */

    function render(time) {
        drawBackground(time);

        drawArena();

        drawEffects(time);

        drawTraps(time);

        drawBoneWalls(time);

        drawConstructs(time);

        drawPlayerProjectiles();

        drawEnemyProjectiles();

        drawBeams(time);

        drawSlashes(time);

        drawAimPreview(time);

        drawProtagonist(time);

        drawForecast(time);
    }


    /* =====================================================
       UPDATE
    ===================================================== */

    function update(
        dt,
        time
    ) {
        if (
            battleEnded
        ) {
            updateAnimation(time);
            updateEffects(time);

            return;
        }


        updateTurn(time);

        updateProtagonist(
            dt,
            time
        );

        updateStamina(
            dt,
            time
        );

        updateAnimation(
            time
        );

        updateEffects(
            time
        );

        updatePlayerProjectiles(
            dt,
            time
        );

        updateBoneWalls(
            dt,
            time
        );

        updateConstructs(
            dt,
            time
        );

        updateTraps(
            time
        );

        updateBeams(
            time
        );

        updateSlashes(
            time
        );


        if (
            turn ===
            "PROTAGONIST"
        ) {
            updateEnemyTurn(
                dt,
                time
            );

            updateEnemyProjectiles(
                dt,
                time
            );
        }
    }


    /* =====================================================
       GAME LOOP
    ===================================================== */

    function loop(time) {
        if (!running) {
            return;
        }


        if (!previousTime) {
            previousTime = time;
        }


        const dt =
            Math.min(
                (
                    time -
                    previousTime
                ) / 1000,

                0.035
            );


        previousTime = time;


        update(
            dt,
            time
        );

        render(
            time
        );


        requestAnimationFrame(
            loop
        );
    }


    /* =====================================================
       EVENTS FROM OTHER MODULES
    ===================================================== */

    function installEvents() {

        window.addEventListener(
            "forecast-weapon-fire",
            event => {

                const detail =
                    event.detail || {};


                useWeapon(
                    detail.attack,
                    detail.target
                );
            }
        );


        window.addEventListener(
            "forecast-technique-activate",
            event => {

                const detail =
                    event.detail || {};


                useTechnique(
                    detail.attack,
                    detail.target
                );
            }
        );


        window.addEventListener(
            "forecast-eye-activate",
            event => {

                const detail =
                    event.detail || {};


                useEye(
                    detail.name,
                    detail.target
                );
            }
        );


        window.addEventListener(
            "forecast-phase-change",
            () => {

                setAnimation(
                    "phase_change",
                    750
                );


                effects.push({
                    type:
                        "nullBurst",

                    x: forecast.x,
                    y: forecast.y,

                    created: now(),
                    life: 650
                });
            }
        );
    }


    /* =====================================================
       RESET
    ===================================================== */

    function reset() {
        battleEnded = false;


        playerProjectiles.length = 0;
        enemyProjectiles.length = 0;

        effects.length = 0;
        boneWalls.length = 0;
        constructs.length = 0;
        traps.length = 0;
        beams.length = 0;
        slashes.length = 0;


        forecast.stamina =
            MAX_STAMINA;

        forecast.invulnerableUntil =
            0;

        forecast.animation =
            "idle";

        forecast.animationStarted =
            0;

        forecast.animationUntil =
            0;

        forecast.dodgeChain = 0;

        forecast.prediction = 0;
        forecast.observation = 0;
        forecast.evolution = 0;

        forecast.afterimages.length =
            0;


        protagonist.hp =
            protagonist.maxHp;

        protagonist.vx = 0;
        protagonist.vy = 0;

        protagonist.frozenUntil = 0;
        protagonist.deadlockedUntil = 0;
        protagonist.invulnerableUntil = 0;

        protagonist.history.length =
            0;


        protagonist.x =
            width * 0.5;

        protagonist.y =
            arena.top +
            arena.height *
            0.55;


        for (
            const key of
            Object.keys(eyeEffects)
        ) {
            eyeEffects[key] = 0;
        }


        aimPreview = null;


        turn = "FORECAST";
        turnStarted = now();

        enemyAttackTimer = 0;


        if (
            typeof ForecastPhases !==
            "undefined"
        ) {
            ForecastPhases.reset();
        }


        emitStatus();
    }


    /* =====================================================
       STATUS
    ===================================================== */

    function getStatus() {
        return {
            turn,

            battleEnded,

            stamina:
                forecast.stamina,

            maxStamina:
                MAX_STAMINA,

            protagonistHP:
                protagonist.hp,

            protagonistMaxHP:
                protagonist.maxHp,

            protagonist: {
                x:
                    protagonist.x,

                y:
                    protagonist.y
            },

            forecast: {
                x:
                    forecast.x,

                y:
                    forecast.y,

                animation:
                    forecast.animation
            },

            arena: {
                left:
                    arena.left,

                top:
                    arena.top,

                right:
                    arena.right,

                bottom:
                    arena.bottom
            }
        };
    }


    /* =====================================================
       INIT
    ===================================================== */

    function init() {
        if (
            initialized
        ) {
            return true;
        }


        canvas =
            document.getElementById(
                "gameCanvas"
            );


        /*
            This is the ONLY absolutely
            required DOM element.

            No more old UI element checks
            crashing the entire game.
        */

        if (!canvas) {
            console.error(
                "ForecastBattle: #gameCanvas not found."
            );

            return false;
        }


        ctx =
            canvas.getContext(
                "2d"
            );


        if (!ctx) {
            console.error(
                "ForecastBattle: Canvas 2D context unavailable."
            );

            return false;
        }


        ctx.imageSmoothingEnabled =
            false;


        resize();


        window.addEventListener(
            "resize",
            resize
        );


        installEvents();


        initialized = true;

        reset();


        running = true;

        previousTime = 0;


        requestAnimationFrame(
            loop
        );


        return true;
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    return {
        init,
        reset,

        getStatus,

        setAimPreview,

        useWeapon,
        useTechnique,
        useEye,
        useForecastAbility
    };

})();