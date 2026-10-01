/* =========================================
   FORECAST!SANS — TECHNIQUES V0.3
========================================= */

const Techniques = (() => {

    const TECHNIQUES = {

        "BONES": {
            requiredPhase: "1",
            cooldown: 550,
            attack: "bones",
            description:
                "Launches a fast bone attack toward the protagonist."
        },

        "BONE WALL": {
            requiredPhase: "1.5",
            cooldown: 2200,
            attack: "boneWall",
            description:
                "Predicts an escape route and raises a bone wall."
        },

        "ILLUSIONS": {
            requiredPhase: "2",
            cooldown: 3600,
            attack: "illusions",
            description:
                "Creates false attacks to confuse the protagonist."
        },

        "CONSTRUCTS": {
            requiredPhase: "2.5",
            cooldown: 3200,
            attack: "constructs",
            description:
                "Creates solid red-black energy constructs."
        },

        "GASTER": {
            requiredPhase: "3",
            cooldown: 4300,
            attack: "gaster",
            description:
                "Summons a Gaster construct and charges an energy attack."
        },

        "FORECAST TRAP": {
            requiredPhase: "3.5",
            cooldown: 4700,
            attack: "forecastTrap",
            description:
                "Marks the protagonist's predicted future position."
        },

        "CROSSFIRE": {
            requiredPhase: "4",
            cooldown: 5600,
            attack: "crossfire",
            description:
                "Attacks the target from several directions."
        },

        "FALSE FUTURE": {
            requiredPhase: "4.5",
            cooldown: 6500,
            attack: "falseFuture",
            description:
                "Shows a fake prediction before striking the real position."
        },

        "INEVITABLE": {
            requiredPhase: "5",
            cooldown: 8500,
            attack: "inevitable",
            description:
                "A Phase 5 pattern that reacts to the protagonist's movement."
        }

    };


    let selected = "BONES";

    const lastUsed = {};


    /* =====================================
       INFORMATION
    ===================================== */

    function getList() {
        return Object.keys(TECHNIQUES);
    }


    function getData(name) {
        return TECHNIQUES[name] || null;
    }


    function getSelected() {
        return selected;
    }


    /* =====================================
       UNLOCKS
    ===================================== */

    function isUnlocked(name) {

        const technique =
            TECHNIQUES[name];


        if (!technique) {
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
                technique.requiredPhase
            );
    }


    /* =====================================
       SELECT
    ===================================== */

    function select(name) {

        const technique =
            TECHNIQUES[name];


        if (!technique) {
            return false;
        }


        if (!isUnlocked(name)) {

            announce(
                `${name} unlocks at Phase ${technique.requiredPhase}.`
            );

            return false;
        }


        selected = name;


        announce(
            `${name} selected.`
        );


        window.dispatchEvent(
            new CustomEvent(
                "forecast-technique-selected",
                {
                    detail: {
                        name,
                        data: technique
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

        const technique =
            TECHNIQUES[name];


        if (!technique) {
            return 0;
        }


        const previous =
            lastUsed[name] || 0;


        const elapsed =
            performance.now() -
            previous;


        return Math.max(
            0,
            technique.cooldown -
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

        const technique =
            TECHNIQUES[selected];


        if (!technique) {
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
            battle.js listens for this
            and creates the actual attack.
        */

        window.dispatchEvent(
            new CustomEvent(
                "forecast-technique-activate",
                {
                    detail: {

                        name:
                            selected,

                        attack:
                            technique.attack

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

        selected = "BONES";


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