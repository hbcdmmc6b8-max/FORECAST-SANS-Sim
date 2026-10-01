/* ==========================================
   FORECAST!SANS SIM — TECHNIQUE SYSTEM
========================================== */

const Techniques = (() => {

    const techniques = {

        "BONES": {
            requiredPhase: "1",
            cooldown: 450,
            description: "Summon bone constructs toward the target."
        },

        "BONE WALL": {
            requiredPhase: "1.5",
            cooldown: 2200,
            description: "Raise a line of bones across the arena."
        },

        "ILLUSIONS": {
            requiredPhase: "2",
            cooldown: 3800,
            description: "Create false attacks and misleading images."
        },

        "CONSTRUCTS": {
            requiredPhase: "2.5",
            cooldown: 3200,
            description: "Create solid red-black energy constructs."
        },

        "GASTER": {
            requiredPhase: "3",
            cooldown: 4200,
            description: "Summon a Gaster construct for an energy attack."
        },

        "FORECAST TRAP": {
            requiredPhase: "3.5",
            cooldown: 5000,
            description: "Predict a future position and attack it."
        },

        "CROSSFIRE": {
            requiredPhase: "4",
            cooldown: 5800,
            description: "Surround the target with synchronized attacks."
        },

        "FALSE FUTURE": {
            requiredPhase: "4.5",
            cooldown: 6500,
            description: "Display a false prediction before the real attack."
        },

        "INEVITABLE": {
            requiredPhase: "5",
            cooldown: 8500,
            description: "A Phase 5 attack that adapts its pattern to the target."
        }

    };


    const phaseOrder = [
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


    let selected = "BONES";

    const lastUsed = {};


    /* ======================================
       INFORMATION
    ====================================== */

    function getList() {
        return Object.keys(techniques);
    }


    function getData(name) {
        return techniques[name] || null;
    }


    function getSelected() {
        return selected;
    }


    function select(name) {

        if (!techniques[name]) {
            return false;
        }

        selected = name;

        return true;
    }


    /* ======================================
       PHASE LOCKING
    ====================================== */

    function phaseToIndex(phase) {
        return phaseOrder.indexOf(
            String(phase)
        );
    }


    function isUnlocked(name) {

        const technique =
            techniques[name];

        if (!technique) {
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
                technique.requiredPhase
            );


        return current >= required;
    }


    /* ======================================
       COOLDOWNS
    ====================================== */

    function getCooldownRemaining(name) {

        const technique =
            techniques[name];

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
            technique.cooldown - elapsed
        );
    }


    function canUse(name) {

        return (
            isUnlocked(name) &&
            getCooldownRemaining(name) <= 0
        );
    }


    /* ======================================
       ACTIVATE
    ====================================== */

    function activate() {

        const name = selected;

        const technique =
            techniques[name];


        if (!technique) {
            return false;
        }


        if (!isUnlocked(name)) {

            if (
                typeof Battle !==
                "undefined" &&
                Battle.say
            ) {

                Battle.say(
                    `${name} unlocks at Phase ${technique.requiredPhase}.`
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

            case "BONES":
                bones();
                break;

            case "BONE WALL":
                boneWall();
                break;

            case "ILLUSIONS":
                illusions();
                break;

            case "CONSTRUCTS":
                constructs();
                break;

            case "GASTER":
                gaster();
                break;

            case "FORECAST TRAP":
                forecastTrap();
                break;

            case "CROSSFIRE":
                crossfire();
                break;

            case "FALSE FUTURE":
                falseFuture();
                break;

            case "INEVITABLE":
                inevitable();
                break;
        }


        return true;
    }


    /* ======================================
       PHASE 1 — BONES
    ====================================== */

    function bones() {

        Battle.say(
            "Bones tear through the predicted path."
        );


        if (Battle.spawnBoneAttack) {

            Battle.spawnBoneAttack({
                count: 5,
                speed: 390,
                damage: 7,
                spread: 0.18
            });
        }
    }


    /* ======================================
       PHASE 1.5 — BONE WALL
    ====================================== */

    function boneWall() {

        Battle.say(
            "The escape route closes."
        );


        if (Battle.spawnBoneWall) {

            Battle.spawnBoneWall({
                count: 9,
                damage: 8,
                warningTime: 500
            });
        }
    }


    /* ======================================
       PHASE 2 — ILLUSIONS
    ====================================== */

    function illusions() {

        Battle.say(
            "Not every attack is real."
        );


        if (Battle.spawnIllusions) {

            Battle.spawnIllusions({
                count: 5,
                duration: 3200
            });
        }
    }


    /* ======================================
       PHASE 2.5 — CONSTRUCTS
    ====================================== */

    function constructs() {

        Battle.say(
            "Thought becomes structure."
        );


        if (Battle.spawnConstructs) {

            Battle.spawnConstructs({
                count: 4,
                damage: 10,
                duration: 2800
            });
        }
    }


    /* ======================================
       PHASE 3 — GASTER
    ====================================== */

    function gaster() {

        Battle.say(
            "A Gaster construct takes aim."
        );


        if (Battle.spawnGasterAttack) {

            Battle.spawnGasterAttack({
                chargeTime: 650,
                duration: 600,
                damage: 22
            });
        }
    }


    /* ======================================
       PHASE 3.5 — FORECAST TRAP
    ====================================== */

    function forecastTrap() {

        Battle.say(
            "Forecast marks where the target will be."
        );


        if (Battle.spawnForecastTrap) {

            Battle.spawnForecastTrap({
                predictionTime: 900,
                damage: 18,
                radius: 42
            });
        }
    }


    /* ======================================
       PHASE 4 — CROSSFIRE
    ====================================== */

    function crossfire() {

        Battle.say(
            "Every direction becomes dangerous."
        );


        if (Battle.spawnCrossfire) {

            Battle.spawnCrossfire({
                waves: 3,
                damage: 9,
                interval: 350
            });
        }
    }


    /* ======================================
       PHASE 4.5 — FALSE FUTURE
    ====================================== */

    function falseFuture() {

        Battle.say(
            "The prediction was a lie."
        );


        if (Battle.spawnFalseFuture) {

            Battle.spawnFalseFuture({
                fakeDelay: 700,
                realDelay: 1100,
                damage: 24
            });
        }
    }


    /* ======================================
       PHASE 5 — INEVITABLE
    ====================================== */

    function inevitable() {

        Battle.say(
            "The pattern changes with you."
        );


        if (Battle.spawnInevitable) {

            Battle.spawnInevitable({
                waves: 4,
                baseDamage: 12,
                adaptation: true
            });
        }
    }


    /* ======================================
       RESET
    ====================================== */

    function reset() {

        selected = "BONES";


        Object.keys(
            lastUsed
        ).forEach(key => {

            delete lastUsed[key];

        });
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