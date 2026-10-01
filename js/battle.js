/* ==========================================================
   FORECAST!SANS — SAME END ANYWAY
   BATTLE ENGINE V0.7

   PART 1 / 2

   - Single forecast-spritesheet.png
   - Forecast stays ABOVE the battle box
   - No manual Forecast movement
   - Touch/mouse aiming
   - Stationary auto-dodge
   - Animation controller
   - Phase 1 -> 5 support
========================================================== */

const Battle = (() => {
"use strict";

/* ==========================================================
   CANVAS / ENGINE
========================================================== */

let canvas = null;
let ctx = null;

let width = 0;
let height = 0;
let dpr = 1;

let running = false;
let lastFrame = 0;
let eventsInstalled = false;


/* ==========================================================
   TURNS
========================================================== */

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
const PROTAGONIST_TURN_MS = 6500;
const TRANSITION_MS = 650;


/* ==========================================================
   ARENA
========================================================== */

const arena = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
};


/* ==========================================================
   FORECAST
========================================================== */

const forecast = {
    x: 0,
    y: 0,

    radius: 22,

    stamina: 100,
    maxStamina: 100,

    invulnerableUntil: 0,

    dodgeChain: 0,
    lastDodgeAt: 0,

    lowStaminaShown: false
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

    speed: 120,

    targetX: 0,
    targetY: 0,

    nextTargetAt: 0,
    frozenUntil: 0,

    vx: 0,
    vy: 0
};


/* ==========================================================
   HELPERS
========================================================== */

function clamp(value, min, max) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}


function lerp(a, b, t) {
    return a + (b - a) * t;
}


function distance(ax, ay, bx, by) {

    const dx = bx - ax;
    const dy = by - ay;

    return Math.sqrt(
        dx * dx +
        dy * dy
    );
}


function random(min, max) {
    return (
        min +
        Math.random() *
        (max - min)
    );
}


function nowTime() {
    return performance.now();
}


/* ==========================================================
   FORECAST POSITION

   IMPORTANT:
   DODGING NEVER CHANGES THESE COORDINATES.
========================================================== */

function positionForecast() {

    forecast.x =
        width * 0.5;

    forecast.y =
        arena.top - 78;
}


/* ==========================================================
   SPRITESHEET

   FILE:
   /forecast-spritesheet.png

   Generated sheet:
   6 columns
   193 x 109 cells
========================================================== */

const ForecastSprites = (() => {

    const sheet = new Image();

    let loaded = false;
    let failed = false;

    const CELL_W = 193;
    const CELL_H = 109;
    const COLS = 6;

    const order = [

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

    const frames = {};

    order.forEach(
        (name, index) => {

            frames[name] = {

                sx:
                    (index % COLS) *
                    CELL_W,

                sy:
                    Math.floor(
                        index / COLS
                    ) *
                    CELL_H,

                sw: CELL_W,
                sh: CELL_H
            };
        }
    );


    function load() {

        loaded = false;
        failed = false;

        sheet.onload = () => {

            loaded = true;

            console.log(
                "[FORECAST] spritesheet loaded:",
                sheet.width,
                sheet.height
            );
        };


        sheet.onerror = () => {

            failed = true;

            console.error(
                "[FORECAST] failed to load forecast-spritesheet.png"
            );
        };


        sheet.src =
            "./forecast-spritesheet.png";
    }


    function get(name) {

        if (
            !loaded ||
            failed
        ) {
            return null;
        }

        const frame =
            frames[name];

        if (!frame) {
            return null;
        }

        return {
            image: sheet,

            sx: frame.sx,
            sy: frame.sy,
            sw: frame.sw,
            sh: frame.sh
        };
    }


    function isLoaded() {
        return loaded;
    }


    return {
        load,
        get,
        isLoaded
    };

})();


/* ==========================================================
   ANIMATION CONTROLLER
========================================================== */

const Animation = (() => {

    const definitions = {

        idle: {
            frames: [
                "idle_1",
                "idle_2",
                "idle_3",
                "idle_2"
            ],
            fps: 4,
            loop: true
        },

        blink: {
            frames: [
                "idle_1",
                "blink",
                "idle_1"
            ],
            fps: 10,
            loop: false
        },

        look_down: {
            frames: [
                "look_down"
            ],
            fps: 1,
            loop: false
        },

        look_up: {
            frames: [
                "look_up"
            ],
            fps: 1,
            loop: false
        },

        cloak_flow: {
            frames: [
                "idle_1",
                "cloak_flow",
                "idle_2",
                "cloak_flow"
            ],
            fps: 6,
            loop: true
        },

        dodge_left: {
            frames: [
                "idle_1",
                "dodge_left",
                "dodge_afterimage"
            ],
            fps: 15,
            loop: false
        },

        dodge_right: {
            frames: [
                "idle_1",
                "dodge_right",
                "dodge_afterimage"
            ],
            fps: 15,
            loop: false
        },

        dodge_up: {
            frames: [
                "idle_1",
                "dodge_up",
                "dodge_afterimage"
            ],
            fps: 15,
            loop: false
        },

        dodge_down: {
            frames: [
                "idle_1",
                "dodge_down",
                "dodge_afterimage"
            ],
            fps: 15,
            loop: false
        },

        glock_fire: {
            frames: [
                "gun_pose",
                "gun_fire",
                "gun_pose"
            ],
            fps: 15,
            loop: false
        },

        smg_fire: {
            frames: [
                "gun_pose",
                "gun_fire",
                "gun_pose",
                "gun_fire",
                "gun_pose"
            ],
            fps: 19,
            loop: false
        },

        ar_fire: {
            frames: [
                "gun_pose",
                "gun_fire",
                "gun_pose"
            ],
            fps: 15,
            loop: false
        },

        dmr_fire: {
            frames: [
                "gun_pose",
                "gun_fire",
                "gun_pose"
            ],
            fps: 11,
            loop: false
        },

        shotgun_fire: {
            frames: [
                "gun_pose",
                "gun_fire",
                "gun_pose"
            ],
            fps: 12,
            loop: false
        },

        bone_control: {
            frames: [
                "idle_1",
                "bone_control",
                "bone_control",
                "idle_1"
            ],
            fps: 10,
            loop: false
        },

        eye_activate: {
            frames: [
                "idle_1",
                "eye_activate",
                "eye_activate",
                "idle_1"
            ],
            fps: 10,
            loop: false
        },

        scythe_summon: {
            frames: [
                "idle_1",
                "summon_scythe",
                "scythe_ready"
            ],
            fps: 10,
            loop: false
        },

        scythe_swing: {
            frames: [
                "scythe_ready",
                "scythe_swing",
                "scythe_finish"
            ],
            fps: 14,
            loop: false
        },

        gaster_charge: {
            frames: [
                "bone_control",
                "eye_activate"
            ],
            fps: 7,
            loop: true
        },

        gaster_fire: {
            frames: [
                "eye_activate",
                "bone_control",
                "idle_1"
            ],
            fps: 12,
            loop: false
        },

        hit: {
            frames: [
                "hit"
            ],
            fps: 1,
            loop: false
        },

        low_stamina: {
            frames: [
                "low_stamina"
            ],
            fps: 1,
            loop: true
        },

        exhausted: {
            frames: [
                "exhausted"
            ],
            fps: 1,
            loop: true
        },

        phase_change: {
            frames: [
                "idle_1",
                "phase_change",
                "phase_change",
                "idle_1"
            ],
            fps: 10,
            loop: false
        }
    };


    let current = "idle";
    let startedAt = 0;
    let endsAt = Infinity;


    function play(
        name,
        duration = null
    ) {

        if (!definitions[name]) {
            name = "idle";
        }

        current = name;

        startedAt =
            nowTime();

        const definition =
            definitions[name];


        if (duration !== null) {

            endsAt =
                startedAt +
                duration;

        } else if (
            definition.loop
        ) {

            endsAt = Infinity;

        } else {

            endsAt =
                startedAt +
                (
                    definition.frames.length /
                    definition.fps
                ) *
                1000;
        }
    }


    function update(now) {

        if (
            current !== "idle" &&
            current !== "low_stamina" &&
            current !== "exhausted" &&
            now >= endsAt
        ) {

            play("idle");
        }
    }


    function getFrame(now) {

        const definition =
            definitions[current];

        if (!definition) {
            return "idle_1";
        }


        const elapsed =
            Math.max(
                0,
                now - startedAt
            );


        let frameIndex =
            Math.floor(
                elapsed /
                (
                    1000 /
                    definition.fps
                )
            );


        if (definition.loop) {

            frameIndex %=
                definition.frames.length;

        } else {

            frameIndex =
                Math.min(
                    frameIndex,
                    definition.frames.length - 1
                );
        }


        return (
            definition.frames[
                frameIndex
            ]
        );
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
   PHASE VISUAL POWER
========================================================== */

const PHASE_STYLE = {

    "1": {
        aura: 0.10,
        scale: 1.00
    },

    "1.5": {
        aura: 0.16,
        scale: 1.00
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
        aura: 0.62,
        scale: 1.04
    },

    "5": {
        aura: 0.82,
        scale: 1.06
    }
};


/* ==========================================================
   COMBAT OBJECTS
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
   AIM SYSTEM
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

    deepForecastUntil: 0,

    absoluteForecastUntil: 0,

    domainUntil: 0,

    heroismUntil: 0,

    evolutionUntil: 0,

    deadlockUntil: 0,

    observeUntil: 0,

    vectorUntil: 0,

    momentUntil: 0,

    illusionUntil: 0
};


/* ==========================================================
   ADAPTATION
========================================================== */

const adaptation = {

    aimedSeen: 0,
    spreadSeen: 0,
    heavySeen: 0
};


/* ==========================================================
   INIT
========================================================== */

function init(element) {

    if (!element) {

        throw new Error(
            "Battle.init: canvas missing."
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


    ctx.imageSmoothingEnabled =
        false;


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
        nowTime();


    requestAnimationFrame(loop);
}


/* ==========================================================
   RESIZE
========================================================== */

function resize() {

    if (!canvas) {
        return;
    }


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
            390,
            rect.height ||
            500
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


    ctx.imageSmoothingEnabled =
        false;


    const boxWidth =
        Math.min(
            width * 0.82,
            720
        );


    const boxHeight =
        clamp(
            height * 0.35,
            160,
            285
        );


    arena.left =
        (
            width -
            boxWidth
        ) / 2;


    arena.right =
        arena.left +
        boxWidth;


    /*
        Enough space ABOVE the arena
        for Forecast.
    */

    arena.top =
        clamp(
            height * 0.37,
            175,
            260
        );


    arena.bottom =
        arena.top +
        boxHeight;


    if (
        arena.bottom >
        height - 35
    ) {

        arena.bottom =
            height - 35;
    }


    if (
        arena.bottom <
        arena.top + 140
    ) {

        arena.bottom =
            arena.top + 140;
    }


    positionForecast();


    protagonist.x =
        clamp(
            protagonist.x ||
            width * 0.5,

            arena.left + 20,
            arena.right - 20
        );


    protagonist.y =
        clamp(
            protagonist.y ||
            (
                arena.top +
                arena.bottom
            ) / 2,

            arena.top + 20,
            arena.bottom - 20
        );
}


/* ==========================================================
   RESET
========================================================== */

function reset() {

    const now =
        nowTime();


    forecast.stamina =
        forecast.maxStamina;

    forecast.invulnerableUntil = 0;

    forecast.dodgeChain = 0;
    forecast.lastDodgeAt = 0;

    forecast.lowStaminaShown =
        false;


    protagonist.hp =
        protagonist.maxHp;

    protagonist.x =
        width * 0.5;

    protagonist.y =
        lerp(
            arena.top,
            arena.bottom,
            0.62
        );

    protagonist.vx = 0;
    protagonist.vy = 0;

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


    for (
        const key
        in states
    ) {

        states[key] = 0;
    }


    adaptation.aimedSeen = 0;
    adaptation.spreadSeen = 0;
    adaptation.heavySeen = 0;


    aim.active = false;
    aim.pointerId = null;

    aim.x =
        protagonist.x;

    aim.y =
        protagonist.y;

    aim.predictedX =
        protagonist.x;

    aim.predictedY =
        protagonist.y;


    turn =
        TURN.FORECAST;

    turnStarted = now;

    transitionUntil = 0;


    positionForecast();


    Animation.play(
        "idle"
    );


    updateEnemyHUD();

    updateStaminaHUD();

    updateTurnHUD();
}


/* ==========================================================
   EVENT INSTALLATION
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
        "forecast-ability-activate",

        event => {

            activateForecastAbility(
                event.detail || {}
            );
        }
    );


    window.addEventListener(
        "forecast-phase-change",

        () => {

            onPhaseChange();
        }
    );


    /*
        TOUCH + MOUSE AIMING
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
   POINTER AIMING
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
        turn !==
        TURN.FORECAST
    ) {
        return;
    }


    const p =
        pointerPosition(event);


    aim.active = true;

    aim.pointerId =
        event.pointerId;

    aim.x = p.x;
    aim.y = p.y;


    updatePrediction();


    try {

        canvas.setPointerCapture(
            event.pointerId
        );

    } catch (_) {}


    event.preventDefault();
}


function pointerMove(event) {

    if (
        !aim.active ||
        event.pointerId !==
        aim.pointerId
    ) {
        return;
    }


    const p =
        pointerPosition(event);


    aim.x = p.x;
    aim.y = p.y;


    updatePrediction();


    event.preventDefault();
}


function pointerUp(event) {

    if (
        event.pointerId !==
        aim.pointerId
    ) {
        return;
    }


    const p =
        pointerPosition(event);


    aim.x = p.x;
    aim.y = p.y;


    updatePrediction();


    aim.active = false;
    aim.pointerId = null;


    event.preventDefault();
}


/* ==========================================================
   PREDICTION TARGET
========================================================== */

function updatePrediction() {

    const lead =
        states.absoluteForecastUntil >
        nowTime()
            ? 0.75
            :
        states.deepForecastUntil >
        nowTime()
            ? 0.55
            :
        states.predictionUntil >
        nowTime()
            ? 0.35
            :
              0.18;


    aim.predictedX =
        clamp(
            protagonist.x +
            protagonist.vx *
            lead,

            arena.left + 12,
            arena.right - 12
        );


    aim.predictedY =
        clamp(
            protagonist.y +
            protagonist.vy *
            lead,

            arena.top + 12,
            arena.bottom - 12
        );
}


/* ==========================================================
   MAIN LOOP
========================================================== */

function loop(now) {

    if (!running) {
        return;
    }


    const dt =
        Math.min(
            (
                now -
                lastFrame
            ) / 1000,

            0.05
        );


    lastFrame = now;


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
        Forecast is LOCKED here every frame.

        Dodge animation cannot change
        his real position.
    */

    positionForecast();


    Animation.update(now);


    updateTurns(now);


    updateProtagonist(
        dt,
        now
    );


    updatePrediction();


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


    updateEffects(
        dt,
        now
    );


    updateBeam(
        dt,
        now
    );


    updateScythe(
        dt,
        now
    );


    regenerateStamina(
        dt,
        now
    );


    updateForecastCondition(
        now
    );


    updateEnemyHUD();
    updateStaminaHUD();
}


/* ==========================================================
   TURN SYSTEM
========================================================== */

function updateTurns(now) {

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

            beginForecastTurn();
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
        FORECAST_TURN_MS
    ) {

        beginProtagonistTurn();

        return;
    }


    if (
        turn ===
        TURN.PROTAGONIST &&
        elapsed >=
        PROTAGONIST_TURN_MS
    ) {

        beginTransition();
    }
}


function beginForecastTurn() {

    turn =
        TURN.FORECAST;


    turnStarted =
        nowTime();


    hostileProjectiles = [];
    hazards = [];


    aim.active = false;
    aim.pointerId = null;


    Animation.play(
        "idle"
    );


    updateTurnHUD();


    sendMessage(
        "Your turn. Drag across the battle area to aim."
    );
}


function beginProtagonistTurn() {

    turn =
        TURN.PROTAGONIST;


    turnStarted =
        nowTime();


    playerProjectiles = [];


    aim.active = false;
    aim.pointerId = null;


    spawnProtagonistPattern();


    updateTurnHUD();


    sendMessage(
        "The protagonist attacks."
    );
}


function beginTransition() {

    turn =
        TURN.TRANSITION;


    transitionUntil =
        nowTime() +
        TRANSITION_MS;


    hostileProjectiles = [];
    hazards = [];


    updateTurnHUD();
}


/* ==========================================================
   PROTAGONIST AI
========================================================== */

function chooseProtagonistTarget() {

    protagonist.targetX =
        random(
            arena.left + 25,
            arena.right - 25
        );


    protagonist.targetY =
        random(
            arena.top + 25,
            arena.bottom - 25
        );


    protagonist.nextTargetAt =
        nowTime() +
        random(
            450,
            1100
        );
}


function updateProtagonist(
    dt,
    now
) {

    if (
        protagonist.hp <= 0
    ) {
        return;
    }


    if (
        now <
        protagonist.frozenUntil
    ) {

        protagonist.vx = 0;
        protagonist.vy = 0;

        return;
    }


    if (
        now >=
        protagonist.nextTargetAt ||
        distance(
            protagonist.x,
            protagonist.y,
            protagonist.targetX,
            protagonist.targetY
        ) < 12
    ) {

        chooseProtagonistTarget();
    }


    const dx =
        protagonist.targetX -
        protagonist.x;


    const dy =
        protagonist.targetY -
        protagonist.y;


    const len =
        Math.max(
            0.001,
            Math.sqrt(
                dx * dx +
                dy * dy
            )
        );


    let speed =
        protagonist.speed;


    if (
        states.deadlockUntil >
        now
    ) {

        speed *= 0.45;
    }


    protagonist.vx =
        dx /
        len *
        speed;


    protagonist.vy =
        dy /
        len *
        speed;


    protagonist.x +=
        protagonist.vx *
        dt;


    protagonist.y +=
        protagonist.vy *
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
   STAMINA
========================================================== */

function regenerateStamina(
    dt,
    now
) {

    let regen = 16;


    if (
        turn ===
        TURN.FORECAST
    ) {

        regen *= 1.35;
    }


    if (
        states.heroismUntil >
        now
    ) {

        regen *= 1.25;
    }


    forecast.stamina =
        Math.min(
            forecast.maxStamina,
            forecast.stamina +
            regen * dt
        );
}


/* ==========================================================
   AUTO DODGE

   IMPORTANT:
   NO x/y MOVEMENT.
========================================================== */

function attemptAutoDodge(
    projectile,
    now
) {

    if (
        now <
        forecast.invulnerableUntil
    ) {

        return true;
    }


    let cost = 12;


    /*
        Repeated attack adaptation.
    */

    if (
        projectile.type ===
        "aimed"
    ) {

        adaptation.aimedSeen++;

        if (
            adaptation.aimedSeen >= 3
        ) {
            cost -= 2;
        }
    }


    if (
        projectile.type ===
        "spread"
    ) {

        adaptation.spreadSeen++;

        if (
            adaptation.spreadSeen >= 3
        ) {
            cost -= 1.5;
        }
    }


    if (
        projectile.type ===
        "heavy"
    ) {

        adaptation.heavySeen++;

        cost += 3;
    }


    if (
        states.evolutionUntil >
        now
    ) {

        cost *= 0.70;
    }


    if (
        states.observeUntil >
        now
    ) {

        cost *= 0.82;
    }


    if (
        states.predictionUntil >
        now
    ) {

        cost *= 0.90;
    }


    if (
        states.deepForecastUntil >
        now
    ) {

        cost *= 0.82;
    }


    if (
        states.absoluteForecastUntil >
        now
    ) {

        cost *= 0.65;
    }


    /*
        Chain pressure.
    */

    if (
        now -
        forecast.lastDodgeAt <
        650
    ) {

        forecast.dodgeChain++;

    } else {

        forecast.dodgeChain = 0;
    }


    cost +=
        Math.min(
            15,
            forecast.dodgeChain *
            1.4
        );


    if (
        forecast.stamina <
        cost
    ) {

        return false;
    }


    forecast.stamina -=
        cost;


    forecast.lastDodgeAt =
        now;


    forecast.invulnerableUntil =
        now + 320;


    /*
        Animation direction only.

        FORECAST'S POSITION
        DOES NOT CHANGE.
    */

    const dx =
        projectile.vx || 0;


    const dy =
        projectile.vy || 0;


    let animation =
        "dodge_left";


    if (
        Math.abs(dx) >
        Math.abs(dy)
    ) {

        animation =
            dx > 0
                ? "dodge_left"
                : "dodge_right";

    } else {

        animation =
            dy > 0
                ? "dodge_up"
                : "dodge_down";
    }


    Animation.play(
        animation,
        310
    );


    effects.push({

        type: "afterimage",

        x: forecast.x,
        y: forecast.y,

        created: now,
        life: 280
    });


    return true;
}


/* ==========================================================
   FORECAST CONDITION
========================================================== */

function updateForecastCondition(
    now
) {

    const currentAnimation =
        Animation.getName();


    if (
        currentAnimation.includes(
            "dodge"
        ) ||
        currentAnimation.includes(
            "fire"
        ) ||
        currentAnimation ===
        "bone_control" ||
        currentAnimation ===
        "eye_activate" ||
        currentAnimation.includes(
            "scythe"
        ) ||
        currentAnimation ===
        "phase_change"
    ) {

        return;
    }


    if (
        forecast.stamina <= 0.5
    ) {

        if (
            currentAnimation !==
            "exhausted"
        ) {

            Animation.play(
                "exhausted"
            );
        }

        return;
    }


    if (
        forecast.stamina <= 25
    ) {

        if (
            currentAnimation !==
            "low_stamina"
        ) {

            Animation.play(
                "low_stamina"
            );
        }

        return;
    }


    if (
        currentAnimation ===
        "low_stamina" ||
        currentAnimation ===
        "exhausted"
    ) {

        Animation.play(
            "idle"
        );
    }
}


/* ==========================================================
   PHASE CHANGE
========================================================== */

function onPhaseChange() {

    const now =
        nowTime();


    Animation.play(
        "phase_change",
        900
    );


    playerProjectiles = [];
    hostileProjectiles = [];
    hazards = [];


    effects.push({

        type: "phaseBurst",

        x: forecast.x,
        y: forecast.y,

        created: now,
        life: 850
    });


    forecast.stamina =
        Math.min(
            forecast.maxStamina,
            forecast.stamina + 30
        );
}


/* ==========================================================
   PROTAGONIST ATTACK PATTERNS
========================================================== */

function spawnProtagonistPattern() {

    const phase =
        (
            typeof ForecastPhases !==
            "undefined"
        )
            ? ForecastPhases.getPhaseIndex()
            : 0;


    const count =
        4 +
        Math.min(
            phase,
            6
        );


    const pattern =
        Math.floor(
            Math.random() * 3
        );


    if (
        pattern === 0
    ) {

        /*
            AIMED SHOTS
        */

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

                    spawnEnemyAimedShot();

                },
                i * 380
            );
        }

    } else if (
        pattern === 1
    ) {

        /*
            SPREAD
        */

        for (
            let i = 0;
            i < Math.ceil(
                count / 2
            );
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

                    spawnEnemySpread();

                },
                i * 650
            );
        }

    } else {

        /*
            HEAVY + AIMED
        */

        spawnEnemyHeavy();


        for (
            let i = 0;
            i < count - 1;
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

                    spawnEnemyAimedShot();

                },
                550 +
                i * 430
            );
        }
    }
}


/* ==========================================================
   AIMED ENEMY ATTACK
========================================================== */

function spawnEnemyAimedShot() {

    const side =
        Math.floor(
            Math.random() * 3
        );


    let x;
    let y;


    if (
        side === 0
    ) {

        x =
            arena.left -
            20;

        y =
            random(
                30,
                arena.top
            );

    } else if (
        side === 1
    ) {

        x =
            arena.right +
            20;

        y =
            random(
                30,
                arena.top
            );

    } else {

        x =
            random(
                arena.left,
                arena.right
            );

        y = -20;
    }


    const dx =
        forecast.x - x;


    const dy =
        forecast.y - y;


    const len =
        Math.max(
            1,
            Math.sqrt(
                dx * dx +
                dy * dy
            )
        );


    const speed = 260;


    hostileProjectiles.push({

        x,
        y,

        vx:
            dx /
            len *
            speed,

        vy:
            dy /
            len *
            speed,

        radius: 6,

        type: "aimed",

        life: 4,

        age: 0
    });
}


/* ==========================================================
   SPREAD ENEMY ATTACK
========================================================== */

function spawnEnemySpread() {

    const originX =
        width * 0.5;

    const originY =
        -15;


    const base =
        Math.atan2(
            forecast.y -
            originY,

            forecast.x -
            originX
        );


    for (
        let i = -2;
        i <= 2;
        i++
    ) {

        const angle =
            base +
            i * 0.14;


        const speed = 235;


        hostileProjectiles.push({

            x: originX,
            y: originY,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            radius: 5,

            type: "spread",

            life: 4,
            age: 0
        });
    }
}


/* ==========================================================
   HEAVY ENEMY ATTACK
========================================================== */

function spawnEnemyHeavy() {

    const fromLeft =
        Math.random() <
        0.5;


    const x =
        fromLeft
            ? -30
            : width + 30;


    const y =
        forecast.y +
        random(
            -35,
            35
        );


    const dx =
        forecast.x - x;


    const dy =
        forecast.y - y;


    const len =
        Math.max(
            1,
            Math.sqrt(
                dx * dx +
                dy * dy
            )
        );


    hostileProjectiles.push({

        x,
        y,

        vx:
            dx /
            len *
            195,

        vy:
            dy /
            len *
            195,

        radius: 11,

        type: "heavy",

        life: 5,
        age: 0
    });
}


/* ==========================================================
   HOSTILE PROJECTILE UPDATE
========================================================== */

function updateHostileProjectiles(
    dt,
    now
) {

    for (
        let i =
            hostileProjectiles.length - 1;

        i >= 0;

        i--
    ) {

        const p =
            hostileProjectiles[i];


        p.x +=
            p.vx * dt;

        p.y +=
            p.vy * dt;

        p.age += dt;


        if (
            p.age >=
            p.life
        ) {

            hostileProjectiles.splice(
                i,
                1
            );

            continue;
        }


        /*
            Enemy attacks are allowed
            ABOVE the arena because
            Forecast is above the arena.
        */

        const hitDistance =
            forecast.radius +
            p.radius;


        if (
            distance(
                p.x,
                p.y,
                forecast.x,
                forecast.y
            ) <=
            hitDistance
        ) {

            const dodged =
                attemptAutoDodge(
                    p,
                    now
                );


            hostileProjectiles.splice(
                i,
                1
            );


            if (!dodged) {

                confirmedForecastHit(
                    now
                );
            }
        }
    }
}


/* ==========================================================
   CONFIRMED HIT ON FORECAST

   THIS is the only thing that advances
   Phase 1 -> 1.5 -> ... -> 5.
========================================================== */

function confirmedForecastHit(
    now
) {

    if (
        turn !==
        TURN.PROTAGONIST
    ) {
        return;
    }


    if (
        typeof ForecastPhases ===
        "undefined"
    ) {
        return;
    }


    if (
        ForecastPhases.isLocked()
    ) {
        return;
    }


    const result =
        ForecastPhases.confirmedHit();


    if (
        !result
    ) {
        return;
    }


    if (
        result.reason ===
        "final-phase"
    ) {

        sendMessage(
            "Phase 5 holds."
        );


        hostileProjectiles = [];
        hazards = [];

        return;
    }


    if (
        result.advanced
    ) {

        Animation.play(
            "phase_change",
            900
        );


        effects.push({

            type: "phaseBurst",

            x: forecast.x,
            y: forecast.y,

            created: now,
            life: 850
        });


        hostileProjectiles = [];
        hazards = [];


        beginTransition();
    }
}


/* ==========================================================
   PLAYER PROJECTILES
========================================================== */

function createPlayerProjectile(
    options
) {

    playerProjectiles.push({

        x:
            options.x ??
            forecast.x,

        y:
            options.y ??
            forecast.y,

        vx:
            options.vx || 0,

        vy:
            options.vy || 0,

        radius:
            options.radius || 4,

        damage:
            options.damage || 1,

        type:
            options.type ||
            "bullet",

        life:
            options.life ||
            3,

        age: 0,

        length:
            options.length || 0,

        width:
            options.width || 0,

        trail:
            options.trail || 0,

        rotation:
            options.rotation || 0
    });
}


/* ==========================================================
   FIRE TOWARD TARGET
========================================================== */

function fireToward(
    targetX,
    targetY,
    speed,
    options = {}
) {

    const dx =
        targetX -
        forecast.x;


    const dy =
        targetY -
        forecast.y;


    const len =
        Math.max(
            1,
            Math.sqrt(
                dx * dx +
                dy * dy
            )
        );


    createPlayerProjectile({

        x:
            forecast.x,

        y:
            forecast.y + 12,

        vx:
            dx /
            len *
            speed,

        vy:
            dy /
            len *
            speed,

        ...options
    });
}


/* ==========================================================
   CURRENT AIM TARGET
========================================================== */

function getAttackTarget() {

    /*
        When the player is actively aiming,
        use their pointer.

        Prediction abilities can lead
        the moving protagonist.
    */

    if (
        states.predictionUntil >
        nowTime() ||
        states.deepForecastUntil >
        nowTime() ||
        states.absoluteForecastUntil >
        nowTime()
    ) {

        return {
            x: aim.predictedX,
            y: aim.predictedY
        };
    }


    if (
        aim.x &&
        aim.y
    ) {

        return {
            x: aim.x,
            y: aim.y
        };
    }


    return {
        x: protagonist.x,
        y: protagonist.y
    };
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

        const p =
            playerProjectiles[i];


        p.x +=
            p.vx *
            dt;

        p.y +=
            p.vy *
            dt;

        p.age +=
            dt;


        if (
            p.age >=
            p.life
        ) {

            playerProjectiles.splice(
                i,
                1
            );

            continue;
        }


        if (
            distance(
                p.x,
                p.y,
                protagonist.x,
                protagonist.y
            ) <=
            p.radius +
            protagonist.radius
        ) {

            damageProtagonist(
                p.damage,
                p.x,
                p.y
            );


            playerProjectiles.splice(
                i,
                1
            );
        }
    }
}


/* ==========================================================
   DAMAGE PROTAGONIST
========================================================== */

function damageProtagonist(
    amount,
    x = protagonist.x,
    y = protagonist.y
) {

    if (
        protagonist.hp <= 0
    ) {
        return;
    }


    protagonist.hp =
        Math.max(
            0,
            protagonist.hp -
            amount
        );


    effects.push({

        type: "enemyHit",

        x,
        y,

        created: nowTime(),
        life: 260
    });


    if (
        protagonist.hp <= 0
    ) {

        turn =
            TURN.ENDED;


        playerProjectiles = [];
        hostileProjectiles = [];
        hazards = [];


        sendMessage(
            "The protagonist can no longer continue."
        );


        updateTurnHUD();
    }
}


/* ==========================================================
   WEAPON DISPATCH

   Actual weapon implementations continue
   in PART 2.
========================================================== */

function fireWeapon(
    attack
) {

    if (
        turn !==
        TURN.FORECAST
    ) {

        sendMessage(
            "Wait for Forecast's turn."
        );

        return;
    }


    switch (attack) {

        case "glock":
            fireGlock();
            break;

        case "smg":
            fireSMG();
            break;

        case "ar":
            fireAR();
            break;

        case "dmr":
            fireDMR();
            break;

        case "shotgun":
            fireShotgun();
            break;

        case "gasterHand":
            fireGasterHand();
            break;

        case "scythe":
            fireScythe();
            break;

        default:

            sendMessage(
                "That weapon is unavailable."
            );

            break;
    }
}


/* ==========================================================
   PART 1 END

   DO NOT ADD:
   })();

   PART 2 CONTINUES DIRECTLY BELOW.
========================================================== *//* ==========================================================
   PART 2 / 2
   WEAPONS / TECHNIQUES / EYES / RENDERER
========================================================== */


/* ==========================================================
   GLOCK
========================================================== */

function fireGlock() {

    const target =
        getAttackTarget();

    Animation.play(
        "glock_fire",
        260
    );

    fireToward(
        target.x,
        target.y,
        510,
        {
            radius: 3,
            damage: 8,
            type: "glock",
            trail: 14
        }
    );

    muzzleFlash(
        forecast.x,
        forecast.y + 8
    );
}


/* ==========================================================
   SMG
========================================================== */

function fireSMG() {

    const target =
        getAttackTarget();

    Animation.play(
        "smg_fire",
        430
    );

    for (
        let i = 0;
        i < 7;
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

                const spread =
                    random(
                        -18,
                        18
                    );

                fireToward(
                    target.x +
                    spread,
                    target.y +
                    random(
                        -12,
                        12
                    ),
                    475,
                    {
                        radius: 2.5,
                        damage: 2.2,
                        type: "smg",
                        trail: 9
                    }
                );

                muzzleFlash(
                    forecast.x,
                    forecast.y + 8
                );

            },
            i * 62
        );
    }
}


/* ==========================================================
   AR
========================================================== */

function fireAR() {

    const target =
        getAttackTarget();

    Animation.play(
        "ar_fire",
        300
    );

    for (
        let i = 0;
        i < 3;
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

                fireToward(
                    target.x +
                    random(-8, 8),
                    target.y +
                    random(-8, 8),
                    570,
                    {
                        radius: 4,
                        damage: 4.5,
                        type: "ar",
                        length: 18,
                        width: 4,
                        trail: 20
                    }
                );

                muzzleFlash(
                    forecast.x,
                    forecast.y + 8
                );

            },
            i * 95
        );
    }
}


/* ==========================================================
   DMR
========================================================== */

function fireDMR() {

    const target =
        getAttackTarget();

    Animation.play(
        "dmr_fire",
        340
    );

    effects.push({

        type: "predictionLine",

        x1: forecast.x,
        y1: forecast.y,

        x2: target.x,
        y2: target.y,

        created: nowTime(),
        life: 190
    });


    setTimeout(
        () => {

            if (
                turn !==
                TURN.FORECAST
            ) {
                return;
            }

            fireToward(
                target.x,
                target.y,
                780,
                {
                    radius: 5,
                    damage: 13,
                    type: "dmr",
                    length: 32,
                    width: 5,
                    trail: 45
                }
            );

            muzzleFlash(
                forecast.x,
                forecast.y + 8
            );

        },
        110
    );
}


/* ==========================================================
   SHOTGUN
========================================================== */

function fireShotgun() {

    const target =
        getAttackTarget();

    Animation.play(
        "shotgun_fire",
        360
    );

    const base =
        Math.atan2(
            target.y -
            forecast.y,

            target.x -
            forecast.x
        );


    for (
        let i = -4;
        i <= 4;
        i++
    ) {

        const angle =
            base +
            i * 0.055 +
            random(
                -0.015,
                0.015
            );

        const speed =
            random(
                400,
                500
            );

        createPlayerProjectile({

            x: forecast.x,
            y: forecast.y + 10,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            radius: 3,

            damage: 2.3,

            type: "pellet",

            life: 1.2
        });
    }


    effects.push({

        type: "shotgunBurst",

        x: forecast.x,
        y: forecast.y + 12,

        angle: base,

        created: nowTime(),
        life: 180
    });
}


/* ==========================================================
   GASTER HAND
========================================================== */

function fireGasterHand() {

    const target =
        getAttackTarget();

    Animation.play(
        "gaster_charge",
        520
    );


    effects.push({

        type: "gasterCharge",

        x: forecast.x,
        y: forecast.y,

        created: nowTime(),
        life: 520
    });


    setTimeout(
        () => {

            if (
                turn !==
                TURN.FORECAST
            ) {
                return;
            }

            Animation.play(
                "gaster_fire",
                400
            );

            activeBeam = {

                x1: forecast.x,
                y1: forecast.y + 18,

                x2: target.x,
                y2: target.y,

                width: 20,

                damage: 17,

                created: nowTime(),

                life: 420,

                hit: false
            };

        },
        520
    );
}


/* ==========================================================
   EXECUTION SCYTHE
========================================================== */

function fireScythe() {

    const target =
        getAttackTarget();

    Animation.play(
        "scythe_summon",
        300
    );


    setTimeout(
        () => {

            if (
                turn !==
                TURN.FORECAST
            ) {
                return;
            }

            Animation.play(
                "scythe_swing",
                430
            );


            activeScythe = {

                angle:
                    Math.atan2(
                        target.y -
                        forecast.y,

                        target.x -
                        forecast.x
                    ),

                radius: 105,

                created:
                    nowTime(),

                life: 430,

                hit: false
            };

        },
        260
    );
}


/* ==========================================================
   TECHNIQUE DISPATCH
========================================================== */

function activateTechnique(
    attack
) {

    if (
        turn !==
        TURN.FORECAST
    ) {

        sendMessage(
            "Wait for Forecast's turn."
        );

        return;
    }


    switch (attack) {

        case "bones":
            castBones();
            break;

        case "boneWall":
            castBoneWall();
            break;

        case "illusions":
            castIllusions();
            break;

        case "constructs":
            castConstructs();
            break;

        case "gaster":
            castGaster();
            break;

        case "forecastTrap":
            castForecastTrap();
            break;

        case "crossfire":
            castCrossfire();
            break;

        case "falseFuture":
            castFalseFuture();
            break;

        case "inevitable":
            castInevitable();
            break;

        default:

            sendMessage(
                "Technique unavailable."
            );
    }
}


/* ==========================================================
   BONES
========================================================== */

function castBones() {

    Animation.play(
        "bone_control",
        500
    );


    const target =
        getAttackTarget();


    for (
        let i = -2;
        i <= 2;
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

                const startX =
                    forecast.x +
                    i * 14;

                const startY =
                    forecast.y + 15;

                const dx =
                    target.x -
                    startX;

                const dy =
                    target.y -
                    startY;

                const len =
                    Math.max(
                        1,
                        Math.hypot(
                            dx,
                            dy
                        )
                    );


                createPlayerProjectile({

                    x: startX,
                    y: startY,

                    vx:
                        dx /
                        len *
                        340,

                    vy:
                        dy /
                        len *
                        340,

                    radius: 6,

                    damage: 4,

                    type: "bone",

                    length: 30,

                    width: 7,

                    life: 3
                });

            },
            (
                i + 2
            ) * 75
        );
    }
}


/* ==========================================================
   BONE WALL
========================================================== */

function castBoneWall() {

    Animation.play(
        "bone_control",
        700
    );


    const count = 9;


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const x =
            arena.left +
            (
                (
                    i + 0.5
                ) /
                count
            ) *
            (
                arena.right -
                arena.left
            );


        setTimeout(
            () => {

                hazards.push({

                    type: "boneSpike",

                    x,

                    y:
                        arena.bottom,

                    width: 12,

                    height: 0,

                    maxHeight:
                        random(
                            70,
                            125
                        ),

                    damage: 6,

                    created:
                        nowTime(),

                    life: 1000,

                    hit: false
                });

            },
            i * 80
        );
    }
}


/* ==========================================================
   ILLUSIONS
========================================================== */

function castIllusions() {

    Animation.play(
        "eye_activate",
        450
    );


    states.illusionUntil =
        nowTime() +
        2600;


    illusions = [];


    for (
        let i = 0;
        i < 4;
        i++
    ) {

        illusions.push({

            x:
                protagonist.x +
                random(
                    -80,
                    80
                ),

            y:
                protagonist.y +
                random(
                    -55,
                    55
                ),

            created:
                nowTime(),

            life: 2600
        });
    }


    sendMessage(
        "The arena stops telling the truth."
    );
}


/* ==========================================================
   CONSTRUCTS
========================================================== */

function castConstructs() {

    Animation.play(
        "bone_control",
        500
    );


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        constructs.push({

            x:
                arena.left +
                (
                    (
                        i + 1
                    ) /
                    4
                ) *
                (
                    arena.right -
                    arena.left
                ),

            y:
                arena.top - 15,

            nextShot:
                nowTime() +
                i * 180,

            created:
                nowTime(),

            life: 4200
        });
    }
}


/* ==========================================================
   GASTER TECHNIQUE
========================================================== */

function castGaster() {

    Animation.play(
        "gaster_charge",
        650
    );


    const target =
        getAttackTarget();


    effects.push({

        type: "gasterCharge",

        x: forecast.x,
        y: forecast.y,

        created: nowTime(),
        life: 650
    });


    setTimeout(
        () => {

            if (
                turn !==
                TURN.FORECAST
            ) {
                return;
            }


            Animation.play(
                "gaster_fire",
                450
            );


            activeBeam = {

                x1: forecast.x,
                y1: forecast.y + 18,

                x2: target.x,
                y2: target.y,

                width: 34,

                damage: 22,

                created:
                    nowTime(),

                life: 520,

                hit: false
            };

        },
        650
    );
}


/* ==========================================================
   FORECAST TRAP
========================================================== */

function castForecastTrap() {

    Animation.play(
        "eye_activate",
        420
    );


    const predictedX =
        clamp(
            protagonist.x +
            protagonist.vx *
            0.7,

            arena.left + 20,
            arena.right - 20
        );


    const predictedY =
        clamp(
            protagonist.y +
            protagonist.vy *
            0.7,

            arena.top + 20,
            arena.bottom - 20
        );


    hazards.push({

        type: "forecastTrap",

        x: predictedX,
        y: predictedY,

        radius: 36,

        created:
            nowTime(),

        triggerAt:
            nowTime() +
            750,

        life: 1300,

        damage: 14,

        hit: false
    });
}


/* ==========================================================
   CROSSFIRE
========================================================== */

function castCrossfire() {

    Animation.play(
        "bone_control",
        650
    );


    const targetX =
        protagonist.x;

    const targetY =
        protagonist.y;


    const origins = [

        {
            x: arena.left,
            y: targetY
        },

        {
            x: arena.right,
            y: targetY
        },

        {
            x: targetX,
            y: arena.top
        },

        {
            x: targetX,
            y: arena.bottom
        }
    ];


    origins.forEach(
        (
            origin,
            index
        ) => {

            setTimeout(
                () => {

                    const dx =
                        targetX -
                        origin.x;

                    const dy =
                        targetY -
                        origin.y;

                    const len =
                        Math.max(
                            1,
                            Math.hypot(
                                dx,
                                dy
                            )
                        );


                    createPlayerProjectile({

                        x: origin.x,
                        y: origin.y,

                        vx:
                            dx /
                            len *
                            380,

                        vy:
                            dy /
                            len *
                            380,

                        radius: 6,

                        damage: 7,

                        type:
                            "crossfire",

                        trail: 20,

                        life: 2
                    });

                },
                index * 110
            );
        }
    );
}


/* ==========================================================
   FALSE FUTURE
========================================================== */

function castFalseFuture() {

    Animation.play(
        "eye_activate",
        500
    );


    const fakeX =
        clamp(
            protagonist.x +
            random(
                -100,
                100
            ),

            arena.left + 25,
            arena.right - 25
        );


    const fakeY =
        clamp(
            protagonist.y +
            random(
                -70,
                70
            ),

            arena.top + 25,
            arena.bottom - 25
        );


    hazards.push({

        type:
            "falseWarning",

        x: fakeX,
        y: fakeY,

        radius: 30,

        created:
            nowTime(),

        life: 800
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
                    "realFuture",

                x:
                    protagonist.x,

                y:
                    protagonist.y,

                radius: 38,

                created:
                    nowTime(),

                triggerAt:
                    nowTime() +
                    220,

                life: 850,

                damage: 16,

                hit: false
            });

        },
        650
    );
}


/* ==========================================================
   INEVITABLE — PHASE 5
========================================================== */

function castInevitable() {

    Animation.play(
        "phase_change",
        850
    );


    const created =
        nowTime();


    effects.push({

        type:
            "inevitableStart",

        x:
            protagonist.x,

        y:
            protagonist.y,

        created,

        life: 900
    });


    /*
        Four prediction marks close in.
    */

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        hazards.push({

            type:
                "inevitableMark",

            x:
                protagonist.x,

            y:
                protagonist.y,

            angle:
                i *
                Math.PI /
                2,

            created,

            triggerAt:
                created +
                700,

            life: 1250,

            damage: 6,

            hit: false
        });
    }


    setTimeout(
        () => {

            if (
                turn !==
                TURN.FORECAST
            ) {
                return;
            }


            activeBeam = {

                x1:
                    forecast.x,

                y1:
                    forecast.y,

                x2:
                    protagonist.x,

                y2:
                    protagonist.y,

                width: 44,

                damage: 20,

                created:
                    nowTime(),

                life: 500,

                hit: false,

                inevitable: true
            };

        },
        760
    );
}


/* ==========================================================
   EYES
========================================================== */

function activateEye(
    detail
) {

    if (
        turn !==
        TURN.FORECAST
    ) {

        sendMessage(
            "Wait for Forecast's turn."
        );

        return;
    }


    const name =
        String(
            detail.name ||
            detail.eye ||
            ""
        ).toUpperCase();


    Animation.play(
        "eye_activate",
        450
    );


    const now =
        nowTime();


    switch (name) {

        case "RED EYE":

            protagonist.frozenUntil =
                now + 1300;

            sendMessage(
                "RED EYE — movement frozen."
            );

            break;


        case "BLACK EYE":

            states.domainUntil =
                now + 2200;

            sendMessage(
                "BLACK EYE — pocket domain."
            );

            break;


        case "HEROISM":

            states.heroismUntil =
                now + 3000;

            sendMessage(
                "HEROISM awakened."
            );

            break;


        case "EVOLUTION":

            states.evolutionUntil =
                now + 4500;

            sendMessage(
                "EVOLUTION — adaptation accelerated."
            );

            break;


        case "DEADLOCK":

            states.deadlockUntil =
                now + 1800;

            sendMessage(
                "DEADLOCK."
            );

            break;


        case "NULL":

            playerProjectiles = [];
            hostileProjectiles = [];
            hazards = [];

            sendMessage(
                "NULL."
            );

            break;


        case "PARADOX":

            states.domainUntil =
                now + 3500;

            protagonist.targetX =
                arena.left +
                arena.right -
                protagonist.x;

            protagonist.targetY =
                arena.top +
                arena.bottom -
                protagonist.y;

            sendMessage(
                "PARADOX."
            );

            break;


        case "OBSERVE":

            states.observeUntil =
                now + 5000;

            sendMessage(
                "OBSERVE — attack patterns recorded."
            );

            break;


        case "VECTOR":

            states.vectorUntil =
                now + 3000;

            sendMessage(
                "VECTOR."
            );

            break;


        case "MOMENT":

            states.momentUntil =
                now + 2500;

            protagonist.frozenUntil =
                now + 700;

            sendMessage(
                "MOMENT."
            );

            break;


        default:

            sendMessage(
                "Eye activated."
            );
    }
}


/* ==========================================================
   FORECAST ABILITIES
========================================================== */

function activateForecastAbility(
    detail
) {

    if (
        turn !==
        TURN.FORECAST
    ) {

        sendMessage(
            "Wait for Forecast's turn."
        );

        return;
    }


    const name =
        String(
            detail.name ||
            detail.ability ||
            ""
        ).toUpperCase();


    const now =
        nowTime();


    Animation.play(
        "eye_activate",
        400
    );


    switch (name) {

        case "PREDICT":

            states.predictionUntil =
                now + 4000;

            sendMessage(
                "PREDICT — future movement exposed."
            );

            break;


        case "DEEP FORECAST":

            states.deepForecastUntil =
                now + 4500;

            sendMessage(
                "DEEP FORECAST."
            );

            break;


        case "ABSOLUTE FORECAST":

            states.absoluteForecastUntil =
                now + 5200;

            sendMessage(
                "ABSOLUTE FORECAST."
            );

            break;


        default:

            sendMessage(
                "Forecast engaged."
            );
    }
}


/* ==========================================================
   HAZARDS
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

        const h =
            hazards[i];


        if (
            now -
            h.created >=
            h.life
        ) {

            hazards.splice(
                i,
                1
            );

            continue;
        }


        if (
            h.type ===
            "boneSpike"
        ) {

            const progress =
                clamp(
                    (
                        now -
                        h.created
                    ) /
                    260,
                    0,
                    1
                );


            h.height =
                h.maxHeight *
                progress;


            if (
                !h.hit &&
                Math.abs(
                    protagonist.x -
                    h.x
                ) <
                h.width +
                protagonist.radius &&
                protagonist.y >
                arena.bottom -
                h.height -
                protagonist.radius
            ) {

                h.hit = true;

                damageProtagonist(
                    h.damage,
                    h.x,
                    protagonist.y
                );
            }
        }


        if (
            (
                h.type ===
                "forecastTrap" ||
                h.type ===
                "realFuture"
            ) &&
            now >=
            h.triggerAt &&
            !h.hit
        ) {

            h.hit = true;


            if (
                distance(
                    protagonist.x,
                    protagonist.y,
                    h.x,
                    h.y
                ) <=
                h.radius +
                protagonist.radius
            ) {

                damageProtagonist(
                    h.damage,
                    h.x,
                    h.y
                );
            }


            effects.push({

                type:
                    "trapBurst",

                x: h.x,
                y: h.y,

                created: now,
                life: 320
            });
        }


        if (
            h.type ===
            "inevitableMark" &&
            now >=
            h.triggerAt &&
            !h.hit
        ) {

            h.hit = true;


            const strikeX =
                h.x +
                Math.cos(
                    h.angle
                ) *
                20;


            const strikeY =
                h.y +
                Math.sin(
                    h.angle
                ) *
                20;


            if (
                distance(
                    protagonist.x,
                    protagonist.y,
                    strikeX,
                    strikeY
                ) < 55
            ) {

                damageProtagonist(
                    h.damage,
                    strikeX,
                    strikeY
                );
            }
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

        const c =
            constructs[i];


        if (
            now -
            c.created >=
            c.life
        ) {

            constructs.splice(
                i,
                1
            );

            continue;
        }


        if (
            now >=
            c.nextShot
        ) {

            c.nextShot =
                now + 620;


            const dx =
                protagonist.x -
                c.x;


            const dy =
                protagonist.y -
                c.y;


            const len =
                Math.max(
                    1,
                    Math.hypot(
                        dx,
                        dy
                    )
                );


            createPlayerProjectile({

                x: c.x,
                y: c.y,

                vx:
                    dx /
                    len *
                    310,

                vy:
                    dy /
                    len *
                    310,

                radius: 5,

                damage: 3,

                type:
                    "construct",

                trail: 12,

                life: 3
            });
        }
    }
}


/* ==========================================================
   EFFECTS
========================================================== */

function updateEffects(
    dt,
    now
) {

    effects =
        effects.filter(
            effect =>
                now -
                effect.created <
                effect.life
        );


    illusions =
        illusions.filter(
            illusion =>
                now -
                illusion.created <
                illusion.life
        );
}


/* ==========================================================
   BEAM
========================================================== */

function updateBeam(
    dt,
    now
) {

    if (!activeBeam) {
        return;
    }


    if (
        now -
        activeBeam.created >=
        activeBeam.life
    ) {

        activeBeam = null;

        return;
    }


    if (
        activeBeam.hit
    ) {
        return;
    }


    const d =
        distancePointToSegment(

            protagonist.x,
            protagonist.y,

            activeBeam.x1,
            activeBeam.y1,

            activeBeam.x2,
            activeBeam.y2
        );


    if (
        d <=
        activeBeam.width /
        2 +
        protagonist.radius
    ) {

        activeBeam.hit =
            true;


        damageProtagonist(
            activeBeam.damage,
            protagonist.x,
            protagonist.y
        );
    }
}


/* ==========================================================
   SCYTHE
========================================================== */

function updateScythe(
    dt,
    now
) {

    if (!activeScythe) {
        return;
    }


    if (
        now -
        activeScythe.created >=
        activeScythe.life
    ) {

        activeScythe = null;

        return;
    }


    if (
        activeScythe.hit
    ) {
        return;
    }


    if (
        distance(
            forecast.x,
            forecast.y,
            protagonist.x,
            protagonist.y
        ) <=
        activeScythe.radius +
        protagonist.radius
    ) {

        activeScythe.hit =
            true;


        damageProtagonist(
            18,
            protagonist.x,
            protagonist.y
        );
    }
}


/* ==========================================================
   POINT -> SEGMENT DISTANCE
========================================================== */

function distancePointToSegment(
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
                (
                    px - x1
                ) *
                dx +
                (
                    py - y1
                ) *
                dy
            ) /
            (
                dx * dx +
                dy * dy
            ),

            0,
            1
        );


    const x =
        x1 +
        t * dx;


    const y =
        y1 +
        t * dy;


    return distance(
        px,
        py,
        x,
        y
    );
}


/* ==========================================================
   MUZZLE FLASH
========================================================== */

function muzzleFlash(
    x,
    y
) {

    effects.push({

        type:
            "muzzle",

        x,
        y,

        created:
            nowTime(),

        life: 90
    });
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

    drawArena(now);

    drawAim(now);

    drawIllusions(now);

    drawConstructs(now);

    drawHazards(now);

    drawPlayerProjectiles(now);

    drawHostileProjectiles(now);

    drawBeam(now);

    drawScythe(now);

    drawProtagonist(now);

    drawForecast(now);

    drawEffects(now);
}


/* ==========================================================
   BACKGROUND
========================================================== */

function drawBackground(now) {

    ctx.fillStyle =
        "#020202";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    /*
        Red phase glow.
    */

    const phase =
        typeof ForecastPhases !==
        "undefined"
            ? ForecastPhases.getPhase()
            : "1";


    const style =
        PHASE_STYLE[phase] ||
        PHASE_STYLE["1"];


    const gradient =
        ctx.createRadialGradient(

            forecast.x,
            forecast.y,

            10,

            forecast.x,
            forecast.y,

            220
        );


    gradient.addColorStop(
        0,
        `rgba(255,0,0,${
            style.aura * 0.25
        })`
    );


    gradient.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        width,
        height
    );
}


/* ==========================================================
   ARENA
========================================================== */

function drawArena(now) {

    ctx.save();


    ctx.fillStyle =
        "rgba(0,0,0,0.78)";


    ctx.fillRect(
        arena.left,
        arena.top,
        arena.right -
        arena.left,
        arena.bottom -
        arena.top
    );


    ctx.strokeStyle =
        states.domainUntil >
        now
            ? "#ff2020"
            : "#ffffff";


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
        states.domainUntil >
        now
    ) {

        ctx.globalAlpha =
            0.18;


        for (
            let x =
                arena.left;

            x <
            arena.right;

            x += 18
        ) {

            ctx.strokeStyle =
                "#ff0000";

            ctx.beginPath();

            ctx.moveTo(
                x,
                arena.top
            );

            ctx.lineTo(
                arena.right,
                arena.bottom -
                (
                    x -
                    arena.left
                )
            );

            ctx.stroke();
        }
    }


    ctx.restore();
}


/* ==========================================================
   AIM
========================================================== */

function drawAim(now) {

    if (
        turn !==
        TURN.FORECAST
    ) {
        return;
    }


    const target =
        getAttackTarget();


    ctx.save();


    ctx.setLineDash(
        [7, 7]
    );


    ctx.strokeStyle =
        "rgba(255,50,50,0.7)";


    ctx.lineWidth = 1.5;


    ctx.beginPath();

    ctx.moveTo(
        forecast.x,
        forecast.y + 15
    );

    ctx.lineTo(
        target.x,
        target.y
    );

    ctx.stroke();


    ctx.setLineDash([]);


    /*
        Target reticle
    */

    ctx.strokeStyle =
        "#ff3030";

    ctx.lineWidth = 2;


    ctx.beginPath();

    ctx.arc(
        target.x,
        target.y,
        12,
        0,
        Math.PI * 2
    );

    ctx.stroke();


    ctx.beginPath();

    ctx.moveTo(
        target.x - 18,
        target.y
    );

    ctx.lineTo(
        target.x + 18,
        target.y
    );

    ctx.moveTo(
        target.x,
        target.y - 18
    );

    ctx.lineTo(
        target.x,
        target.y + 18
    );

    ctx.stroke();


    /*
        Predicted protagonist position.
    */

    if (
        states.predictionUntil >
        now ||
        states.deepForecastUntil >
        now ||
        states.absoluteForecastUntil >
        now
    ) {

        ctx.strokeStyle =
            "#ffffff";

        ctx.globalAlpha =
            0.7;

        ctx.beginPath();

        ctx.arc(
            aim.predictedX,
            aim.predictedY,
            7,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }


    ctx.restore();
}


/* ==========================================================
   PROTAGONIST
========================================================== */

function drawProtagonist(now) {

    ctx.save();


    ctx.translate(
        protagonist.x,
        protagonist.y
    );


    /*
        Undertale-like heart silhouette,
        drawn from scratch.
    */

    ctx.fillStyle =
        states.deadlockUntil >
        now
            ? "#888888"
            : "#ff2525";


    ctx.beginPath();

    ctx.moveTo(
        0,
        10
    );

    ctx.lineTo(
        -11,
        -2
    );

    ctx.lineTo(
        -11,
        -7
    );

    ctx.lineTo(
        -7,
        -11
    );

    ctx.lineTo(
        -2,
        -11
    );

    ctx.lineTo(
        0,
        -7
    );

    ctx.lineTo(
        2,
        -11
    );

    ctx.lineTo(
        7,
        -11
    );

    ctx.lineTo(
        11,
        -7
    );

    ctx.lineTo(
        11,
        -2
    );

    ctx.closePath();

    ctx.fill();


    ctx.restore();
}


/* ==========================================================
   FORECAST SPRITE
========================================================== */

function drawForecast(now) {

    const frameName =
        Animation.getFrame(
            now
        );


    const sprite =
        ForecastSprites.get(
            frameName
        );


    const phase =
        typeof ForecastPhases !==
        "undefined"
            ? ForecastPhases.getPhase()
            : "1";


    const phaseStyle =
        PHASE_STYLE[phase] ||
        PHASE_STYLE["1"];


    ctx.save();


    /*
        FIXED position.

        There is deliberately NO dodge
        translation here.
    */

    ctx.translate(
        forecast.x,
        forecast.y
    );


    /*
        Phase aura
    */

    const pulse =
        0.5 +
        Math.sin(
            now * 0.008
        ) *
        0.5;


    ctx.globalAlpha =
        phaseStyle.aura *
        (
            0.55 +
            pulse * 0.35
        );


    ctx.fillStyle =
        "#ff0000";


    ctx.beginPath();

    ctx.arc(
        0,
        0,
        46 +
        pulse * 8,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.globalAlpha = 1;


    if (sprite) {

        /*
            Actual Forecast from
            forecast-spritesheet.png
        */

        const drawWidth =
            145 *
            phaseStyle.scale;


        const drawHeight =
            82 *
            phaseStyle.scale;


        ctx.drawImage(

            sprite.image,

            sprite.sx,
            sprite.sy,
            sprite.sw,
            sprite.sh,

            -drawWidth / 2,
            -drawHeight / 2,

            drawWidth,
            drawHeight
        );

    } else {

        /*
            Fallback ONLY while the
            spritesheet is loading.
        */

        drawForecastFallback();
    }


    ctx.restore();
}


/* ==========================================================
   FALLBACK FORECAST
========================================================== */

function drawForecastFallback() {

    ctx.save();


    ctx.fillStyle =
        "#111";


    ctx.beginPath();

    ctx.arc(
        0,
        0,
        25,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth = 2;

    ctx.stroke();


    ctx.fillStyle =
        "#ff2020";


    ctx.fillRect(
        -11,
        -4,
        7,
        4
    );


    ctx.fillStyle =
        "#ffffff";


    ctx.fillRect(
        5,
        -4,
        7,
        4
    );


    ctx.restore();
}


/* ==========================================================
   PLAYER PROJECTILES
========================================================== */

function drawPlayerProjectiles(now) {

    for (
        const p
        of playerProjectiles
    ) {

        ctx.save();


        ctx.translate(
            p.x,
            p.y
        );


        const angle =
            Math.atan2(
                p.vy,
                p.vx
            );


        ctx.rotate(angle);


        if (
            p.type ===
            "bone"
        ) {

            drawBoneProjectile(
                p
            );

        } else if (
            p.type ===
            "pellet"
        ) {

            ctx.fillStyle =
                "#ffffff";

            ctx.fillRect(
                -3,
                -2,
                6,
                4
            );

        } else if (
            p.type ===
            "dmr"
        ) {

            ctx.fillStyle =
                "#ffffff";

            ctx.fillRect(
                -18,
                -2,
                36,
                4
            );


            ctx.fillStyle =
                "#ff2020";

            ctx.fillRect(
                -28,
                -1,
                10,
                2
            );

        } else if (
            p.type ===
            "ar"
        ) {

            ctx.fillStyle =
                "#ffffff";

            ctx.fillRect(
                -10,
                -2,
                20,
                4
            );


            ctx.fillStyle =
                "#ff3030";

            ctx.fillRect(
                -17,
                -1,
                7,
                2
            );

        } else if (
            p.type ===
            "smg"
        ) {

            ctx.fillStyle =
                "#ffffff";

            ctx.fillRect(
                -4,
                -1,
                8,
                3
            );

        } else if (
            p.type ===
            "construct"
        ) {

            ctx.fillStyle =
                "#ff3030";

            ctx.fillRect(
                -7,
                -3,
                14,
                6
            );


            ctx.strokeStyle =
                "#000";

            ctx.strokeRect(
                -7,
                -3,
                14,
                6
            );

        } else if (
            p.type ===
            "crossfire"
        ) {

            ctx.fillStyle =
                "#ff2020";

            ctx.fillRect(
                -12,
                -3,
                24,
                6
            );


            ctx.fillStyle =
                "#ffffff";

            ctx.fillRect(
                6,
                -1,
                8,
                2
            );

        } else {

            /*
                GLOCK
            */

            ctx.fillStyle =
                "#ffffff";

            ctx.fillRect(
                -5,
                -2,
                10,
                4
            );


            ctx.fillStyle =
                "#ff2020";

            ctx.fillRect(
                -10,
                -1,
                5,
                2
            );
        }


        ctx.restore();
    }
}


/* ==========================================================
   PIXEL BONE
========================================================== */

function drawBoneProjectile(p) {

    ctx.fillStyle =
        "#ffffff";


    ctx.fillRect(
        -14,
        -3,
        28,
        6
    );


    ctx.fillRect(
        -17,
        -6,
        6,
        5
    );


    ctx.fillRect(
        -17,
        1,
        6,
        5
    );


    ctx.fillRect(
        11,
        -6,
        6,
        5
    );


    ctx.fillRect(
        11,
        1,
        6,
        5
    );


    ctx.strokeStyle =
        "#ff3030";

    ctx.lineWidth = 1;


    ctx.strokeRect(
        -14,
        -3,
        28,
        6
    );
}


/* ==========================================================
   HOSTILE PROJECTILES
========================================================== */

function drawHostileProjectiles(now) {

    for (
        const p
        of hostileProjectiles
    ) {

        ctx.save();


        ctx.translate(
            p.x,
            p.y
        );


        const angle =
            Math.atan2(
                p.vy,
                p.vx
            );


        ctx.rotate(angle);


        if (
            p.type ===
            "heavy"
        ) {

            ctx.fillStyle =
                "#ffffff";

            ctx.fillRect(
                -14,
                -7,
                28,
                14
            );


            ctx.strokeStyle =
                "#ff2020";

            ctx.lineWidth = 2;

            ctx.strokeRect(
                -14,
                -7,
                28,
                14
            );

        } else if (
            p.type ===
            "spread"
        ) {

            ctx.fillStyle =
                "#ff3030";

            ctx.fillRect(
                -7,
                -3,
                14,
                6
            );

        } else {

            ctx.fillStyle =
                "#ffffff";

            ctx.fillRect(
                -9,
                -3,
                18,
                6
            );


            ctx.fillStyle =
                "#ff3030";

            ctx.fillRect(
                5,
                -1,
                6,
                2
            );
        }


        ctx.restore();
    }
}


/* ==========================================================
   HAZARD DRAWING
========================================================== */

function drawHazards(now) {

    for (
        const h
        of hazards
    ) {

        ctx.save();


        if (
            h.type ===
            "boneSpike"
        ) {

            ctx.translate(
                h.x,
                arena.bottom
            );


            ctx.fillStyle =
                "#ffffff";


            const boneHeight =
                h.height;


            ctx.fillRect(
                -4,
                -boneHeight,
                8,
                boneHeight
            );


            ctx.fillRect(
                -8,
                -boneHeight,
                16,
                7
            );


            ctx.fillRect(
                -8,
                -7,
                16,
                7
            );


        } else if (
            h.type ===
            "forecastTrap"
        ) {

            const triggered =
                now >=
                h.triggerAt;


            ctx.strokeStyle =
                triggered
                    ? "#ffffff"
                    : "#ff3030";


            ctx.lineWidth = 2;


            ctx.beginPath();

            ctx.arc(
                h.x,
                h.y,
                h.radius,
                0,
                Math.PI * 2
            );

            ctx.stroke();


            ctx.beginPath();

            ctx.moveTo(
                h.x - h.radius,
                h.y
            );

            ctx.lineTo(
                h.x + h.radius,
                h.y
            );

            ctx.moveTo(
                h.x,
                h.y - h.radius
            );

            ctx.lineTo(
                h.x,
                h.y + h.radius
            );

            ctx.stroke();


        } else if (
            h.type ===
            "falseWarning"
        ) {

            ctx.globalAlpha =
                0.55;


            ctx.strokeStyle =
                "#ffffff";


            ctx.setLineDash(
                [4, 4]
            );


            ctx.beginPath();

            ctx.arc(
                h.x,
                h.y,
                h.radius,
                0,
                Math.PI * 2
            );

            ctx.stroke();


            ctx.setLineDash([]);


        } else if (
            h.type ===
            "realFuture"
        ) {

            ctx.strokeStyle =
                "#ff0000";

            ctx.lineWidth = 3;


            ctx.beginPath();

            ctx.arc(
                h.x,
                h.y,
                h.radius,
                0,
                Math.PI * 2
            );

            ctx.stroke();


        } else if (
            h.type ===
            "inevitableMark"
        ) {

            const progress =
                clamp(
                    (
                        now -
                        h.created
                    ) /
                    700,
                    0,
                    1
                );


            const radius =
                lerp(
                    95,
                    18,
                    progress
                );


            const x =
                h.x +
                Math.cos(
                    h.angle
                ) *
                radius;


            const y =
                h.y +
                Math.sin(
                    h.angle
                ) *
                radius;


            ctx.fillStyle =
                "#ff2020";


            ctx.fillRect(
                x - 7,
                y - 7,
                14,
                14
            );


            ctx.strokeStyle =
                "#ffffff";

            ctx.strokeRect(
                x - 7,
                y - 7,
                14,
                14
            );
        }


        ctx.restore();
    }
}


/* ==========================================================
   ILLUSIONS
========================================================== */

function drawIllusions(now) {

    for (
        const illusion
        of illusions
    ) {

        const remaining =
            1 -
            (
                now -
                illusion.created
            ) /
            illusion.life;


        ctx.save();


        ctx.globalAlpha =
            Math.max(
                0,
                remaining *
                0.35
            );


        ctx.translate(
            illusion.x,
            illusion.y
        );


        ctx.fillStyle =
            "#ff2020";


        ctx.beginPath();

        ctx.arc(
            0,
            0,
            10,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.restore();
    }
}


/* ==========================================================
   CONSTRUCT DRAWING
========================================================== */

function drawConstructs(now) {

    for (
        const c
        of constructs
    ) {

        ctx.save();


        ctx.translate(
            c.x,
            c.y
        );


        ctx.fillStyle =
            "#080808";


        ctx.fillRect(
            -14,
            -10,
            28,
            20
        );


        ctx.strokeStyle =
            "#ff2020";

        ctx.lineWidth = 2;


        ctx.strokeRect(
            -14,
            -10,
            28,
            20
        );


        ctx.fillStyle =
            "#ff2020";


        ctx.fillRect(
            -7,
            -2,
            5,
            4
        );


        ctx.fillRect(
            2,
            -2,
            5,
            4
        );


        ctx.restore();
    }
}


/* ==========================================================
   BEAM DRAWING
========================================================== */

function drawBeam(now) {

    if (!activeBeam) {
        return;
    }


    const progress =
        (
            now -
            activeBeam.created
        ) /
        activeBeam.life;


    const alpha =
        Math.max(
            0,
            1 -
            progress
        );


    ctx.save();


    ctx.globalAlpha =
        alpha;


    ctx.strokeStyle =
        "#ff2020";


    ctx.lineWidth =
        activeBeam.width +
        12;


    ctx.beginPath();

    ctx.moveTo(
        activeBeam.x1,
        activeBeam.y1
    );

    ctx.lineTo(
        activeBeam.x2,
        activeBeam.y2
    );

    ctx.stroke();


    ctx.strokeStyle =
        "#ffffff";


    ctx.lineWidth =
        activeBeam.width *
        0.48;


    ctx.beginPath();

    ctx.moveTo(
        activeBeam.x1,
        activeBeam.y1
    );

    ctx.lineTo(
        activeBeam.x2,
        activeBeam.y2
    );

    ctx.stroke();


    ctx.restore();
}


/* ==========================================================
   SCYTHE DRAWING
========================================================== */

function drawScythe(now) {

    if (!activeScythe) {
        return;
    }


    const progress =
        clamp(
            (
                now -
                activeScythe.created
            ) /
            activeScythe.life,
            0,
            1
        );


    const start =
        activeScythe.angle -
        1.4;


    const end =
        start +
        progress *
        2.8;


    ctx.save();


    ctx.strokeStyle =
        "#ff2020";


    ctx.lineWidth = 15;


    ctx.beginPath();

    ctx.arc(
        forecast.x,
        forecast.y,
        activeScythe.radius,
        start,
        end
    );

    ctx.stroke();


    ctx.strokeStyle =
        "#ffffff";


    ctx.lineWidth = 4;


    ctx.beginPath();

    ctx.arc(
        forecast.x,
        forecast.y,
        activeScythe.radius,
        start,
        end
    );

    ctx.stroke();


    ctx.restore();
}


/* ==========================================================
   EFFECT DRAWING
========================================================== */

function drawEffects(now) {

    for (
        const e
        of effects
    ) {

        const progress =
            clamp(
                (
                    now -
                    e.created
                ) /
                e.life,
                0,
                1
            );


        const alpha =
            1 -
            progress;


        ctx.save();

        ctx.globalAlpha =
            alpha;


        if (
            e.type ===
            "muzzle"
        ) {

            ctx.translate(
                e.x,
                e.y
            );


            ctx.fillStyle =
                "#ffffff";


            ctx.beginPath();

            ctx.moveTo(
                0,
                -4
            );

            ctx.lineTo(
                18,
                0
            );

            ctx.lineTo(
                0,
                4
            );

            ctx.closePath();

            ctx.fill();


            ctx.fillStyle =
                "#ff2020";


            ctx.fillRect(
                0,
                -2,
                12,
                4
            );


        } else if (
            e.type ===
            "enemyHit"
        ) {

            ctx.strokeStyle =
                "#ffffff";

            ctx.lineWidth = 2;


            const r =
                8 +
                progress * 18;


            ctx.beginPath();

            ctx.arc(
                e.x,
                e.y,
                r,
                0,
                Math.PI * 2
            );

            ctx.stroke();


        } else if (
            e.type ===
            "phaseBurst"
        ) {

            const r =
                30 +
                progress * 130;


            ctx.strokeStyle =
                "#ff2020";


            ctx.lineWidth =
                7 *
                alpha;


            ctx.beginPath();

            ctx.arc(
                e.x,
                e.y,
                r,
                0,
                Math.PI * 2
            );

            ctx.stroke();


        } else if (
            e.type ===
            "afterimage"
        ) {

            ctx.fillStyle =
                "#ff2020";


            ctx.globalAlpha =
                alpha * 0.25;


            ctx.beginPath();

            ctx.arc(
                e.x,
                e.y,
                30 +
                progress * 15,
                0,
                Math.PI * 2
            );

            ctx.fill();


        } else if (
            e.type ===
            "predictionLine"
        ) {

            ctx.strokeStyle =
                "#ff2020";


            ctx.lineWidth = 2;


            ctx.setLineDash(
                [6, 5]
            );


            ctx.beginPath();

            ctx.moveTo(
                e.x1,
                e.y1
            );

            ctx.lineTo(
                e.x2,
                e.y2
            );

            ctx.stroke();


            ctx.setLineDash([]);


        } else if (
            e.type ===
            "shotgunBurst"
        ) {

            ctx.translate(
                e.x,
                e.y
            );


            ctx.rotate(
                e.angle
            );


            ctx.strokeStyle =
                "#ffffff";


            ctx.lineWidth = 2;


            for (
                let i = -2;
                i <= 2;
                i++
            ) {

                ctx.beginPath();

                ctx.moveTo(
                    0,
                    0
                );

                ctx.lineTo(
                    25,
                    i * 7
                );

                ctx.stroke();
            }


        } else if (
            e.type ===
            "gasterCharge"
        ) {

            const radius =
                lerp(
                    40,
                    10,
                    progress
                );


            ctx.strokeStyle =
                "#ff2020";


            ctx.lineWidth = 3;


            ctx.beginPath();

            ctx.arc(
                e.x,
                e.y,
                radius,
                0,
                Math.PI * 2
            );

            ctx.stroke();


        } else if (
            e.type ===
            "trapBurst"
        ) {

            const radius =
                10 +
                progress * 50;


            ctx.strokeStyle =
                "#ff2020";


            ctx.lineWidth = 4;


            ctx.beginPath();

            ctx.arc(
                e.x,
                e.y,
                radius,
                0,
                Math.PI * 2
            );

            ctx.stroke();


        } else if (
            e.type ===
            "inevitableStart"
        ) {

            ctx.strokeStyle =
                "#ffffff";


            ctx.lineWidth = 2;


            const radius =
                75 -
                progress * 55;


            ctx.beginPath();

            ctx.arc(
                e.x,
                e.y,
                radius,
                0,
                Math.PI * 2
            );

            ctx.stroke();


            ctx.strokeStyle =
                "#ff2020";


            ctx.beginPath();

            ctx.arc(
                e.x,
                e.y,
                radius + 12,
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
            "enemyHealthFill"
        );


    const text =
        document.getElementById(
            "enemyHealthText"
        );


    const percent =
        protagonist.hp /
        protagonist.maxHp *
        100;


    if (fill) {

        fill.style.width =
            `${percent}%`;
    }


    if (text) {

        text.textContent =
            `${Math.ceil(
                protagonist.hp
            )} / ${
                protagonist.maxHp
            }`;
    }
}


function updateStaminaHUD() {

    const fill =
        document.getElementById(
            "staminaFill"
        );


    const text =
        document.getElementById(
            "staminaText"
        );


    const percent =
        forecast.stamina /
        forecast.maxStamina *
        100;


    if (fill) {

        fill.style.width =
            `${percent}%`;
    }


    if (text) {

        text.textContent =
            `${Math.ceil(
                forecast.stamina
            )} / ${
                forecast.maxStamina
            }`;
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


    if (
        turn ===
        TURN.FORECAST
    ) {

        banner.textContent =
            "FORECAST TURN";

    } else if (
        turn ===
        TURN.PROTAGONIST
    ) {

        banner.textContent =
            "PROTAGONIST TURN";

    } else if (
        turn ===
        TURN.TRANSITION
    ) {

        banner.textContent =
            "...";

    } else {

        banner.textContent =
            "BATTLE END";
    }
}


/* ==========================================================
   MESSAGE
========================================================== */

function sendMessage(
    message
) {

    const dialogue =
        document.getElementById(
            "dialogueText"
        );


    if (dialogue) {

        dialogue.textContent =
            message;
    }


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


/* ==========================================================
   PUBLIC STATUS
========================================================== */

function getStatus() {

    return {

        turn,

        protagonistHP:
            protagonist.hp,

        protagonistMaxHP:
            protagonist.maxHp,

        stamina:
            forecast.stamina,

        maxStamina:
            forecast.maxStamina,

        forecastX:
            forecast.x,

        forecastY:
            forecast.y,

        animation:
            Animation.getName(),

        spritesReady:
            ForecastSprites.isLoaded(),

        aiming:
            aim.active
    };
}


/* ==========================================================
   DEBUG RESET
========================================================== */

function debugReset() {

    if (
        typeof ForecastPhases !==
        "undefined" &&
        ForecastPhases.reset
    ) {

        ForecastPhases.reset();
    }


    reset();
}


/* ==========================================================
   PUBLIC API
========================================================== */

return {

    init,

    reset,

    getStatus,

    debugReset
};


/* ==========================================================
   END BATTLE ENGINE
========================================================== */

})();