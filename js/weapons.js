/* =========================================================
   FORECAST!SANS — SAME END ANYWAY
   V1 WEAPON SYSTEM — DRAG TARGET PATCHED

   Flow:
   select weapon
        ↓
   drag on battle screen
        ↓
   release
        ↓
   game.js sends target
        ↓
   weapons.js sends target to battle.js
========================================================= */

const ForecastWeapons = (() => {
    "use strict";


    /* =====================================================
       WEAPONS
    ===================================================== */

    const WEAPONS = {

        "GLOCK": {
            name: "GLOCK",
            phase: "1",
            cooldown: 300,
            attack: "glock",

            description:
                "Fast precision shot."
        },

        "SMG": {
            name: "SMG",
            phase: "1.5",
            cooldown: 700,
            attack: "smg",

            description:
                "Rapid stream of smaller projectiles."
        },

        "AR": {
            name: "AR",
            phase: "2",
            cooldown: 650,
            attack: "ar",

            description:
                "Controlled burst with heavier tracers."
        },

        "DMR": {
            name: "DMR",
            phase: "2.5",
            cooldown: 1000,
            attack: "dmr",

            description:
                "High-speed precision projectile."
        },

        "SHOTGUN": {
            name: "SHOTGUN",
            phase: "3",
            cooldown: 950,
            attack: "shotgun",

            description:
                "Fires a spread of projectiles."
        },

        "GASTER HAND": {
            name: "GASTER HAND",
            phase: "3.5",
            cooldown: 1400,
            attack: "gasterHand",

            description:
                "Charges and releases an energy beam."
        },

        "EXECUTION SCYTHE": {
            name: "EXECUTION SCYTHE",
            phase: "4",
            cooldown: 1250,
            attack: "scythe",

            description:
                "Summons Forecast's scythe for a sweeping attack."
        }
    };


    const ORDER = [
        "GLOCK",
        "SMG",
        "AR",
        "DMR",
        "SHOTGUN",
        "GASTER HAND",
        "EXECUTION SCYTHE"
    ];


    /* =====================================================
       STATE
    ===================================================== */

    let selected = "GLOCK";

    const lastUsed = {};


    /* =====================================================
       HELPERS
    ===================================================== */

    function normalize(name) {
        return String(
            name || ""
        )
            .trim()
            .toUpperCase();
    }


    function getData(name) {
        return (
            WEAPONS[
                normalize(name)
            ] || null
        );
    }


    function getList() {
        return ORDER.map(
            name => ({
                ...WEAPONS[name]
            })
        );
    }


    function getSelected() {
        return selected;
    }


    function getSelectedData() {
        return getData(
            selected
        );
    }


    /* =====================================================
       UNLOCK CHECK
    ===================================================== */

    function isUnlocked(name) {
        const weapon =
            getData(name);


        if (!weapon) {
            return false;
        }


        if (
            typeof ForecastPhases ===
            "undefined"
        ) {
            return (
                weapon.phase ===
                "1"
            );
        }


        return ForecastPhases
            .isPhaseUnlocked(
                weapon.phase
            );
    }


    /* =====================================================
       SELECT
    ===================================================== */

    function select(name) {
        const weapon =
            getData(name);


        if (!weapon) {
            emitMessage(
                "Unknown weapon."
            );

            return false;
        }


        if (
            !isUnlocked(
                weapon.name
            )
        ) {
            emitMessage(
                `LOCKED — PHASE ${weapon.phase}`
            );

            return false;
        }


        selected =
            weapon.name;


        window.dispatchEvent(
            new CustomEvent(
                "forecast-weapon-selected",
                {
                    detail: {
                        ...weapon
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
        const weapon =
            getData(name);


        if (!weapon) {
            return 0;
        }


        const usedAt =
            lastUsed[
                weapon.name
            ] || 0;


        return Math.max(
            0,

            weapon.cooldown -
            (
                performance.now() -
                usedAt
            )
        );
    }


    function canUse(
        name = selected
    ) {
        const weapon =
            getData(name);


        if (!weapon) {
            return false;
        }


        if (
            !isUnlocked(
                weapon.name
            )
        ) {
            return false;
        }


        return (
            getCooldownRemaining(
                weapon.name
            ) <= 0
        );
    }


    /* =====================================================
       FIRE

       target = exact point where the player
       released their finger/mouse.

       Example:

       {
           x: 420,
           y: 310
       }
    ===================================================== */

    function fire(
        target = null,
        name = selected
    ) {
        const weapon =
            getData(name);


        if (!weapon) {
            return {
                fired: false,
                reason: "unknown"
            };
        }


        if (
            !isUnlocked(
                weapon.name
            )
        ) {
            emitMessage(
                `LOCKED — PHASE ${weapon.phase}`
            );


            return {
                fired: false,
                reason: "locked"
            };
        }


        const remaining =
            getCooldownRemaining(
                weapon.name
            );


        if (
            remaining > 0
        ) {
            return {
                fired: false,
                reason: "cooldown",
                remaining
            };
        }


        selected =
            weapon.name;


        lastUsed[
            weapon.name
        ] =
            performance.now();


        /*
            THIS IS THE IMPORTANT PATCH.

            The exact drag-release coordinates
            are included in the event.
        */

        window.dispatchEvent(
            new CustomEvent(
                "forecast-weapon-fire",
                {
                    detail: {
                        name:
                            weapon.name,

                        attack:
                            weapon.attack,

                        cooldown:
                            weapon.cooldown,

                        target:
                            target
                                ? {
                                    x:
                                        target.x,

                                    y:
                                        target.y
                                }
                                : null
                    }
                }
            )
        );


        return {
            fired: true,

            weapon:
                weapon.name,

            attack:
                weapon.attack,

            target:
                target
                    ? {
                        x:
                            target.x,

                        y:
                            target.y
                    }
                    : null
        };
    }


    /* =====================================================
       RESET
    ===================================================== */

    function reset() {
        selected =
            "GLOCK";


        for (
            const key of
            Object.keys(lastUsed)
        ) {
            delete lastUsed[
                key
            ];
        }


        window.dispatchEvent(
            new CustomEvent(
                "forecast-weapon-selected",
                {
                    detail: {
                        ...WEAPONS.GLOCK
                    }
                }
            )
        );
    }


    /* =====================================================
       MESSAGE
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
        fire,

        canUse,
        getCooldownRemaining,

        reset
    };

})();