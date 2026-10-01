/* ==========================================================
   FORECAST!SANS — BATTLE ENGINE V0.6
   FULL REBUILD
   "SAME END ANYWAY."
========================================================== */

const Battle = (() => {
"use strict";

/* ==========================================================
   CORE
========================================================== */

let canvas;
let ctx;

let width = 0;
let height = 0;
let dpr = 1;

let running = false;
let lastFrame = 0;
let eventsInstalled = false;

const TURN = Object.freeze({
    FORECAST: "FORECAST",
    PROTAGONIST: "PROTAGONIST",
    TRANSITION: "TRANSITION",
    ENDED: "ENDED"
});

let turn = TURN.FORECAST;
let turnStarted = 0;
let transitionUntil = 0;

const FORECAST_TURN_MS = 8000;
const PROTAGONIST_TURN_MS = 6000;


/* ==========================================================
   ARENA

   Forecast is NOT part of this box.
   The protagonist is.
========================================================== */

const arena = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
};


/* ==========================================================
   FORECAST

   worldX/worldY NEVER change for dodging.
========================================================== */

const forecast = {
    worldX: 0,
    worldY: 0,

    collisionRadius: 22,

    invulnerableUntil: 0,

    stamina: 100,
    maxStamina: 100,

    dodgeChain: 0,
    lastDodgeAt: 0
};


/* ==========================================================
   PROTAGONIST
========================================================== */

const protagonist = {
    x: 0,
    y: 0,

    radius: 10,

    hp: 100,
    maxHp: 100,

    speed: 125,

    targetX: 0,
    targetY: 0,

    nextTargetAt: 0,
    frozenUntil: 0
};


/* ==========================================================
   REAL ANIMATION CONTROLLER
========================================================== */

const Animation = (() => {

    const definitions = {

        idle: {
            frames: ["idle_1", "idle_2", "idle_3"],
            fps: 5,
            loop: true
        },

        blink: {
            frames: ["idle_1", "blink", "idle_1"],
            fps: 9,
            loop: false
        },

        look_down: {
            frames: ["look_down"],
            fps: 1,
            loop: false
        },

        look_up: {
            frames: ["look_up"],
            fps: 1,
            loop: false
        },

        cloak_flow: {
            frames: ["idle_1", "cloak_flow", "idle_2", "cloak_flow"],
            fps: 6,
            loop: true
        },

        dodge_left: {
            frames: ["idle_1", "dodge_left", "dodge_afterimage"],
            fps: 14,
            loop: false
        },

        dodge_right: {
            frames: ["idle_1", "dodge_right", "dodge_afterimage"],
            fps: 14,
            loop: false
        },

        dodge_up: {
            frames: ["idle_1", "dodge_up", "dodge_afterimage"],
            fps: 14,
            loop: false
        },

        dodge_down: {
            frames: ["idle_1", "dodge_down", "dodge_afterimage"],
            fps: 14,
            loop: false
        },

        glock_fire: {
            frames: ["gun_pose", "gun_fire", "gun_pose"],
            fps: 14,
            loop: false
        },

        smg_fire: {
            frames: ["gun_pose", "gun_fire", "gun_pose", "gun_fire"],
            fps: 17,
            loop: false
        },

        ar_fire: {
            frames: ["gun_pose", "gun_fire", "gun_pose"],
            fps: 14,
            loop: false
        },

        dmr_fire: {
            frames: ["gun_pose", "gun_fire", "gun_pose"],
            fps: 11,
            loop: false
        },

        shotgun_fire: {
            frames: ["gun_pose", "gun_fire", "gun_pose"],
            fps: 11,
            loop: false
        },

        bone_control: {
            frames: ["idle_1", "bone_control", "bone_control"],
            fps: 10,
            loop: false
        },

        eye_activate: {
            frames: ["idle_1", "eye_activate", "eye_activate"],
            fps: 9,
            loop: false
        },

        scythe_summon: {
            frames: ["idle_1", "summon_scythe", "scythe_ready"],
            fps: 10,
            loop: false
        },

        scythe_swing: {
            frames: ["scythe_ready", "scythe_swing", "scythe_finish"],
            fps: 14,
            loop: false
        },

        gaster_charge: {
            frames: ["bone_control", "eye_activate"],
            fps: 7,
            loop: true
        },

        gaster_fire: {
            frames: ["eye_activate", "bone_control"],
            fps: 12,
            loop: false
        },

        hit: {
            frames: ["hit"],
            fps: 1,
            loop: false
        },

        low_stamina: {
            frames: ["low_stamina"],
            fps: 1,
            loop: true
        },

        exhausted: {
            frames: ["exhausted"],
            fps: 1,
            loop: true
        },

        phase_change: {
            frames: ["idle_1", "phase_change", "phase_change"],
            fps: 11,
            loop: false
        }
    };


    let current = "idle";
    let startedAt = 0;
    let forcedUntil = 0;


    function play(name, duration = null) {

        if (!definitions[name]) {
            name = "idle";
        }

        current = name;
        startedAt = performance.now();

        const animation = definitions[name];

        if (duration !== null) {
            forcedUntil = startedAt + duration;
        }

        else if (animation.loop) {
            forcedUntil = Infinity;
        }

        else {
            forcedUntil =
                startedAt +
                (
                    animation.frames.length /
                    animation.fps
                ) * 1000;
        }
    }


    function update(now) {

        if (
            current !== "idle" &&
            now >= forcedUntil
        ) {
            play("idle");
        }
    }


    function getFrame(now) {

        const animation =
            definitions[current];

        if (!animation) {
            return "idle_1";
        }

        const elapsed =
            Math.max(
                0,
                now - startedAt
            );

        let index =
            Math.floor(
                elapsed /
                (1000 / animation.fps)
            );

        if (animation.loop) {
            index %=
                animation.frames.length;
        }

        else {
            index =
                Math.min(
                    index,
                    animation.frames.length - 1
                );
        }

        return animation.frames[index];
    }


    function getName() {
        return current;
    }


    return {
        play,
        update,
        getFrame,
        getName
    };

})();


/* ==========================================================
   SPRITE SYSTEM

   This replaces the giant guessed rectangular crop.

   Frames can be loaded as CLEAN individual transparent PNGs.

   assets/forecast/
       idle_1.png
       idle_2.png
       idle_3.png
       blink.png
       dodge_left.png
       ...
========================================================== */

const ForecastSprites = (() => {

    const frameNames = [
        "idle_1",
        "idle_2",
        "idle_3",

        "blink",
        "look_down",
        "look_up",
        "cloak_flow",

        "dodge_left",
        "dodge_right",
        "dodge_up",
        "dodge_down",
        "dodge_afterimage",

        "gun_pose",
        "gun_fire",

        "bone_control",
        "eye_activate",

        "summon_scythe",
        "scythe_ready",
        "scythe_swing",
        "scythe_finish",

        "hit",
        "low_stamina",
        "exhausted",
        "phase_change"
    ];


    const frames = new Map();

    let loaded = 0;


    function load() {

        frameNames.forEach(name => {

            const image =
                new Image();

            image.src =
                `./assets/forecast/${name}.png`;

            image.onload = () => {

                frames.set(
                    name,
                    image
                );

                loaded++;
            };

            /*
                Missing frame does NOT crash the game.

                Renderer will use the clean fallback until
                that extracted animation frame exists.
            */

            image.onerror = () => {
                frames.set(
                    name,
                    null
                );
            };

        });

    }


    function get(name) {
        return frames.get(name) || null;
    }


    function getLoadedCount() {
        return loaded;
    }


    return {
        load,
        get,
        getLoadedCount
    };

})();


/* ==========================================================
   PHASE VISUALS

   Gameplay phase remains owned by ForecastPhases.
========================================================== */

const PHASE_STYLE = {

    "1": {
        aura: 0.10,
        scale: 1
    },

    "1.5": {
        aura: 0.16,
        scale: 1
    },

    "2": {
        aura: 0.22,
        scale: 1.01
    },

    "2.5": {
        aura: 0.28,
        scale: 1.01
    },

    "3": {
        aura: 0.35,
        scale: 1.02
    },

    "3.5": {
        aura: 0.42,
        scale: 1.02
    },

    "4": {
        aura: 0.50,
        scale: 1.03
    },

    "4.5": {
        aura: 0.60,
        scale: 1.04
    },

    "5": {
        aura: 0.80,
        scale: 1.06
    }

};


/* ==========================================================
   COMBAT COLLECTIONS
========================================================== */

let playerProjectiles = [];
let hostileProjectiles = [];

let hazards = [];
let effects = [];
let constructs = [];
let illusions = [];

let activeBeam = null;
let activeScythe = null;


/* ==========================================================
   AIMING

   Mouse + touch/drag ready.

   Forecast itself still DOES NOT move.
========================================================== */

const aim = {
    active: false,

    x: 0,
    y: 0,

    predictedX: 0,
    predictedY: 0,

    pointerId: null
};


/* ==========================================================
   SPECIAL STATES
========================================================== */

const states = {
    predictionUntil: 0,

    domainUntil: 0,
    heroismUntil: 0,
    evolutionUntil: 0,
    deadlockUntil: 0,

    observeUntil: 0,
    vectorUntil: 0,
    momentUntil: 0,

    decoyUntil: 0,
    decoyX: 0,
    decoyY: 0
};


const adaptation = {
    aimedSeen: 0,
    spreadSeen: 0,
    heavySeen: 0
};


/* ==========================================================
   INITIALIZATION
========================================================== */

function init(element) {

    if (!element) {
        throw new Error(
            "Battle.init: gameCanvas was not found."
        );
    }

    canvas = element;

    ctx =
        canvas.getContext("2d");

    if (!ctx) {
        throw new Error(
            "Battle.init: Canvas 2D unavailable."
        );
    }

    ctx.imageSmoothingEnabled = false;

    ForecastSprites.load();

    installEvents();

    resize();

    window.addEventListener(
        "resize",
        resize
    );

    reset();

    running = true;

    lastFrame =
        performance.now();

    requestAnimationFrame(loop);
}


/* ==========================================================
   RESPONSIVE BATTLE LAYOUT
========================================================== */

function resize() {

    if (!canvas) return;

    const rect =
        canvas.getBoundingClientRect();

    width =
        Math.max(
            320,
            rect.width ||
            window.innerWidth
        );

    height =
        Math.max(
            420,
            rect.height ||
            window.innerHeight
        );

    dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    canvas.width =
        Math.round(
            width * dpr
        );

    canvas.height =
        Math.round(
            height * dpr
        );

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
        Large upper stage for Forecast.

        Battle box begins BELOW him.
    */

    const boxWidth =
        Math.min(
            width * 0.82,
            720
        );

    const boxHeight =
        clamp(
            height * 0.28,
            175,
            300
        );

    arena.left =
        (width - boxWidth) / 2;

    arena.right =
        arena.left +
        boxWidth;

    arena.top =
        clamp(
            height * 0.34,
            210,
            340
        );

    arena.bottom =
        arena.top +
        boxHeight;


    if (
        arena.bottom >
        height - 130
    ) {
        arena.bottom =
            height - 130;
    }


    if (
        arena.bottom <
        arena.top + 150
    ) {
        arena.bottom =
            arena.top + 150;
    }


    /*
        FORECAST'S REAL WORLD POSITION.

        This is the only normal positioning function
        for Forecast.

        Auto-dodge NEVER edits these values.
    */

    forecast.worldX =
        width * 0.5;

    forecast.worldY =
        arena.top - 82;


    protagonist.x =
        clamp(
            protagonist.x ||
            width * 0.5,

            arena.left + 25,
            arena.right - 25
        );

    protagonist.y =
        clamp(
            protagonist.y ||
            (
                arena.top +
                arena.bottom
            ) / 2,

            arena.top + 25,
            arena.bottom - 25
        );
}


/* ==========================================================
   RESET
========================================================== */

function reset() {

    const now =
        performance.now();

    forecast.stamina =
        forecast.maxStamina;

    forecast.dodgeChain = 0;
    forecast.lastDodgeAt = 0;
    forecast.invulnerableUntil = 0;

    protagonist.hp =
        protagonist.maxHp;

    protagonist.x =
        width * 0.5;

    protagonist.y =
        arena.top +
        (
            arena.bottom -
            arena.top
        ) * 0.62;

    protagonist.frozenUntil = 0;

    chooseProtagonistTarget();


    playerProjectiles = [];
    hostileProjectiles = [];

    hazards = [];
    effects = [];
    constructs = [];
    illusions = [];

    activeBeam = null;
    activeScythe = null;


    Object.keys(states)
        .forEach(key => {
            states[key] = 0;
        });


    adaptation.aimedSeen = 0;
    adaptation.spreadSeen = 0;
    adaptation.heavySeen = 0;


    aim.active = false;
    aim.pointerId = null;

    aim.x =
        protagonist.x;

    aim.y =
        protagonist.y;


    turn =
        TURN.FORECAST;

    turnStarted = now;

    transitionUntil = 0;


    Animation.play(
        "idle"
    );


    updateEnemyHUD();
    updateStaminaHUD();
    updateTurnHUD();
}


/* ==========================================================
   EVENTS
========================================================== */

function installEvents() {

    if (eventsInstalled) {
        return;
    }

    eventsInstalled = true;


    window.addEventListener(
        "forecast-weapon-fire",
        event => {

            fireWeapon(
                event.detail?.attack
            );

        }
    );


    window.addEventListener(
        "forecast-technique-activate",
        event => {

            activateTechnique(
                event.detail?.attack
            );

        }
    );


    window.addEventListener(
        "forecast-eye-activate",
        event => {

            activateEye(
                event.detail || {}
            );

        }
    );


    window.addEventListener(
        "forecast-phase-change",
        event => {

            handlePhaseChange(
                event.detail || {}
            );

        }
    );


    /*
        AIM INPUT
    */

    canvas.addEventListener(
        "pointerdown",
        pointerDown
    );

    canvas.addEventListener(
        "pointermove",
        pointerMove
    );

    canvas.addEventListener(
        "pointerup",
        pointerUp
    );

    canvas.addEventListener(
        "pointercancel",
        pointerUp
    );
}


/* ==========================================================
   POINTER AIM
========================================================== */

function pointerPosition(event) {

    const rect =
        canvas.getBoundingClientRect();

    return {
        x:
            (
                event.clientX -
                rect.left
            ) *
            (
                width /
                rect.width
            ),

        y:
            (
                event.clientY -
                rect.top
            ) *
            (
                height /
                rect.height
            )
    };
}


function pointerDown(event) {

    if (
        turn !== TURN.FORECAST
    ) {
        return;
    }

    const point =
        pointerPosition(event);

    aim.active = true;
    aim.pointerId =
        event.pointerId;

    aim.x = point.x;
    aim.y = point.y;

    updatePredictedAim();

    try {
        canvas.setPointerCapture(
            event.pointerId
        );
    }
    catch (_) {}
}


function pointerMove(event) {

    if (
        !aim.active ||
        aim.pointerId !==
        event.pointerId
    ) {
        return;
    }

    const point =
        pointerPosition(event);

    aim.x = point.x;
    aim.y = point.y;

    updatePredictedAim();
}


function pointerUp(event) {

    if (
        aim.pointerId !==
        event.pointerId
    ) {
        return;
    }

    aim.active = false;
    aim.pointerId = null;
}


/* ==========================================================
   FUTURE POSITION PREDICTION
========================================================== */

function updatePredictedAim() {

    const dx =
        protagonist.targetX -
        protagonist.x;

    const dy =
        protagonist.targetY -
        protagonist.y;

    const distance =
        Math.hypot(
            dx,
            dy
        ) || 1;

    const leadDistance = 45;

    aim.predictedX =
        clamp(
            protagonist.x +
            (
                dx /
                distance
            ) *
            leadDistance,

            arena.left + 15,
            arena.right - 15
        );

    aim.predictedY =
        clamp(
            protagonist.y +
            (
                dy /
                distance
            ) *
            leadDistance,

            arena.top + 15,
            arena.bottom - 15
        );
}


/* ==========================================================
   LOOP
========================================================== */

function loop(now) {

    if (!running) {
        return;
    }

    let dt =
        (
            now -
            lastFrame
        ) /
        1000;

    lastFrame = now;

    dt =
        Math.min(
            dt,
            0.04
        );

    update(
        dt,
        now
    );

    render(now);

    requestAnimationFrame(loop);
}


/* ==========================================================
   UPDATE
========================================================== */

function update(
    dt,
    now
) {

    /*
        Absolute guarantee:

        Forecast is snapped to the boss position
        every frame.

        No dodge can physically move him.
    */

    forecast.worldX =
        width * 0.5;

    forecast.worldY =
        arena.top - 82;


    updateTurn(now);

    Animation.update(now);

    updateStamina(
        dt,
        now
    );

    updateProtagonist(
        dt,
        now
    );

    updatePredictedAim();

    updatePlayerProjectiles(
        dt,
        now
    );

    updateHostileProjectiles(
        dt,
        now
    );

    updateHazards(
        dt,
        now
    );

    updateConstructs(
        dt,
        now
    );

    updateSpecialAttacks(
        dt,
        now
    );

    updateEffects(dt);

    cleanupTemporaryObjects(now);

    updateStaminaHUD();
}


/* ==========================================================
   TURN FLOW
========================================================== */

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
        now -
        turnStarted;


    if (
        turn === TURN.FORECAST &&
        elapsed >=
        FORECAST_TURN_MS
    ) {
        startProtagonistTurn();
    }


    else if (
        turn === TURN.PROTAGONIST &&
        elapsed >=
        PROTAGONIST_TURN_MS
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

    turn =
        TURN.FORECAST;

    turnStarted =
        performance.now();

    hostileProjectiles = [];

    aim.active = false;

    Animation.play(
        "idle"
    );

    updateTurnHUD();

    message(
        "Your turn. The future is visible."
    );
}


function startProtagonistTurn() {

    if (
        turn === TURN.ENDED
    ) {
        return;
    }

    turn =
        TURN.PROTAGONIST;

    turnStarted =
        performance.now();

    playerProjectiles = [];
    hazards = [];

    aim.active = false;

    Animation.play(
        "idle"
    );

    updateTurnHUD();

    message(
        "Protagonist turn. AUTO-DODGE ACTIVE."
    );

    startProtagonistAttackPattern();
}


function startPhaseTransition() {

    turn =
        TURN.TRANSITION;

    transitionUntil =
        performance.now() +
        1200;

    hostileProjectiles = [];
    playerProjectiles = [];
    hazards = [];

    aim.active = false;

    Animation.play(
        "phase_change",
        950
    );

    updateTurnHUD();
}


/* ==========================================================
   STAMINA / AUTO-DODGE
========================================================== */

const BASE_DODGE_COST = 12;
const STAMINA_REGEN = 16;
const DODGE_INVULNERABILITY = 290;


function updateStamina(
    dt,
    now
) {

    const regenMultiplier =
        turn === TURN.FORECAST
            ? 1.35
            : 1;

    forecast.stamina =
        Math.min(
            forecast.maxStamina,

            forecast.stamina +
            STAMINA_REGEN *
            regenMultiplier *
            dt
        );


    if (
        now -
        forecast.lastDodgeAt >
        900
    ) {
        forecast.dodgeChain = 0;
    }


    if (
        forecast.stamina <= 20 &&
        Animation.getName() ===
        "idle"
    ) {
        Animation.play(
            "low_stamina",
            350
        );
    }
}


function getDodgeCost(now) {

    let cost =
        BASE_DODGE_COST +
        Math.min(
            forecast.dodgeChain * 3,
            15
        );


    if (
        now <
        states.evolutionUntil
    ) {
        cost *= 0.67;
    }


    if (
        adaptation.aimedSeen >= 7
    ) {
        cost *= 0.90;
    }


    if (
        now <
            states.predictionUntil ||
        now <
            states.observeUntil
    ) {
        cost *= 0.84;
    }


    return Math.max(
        5,
        Math.round(cost)
    );
}


/* ==========================================================
   STATIONARY AUTO-DODGE

   Animation != movement.
========================================================== */

function attemptAutoDodge(
    projectile,
    now
) {

    if (
        turn !==
        TURN.PROTAGONIST
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
        forecast.stamina <
        cost
    ) {

        Animation.play(
            "exhausted",
            450
        );

        updateStaminaHUD(
            "EXHAUSTED"
        );

        return false;
    }


    forecast.stamina -= cost;

    forecast.dodgeChain++;

    forecast.lastDodgeAt = now;

    forecast.invulnerableUntil =
        now +
        DODGE_INVULNERABILITY;


    /*
        Choose animation according to incoming vector.

        STILL NO POSITION CHANGE.
    */

    const horizontal =
        Math.abs(
            projectile.vx || 0
        );

    const vertical =
        Math.abs(
            projectile.vy || 0
        );


    let dodgeAnimation;


    if (
        vertical >
        horizontal * 1.4
    ) {

        dodgeAnimation =
            projectile.vy > 0
                ? "dodge_left"
                : "dodge_down";

    }

    else {

        dodgeAnimation =
            projectile.x <
            forecast.worldX
                ? "dodge_right"
                : "dodge_left";

    }


    Animation.play(
        dodgeAnimation,
        280
    );


    effects.push({
        type: "dodge_afterimage",

        x: forecast.worldX,
        y: forecast.worldY,

        animation:
            dodgeAnimation,

        life: 0.30,
        maxLife: 0.30
    });


    effects.push({
        type: "dodge_flash",

        x: forecast.worldX,
        y: forecast.worldY,

        life: 0.18,
        maxLife: 0.18
    });


    updateStaminaHUD(
        `AUTO-DODGE -${cost}`
    );


    return true;
}


/* ==========================================================
   PROTAGONIST AI
========================================================== */

function chooseProtagonistTarget() {

    protagonist.targetX =
        random(
            arena.left + 30,
            arena.right - 30
        );

    protagonist.targetY =
        random(
            arena.top + 30,
            arena.bottom - 30
        );

    protagonist.nextTargetAt =
        performance.now() +
        random(
            450,
            1050
        );
}


function updateProtagonist(
    dt,
    now
) {

    if (
        now <
        protagonist.frozenUntil
    ) {
        return;
    }


    if (
        now >=
        protagonist.nextTargetAt
    ) {
        chooseProtagonistTarget();
    }


    let multiplier = 1;


    if (
        now <
        states.deadlockUntil
    ) {
        multiplier *= 0.28;
    }


    if (
        now <
        states.domainUntil
    ) {
        multiplier *= 0.66;
    }


    if (
        now <
        states.momentUntil
    ) {
        multiplier *= 0.32;
    }


    const dx =
        protagonist.targetX -
        protagonist.x;

    const dy =
        protagonist.targetY -
        protagonist.y;

    const distance =
        Math.hypot(
            dx,
            dy
        ) || 1;


    protagonist.x +=
        (
            dx /
            distance
        ) *
        protagonist.speed *
        multiplier *
        dt;


    protagonist.y +=
        (
            dy /
            distance
        ) *
        protagonist.speed *
        multiplier *
        dt;


    protagonist.x =
        clamp(
            protagonist.x,

            arena.left +
            protagonist.radius,

            arena.right -
            protagonist.radius
        );


    protagonist.y =
        clamp(
            protagonist.y,

            arena.top +
            protagonist.radius,

            arena.bottom -
            protagonist.radius
        );
}


/* ==========================================================
   PROTAGONIST ATTACK SYSTEM

   Different attack patterns will be created here.
========================================================== */

function startProtagonistAttackPattern() {

    const phaseIndex =
        ForecastPhases
            .getPhaseIndex();

    const count =
        Math.min(
            5 + phaseIndex,
            13
        );


    for (
        let i = 0;
        i < count;
        i++
    ) {

        setTimeout(
            () => {

                if (
                    turn !==
                    TURN.PROTAGONIST
                ) {
                    return;
                }

                spawnHostileAttack(
                    i,
                    phaseIndex
                );

            },

            250 +
            i * 390
        );

    }
}


function spawnHostileAttack(
    index,
    phaseIndex
) {

    /*
        Later phases vary the incoming pattern.
    */

    if (
        phaseIndex >= 4 &&
        index % 4 === 3
    ) {

        spawnHostileSpread();

        adaptation.spreadSeen++;

        return;
    }


    if (
        phaseIndex >= 6 &&
        index % 5 === 4
    ) {

        spawnHostileHeavy();

        adaptation.heavySeen++;

        return;
    }


    spawnHostileAimed();

    adaptation.aimedSeen++;
}


function hostileTarget() {

    if (
        performance.now() <
        states.decoyUntil
    ) {

        return {
            x:
                states.decoyX,

            y:
                states.decoyY
        };

    }


    return {
        x:
            forecast.worldX,

        y:
            forecast.worldY
    };
}


function spawnHostileAimed() {

    const target =
        hostileTarget();

    const dx =
        target.x -
        protagonist.x;

    const dy =
        target.y -
        protagonist.y;

    const distance =
        Math.hypot(
            dx,
            dy
        ) || 1;

    const speed = 285;


    hostileProjectiles.push({

        type:
            "protagonist_aimed",

        x:
            protagonist.x,

        y:
            protagonist.y,

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

        radius: 6,

        life: 4

    });
}


function spawnHostileSpread() {

    const target =
        hostileTarget();

    const baseAngle =
        Math.atan2(
            target.y -
            protagonist.y,

            target.x -
            protagonist.x
        );


    for (
        let i = -1;
        i <= 1;
        i++
    ) {

        const angle =
            baseAngle +
            i * 0.12;

        const speed =
            270;


        hostileProjectiles.push({

            type:
                "protagonist_spread",

            x:
                protagonist.x,

            y:
                protagonist.y,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            radius: 5,

            life: 4

        });

    }
}


function spawnHostileHeavy() {

    const target =
        hostileTarget();

    const angle =
        Math.atan2(
            target.y -
            protagonist.y,

            target.x -
            protagonist.x
        );


    hostileProjectiles.push({

        type:
            "protagonist_heavy",

        x:
            protagonist.x,

        y:
            protagonist.y,

        vx:
            Math.cos(angle) *
            220,

        vy:
            Math.sin(angle) *
            220,

        radius: 10,

        life: 5

    });
}


/* ==========================================================
   HOSTILE PROJECTILE UPDATE
========================================================== */

function updateHostileProjectiles(
    dt,
    now
) {

    const timeScale =
        now <
        states.momentUntil
            ? 0.32
            : 1;


    for (
        let i =
            hostileProjectiles.length - 1;

        i >= 0;

        i--
    ) {

        const projectile =
            hostileProjectiles[i];


        if (!projectile) {

            hostileProjectiles.splice(
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


        if (
            projectile.life <= 0 ||
            projectile.x < -100 ||
            projectile.x >
                width + 100 ||
            projectile.y < -100 ||
            projectile.y >
                height + 100
        ) {

            hostileProjectiles.splice(
                i,
                1
            );

            continue;
        }


        /*
            Collision happens at Forecast's
            FIXED world position.
        */

        if (
            circlesTouch(

                projectile.x,
                projectile.y,
                projectile.radius,

                forecast.worldX,
                forecast.worldY,
                forecast.collisionRadius

            )
        ) {

            const dodged =
                attemptAutoDodge(
                    projectile,
                    now
                );


            hostileProjectiles.splice(
                i,
                1
            );


            if (!dodged) {
                confirmForecastHit(now);
                return;
            }
        }
    }
}


/* ==========================================================
   EXACT PHASE PROGRESSION

   1
   HIT -> 1.5
   HIT -> 2
   HIT -> 2.5
   HIT -> 3
   HIT -> 3.5
   HIT -> 4
   HIT -> 4.5
   HIT -> 5
========================================================== */

function confirmForecastHit(now) {

    if (
        turn !==
        TURN.PROTAGONIST
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


    Animation.play(
        "hit",
        300
    );


    const result =
        ForecastPhases
            .confirmedHit();


    if (
        result?.advanced
    ) {

        forecast.stamina =
            Math.min(
                forecast.maxStamina,

                forecast.stamina +
                20
            );


        startPhaseTransition();

        return;
    }


    if (
        result?.reason ===
        "final-phase"
    ) {

        hostileProjectiles = [];

        message(
            "Phase 5 holds."
        );
    }
}


/* ==========================================================
   PLAYER PROJECTILE FACTORY

   Weapons are deliberately separate visual types.
========================================================== */

function createPlayerProjectile({
    type,

    x =
        forecast.worldX,

    y =
        forecast.worldY,

    targetX,
    targetY,

    speed,
    damage,
    radius,

    angleOffset = 0,

    life = 3
}) {

    const angle =
        Math.atan2(
            targetY - y,
            targetX - x
        ) +
        angleOffset;


    playerProjectiles.push({

        type,

        x,
        y,

        vx:
            Math.cos(angle) *
            speed,

        vy:
            Math.sin(angle) *
            speed,

        damage,
        radius,
        life,

        trail: []
    });
}


/* ==========================================================
   AIM TARGET

   When not manually dragging, Forecast predicts the
   protagonist automatically.
========================================================== */

function getAttackTarget() {

    if (aim.active) {

        return {
            x: aim.x,
            y: aim.y
        };

    }


    if (
        performance.now() <
            states.predictionUntil ||
        performance.now() <
            states.observeUntil
    ) {

        return {
            x:
                aim.predictedX,

            y:
                aim.predictedY
        };

    }


    return {
        x:
            protagonist.x,

        y:
            protagonist.y
    };
}


/* ==========================================================
   WEAPONS

   GLOCK
   SMG
   AR
   DMR
   SHOTGUN
   GASTER HAND
   EXECUTION SCYTHE
========================================================== */

function fireWeapon(type) {

    if (
        turn !== TURN.FORECAST ||
        !type
    ) {
        return;
    }


    const target =
        getAttackTarget();


    switch (type) {

        /* --------------------------------------------------
           GLOCK

           One small, fast, visible pixel bullet.
        -------------------------------------------------- */

        case "glock":

            Animation.play(
                "glock_fire",
                260
            );

            createMuzzleFlash(
                "small"
            );

            createPlayerProjectile({
                type:
                    "glock_bullet",

                targetX:
                    target.x,

                targetY:
                    target.y,

                speed: 620,
                damage: 12,
                radius: 3
            });

            break;


        /* --------------------------------------------------
           SMG

           Rapid small stream.
        -------------------------------------------------- */

        case "smg":

            Animation.play(
                "smg_fire",
                620
            );

            for (
                let i = 0;
                i < 8;
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

                        createMuzzleFlash(
                            "rapid"
                        );

                        createPlayerProjectile({
                            type:
                                "smg_bullet",

                            targetX:
                                getAttackTarget().x,

                            targetY:
                                getAttackTarget().y,

                            speed: 560,
                            damage: 4,
                            radius: 2,

                            angleOffset:
                                random(
                                    -0.035,
                                    0.035
                                )
                        });

                    },

                    i * 60
                );

            }

            break;


        /* --------------------------------------------------
           AR

           Heavier burst with long tracers.
        -------------------------------------------------- */

        case "ar":

            Animation.play(
                "ar_fire",
                520
            );

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

                        createMuzzleFlash(
                            "rifle"
                        );

                        const currentTarget =
                            getAttackTarget();

                        createPlayerProjectile({
                            type:
                                "ar_round",

                            targetX:
                                currentTarget.x,

                            targetY:
                                currentTarget.y,

                            speed: 690,
                            damage: 7,
                            radius: 3,

                            angleOffset:
                                random(
                                    -0.015,
                                    0.015
                                )
                        });

                    },

                    i * 105
                );

            }

            break;


        /* --------------------------------------------------
           DMR

           Prediction line -> precision round.
        -------------------------------------------------- */

        case "dmr":

            Animation.play(
                "dmr_fire",
                450
            );

            effects.push({
                type:
                    "dmr_prediction",

                x:
                    forecast.worldX,

                y:
                    forecast.worldY,

                targetX:
                    target.x,

                targetY:
                    target.y,

                life: 0.24,
                maxLife: 0.24
            });


            setTimeout(
                () => {

                    if (
                        turn !==
                        TURN.FORECAST
                    ) {
                        return;
                    }

                    createMuzzleFlash(
                        "precision"
                    );

                    const currentTarget =
                        getAttackTarget();

                    createPlayerProjectile({
                        type:
                            "dmr_round",

                        targetX:
                            currentTarget.x,

                        targetY:
                            currentTarget.y,

                        speed: 980,
                        damage: 21,
                        radius: 4
                    });

                },

                180
            );

            break;


        /* --------------------------------------------------
           SHOTGUN

           Actual spread of separate pellets.
        -------------------------------------------------- */

        case "shotgun":

            Animation.play(
                "shotgun_fire",
                420
            );

            createMuzzleFlash(
                "shotgun"
            );


            for (
                let i = -4;
                i <= 4;
                i++
            ) {

                createPlayerProjectile({
                    type:
                        "shotgun_pellet",

                    targetX:
                        target.x,

                    targetY:
                        target.y,

                    speed:
                        random(
                            455,
                            515
                        ),

                    damage: 4,
                    radius: 2,

                    angleOffset:
                        i * 0.075
                });

            }

            break;


        /* --------------------------------------------------
           GASTER HAND
        -------------------------------------------------- */

        case "gasterHand":

            beginGasterBeam(
                target,
                "hand"
            );

            break;


        /* --------------------------------------------------
           EXECUTION SCYTHE
        -------------------------------------------------- */

        case "scythe":

            beginScytheAttack(
                target
            );

            break;
    }
}


/* ==========================================================
   MUZZLE EFFECTS
========================================================== */

function createMuzzleFlash(
    variant
) {

    effects.push({

        type:
            "muzzle_flash",

        variant,

        x:
            forecast.worldX,

        y:
            forecast.worldY + 4,

        life: 0.12,
        maxLife: 0.12

    });
}


/* ==========================================================
   PLAYER PROJECTILE UPDATE
========================================================== */

function updatePlayerProjectiles(
    dt,
    now
) {

    for (
        let i =
            playerProjectiles.length - 1;

        i >= 0;

        i--
    ) {

        const projectile =
            playerProjectiles[i];


        if (!projectile) {

            playerProjectiles.splice(
                i,
                1
            );

            continue;
        }


        /*
            Store trail positions.
        */

        projectile.trail.push({
            x: projectile.x,
            y: projectile.y
        });


        const maxTrail =
            projectile.type ===
            "dmr_round"
                ? 8
                : projectile.type ===
                  "ar_round"
                    ? 5
                    : 3;


        if (
            projectile.trail.length >
            maxTrail
        ) {
            projectile.trail.shift();
        }


        /*
            VECTOR eye:
            controlled homing.
        */

        if (
            now <
            states.vectorUntil
        ) {

            const targetAngle =
                Math.atan2(
                    protagonist.y -
                    projectile.y,

                    protagonist.x -
                    projectile.x
                );

            const speed =
                Math.hypot(
                    projectile.vx,
                    projectile.vy
                );

            projectile.vx =
                projectile.vx *
                0.90 +
                Math.cos(
                    targetAngle
                ) *
                speed *
                0.10;

            projectile.vy =
                projectile.vy *
                0.90 +
                Math.sin(
                    targetAngle
                ) *
                speed *
                0.10;
        }


        projectile.x +=
            projectile.vx *
            dt;

        projectile.y +=
            projectile.vy *
            dt;

        projectile.life -= dt;


        if (
            projectile.life <= 0 ||
            projectile.x < -100 ||
            projectile.x >
                width + 100 ||
            projectile.y < -100 ||
            projectile.y >
                height + 100
        ) {

            playerProjectiles.splice(
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

                protagonist.x,
                protagonist.y,
                protagonist.radius

            )
        ) {

            damageProtagonist(
                projectile.damage
            );

            createImpact(
                projectile.x,
                projectile.y,
                projectile.type
            );

            playerProjectiles.splice(
                i,
                1
            );
        }
    }
}/* ==========================================================
   TECHNIQUES
========================================================== */

function activateTechnique(type) {

    if (
        turn !== TURN.FORECAST ||
        !type
    ) {
        return;
    }

    switch (type) {

        /* --------------------------------------------------
           BONES
        -------------------------------------------------- */

        case "bones": {

            Animation.play(
                "bone_control",
                600
            );

            const target =
                getAttackTarget();

            for (
                let i = -2;
                i <= 2;
                i++
            ) {

                createPlayerProjectile({
                    type: "bone",

                    targetX: target.x,
                    targetY: target.y,

                    speed: 410,
                    damage: 6,
                    radius: 6,

                    angleOffset:
                        i * 0.09
                });
            }

            break;
        }


        /* --------------------------------------------------
           BONE WALL

           Warning -> bones erupt upward in sequence.
        -------------------------------------------------- */

        case "boneWall": {

            Animation.play(
                "bone_control",
                700
            );

            const baseX =
                protagonist.x;

            const baseY =
                protagonist.y;

            for (
                let i = 0;
                i < 8;
                i++
            ) {

                hazards.push({
                    type: "bone_wall",

                    x:
                        baseX -
                        70 +
                        i * 20,

                    y: baseY,

                    radius: 11,

                    damage: 7,

                    activateAt:
                        performance.now() +
                        350 +
                        i * 55,

                    life: 1.7,

                    hit: false
                });
            }

            break;
        }


        /* --------------------------------------------------
           ILLUSIONS
        -------------------------------------------------- */

        case "illusions": {

            const now =
                performance.now();

            for (
                let i = 0;
                i < 6;
                i++
            ) {

                illusions.push({
                    x:
                        random(
                            arena.left + 35,
                            arena.right - 35
                        ),

                    y:
                        random(
                            arena.top + 35,
                            arena.bottom - 35
                        ),

                    phase:
                        random(
                            0,
                            Math.PI * 2
                        ),

                    until:
                        now + 3200
                });
            }

            effects.push({
                type: "illusion_burst",

                x: forecast.worldX,
                y: forecast.worldY,

                life: 0.45,
                maxLife: 0.45
            });

            break;
        }


        /* --------------------------------------------------
           CONSTRUCTS

           Independent summoned attackers.
        -------------------------------------------------- */

        case "constructs": {

            const now =
                performance.now();

            for (
                let i = 0;
                i < 4;
                i++
            ) {

                const angle =
                    (
                        i / 4
                    ) *
                    Math.PI *
                    2;

                constructs.push({
                    x:
                        protagonist.x +
                        Math.cos(angle) *
                        115,

                    y:
                        protagonist.y +
                        Math.sin(angle) *
                        90,

                    angle,

                    orbitRadius:
                        85 +
                        i * 7,

                    fireAt:
                        now +
                        500 +
                        i * 180,

                    until:
                        now + 3000,

                    fired: false
                });
            }

            break;
        }


        /* --------------------------------------------------
           GASTER
        -------------------------------------------------- */

        case "gaster": {

            beginGasterBeam(
                getAttackTarget(),
                "full"
            );

            break;
        }


        /* --------------------------------------------------
           FORECAST TRAP

           Marks predicted destination first.
        -------------------------------------------------- */

        case "forecastTrap": {

            Animation.play(
                "eye_activate",
                450
            );

            const x =
                aim.predictedX;

            const y =
                aim.predictedY;

            hazards.push({
                type: "forecast_trap",

                x,
                y,

                radius: 38,

                damage: 17,

                warningAt:
                    performance.now(),

                activateAt:
                    performance.now() +
                    720,

                life: 2,

                hit: false
            });

            break;
        }


        /* --------------------------------------------------
           CROSSFIRE

           Actual attacks from multiple directions.
        -------------------------------------------------- */

        case "crossfire": {

            beginCrossfire();

            break;
        }


        /* --------------------------------------------------
           FALSE FUTURE

           Shows one future.
           Attack happens somewhere else.
        -------------------------------------------------- */

        case "falseFuture": {

            beginFalseFuture();

            break;
        }


        /* --------------------------------------------------
           INEVITABLE
        -------------------------------------------------- */

        case "inevitable": {

            beginInevitable();

            break;
        }
    }
}


/* ==========================================================
   CONSTRUCTS
========================================================== */

function updateConstructs(
    dt,
    now
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
            now >=
            construct.until
        ) {

            constructs.splice(
                i,
                1
            );

            continue;
        }


        construct.angle +=
            dt * 1.7;


        construct.x =
            protagonist.x +
            Math.cos(
                construct.angle
            ) *
            construct.orbitRadius;


        construct.y =
            protagonist.y +
            Math.sin(
                construct.angle
            ) *
            construct.orbitRadius;


        if (
            !construct.fired &&
            now >=
            construct.fireAt
        ) {

            construct.fired = true;


            createPlayerProjectile({

                type:
                    "construct_shard",

                x:
                    construct.x,

                y:
                    construct.y,

                targetX:
                    protagonist.x,

                targetY:
                    protagonist.y,

                speed: 390,

                damage: 9,

                radius: 5

            });
        }
    }
}


/* ==========================================================
   CROSSFIRE
========================================================== */

function beginCrossfire() {

    Animation.play(
        "eye_activate",
        500
    );


    const count = 8;

    const centerX =
        protagonist.x;

    const centerY =
        protagonist.y;


    effects.push({
        type: "crosshair",

        x: centerX,
        y: centerY,

        life: 0.55,
        maxLife: 0.55
    });


    setTimeout(
        () => {

            if (
                turn !==
                TURN.FORECAST
            ) {
                return;
            }


            for (
                let i = 0;
                i < count;
                i++
            ) {

                const angle =
                    (
                        i /
                        count
                    ) *
                    Math.PI *
                    2;


                const x =
                    centerX +
                    Math.cos(angle) *
                    160;


                const y =
                    centerY +
                    Math.sin(angle) *
                    160;


                createPlayerProjectile({

                    type:
                        "crossfire_shard",

                    x,
                    y,

                    targetX:
                        centerX,

                    targetY:
                        centerY,

                    speed: 370,

                    damage: 7,

                    radius: 4

                });
            }

        },

        480
    );
}


/* ==========================================================
   FALSE FUTURE
========================================================== */

function beginFalseFuture() {

    Animation.play(
        "eye_activate",
        600
    );


    const fakeX =
        aim.predictedX;

    const fakeY =
        aim.predictedY;


    effects.push({

        type:
            "false_future_marker",

        x: fakeX,
        y: fakeY,

        life: 0.85,
        maxLife: 0.85

    });


    setTimeout(
        () => {

            if (
                turn !==
                TURN.FORECAST
            ) {
                return;
            }


            /*
                Real attack snaps to the protagonist's
                ACTUAL position after the false warning.
            */

            const realX =
                protagonist.x;

            const realY =
                protagonist.y;


            hazards.push({

                type:
                    "false_future_strike",

                x: realX,
                y: realY,

                radius: 42,

                damage: 21,

                activateAt:
                    performance.now() +
                    100,

                life: 1.25,

                hit: false

            });


            effects.push({

                type:
                    "future_break",

                x: fakeX,
                y: fakeY,

                targetX: realX,
                targetY: realY,

                life: 0.45,
                maxLife: 0.45

            });

        },

        720
    );
}


/* ==========================================================
   INEVITABLE — PHASE 5 SEQUENCE
========================================================== */

function beginInevitable() {

    Animation.play(
        "phase_change",
        1000
    );


    effects.push({

        type:
            "inevitable_start",

        x:
            forecast.worldX,

        y:
            forecast.worldY,

        life: 1,
        maxLife: 1

    });


    /*
        Four prediction locks.
        Each one updates to the protagonist's position.
    */

    for (
        let wave = 0;
        wave < 4;
        wave++
    ) {

        setTimeout(
            () => {

                if (
                    turn !==
                    TURN.FORECAST
                ) {
                    return;
                }


                const x =
                    protagonist.x;

                const y =
                    protagonist.y;


                effects.push({

                    type:
                        "inevitable_lock",

                    x,
                    y,

                    life: 0.55,
                    maxLife: 0.55

                });


                hazards.push({

                    type:
                        "inevitable_strike",

                    x,
                    y,

                    radius:
                        27 +
                        wave * 4,

                    damage: 11,

                    activateAt:
                        performance.now() +
                        420,

                    life: 1.4,

                    hit: false

                });

            },

            wave * 430
        );
    }
}


/* ==========================================================
   GASTER SYSTEM

   Charge -> targeting line -> beam.
========================================================== */

function beginGasterBeam(
    target,
    variant
) {

    if (activeBeam) {
        return;
    }


    const now =
        performance.now();


    const chargeDuration =
        variant === "full"
            ? 650
            : 430;


    const beamDuration =
        variant === "full"
            ? 750
            : 520;


    Animation.play(
        "gaster_charge",
        chargeDuration
    );


    activeBeam = {

        variant,

        x:
            forecast.worldX,

        y:
            forecast.worldY + 12,

        targetX:
            target.x,

        targetY:
            target.y,

        startedAt: now,

        chargeUntil:
            now +
            chargeDuration,

        until:
            now +
            chargeDuration +
            beamDuration,

        damage:
            variant === "full"
                ? 28
                : 22,

        width:
            variant === "full"
                ? 36
                : 25,

        hit: false
    };
}


/* ==========================================================
   SCYTHE SYSTEM
========================================================== */

function beginScytheAttack(target) {

    if (activeScythe) {
        return;
    }


    const now =
        performance.now();


    Animation.play(
        "scythe_summon",
        300
    );


    activeScythe = {

        stage: "summon",

        startedAt: now,

        swingAt:
            now + 300,

        until:
            now + 950,

        targetX:
            target.x,

        targetY:
            target.y,

        damage: 28,

        hit: false
    };
}


/* ==========================================================
   SPECIAL ATTACK UPDATE
========================================================== */

function updateSpecialAttacks(
    dt,
    now
) {

    /* ---------------- GASTER ---------------- */

    if (activeBeam) {

        if (
            now >=
            activeBeam.until
        ) {

            activeBeam = null;
        }

        else if (
            now >=
            activeBeam.chargeUntil
        ) {

            if (
                Animation.getName() !==
                "gaster_fire"
            ) {

                Animation.play(
                    "gaster_fire",
                    500
                );
            }


            if (
                !activeBeam.hit
            ) {

                const beamEnd =
                    getBeamEnd(
                        activeBeam
                    );


                const distance =
                    distancePointToSegment(

                        protagonist.x,
                        protagonist.y,

                        activeBeam.x,
                        activeBeam.y,

                        beamEnd.x,
                        beamEnd.y

                    );


                if (
                    distance <=
                    activeBeam.width *
                    0.6
                ) {

                    activeBeam.hit = true;

                    damageProtagonist(
                        activeBeam.damage
                    );

                    createImpact(
                        protagonist.x,
                        protagonist.y,
                        "gaster"
                    );
                }
            }
        }
    }


    /* ---------------- SCYTHE ---------------- */

    if (activeScythe) {

        if (
            activeScythe.stage ===
                "summon" &&
            now >=
                activeScythe.swingAt
        ) {

            activeScythe.stage =
                "swing";

            Animation.play(
                "scythe_swing",
                620
            );
        }


        if (
            activeScythe.stage ===
                "swing" &&
            !activeScythe.hit
        ) {

            const distance =
                Math.hypot(

                    protagonist.x -
                    forecast.worldX,

                    protagonist.y -
                    forecast.worldY

                );


            if (
                distance <= 245
            ) {

                activeScythe.hit = true;

                damageProtagonist(
                    activeScythe.damage
                );

                createImpact(
                    protagonist.x,
                    protagonist.y,
                    "scythe"
                );
            }
        }


        if (
            now >=
            activeScythe.until
        ) {

            activeScythe = null;
        }
    }
}


/* ==========================================================
   EYES
========================================================== */

function activateEye(data) {

    if (
        turn !== TURN.FORECAST
    ) {
        return;
    }


    const now =
        performance.now();


    Animation.play(
        "eye_activate",
        520
    );


    effects.push({

        type:
            "eye_activation",

        x:
            forecast.worldX,

        y:
            forecast.worldY - 15,

        life: 0.55,
        maxLife: 0.55

    });


    switch (data.effect) {

        /* RED EYE */

        case "freeze":

            protagonist.frozenUntil =
                now +
                (
                    data.duration ||
                    3000
                );

            effects.push({

                type:
                    "freeze_lock",

                x:
                    protagonist.x,

                y:
                    protagonist.y,

                life: 0.7,
                maxLife: 0.7

            });

            break;


        /* BLACK EYE */

        case "domain":

            states.domainUntil =
                now +
                (
                    data.duration ||
                    3500
                );

            break;


        /* HEROISM */

        case "heroism":

            states.heroismUntil =
                now +
                (
                    data.duration ||
                    4000
                );

            break;


        /* EVOLUTION */

        case "evolution":

            states.evolutionUntil =
                now +
                (
                    data.duration ||
                    5000
                );

            break;


        /* DEADLOCK */

        case "deadlock":

            states.deadlockUntil =
                now +
                (
                    data.duration ||
                    3500
                );

            break;


        /* NULL */

        case "null":

            hostileProjectiles = [];

            effects.push({

                type:
                    "null_wave",

                x:
                    forecast.worldX,

                y:
                    forecast.worldY,

                life: 0.75,
                maxLife: 0.75

            });

            break;


        /* PARADOX */

        case "paradox":

            states.decoyUntil =
                now +
                (
                    data.duration ||
                    4000
                );

            states.decoyX =
                forecast.worldX +
                (
                    Math.random() <
                    0.5
                        ? -95
                        : 95
                );

            states.decoyY =
                forecast.worldY +
                15;

            break;


        /* OBSERVE */

        case "observe":

            states.observeUntil =
                now +
                (
                    data.duration ||
                    5000
                );

            break;


        /* VECTOR */

        case "vector":

            states.vectorUntil =
                now +
                (
                    data.duration ||
                    4500
                );

            break;


        /* MOMENT */

        case "moment":

            states.momentUntil =
                now +
                (
                    data.duration ||
                    3500
                );

            break;
    }
}


/* ==========================================================
   HAZARD UPDATE
========================================================== */

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


        if (
            circlesTouch(

                hazard.x,
                hazard.y,
                hazard.radius,

                protagonist.x,
                protagonist.y,
                protagonist.radius

            )
        ) {

            hazard.hit = true;


            damageProtagonist(
                hazard.damage
            );


            createImpact(
                hazard.x,
                hazard.y,
                hazard.type
            );
        }
    }
}


/* ==========================================================
   DAMAGE
========================================================== */

function damageProtagonist(amount) {

    if (
        turn !== TURN.FORECAST
    ) {
        return;
    }


    let damage =
        amount;


    if (
        performance.now() <
        states.heroismUntil
    ) {

        damage *= 1.3;
    }


    protagonist.hp =
        Math.max(
            0,
            protagonist.hp -
            damage
        );


    updateEnemyHUD();


    if (
        protagonist.hp <= 0
    ) {

        turn =
            TURN.ENDED;

        playerProjectiles = [];
        hostileProjectiles = [];
        hazards = [];
        constructs = [];

        activeBeam = null;
        activeScythe = null;

        Animation.play(
            "idle"
        );

        updateTurnHUD();

        message(
            "Possibility terminated."
        );
    }
}


/* ==========================================================
   PHASE CHANGE
========================================================== */

function handlePhaseChange(detail) {

    hostileProjectiles = [];
    hazards = [];


    Animation.play(
        "phase_change",
        1000
    );


    effects.push({

        type:
            "phase_change",

        x:
            forecast.worldX,

        y:
            forecast.worldY,

        phase:
            ForecastPhases.getPhase(),

        life: 1,
        maxLife: 1

    });


    /*
        Phase 5 remains the final known phase.
        No invented Phase 6.
    */

    if (
        ForecastPhases.getPhase() ===
        "5"
    ) {

        message(
            "PHASE 5 — SAME END ANYWAY."
        );
    }
}


/* ==========================================================
   IMPACT EFFECTS
========================================================== */

function createImpact(
    x,
    y,
    variant
) {

    effects.push({

        type:
            "impact",

        variant,

        x,
        y,

        life: 0.28,
        maxLife: 0.28

    });
}


/* ==========================================================
   EFFECT UPDATE / CLEANUP
========================================================== */

function updateEffects(dt) {

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
}


function cleanupTemporaryObjects(now) {

    illusions =
        illusions.filter(
            illusion =>
                now <
                illusion.until
        );


    if (
        now >=
        states.decoyUntil
    ) {

        states.decoyUntil = 0;
    }
}


/* ==========================================================
   RENDER
========================================================== */

function render(now) {

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    drawBackground(now);

    drawAimSystem(now);

    drawArena(now);

    drawIllusions(now);

    drawHazards(now);

    drawConstructs(now);

    drawPlayerProjectiles(now);

    drawHostileProjectiles(now);

    drawGaster(now);

    drawScythe(now);

    drawProtagonist(now);

    drawForecast(now);

    drawEffects(now);
}


/* ==========================================================
   BACKGROUND
========================================================== */

function drawBackground(now) {

    ctx.save();


    ctx.fillStyle =
        "#000000";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    /*
        Phase aura behind Forecast.
    */

    const phase =
        ForecastPhases.getPhase();

    const style =
        PHASE_STYLE[phase] ||
        PHASE_STYLE["1"];


    const gradient =
        ctx.createRadialGradient(

            forecast.worldX,
            forecast.worldY,
            5,

            forecast.worldX,
            forecast.worldY,
            150

        );


    gradient.addColorStop(
        0,
        `rgba(255,20,20,${
            style.aura
        })`
    );


    gradient.addColorStop(
        1,
        "rgba(255,0,0,0)"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        forecast.worldX - 170,
        forecast.worldY - 170,
        340,
        340
    );


    ctx.restore();
}


/* ==========================================================
   ARENA
========================================================== */

function drawArena(now) {

    ctx.save();


    ctx.strokeStyle =
        now <
        states.domainUntil
            ? "#ff3030"
            : "#eeeeee";


    ctx.lineWidth = 3;


    if (
        now <
        states.domainUntil
    ) {

        ctx.shadowColor =
            "#ff2020";

        ctx.shadowBlur = 14;
    }


    ctx.strokeRect(

        arena.left,
        arena.top,

        arena.right -
        arena.left,

        arena.bottom -
        arena.top

    );


    if (
        now <
        states.domainUntil
    ) {

        ctx.globalAlpha = 0.07;

        ctx.fillStyle =
            "#ff2020";

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


/* ==========================================================
   AIM / PREDICTION VISUALS
========================================================== */

function drawAimSystem(now) {

    if (
        turn !== TURN.FORECAST
    ) {
        return;
    }


    const showPrediction =
        aim.active ||
        now <
            states.predictionUntil ||
        now <
            states.observeUntil;


    if (!showPrediction) {
        return;
    }


    const target =
        aim.active
            ? {
                x: aim.x,
                y: aim.y
            }
            : {
                x: aim.predictedX,
                y: aim.predictedY
            };


    ctx.save();


    ctx.strokeStyle =
        aim.active
            ? "#ffffff"
            : "#ff3030";


    ctx.lineWidth = 2;


    ctx.setLineDash([
        7,
        6
    ]);


    ctx.beginPath();


    ctx.moveTo(
        forecast.worldX,
        forecast.worldY
    );


    ctx.lineTo(
        target.x,
        target.y
    );


    ctx.stroke();


    ctx.setLineDash([]);


    ctx.strokeStyle =
        "#ff3030";


    ctx.beginPath();


    ctx.arc(
        target.x,
        target.y,
        14,
        0,
        Math.PI * 2
    );


    ctx.stroke();


    ctx.beginPath();


    ctx.moveTo(
        target.x - 20,
        target.y
    );


    ctx.lineTo(
        target.x + 20,
        target.y
    );


    ctx.moveTo(
        target.x,
        target.y - 20
    );


    ctx.lineTo(
        target.x,
        target.y + 20
    );


    ctx.stroke();


    ctx.restore();
}


/* ==========================================================
   FORECAST SPRITE RENDERER
========================================================== */

function drawForecast(now) {

    const frameName =
        Animation.getFrame(now);


    const sprite =
        ForecastSprites.get(
            frameName
        );


    const phase =
        ForecastPhases.getPhase();


    const phaseStyle =
        PHASE_STYLE[phase] ||
        PHASE_STYLE["1"];


    /*
        IMPORTANT:

        renderX/renderY can visually shift for dodge animation.
        worldX/worldY NEVER change.
    */

    let renderX =
        forecast.worldX;


    let renderY =
        forecast.worldY;


    const animation =
        Animation.getName();


    if (
        animation ===
        "dodge_left"
    ) {
        renderX -= 12;
    }


    else if (
        animation ===
        "dodge_right"
    ) {
        renderX += 12;
    }


    else if (
        animation ===
        "dodge_up"
    ) {
        renderY -= 10;
    }


    else if (
        animation ===
        "dodge_down"
    ) {
        renderY += 10;
    }


    ctx.save();


    ctx.translate(
        renderX,
        renderY
    );


    ctx.scale(
        phaseStyle.scale,
        phaseStyle.scale
    );


    /*
        If clean frame exists:
        USE THE REAL SPRITE.
    */

    if (sprite) {

        const maxHeight = 92;

        const scale =
            Math.min(
                1,
                maxHeight /
                sprite.height
            );


        const drawWidth =
            sprite.width *
            scale;


        const drawHeight =
            sprite.height *
            scale;


        ctx.drawImage(

            sprite,

            -drawWidth / 2,
            -drawHeight / 2,

            drawWidth,
            drawHeight

        );
    }


    /*
        Clean fallback only while an individual
        extracted frame is absent.
    */

    else {

        drawForecastFallback(
            animation,
            now
        );
    }


    ctx.restore();


    /*
        Paradox decoy.
    */

    if (
        now <
        states.decoyUntil
    ) {

        drawForecastDecoy(now);
    }
}


/* ==========================================================
   FALLBACK FORECAST

   NOT the final asset.
   It exists only so missing PNG frames don't crash V0.6.
========================================================== */

function drawForecastFallback(
    animation,
    now
) {

    ctx.save();


    ctx.shadowColor =
        "#ff2020";

    ctx.shadowBlur = 10;


    /*
        Cloak
    */

    ctx.fillStyle =
        "#090909";


    ctx.beginPath();


    ctx.moveTo(
        -26,
        28
    );


    ctx.lineTo(
        -23,
        -12
    );


    ctx.quadraticCurveTo(
        -18,
        -38,
        0,
        -40
    );


    ctx.quadraticCurveTo(
        18,
        -38,
        23,
        -12
    );


    ctx.lineTo(
        26,
        28
    );


    ctx.lineTo(
        0,
        19
    );


    ctx.closePath();


    ctx.fill();


    /*
        Skull
    */

    ctx.shadowBlur = 0;


    ctx.fillStyle =
        "#eeeeee";


    ctx.beginPath();


    ctx.arc(
        0,
        -14,
        16,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.fillRect(
        -10,
        -9,
        20,
        14
    );


    /*
        Eye sockets
    */

    ctx.fillStyle =
        "#050505";


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
        Forecast eye
    */

    ctx.fillStyle =
        "#ff2020";


    ctx.shadowColor =
        "#ff2020";


    ctx.shadowBlur =
        animation ===
        "eye_activate"
            ? 24
            : 10;


    ctx.fillRect(
        5,
        -19,
        6,
        4
    );


    ctx.restore();
}


/* ==========================================================
   PARADOX DECOY
========================================================== */

function drawForecastDecoy(now) {

    ctx.save();


    ctx.globalAlpha =
        0.24 +
        Math.sin(
            now * 0.015
        ) *
        0.08;


    ctx.translate(
        states.decoyX,
        states.decoyY
    );


    ctx.strokeStyle =
        "#ff3030";


    ctx.lineWidth = 2;


    ctx.strokeRect(
        -22,
        -31,
        44,
        62
    );


    ctx.restore();
}


/* ==========================================================
   PROTAGONIST HEART
========================================================== */

function drawProtagonist(now) {

    ctx.save();


    ctx.translate(
        protagonist.x,
        protagonist.y
    );


    if (
        now <
        protagonist.frozenUntil
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


/* ==========================================================
   PLAYER PROJECTILES

   DIFFERENT VISUAL FOR EVERY CLASS.
========================================================== */

function drawPlayerProjectiles(now) {

    for (
        const projectile of
        playerProjectiles
    ) {

        drawProjectileTrail(
            projectile
        );


        ctx.save();


        ctx.translate(
            projectile.x,
            projectile.y
        );


        const angle =
            Math.atan2(
                projectile.vy,
                projectile.vx
            );


        ctx.rotate(angle);


        switch (
            projectile.type
        ) {

            /* GLOCK */

            case "glock_bullet":

                ctx.fillStyle =
                    "#ffffff";


                ctx.fillRect(
                    -5,
                    -2,
                    11,
                    4
                );


                ctx.fillStyle =
                    "#ff3030";


                ctx.fillRect(
                    -11,
                    -1,
                    6,
                    2
                );

                break;


            /* SMG */

            case "smg_bullet":

                ctx.fillStyle =
                    "#ffffff";


                ctx.fillRect(
                    -4,
                    -1,
                    8,
                    3
                );


                ctx.globalAlpha =
                    0.7;


                ctx.fillStyle =
                    "#ff3030";


                ctx.fillRect(
                    -9,
                    -1,
                    5,
                    2
                );

                break;


            /* AR */

            case "ar_round":

                ctx.strokeStyle =
                    "#ff3030";


                ctx.lineWidth = 2;


                ctx.beginPath();


                ctx.moveTo(
                    -22,
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


            /* DMR */

            case "dmr_round":

                ctx.shadowColor =
                    "#ff3030";


                ctx.shadowBlur = 10;


                ctx.strokeStyle =
                    "#ffffff";


                ctx.lineWidth = 3;


                ctx.beginPath();


                ctx.moveTo(
                    -38,
                    0
                );


                ctx.lineTo(
                    12,
                    0
                );


                ctx.stroke();


                ctx.fillStyle =
                    "#ff3030";


                ctx.fillRect(
                    8,
                    -3,
                    13,
                    6
                );

                break;


            /* SHOTGUN */

            case "shotgun_pellet":

                ctx.fillStyle =
                    "#eeeeee";


                ctx.fillRect(
                    -3,
                    -2,
                    7,
                    4
                );

                break;


            /* BONE */

            case "bone":

                drawBoneProjectile();

                break;


            /* CONSTRUCT */

            case "construct_shard":

                ctx.fillStyle =
                    "#ff3030";


                ctx.beginPath();


                ctx.moveTo(
                    10,
                    0
                );


                ctx.lineTo(
                    -8,
                    -6
                );


                ctx.lineTo(
                    -3,
                    0
                );


                ctx.lineTo(
                    -8,
                    6
                );


                ctx.closePath();


                ctx.fill();

                break;


            /* CROSSFIRE */

            case "crossfire_shard":

                ctx.strokeStyle =
                    "#ff3030";


                ctx.fillStyle =
                    "#ffffff";


                ctx.lineWidth = 2;


                ctx.beginPath();


                ctx.moveTo(
                    11,
                    0
                );


                ctx.lineTo(
                    -7,
                    -5
                );


                ctx.lineTo(
                    -7,
                    5
                );


                ctx.closePath();


                ctx.fill();


                ctx.stroke();

                break;
        }


        ctx.restore();
    }
}


/* ==========================================================
   PROJECTILE TRAILS
========================================================== */

function drawProjectileTrail(
    projectile
) {

    if (
        !projectile.trail ||
        projectile.trail.length < 2
    ) {
        return;
    }


    ctx.save();


    ctx.strokeStyle =
        projectile.type ===
        "dmr_round"
            ? "#ffffff"
            : "#ff3030";


    ctx.lineWidth =
        projectile.type ===
        "dmr_round"
            ? 2
            : 1;


    ctx.globalAlpha = 0.35;


    ctx.beginPath();


    ctx.moveTo(
        projectile.trail[0].x,
        projectile.trail[0].y
    );


    for (
        let i = 1;
        i <
        projectile.trail.length;
        i++
    ) {

        ctx.lineTo(
            projectile.trail[i].x,
            projectile.trail[i].y
        );
    }


    ctx.stroke();


    ctx.restore();
}


/* ==========================================================
   BONE PROJECTILE
========================================================== */

function drawBoneProjectile() {

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
        -4,
        5,
        0,
        Math.PI * 2
    );


    ctx.arc(
        -12,
        4,
        5,
        0,
        Math.PI * 2
    );


    ctx.arc(
        12,
        -4,
        5,
        0,
        Math.PI * 2
    );


    ctx.arc(
        12,
        4,
        5,
        0,
        Math.PI * 2
    );


    ctx.fill();
}


/* ==========================================================
   HOSTILE PROJECTILES
========================================================== */

function drawHostileProjectiles(now) {

    for (
        const projectile of
        hostileProjectiles
    ) {

        ctx.save();


        ctx.translate(
            projectile.x,
            projectile.y
        );


        if (
            projectile.type ===
            "protagonist_heavy"
        ) {

            ctx.strokeStyle =
                "#ffffff";


            ctx.lineWidth = 4;


            ctx.shadowColor =
                "#ff3030";


            ctx.shadowBlur = 12;


            ctx.beginPath();


            ctx.arc(
                0,
                0,
                projectile.radius,
                0,
                Math.PI * 2
            );


            ctx.stroke();


            ctx.beginPath();


            ctx.moveTo(
                -projectile.radius,
                0
            );


            ctx.lineTo(
                projectile.radius,
                0
            );


            ctx.stroke();
        }


        else if (
            projectile.type ===
            "protagonist_spread"
        ) {

            ctx.fillStyle =
                "#ff3030";


            ctx.rotate(
                Math.PI / 4
            );


            ctx.fillRect(
                -4,
                -4,
                8,
                8
            );
        }


        else {

            ctx.fillStyle =
                "#ffffff";


            ctx.beginPath();


            ctx.arc(
                0,
                0,
                projectile.radius,
                0,
                Math.PI * 2
            );


            ctx.fill();


            ctx.strokeStyle =
                "#ff3030";


            ctx.lineWidth = 2;


            ctx.stroke();
        }


        ctx.restore();
    }
}


/* ==========================================================
   HAZARD DRAWING
========================================================== */

function drawHazards(now) {

    for (
        const hazard of hazards
    ) {

        const active =
            now >=
            hazard.activateAt;


        ctx.save();


        if (
            hazard.type ===
            "bone_wall"
        ) {

            drawBoneWallHazard(
                hazard,
                active,
                now
            );
        }


        else if (
            hazard.type ===
            "forecast_trap"
        ) {

            drawForecastTrap(
                hazard,
                active,
                now
            );
        }


        else if (
            hazard.type ===
            "false_future_strike"
        ) {

            drawFalseFutureStrike(
                hazard,
                active
            );
        }


        else if (
            hazard.type ===
            "inevitable_strike"
        ) {

            drawInevitableStrike(
                hazard,
                active,
                now
            );
        }


        ctx.restore();
    }
}


/* ==========================================================
   BONE WALL VISUAL
========================================================== */

function drawBoneWallHazard(
    hazard,
    active,
    now
) {

    const height =
        active
            ? 78
            : 18;


    ctx.fillStyle =
        active
            ? "#eeeeee"
            : "rgba(238,238,238,0.28)";


    ctx.fillRect(
        hazard.x - 4,
        hazard.y -
            height / 2,

        8,
        height
    );


    ctx.beginPath();


    ctx.arc(
        hazard.x,
        hazard.y -
            height / 2,
        7,
        0,
        Math.PI * 2
    );


    ctx.arc(
        hazard.x,
        hazard.y +
            height / 2,
        7,
        0,
        Math.PI * 2
    );


    ctx.fill();


    if (!active) {

        ctx.strokeStyle =
            "#ff3030";


        ctx.lineWidth = 1;


        ctx.beginPath();


        ctx.moveTo(
            hazard.x,
            hazard.y - 50
        );


        ctx.lineTo(
            hazard.x,
            hazard.y + 50
        );


        ctx.stroke();
    }
}


/* ==========================================================
   FORECAST TRAP VISUAL
========================================================== */

function drawForecastTrap(
    hazard,
    active,
    now
) {

    const pulse =
        1 +
        Math.sin(
            now * 0.018
        ) *
        0.12;


    ctx.translate(
        hazard.x,
        hazard.y
    );


    ctx.scale(
        pulse,
        pulse
    );


    ctx.strokeStyle =
        active
            ? "#ffffff"
            : "#ff3030";


    ctx.lineWidth =
        active
            ? 4
            : 2;


    if (!active) {

        ctx.setLineDash([
            5,
            5
        ]);
    }


    ctx.beginPath();


    ctx.arc(
        0,
        0,
        hazard.radius,
        0,
        Math.PI * 2
    );


    ctx.stroke();


    ctx.beginPath();


    ctx.moveTo(
        -hazard.radius,
        0
    );


    ctx.lineTo(
        hazard.radius,
        0
    );


    ctx.moveTo(
        0,
        -hazard.radius
    );


    ctx.lineTo(
        0,
        hazard.radius
    );


    ctx.stroke();
}


/* ==========================================================
   FALSE FUTURE STRIKE
========================================================== */

function drawFalseFutureStrike(
    hazard,
    active
) {

    ctx.strokeStyle =
        active
            ? "#ffffff"
            : "#ff3030";


    ctx.shadowColor =
        "#ff3030";


    ctx.shadowBlur =
        active
            ? 18
            : 5;


    ctx.lineWidth =
        active
            ? 6
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


    if (active) {

        ctx.beginPath();


        ctx.moveTo(
            hazard.x -
                hazard.radius,
            hazard.y -
                hazard.radius
        );


        ctx.lineTo(
            hazard.x +
                hazard.radius,
            hazard.y +
                hazard.radius
        );


        ctx.moveTo(
            hazard.x +
                hazard.radius,
            hazard.y -
                hazard.radius
        );


        ctx.lineTo(
            hazard.x -
                hazard.radius,
            hazard.y +
                hazard.radius
        );


        ctx.stroke();
    }
}


/* ==========================================================
   INEVITABLE VISUAL
========================================================== */

function drawInevitableStrike(
    hazard,
    active,
    now
) {

    const rotation =
        now * 0.004;


    ctx.translate(
        hazard.x,
        hazard.y
    );


    ctx.rotate(rotation);


    ctx.strokeStyle =
        active
            ? "#ffffff"
            : "#ff3030";


    ctx.shadowColor =
        "#ff3030";


    ctx.shadowBlur =
        active
            ? 24
            : 8;


    ctx.lineWidth =
        active
            ? 5
            : 2;


    ctx.beginPath();


    ctx.arc(
        0,
        0,
        hazard.radius,
        0,
        Math.PI * 2
    );


    ctx.stroke();


    ctx.rotate(
        -rotation * 2
    );


    ctx.beginPath();


    ctx.rect(
        -hazard.radius * 0.55,
        -hazard.radius * 0.55,

        hazard.radius * 1.1,
        hazard.radius * 1.1
    );


    ctx.stroke();


    ctx.beginPath();


    ctx.arc(
        0,
        0,
        hazard.radius * 0.35,
        0,
        Math.PI * 2
    );


    ctx.stroke();
}


/* ==========================================================
   CONSTRUCT DRAWING
========================================================== */

function drawConstructs(now) {

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
            "#ff3030";


        ctx.shadowColor =
            "#ff3030";


        ctx.shadowBlur = 9;


        ctx.lineWidth = 2;


        ctx.beginPath();


        ctx.moveTo(
            0,
            -17
        );


        ctx.lineTo(
            15,
            9
        );


        ctx.lineTo(
            0,
            4
        );


        ctx.lineTo(
            -15,
            9
        );


        ctx.closePath();


        ctx.stroke();


        ctx.restore();
    }
}


/* ==========================================================
   ILLUSION DRAWING
========================================================== */

function drawIllusions(now) {

    for (
        const illusion of
        illusions
    ) {

        ctx.save();


        ctx.globalAlpha =
            0.20 +
            Math.sin(
                now * 0.012 +
                illusion.phase
            ) *
            0.08;


        ctx.translate(
            illusion.x,
            illusion.y
        );


        ctx.strokeStyle =
            "#ff3030";


        ctx.lineWidth = 2;


        ctx.beginPath();


        ctx.arc(
            0,
            -12,
            12,
            0,
            Math.PI * 2
        );


        ctx.stroke();


        ctx.beginPath();


        ctx.moveTo(
            -18,
            28
        );


        ctx.lineTo(
            -14,
            -2
        );


        ctx.lineTo(
            14,
            -2
        );


        ctx.lineTo(
            18,
            28
        );


        ctx.stroke();


        ctx.restore();
    }
}


/* ==========================================================
   GASTER RENDERER
========================================================== */

function drawGaster(now) {

    if (!activeBeam) {
        return;
    }


    const beamEnd =
        getBeamEnd(
            activeBeam
        );


    const charging =
        now <
        activeBeam.chargeUntil;


    ctx.save();


    /*
        Gaster hand / emitter.
    */

    const angle =
        Math.atan2(

            activeBeam.targetY -
            activeBeam.y,

            activeBeam.targetX -
            activeBeam.x

        );


    const emitterX =
        activeBeam.x +
        Math.cos(angle) *
        42;


    const emitterY =
        activeBeam.y +
        Math.sin(angle) *
        42;


    ctx.translate(
        emitterX,
        emitterY
    );


    ctx.rotate(angle);


    ctx.strokeStyle =
        "#eeeeee";


    ctx.fillStyle =
        "#090909";


    ctx.shadowColor =
        "#ff3030";


    ctx.shadowBlur =
        charging
            ? 10
            : 22;


    ctx.lineWidth = 3;


    ctx.beginPath();


    ctx.moveTo(
        -18,
        -15
    );


    ctx.lineTo(
        18,
        -10
    );


    ctx.lineTo(
        25,
        0
    );


    ctx.lineTo(
        18,
        10
    );


    ctx.lineTo(
        -18,
        15
    );


    ctx.closePath();


    ctx.fill();


    ctx.stroke();


    ctx.beginPath();


    ctx.arc(
        8,
        0,
        6,
        0,
        Math.PI * 2
    );


    ctx.stroke();


    ctx.restore();


    /*
        Charge line / beam.
    */

    ctx.save();


    ctx.beginPath();


    ctx.moveTo(
        activeBeam.x,
        activeBeam.y
    );


    ctx.lineTo(
        beamEnd.x,
        beamEnd.y
    );


    if (charging) {

        ctx.strokeStyle =
            "rgba(255,48,48,0.65)";


        ctx.lineWidth = 2;


        ctx.setLineDash([
            7,
            6
        ]);
    }


    else {

        ctx.shadowColor =
            "#ff3030";


        ctx.shadowBlur = 24;


        ctx.strokeStyle =
            "#ff3030";


        ctx.lineWidth =
            activeBeam.width;
    }


    ctx.stroke();


    if (!charging) {

        ctx.shadowBlur = 0;


        ctx.strokeStyle =
            "#ffffff";


        ctx.lineWidth =
            activeBeam.width *
            0.30;


        ctx.stroke();
    }


    ctx.restore();
}


/* ==========================================================
   GASTER BEAM END
========================================================== */

function getBeamEnd(beam) {

    const angle =
        Math.atan2(

            beam.targetY -
            beam.y,

            beam.targetX -
            beam.x

        );


    const length =
        Math.max(
            width,
            height
        ) * 1.7;


    return {

        x:
            beam.x +
            Math.cos(angle) *
            length,

        y:
            beam.y +
            Math.sin(angle) *
            length
    };
}


/* ==========================================================
   SCYTHE RENDERER
========================================================== */

function drawScythe(now) {

    if (!activeScythe) {
        return;
    }


    let progress = 0;


    if (
        activeScythe.stage ===
        "swing"
    ) {

        progress =
            clamp(

                (
                    now -
                    activeScythe.swingAt
                ) /
                620,

                0,
                1
            );
    }


    const angle =
        activeScythe.stage ===
        "summon"
            ? -1.5
            : -2 +
              progress *
              Math.PI *
              1.55;


    ctx.save();


    ctx.translate(
        forecast.worldX,
        forecast.worldY
    );


    ctx.rotate(angle);


    /*
        Handle
    */

    ctx.strokeStyle =
        "#eeeeee";


    ctx.lineWidth = 5;


    ctx.beginPath();


    ctx.moveTo(
        0,
        0
    );


    ctx.lineTo(
        125,
        0
    );


    ctx.stroke();


    /*
        Blade
    */

    ctx.strokeStyle =
        "#ff3030";


    ctx.shadowColor =
        "#ff3030";


    ctx.shadowBlur = 18;


    ctx.lineWidth = 8;


    ctx.beginPath();


    ctx.arc(
        116,
        -22,
        37,
        0.25,
        2.85
    );


    ctx.stroke();


    ctx.restore();


    /*
        Slash trail
    */

    if (
        activeScythe.stage ===
        "swing"
    ) {

        ctx.save();


        ctx.globalAlpha =
            0.38;


        ctx.strokeStyle =
            "#ff3030";


        ctx.lineWidth = 5;


        ctx.beginPath();


        ctx.arc(
            forecast.worldX,
            forecast.worldY,
            128,
            -2,
            angle
        );


        ctx.stroke();


        ctx.restore();
    }
}


/* ==========================================================
   EFFECT RENDERER
========================================================== */

function drawEffects(now) {

    for (
        const effect of effects
    ) {

        const ratio =
            effect.maxLife
                ? clamp(
                    effect.life /
                    effect.maxLife,
                    0,
                    1
                )
                : 1;


        ctx.save();


        /* DODGE AFTERIMAGE */

        if (
            effect.type ===
            "dodge_afterimage"
        ) {

            ctx.globalAlpha =
                ratio * 0.5;


            ctx.strokeStyle =
                "#ff3030";


            ctx.lineWidth = 2;


            let offsetX = 0;
            let offsetY = 0;


            if (
                effect.animation ===
                "dodge_left"
            ) {
                offsetX = -30;
            }


            else if (
                effect.animation ===
                "dodge_right"
            ) {
                offsetX = 30;
            }


            else if (
                effect.animation ===
                "dodge_up"
            ) {
                offsetY = -25;
            }


            else if (
                effect.animation ===
                "dodge_down"
            ) {
                offsetY = 25;
            }


            ctx.strokeRect(

                effect.x -
                    22 +
                    offsetX *
                    (
                        1 -
                        ratio
                    ),

                effect.y -
                    31 +
                    offsetY *
                    (
                        1 -
                        ratio
                    ),

                44,
                62

            );
        }


        /* DODGE FLASH */

        else if (
            effect.type ===
            "dodge_flash"
        ) {

            ctx.globalAlpha =
                ratio;


            ctx.strokeStyle =
                "#ffffff";


            ctx.beginPath();


            ctx.arc(
                effect.x,
                effect.y,
                15 +
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


        /* MUZZLE FLASH */

        else if (
            effect.type ===
            "muzzle_flash"
        ) {

            ctx.translate(
                effect.x,
                effect.y
            );


            ctx.globalAlpha =
                ratio;


            ctx.fillStyle =
                "#ff3030";


            const size =
                effect.variant ===
                "shotgun"
                    ? 18
                    : effect.variant ===
                      "precision"
                        ? 14
                        : 10;


            ctx.beginPath();


            ctx.moveTo(
                size,
                0
            );


            ctx.lineTo(
                -size * 0.5,
                -size * 0.4
            );


            ctx.lineTo(
                -size * 0.15,
                0
            );


            ctx.lineTo(
                -size * 0.5,
                size * 0.4
            );


            ctx.closePath();


            ctx.fill();
        }


        /* DMR PREDICTION */

        else if (
            effect.type ===
            "dmr_prediction"
        ) {

            ctx.globalAlpha =
                ratio;


            ctx.strokeStyle =
                "#ffffff";


            ctx.lineWidth = 2;


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


        /* IMPACT */

        else if (
            effect.type ===
            "impact"
        ) {

            ctx.translate(
                effect.x,
                effect.y
            );


            ctx.globalAlpha =
                ratio;


            ctx.strokeStyle =
                effect.variant ===
                "scythe"
                    ? "#ff3030"
                    : "#ffffff";


            ctx.lineWidth = 3;


            const size =
                8 +
                (
                    1 -
                    ratio
                ) *
                20;


            ctx.beginPath();


            ctx.moveTo(
                -size,
                -size
            );


            ctx.lineTo(
                size,
                size
            );


            ctx.moveTo(
                size,
                -size
            );


            ctx.lineTo(
                -size,
                size
            );


            ctx.stroke();
        }


        /* EYE */

        else if (
            effect.type ===
            "eye_activation"
        ) {

            ctx.globalAlpha =
                ratio;


            ctx.strokeStyle =
                "#ff3030";


            ctx.shadowColor =
                "#ff3030";


            ctx.shadowBlur = 22;


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
                35,
                0,
                Math.PI * 2
            );


            ctx.stroke();
        }


        /* NULL */

        else if (
            effect.type ===
            "null_wave"
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
                20 +
                (
                    1 -
                    ratio
                ) *
                180,
                0,
                Math.PI * 2
            );


            ctx.stroke();
        }


        /* CROSSHAIR */

        else if (
            effect.type ===
            "crosshair"
        ) {

            ctx.globalAlpha =
                ratio;


            ctx.strokeStyle =
                "#ff3030";


            ctx.lineWidth = 2;


            ctx.beginPath();


            ctx.arc(
                effect.x,
                effect.y,
                30,
                0,
                Math.PI * 2
            );


            ctx.stroke();


            ctx.beginPath();


            ctx.moveTo(
                effect.x - 45,
                effect.y
            );


            ctx.lineTo(
                effect.x + 45,
                effect.y
            );


            ctx.moveTo(
                effect.x,
                effect.y - 45
            );


            ctx.lineTo(
                effect.x,
                effect.y + 45
            );


            ctx.stroke();
        }


        /* FALSE FUTURE MARKER */

        else if (
            effect.type ===
            "false_future_marker"
        ) {

            ctx.globalAlpha =
                ratio;


            ctx.strokeStyle =
                "#ff3030";


            ctx.setLineDash([
                6,
                5
            ]);


            ctx.strokeRect(
                effect.x - 30,
                effect.y - 30,
                60,
                60
            );
        }


        /* FUTURE BREAK */

        else if (
            effect.type ===
            "future_break"
        ) {

            ctx.globalAlpha =
                ratio;


            ctx.strokeStyle =
                "#ffffff";


            ctx.lineWidth = 2;


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


        /* INEVITABLE START */

        else if (
            effect.type ===
            "inevitable_start"
        ) {

            ctx.globalAlpha =
                ratio;


            ctx.strokeStyle =
                "#ff3030";


            ctx.shadowColor =
                "#ff3030";


            ctx.shadowBlur = 25;


            ctx.lineWidth = 4;


            ctx.beginPath();


            ctx.arc(
                effect.x,
                effect.y,
                30 +
                (
                    1 -
                    ratio
                ) *
                130,
                0,
                Math.PI * 2
            );


            ctx.stroke();
        }


        /* INEVITABLE LOCK */

        else if (
            effect.type ===
            "inevitable_lock"
        ) {

            ctx.globalAlpha =
                ratio;


            ctx.strokeStyle =
                "#ff3030";


            ctx.lineWidth = 3;


            ctx.beginPath();


            ctx.arc(
                effect.x,
                effect.y,
                26,
                0,
                Math.PI * 2
            );


            ctx.stroke();


            ctx.strokeRect(
                effect.x - 18,
                effect.y - 18,
                36,
                36
            );
        }


        /* PHASE CHANGE */

        else if (
            effect.type ===
            "phase_change"
        ) {

            ctx.globalAlpha =
                ratio;


            ctx.strokeStyle =
                "#ff3030";


            ctx.shadowColor =
                "#ff3030";


            ctx.shadowBlur = 25;


            ctx.lineWidth = 5;


            const radius =
                25 +
                (
                    1 -
                    ratio
                ) *
                130;


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


        /* FREEZE */

        else if (
            effect.type ===
            "freeze_lock"
        ) {

            ctx.globalAlpha =
                ratio;


            ctx.strokeStyle =
                "#ffffff";


            ctx.lineWidth = 2;


            ctx.strokeRect(
                effect.x - 20,
                effect.y - 20,
                40,
                40
            );
        }


        /* ILLUSION BURST */

        else if (
            effect.type ===
            "illusion_burst"
        ) {

            ctx.globalAlpha =
                ratio * 0.5;


            ctx.strokeStyle =
                "#ff3030";


            ctx.beginPath();


            ctx.arc(
                effect.x,
                effect.y,
                20 +
                (
                    1 -
                    ratio
                ) *
                80,
                0,
                Math.PI * 2
            );


            ctx.stroke();
        }


        ctx.restore();
    }
}


/* ==========================================================
   HUD
========================================================== */

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
        clamp(
            protagonist.hp /
            protagonist.maxHp *
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
            `${Math.ceil(
                protagonist.hp
            )} / ${protagonist.maxHp}`;
    }
}


function updateStaminaHUD(
    temporaryText = null
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
        clamp(
            forecast.stamina /
            forecast.maxStamina *
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
            `${Math.ceil(
                forecast.stamina
            )} / ${forecast.maxStamina}`;
    }


    if (status) {

        if (temporaryText) {

            status.textContent =
                temporaryText;
        }


        else if (
            forecast.stamina <
            BASE_DODGE_COST
        ) {

            status.textContent =
                "AUTO-DODGE EXHAUSTED";
        }


        else if (
            turn ===
            TURN.PROTAGONIST
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


    const combat =
        document.getElementById(
            "combatStatusText"
        );


    if (banner) {

        switch (turn) {

            case TURN.FORECAST:

                banner.textContent =
                    "FORECAST TURN";

                break;


            case TURN.PROTAGONIST:

                banner.textContent =
                    "PROTAGONIST TURN";

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


    if (combat) {

        combat.textContent =
            turn ===
            TURN.PROTAGONIST
                ? "AUTO-DODGE"
                : turn ===
                  TURN.FORECAST
                    ? "ATTACK"
                    : "WAIT";
    }
}


/* ==========================================================
   FORECAST ABILITIES

   PREDICT
   DEEP FORECAST
   ABSOLUTE FORECAST

   Existing game.js can pass either a number or a mode.
========================================================== */

function activatePrediction(
    value = 1800
) {

    let duration;


    if (
        typeof value ===
        "number"
    ) {

        duration = value;
    }


    else {

        switch (value) {

            case "deep":
                duration = 3200;
                break;

            case "absolute":
                duration = 5200;
                break;

            default:
                duration = 1800;
                break;
        }
    }


    states.predictionUntil =
        Math.max(

            states.predictionUntil,

            performance.now() +
            duration

        );


    Animation.play(
        "eye_activate",
        350
    );


    effects.push({

        type:
            "eye_activation",

        x:
            forecast.worldX,

        y:
            forecast.worldY - 15,

        life: 0.4,
        maxLife: 0.4

    });
}


/* ==========================================================
   MESSAGE
========================================================== */

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


/* ==========================================================
   COMPATIBILITY

   Old UI may still call Battle.setMovement().
   It intentionally does NOTHING.

   Forecast has NO manual movement.
========================================================== */

function setMovement() {}


/* ==========================================================
   HELPERS
========================================================== */

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


    t =
        clamp(
            t,
            0,
            1
        );


    const closestX =
        x1 +
        t * vx;


    const closestY =
        y1 +
        t * vy;


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


/* ==========================================================
   PUBLIC API
========================================================== */

return {

    init,

    reset,

    setMovement,


    getTurn() {
        return turn;
    },


    isForecastTurn() {
        return (
            turn ===
            TURN.FORECAST
        );
    },


    getStamina() {
        return forecast.stamina;
    },


    getMaxStamina() {
        return forecast.maxStamina;
    },


    activatePrediction

};

})();