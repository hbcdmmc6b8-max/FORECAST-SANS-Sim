/* ==========================================
   FORECAST!SANS SIM — EYE SYSTEM
========================================== */

const Eyes = (() => {

    const eyes = {

        "RED EYE": {
            requiredPhase: "2.5",
            cooldown: 6500,
            description: "Temporarily locks the target in place."
        },

        "BLACK EYE": {
            requiredPhase: "3.5",
            cooldown: 9000,
            description: "Opens Forecast's pocket domain."
        },

        "HEROISM": {
            requiredPhase: "4",
            cooldown: 8000,
            description: "Overcharges Forecast's offensive power."
        },

        "DEADLOCK": {
            requiredPhase: "4.5",
            cooldown: 7500,
            description: "Restricts the target's movement."
        },

        "NULL": {
            requiredPhase: "4.5",
            cooldown: 10000,
            description: "Erases active hostile attacks."
        },

        "PARADOX": {
            requiredPhase: "4.5",
            cooldown: 8500,
            description: "Creates a false Forecast position."
        },

        "OBSERVE": {
            requiredPhase: "4.5",
            cooldown: 5500,
            description: "Reveals predicted movement for longer."
        },

        "VECTOR": {
            requiredPhase: "4.5",
            cooldown: 7000,
            description: "Redirects Forecast's active projectiles."
        },

        "MOMENT": {
            requiredPhase: "4.5",
            cooldown: 9000,
            description: "Briefly slows the battle around Forecast."
        },

        "EVOLUTION": {
            requiredPhase: "5",
            cooldown: 12000,
            description: "Adapts Forecast to repeated attack patterns."
        }

    };


    let selected = "RED EYE";

    const lastUsed = {};


    /* ======================================
       PHASE HELPERS
    ====================================== */

    function phaseToIndex(phase) {

        const order = [
            "1",
            "1.5",
            "2",
            "2.5",
            "3",
            "3.5",
            "4",
            "4.5",
            "5"
        ];

        return order.indexOf(
            String(phase)
        );

    }


    function isUnlocked(name) {

        const eye = eyes[name];

        if (!eye) {
            return false;
        }


        if (
            typeof ForecastPhases ===
            "undefined"
        ) {
            return false;
        }


        const current =
            ForecastPhases.getPhaseIndex();

        const required =
            phaseToIndex(
                eye.requiredPhase
            );


        return current >= required;
    }


    /* ======================================
       INFORMATION
    ====================================== */

    function getList() {

        return Object.keys(eyes);

    }


    function getData(name) {

        return eyes[name] || null;

    }


    function getSelected() {

        return selected;

    }


    function select(name) {

        if (!eyes[name]) {
            return false;
        }

        selected = name;

        return true;

    }


    /* ======================================
       COOLDOWN
    ====================================== */

    function getCooldownRemaining(name) {

        const eye = eyes[name];

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
            eye.cooldown - elapsed
        );

    }


    function canUse(name) {

        return (
            isUnlocked(name) &&
            getCooldownRemaining(name) <= 0
        );

    }


    /* ======================================
       ACTIVATE SELECTED EYE
    ====================================== */

    function activate() {

        const name = selected;

        if (!eyes[name]) {
            return false;
        }


        if (!isUnlocked(name)) {

            if (
                typeof Battle !==
                "undefined" &&
                Battle.say
            ) {

                Battle.say(
                    `${name} unlocks at Phase ${eyes[name].requiredPhase}.`
                );

            }

            return false;
        }


        if (!canUse(name)) {

            const seconds =
                Math.ceil(
                    getCooldownRemaining(name)
                    / 1000
                );


            if (
                typeof Battle !==
                "undefined" &&
                Battle.say
            ) {

                Battle.say(
                    `${name} recovering: ${seconds}s`
                );

            }

            return false;
        }


        if (
            typeof Battle ===
            "undefined"
        ) {
            return false;
        }


        lastUsed[name] =
            performance.now();


        switch (name) {

            case "RED EYE":
                redEye();
                break;

            case "BLACK EYE":
                blackEye();
                break;

            case "HEROISM":
                heroism();
                break;

            case "DEADLOCK":
                deadlock();
                break;

            case "NULL":
                nullEye();
                break;

            case "PARADOX":
                paradox();
                break;

            case "OBSERVE":
                observe();
                break;

            case "VECTOR":
                vector();
                break;

            case "MOMENT":
                moment();
                break;

            case "EVOLUTION":
                evolution();
                break;

        }


        return true;

    }


    /* ======================================
       RED EYE
    ====================================== */

    function redEye() {

        Battle.say(
            "The future stops moving."
        );


        if (Battle.freezeEnemy) {

            Battle.freezeEnemy(
                1600
            );

        }

    }


    /* ======================================
       BLACK EYE
    ====================================== */

    function blackEye() {

        Battle.say(
            "Space folds into Forecast's domain."
        );


        if (Battle.activatePocketDomain) {

            Battle.activatePocketDomain(
                3500
            );

        }

    }


    /* ======================================
       HEROISM
    ====================================== */

    function heroism() {

        Battle.say(
            "HEROISM burns bright."
        );


        if (Battle.activateHeroism) {

            Battle.activateHeroism(
                4200
            );

        }

    }


    /* ======================================
       DEADLOCK
    ====================================== */

    function deadlock() {

        Battle.say(
            "Every escape route closes."
        );


        if (Battle.activateDeadlock) {

            Battle.activateDeadlock(
                2800
            );

        }

    }


    /* ======================================
       NULL
    ====================================== */

    function nullEye() {

        Battle.say(
            "Hostile possibilities erased."
        );


        if (Battle.nullifyEnemyAttacks) {

            Battle.nullifyEnemyAttacks();

        }

    }


    /* ======================================
       PARADOX
    ====================================== */

    function paradox() {

        Battle.say(
            "One position becomes two."
        );


        if (Battle.spawnForecastDecoy) {

            Battle.spawnForecastDecoy(
                4000
            );

        }

    }


    /* ======================================
       OBSERVE
    ====================================== */

    function observe() {

        Battle.say(
            "Forecast reads further ahead."
        );


        if (Battle.activateObserve) {

            Battle.activateObserve(
                5000
            );

        }

    }


    /* ======================================
       VECTOR
    ====================================== */

    function vector() {

        Battle.say(
            "Trajectory rewritten."
        );


        if (Battle.redirectProjectiles) {

            Battle.redirectProjectiles();

        }

    }


    /* ======================================
       MOMENT
    ====================================== */

    function moment() {

        Battle.say(
            "One moment stretches."
        );


        if (Battle.activateMoment) {

            Battle.activateMoment(
                2600
            );

        }

    }


    /* ======================================
       EVOLUTION
    ====================================== */

    function evolution() {

        Battle.say(
            "EVOLUTION begins."
        );


        if (Battle.activateEvolution) {

            Battle.activateEvolution(
                6500
            );

        }

    }


    /* ======================================
       RESET
    ====================================== */

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


    /* ======================================
       PUBLIC API
    ====================================== */

    return {

        getList,

        getData,

        getSelected,

        select,

        activate,

        isUnlocked,

        canUse,

        getCooldownRemaining,

        reset

    };

})();