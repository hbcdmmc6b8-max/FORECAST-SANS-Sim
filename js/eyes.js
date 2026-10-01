/* =========================================================
   FORECAST!SANS — SAME END ANYWAY
   V1 EYE SYSTEM

   Handles:
   - Eye unlock phases
   - Selection
   - Cooldowns
   - Activation events

   battle.js handles the actual effects/visuals.
========================================================= */

const ForecastEyes = (() => {
    "use strict";

    const EYES = {
        "RED EYE": {
            name: "RED EYE",
            phase: "1",
            cooldown: 1300,
            effect: "redEye",
            description: "Temporarily freezes the target."
        },

        "BLACK EYE": {
            name: "BLACK EYE",
            phase: "1.5",
            cooldown: 2200,
            effect: "blackEye",
            description: "Opens Forecast's pocket domain."
        },

        "HEROISM": {
            name: "HEROISM",
            phase: "2",
            cooldown: 3000,
            effect: "heroism",
            description: "Boosts Forecast's combat state."
        },

        "EVOLUTION": {
            name: "EVOLUTION",
            phase: "2.5",
            cooldown: 4500,
            effect: "evolution",
            description: "Improves adaptation to repeated attacks."
        },

        "DEADLOCK": {
            name: "DEADLOCK",
            phase: "3",
            cooldown: 1800,
            effect: "deadlock",
            description: "Restricts the target's movement."
        },

        "NULL": {
            name: "NULL",
            phase: "3.5",
            cooldown: 3600,
            effect: "null",
            description: "Cancels active hostile effects."
        },

        "PARADOX": {
            name: "PARADOX",
            phase: "4",
            cooldown: 3500,
            effect: "paradox",
            description: "Disrupts the target's movement pattern."
        },

        "OBSERVE": {
            name: "OBSERVE",
            phase: "4",
            cooldown: 5000,
            effect: "observe",
            description: "Studies attacks and improves future dodges."
        },

        "VECTOR": {
            name: "VECTOR",
            phase: "4.5",
            cooldown: 3000,
            effect: "vector",
            description: "Manipulates an attack direction."
        },

        "MOMENT": {
            name: "MOMENT",
            phase: "5",
            cooldown: 2500,
            effect: "moment",
            description: "Briefly locks the current moment."
        }
    };


    const ORDER = [
        "RED EYE",
        "BLACK EYE",
        "HEROISM",
        "EVOLUTION",
        "DEADLOCK",
        "NULL",
        "PARADOX",
        "OBSERVE",
        "VECTOR",
        "MOMENT"
    ];


    let selected = "RED EYE";

    const lastUsed = {};


    function normalize(name) {
        return String(name || "")
            .trim()
            .toUpperCase();
    }


    function getData(name) {
        return EYES[normalize(name)] || null;
    }


    function getList() {
        return ORDER.map(name => ({
            ...EYES[name]
        }));
    }


    function getSelected() {
        return selected;
    }


    function getSelectedData() {
        return getData(selected);
    }


    function isUnlocked(name) {
        const eye = getData(name);

        if (!eye) {
            return false;
        }

        if (typeof ForecastPhases === "undefined") {
            return eye.phase === "1";
        }

        return ForecastPhases.isPhaseUnlocked(
            eye.phase
        );
    }


    function select(name) {
        const eye = getData(name);

        if (!eye) {
            emitMessage("Unknown eye.");
            return false;
        }

        if (!isUnlocked(eye.name)) {
            emitMessage(
                `LOCKED — PHASE ${eye.phase}`
            );

            return false;
        }

        selected = eye.name;

        window.dispatchEvent(
            new CustomEvent(
                "forecast-eye-selected",
                {
                    detail: {
                        ...eye
                    }
                }
            )
        );

        return true;
    }


    function getCooldownRemaining(
        name = selected
    ) {
        const eye = getData(name);

        if (!eye) {
            return 0;
        }

        const usedAt =
            lastUsed[eye.name] || 0;

        return Math.max(
            0,
            eye.cooldown -
            (
                performance.now() -
                usedAt
            )
        );
    }


    function canUse(
        name = selected
    ) {
        const eye = getData(name);

        if (!eye) {
            return false;
        }

        if (!isUnlocked(eye.name)) {
            return false;
        }

        return (
            getCooldownRemaining(
                eye.name
            ) <= 0
        );
    }


    /*
        battle.js/game.js will call this
        when the player RELEASES their drag.

        target is preserved so directional
        eyes can use the exact aimed point.
    */
    function activate(
        target = null,
        name = selected
    ) {
        const eye = getData(name);

        if (!eye) {
            return {
                activated: false,
                reason: "unknown"
            };
        }

        if (!isUnlocked(eye.name)) {
            emitMessage(
                `LOCKED — PHASE ${eye.phase}`
            );

            return {
                activated: false,
                reason: "locked"
            };
        }

        const remaining =
            getCooldownRemaining(
                eye.name
            );

        if (remaining > 0) {
            return {
                activated: false,
                reason: "cooldown",
                remaining
            };
        }

        selected = eye.name;

        lastUsed[eye.name] =
            performance.now();

        window.dispatchEvent(
            new CustomEvent(
                "forecast-eye-activate",
                {
                    detail: {
                        name: eye.name,
                        effect: eye.effect,

                        target: target
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
            eye: eye.name,
            effect: eye.effect
        };
    }


    function reset() {
        selected = "RED EYE";

        for (
            const key of
            Object.keys(lastUsed)
        ) {
            delete lastUsed[key];
        }

        window.dispatchEvent(
            new CustomEvent(
                "forecast-eye-selected",
                {
                    detail: {
                        ...EYES["RED EYE"]
                    }
                }
            )
        );
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