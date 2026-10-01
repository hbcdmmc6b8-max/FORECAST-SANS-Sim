/* =========================================================
   FORECAST!SANS — SAME END ANYWAY
   V1 TECHNIQUE SYSTEM

   Handles:
   - Technique unlock phases
   - Selection
   - Cooldowns
   - Drag/release target data
   - Activation events

   battle.js handles visuals, collision and damage.
========================================================= */

const ForecastTechniques = (() => {
    "use strict";


    /* =====================================================
       TECHNIQUE DATABASE
    ===================================================== */

    const TECHNIQUES = {

        "BONES": {
            name: "BONES",
            phase: "1",
            cooldown: 550,
            attack: "bones",
            description: "Launches pixel-bone projectiles."
        },

        "BONE WALL": {
            name: "BONE WALL",
            phase: "1.5",
            cooldown: 2200,
            attack: "boneWall",
            description: "Bones erupt around the aimed area."
        },

        "ILLUSIONS": {
            name: "ILLUSIONS",
            phase: "2",
            cooldown: 3600,
            attack: "illusions",
            description: "Creates false targets and visual deception."
        },

        "CONSTRUCTS": {
            name: "CONSTRUCTS",
            phase: "2.5",
            cooldown: 3200,
            attack: "constructs",
            description: "Summons constructs that attack independently."
        },

        "GASTER": {
            name: "GASTER",
            phase: "3",
            cooldown: 4300,
            attack: "gaster",
            description: "Charges a powerful energy attack."
        },

        "FORECAST TRAP": {
            name: "FORECAST TRAP",
            phase: "3.5",
            cooldown: 4700,
            attack: "forecastTrap",
            description: "Predicts movement and places a delayed trap."
        },

        "CROSSFIRE": {
            name: "CROSSFIRE",
            phase: "4",
            cooldown: 5600,
            attack: "crossfire",
            description: "Attacks the aimed location from several directions."
        },

        "FALSE FUTURE": {
            name: "FALSE FUTURE",
            phase: "4.5",
            cooldown: 6500,
            attack: "falseFuture",
            description: "Shows a false warning before the real attack."
        },

        "INEVITABLE": {
            name: "INEVITABLE",
            phase: "5",
            cooldown: 8500,
            attack: "inevitable",
            description: "Forecast's Phase 5 prediction sequence."
        }
    };


    const ORDER = [
        "BONES",
        "BONE WALL",
        "ILLUSIONS",
        "CONSTRUCTS",
        "GASTER",
        "FORECAST TRAP",
        "CROSSFIRE",
        "FALSE FUTURE",
        "INEVITABLE"
    ];


    /* =====================================================
       STATE
    ===================================================== */

    let selected = "BONES";

    const lastUsed = {};


    /* =====================================================
       HELPERS
    ===================================================== */

    function normalize(name) {
        return String(name || "")
            .trim()
            .toUpperCase();
    }


    function getData(name) {
        return (
            TECHNIQUES[
                normalize(name)
            ] || null
        );
    }


    function getList() {
        return ORDER.map(
            name => ({
                ...TECHNIQUES[name]
            })
        );
    }


    function getSelected() {
        return selected;
    }


    function getSelectedData() {
        return getData(selected);
    }


    /* =====================================================
       UNLOCK CHECK
    ===================================================== */

    function isUnlocked(name) {
        const technique =
            getData(name);


        if (!technique) {
            return false;
        }


        if (
            typeof ForecastPhases ===
            "undefined"
        ) {
            return (
                technique.phase ===
                "1"
            );
        }


        return ForecastPhases
            .isPhaseUnlocked(
                technique.phase
            );
    }


    /* =====================================================
       SELECT
    ===================================================== */

    function select(name) {
        const technique =
            getData(name);


        if (!technique) {
            emitMessage(
                "Unknown technique."
            );

            return false;
        }


        if (
            !isUnlocked(
                technique.name
            )
        ) {
            emitMessage(
                `LOCKED — PHASE ${technique.phase}`
            );

            return false;
        }


        selected =
            technique.name;


        window.dispatchEvent(
            new CustomEvent(
                "forecast-technique-selected",
                {
                    detail: {
                        ...technique
                    }
                }
            )
        );


        return true;
    }


    /* =====================================================
       COOLDOWN
    ===================================================== */

    function getCooldownRemaining(
        name = selected
    ) {
        const technique =
            getData(name);


        if (!technique) {
            return 0;
        }


        const usedAt =
            lastUsed[
                technique.name
            ] || 0;


        return Math.max(
            0,
            technique.cooldown -
            (
                performance.now() -
                usedAt
            )
        );
    }


    function canUse(
        name = selected
    ) {
        const technique =
            getData(name);


        if (!technique) {
            return false;
        }


        if (
            !isUnlocked(
                technique.name
            )
        ) {
            return false;
        }


        return (
            getCooldownRemaining(
                technique.name
            ) <= 0
        );
    }


    /* =====================================================
       ACTIVATE

       Called when the player releases their drag.

       Example target:
       {
           x: 420,
           y: 310
       }
    ===================================================== */

    function activate(
        target = null,
        name = selected
    ) {
        const technique =
            getData(name);


        if (!technique) {
            return {
                activated: false,
                reason: "unknown"
            };
        }


        if (
            !isUnlocked(
                technique.name
            )
        ) {
            emitMessage(
                `LOCKED — PHASE ${technique.phase}`
            );

            return {
                activated: false,
                reason: "locked"
            };
        }


        const remaining =
            getCooldownRemaining(
                technique.name
            );


        if (
            remaining > 0
        ) {
            return {
                activated: false,
                reason: "cooldown",
                remaining
            };
        }


        selected =
            technique.name;


        lastUsed[
            technique.name
        ] = performance.now();


        /*
            Battle receives BOTH the technique
            and the exact drag-release target.
        */

        window.dispatchEvent(
            new CustomEvent(
                "forecast-technique-activate",
                {
                    detail: {
                        name:
                            technique.name,

                        attack:
                            technique.attack,

                        target:
                            target
                                ? {
                                    x: target.x,
                                    y: target.y
                                }
                                : null
                    }
                }
            )
        );


        return {
            activated: true,
            technique:
                technique.name,
            attack:
                technique.attack
        };
    }


    /* =====================================================
       RESET
    ===================================================== */

    function reset() {
        selected = "BONES";


        for (
            const key of
            Object.keys(lastUsed)
        ) {
            delete lastUsed[key];
        }


        window.dispatchEvent(
            new CustomEvent(
                "forecast-technique-selected",
                {
                    detail: {
                        ...TECHNIQUES.BONES
                    }
                }
            )
        );
    }


    /* =====================================================
       MESSAGE EVENT
    ===================================================== */

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


    /* =====================================================
       PUBLIC API
    ===================================================== */

    return {
        getList,
        getData,

        getSelected,
        getSelectedData,

        isUnlocked,

        select,
        activate,

        canUse,
        getCooldownRemaining,

        reset
    };

})();