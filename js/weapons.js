/* =========================================
   FORECAST!SANS — WEAPON SYSTEM V0.3
========================================= */

const Weapons = (() => {

    /*
        All values here are GAME values.

        Battle.js will decide how the
        attacks actually look and move.
    */

    const WEAPONS = {

        "GLOCK": {
            requiredPhase: "1",
            cooldown: 300,
            description: "Fast, accurate basic shot.",
            attack: "glock"
        },

        "SMG": {
            requiredPhase: "1.5",
            cooldown: 700,
            description: "Rapid short burst.",
            attack: "smg"
        },

        "AR": {
            requiredPhase: "2",
            cooldown: 650,
            description: "Controlled three-shot burst.",
            attack: "ar"
        },

        "DMR": {
            requiredPhase: "2.5",
            cooldown: 1000,
            description: "Telegraphed precision attack.",
            attack: "dmr"
        },

        "SHOTGUN": {
            requiredPhase: "3",
            cooldown: 950,
            description: "Wide close-range spread.",
            attack: "shotgun"
        },

        "GASTER HAND": {
            requiredPhase: "3.5",
            cooldown: 1400,
            description: "Charges supernatural energy before firing.",
            attack: "gasterHand"
        },

        "EXECUTION SCYTHE": {
            requiredPhase: "4",
            cooldown: 1250,
            description: "Large close-range sweeping attack.",
            attack: "scythe"
        }

    };


    let selected = "GLOCK";

    const lastUsed = {};


    /* =====================================
       INFORMATION
    ===================================== */

    function getList() {
        return Object.keys(WEAPONS);
    }


    function getData(name) {
        return WEAPONS[name] || null;
    }


    function getSelected() {
        return selected;
    }


    /* =====================================
       UNLOCKS
    ===================================== */

    function isUnlocked(name) {

        const weapon =
            WEAPONS[name];


        if (!weapon) {
            return false;
        }


        if (
            typeof ForecastPhases ===
            "undefined"
        ) {
            return false;
        }


        return ForecastPhases
            .isPhaseUnlocked(
                weapon.requiredPhase
            );
    }


    /* =====================================
       SELECT
    ===================================== */

    function select(name) {

        const weapon =
            WEAPONS[name];


        if (!weapon) {
            return false;
        }


        /*
            Locked weapons can appear in
            the menu, but cannot be equipped.
        */

        if (!isUnlocked(name)) {

            announce(
                `${name} unlocks at Phase ${weapon.requiredPhase}.`
            );

            return false;
        }


        selected = name;


        announce(
            `${name} selected.`
        );


        window.dispatchEvent(
            new CustomEvent(
                "forecast-weapon-selected",
                {
                    detail: {
                        name,
                        data: weapon
                    }
                }
            )
        );


        return true;
    }


    /* =====================================
       COOLDOWN
    ===================================== */

    function getCooldownRemaining(
        name = selected
    ) {

        const weapon =
            WEAPONS[name];


        if (!weapon) {
            return 0;
        }


        const previous =
            lastUsed[name] || 0;


        const elapsed =
            performance.now() -
            previous;


        return Math.max(
            0,
            weapon.cooldown -
            elapsed
        );
    }


    function canUse(
        name = selected
    ) {

        return (
            isUnlocked(name) &&
            getCooldownRemaining(name)
            <= 0
        );
    }


    /* =====================================
       FIRE
    ===================================== */

    function fire() {

        const weapon =
            WEAPONS[selected];


        if (!weapon) {
            return false;
        }


        if (!isUnlocked(selected)) {

            announce(
                `${selected} is locked.`
            );

            return false;
        }


        if (!canUse(selected)) {

            return false;
        }


        /*
            Battle.js listens for this.

            weapons.js does NOT create
            projectiles itself anymore.
        */

        lastUsed[selected] =
            performance.now();


        window.dispatchEvent(
            new CustomEvent(
                "forecast-weapon-fire",
                {
                    detail: {
                        name: selected,
                        attack:
                            weapon.attack
                    }
                }
            )
        );


        return true;
    }


    /* =====================================
       RESET
    ===================================== */

    function reset() {

        selected =
            "GLOCK";


        Object.keys(
            lastUsed
        ).forEach(
            key => {

                delete lastUsed[key];

            }
        );
    }


    /* =====================================
       DIALOGUE HELPER
    ===================================== */

    function announce(message) {

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


    /* =====================================
       PUBLIC API
    ===================================== */

    return {

        getList,
        getData,
        getSelected,

        isUnlocked,

        select,

        fire,

        canUse,
        getCooldownRemaining,

        reset

    };

})();