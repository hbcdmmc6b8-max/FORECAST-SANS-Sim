/* =========================================
   FORECAST!SANS — EYE SYSTEM V0.3
========================================= */

const Eyes = (() => {

    const EYES = {

        "RED EYE": {
            requiredPhase: "1",
            cooldown: 5000,
            duration: 1300,
            effect: "freeze",
            description:
                "Temporarily locks the protagonist's movement."
        },

        "BLACK EYE": {
            requiredPhase: "1.5",
            cooldown: 6500,
            duration: 2200,
            effect: "domain",
            description:
                "Creates a pocket domain that restricts movement."
        },

        "HEROISM": {
            requiredPhase: "2",
            cooldown: 7000,
            duration: 3000,
            effect: "heroism",
            description:
                "Bright-red power state that strengthens Forecast's attacks."
        },

        "EVOLUTION": {
            requiredPhase: "2.5",
            cooldown: 8500,
            duration: 4500,
            effect: "evolution",
            description:
                "Studies repeated patterns and adapts to them."
        },

        "DEADLOCK": {
            requiredPhase: "3",
            cooldown: 7500,
            duration: 1800,
            effect: "deadlock",
            description:
                "Locks the protagonist onto their current trajectory."
        },

        "NULL": {
            requiredPhase: "3.5",
            cooldown: 9000,
            duration: 0,
            effect: "null",
            description:
                "Erases active hostile projectiles from the arena."
        },

        "PARADOX": {
            requiredPhase: "4",
            cooldown: 8500,
            duration: 3500,
            effect: "paradox",
            description:
                "Creates false Forecast positions to confuse targeting."
        },

        "OBSERVE": {
            requiredPhase: "4",
            cooldown: 6500,
            duration: 5000,
            effect: "observe",
            description:
                "Reveals predicted hostile trajectories."
        },

        "VECTOR": {
            requiredPhase: "4.5",
            cooldown: 10000,
            duration: 3000,
            effect: "vector",
            description:
                "Redirects Forecast's active attacks toward the target."
        },

        "MOMENT": {
            requiredPhase: "5",
            cooldown: 12000,
            duration: 2500,
            effect: "moment",
            description:
                "Slows the battle around Forecast for a brief moment."
        }

    };


    let selected = "RED EYE";

    const lastUsed = {};


    /* =====================================
       INFORMATION
    ===================================== */

    function getList() {
        return Object.keys(EYES);
    }


    function getData(name) {
        return EYES[name] || null;
    }


    function getSelected() {
        return selected;
    }


    /* =====================================
       UNLOCK CHECK
    ===================================== */

    function isUnlocked(name) {

        const eye =
            EYES[name];


        if (!eye) {
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
                eye.requiredPhase
            );
    }


    /* =====================================
       SELECT
    ===================================== */

    function select(name) {

        const eye =
            EYES[name];


        if (!eye) {
            return false;
        }


        if (!isUnlocked(name)) {

            announce(
                `${name} unlocks at Phase ${eye.requiredPhase}.`
            );

            return false;
        }


        selected = name;


        announce(
            `${name} selected.`
        );


        window.dispatchEvent(
            new CustomEvent(
                "forecast-eye-selected",
                {
                    detail: {
                        name,
                        data: eye
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

        const eye =
            EYES[name];


        if (!eye) {
            return 0;
        }


        const previous =
            lastUsed[name] || 0;


        const elapsed =
            performance.now() -
            previous;


        return Math.max(
            0,
            eye.cooldown -
            elapsed
        );
    }


    function canActivate(
        name = selected
    ) {

        return (
            isUnlocked(name) &&
            getCooldownRemaining(name)
            <= 0
        );
    }


    /* =====================================
       ACTIVATE
    ===================================== */

    function activate() {

        const eye =
            EYES[selected];


        if (!eye) {
            return false;
        }


        if (!isUnlocked(selected)) {

            announce(
                `${selected} is locked.`
            );

            return false;
        }


        if (!canActivate(selected)) {

            const seconds =
                Math.ceil(
                    getCooldownRemaining(
                        selected
                    ) / 1000
                );


            announce(
                `${selected} recovering: ${seconds}s`
            );

            return false;
        }


        lastUsed[selected] =
            performance.now();


        /*
            battle.js receives this event
            and performs the visual/gameplay
            effect.
        */

        window.dispatchEvent(
            new CustomEvent(
                "forecast-eye-activate",
                {
                    detail: {

                        name:
                            selected,

                        effect:
                            eye.effect,

                        duration:
                            eye.duration

                    }
                }
            )
        );


        announce(
            `${selected} activated.`
        );


        return true;
    }


    /* =====================================
       RESET
    ===================================== */

    function reset() {

        selected =
            "RED EYE";


        Object.keys(
            lastUsed
        ).forEach(
            key => {

                delete lastUsed[key];

            }
        );
    }


    /* =====================================
       MESSAGE
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
        activate,

        canActivate,
        getCooldownRemaining,

        reset

    };

})();