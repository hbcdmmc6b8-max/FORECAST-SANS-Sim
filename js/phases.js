/* =========================================
   FORECAST!SANS — PHASE SYSTEM V0.3
========================================= */

const ForecastPhases = (() => {

    const PHASES = [
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

    let phaseIndex = 0;
    let hitsTaken = 0;

    let locked = false;
    let lockTimer = null;


    /* =====================================
       BASIC INFO
    ===================================== */

    function getPhase() {
        return PHASES[phaseIndex];
    }

    function getPhaseIndex() {
        return phaseIndex;
    }

    function getHitsTaken() {
        return hitsTaken;
    }

    function getAllPhases() {
        return [...PHASES];
    }

    function isFinalPhase() {
        return phaseIndex === PHASES.length - 1;
    }

    function isLocked() {
        return locked;
    }


    /* =====================================
       UNLOCK CHECK

       Example:
       isPhaseUnlocked("3.5")
    ===================================== */

    function isPhaseUnlocked(requiredPhase) {

        const requiredIndex =
            PHASES.indexOf(
                String(requiredPhase)
            );

        if (requiredIndex === -1) {
            return false;
        }

        return phaseIndex >= requiredIndex;
    }


    /* =====================================
       CONFIRMED PROTAGONIST HIT
    ===================================== */

    function confirmedHit() {

        /*
         One attack cannot advance
         several phases.
        */

        if (locked) {
            return {
                advanced: false,
                reason: "locked"
            };
        }


        /*
         Phase 5 never becomes Phase 6.
        */

        if (isFinalPhase()) {

            return {
                advanced: false,
                reason: "final-phase",
                phase: getPhase()
            };
        }


        locked = true;

        hitsTaken++;

        phaseIndex++;


        updateHUD();

        showPhaseSplash();

        shakeScreen();


        /*
         Notify the battle/game controller.
        */

        window.dispatchEvent(
            new CustomEvent(
                "forecast-phase-change",
                {
                    detail: {
                        phase: getPhase(),
                        phaseIndex,
                        hitsTaken,
                        final:
                            isFinalPhase()
                    }
                }
            )
        );


        /*
         Transition protection.
        */

        clearTimeout(lockTimer);

        lockTimer =
            setTimeout(
                () => {

                    locked = false;

                },
                1200
            );


        return {
            advanced: true,
            phase: getPhase(),
            phaseIndex,
            hitsTaken,
            final:
                isFinalPhase()
        };
    }


    /* =====================================
       HUD
    ===================================== */

    function updateHUD() {

        const label =
            document.getElementById(
                "phaseLabel"
            );


        if (label) {

            label.textContent =
                `PHASE ${getPhase()}`;
        }


        const nodes =
            document.querySelectorAll(
                ".phase-node"
            );


        nodes.forEach(
            (node, index) => {

                node.classList.remove(
                    "active",
                    "completed"
                );


                if (index < phaseIndex) {

                    node.classList.add(
                        "completed"
                    );
                }


                else if (
                    index === phaseIndex
                ) {

                    node.classList.add(
                        "active"
                    );
                }

            }
        );
    }


    /* =====================================
       PHASE SPLASH
    ===================================== */

    function showPhaseSplash() {

        const splash =
            document.getElementById(
                "phaseSplash"
            );

        const main =
            document.getElementById(
                "phaseSplashMain"
            );


        if (!splash || !main) {
            return;
        }


        main.textContent =
            `PHASE ${getPhase()}`;


        splash.classList.remove(
            "show"
        );


        /*
         Force browser to restart
         the animation.
        */

        void splash.offsetWidth;


        splash.classList.add(
            "show"
        );
    }


    /* =====================================
       SCREEN SHAKE
    ===================================== */

    function shakeScreen() {

        const game =
            document.getElementById(
                "game"
            );


        if (!game) {
            return;
        }


        game.classList.remove(
            "hit-shake"
        );


        void game.offsetWidth;


        game.classList.add(
            "hit-shake"
        );


        setTimeout(
            () => {

                game.classList.remove(
                    "hit-shake"
                );

            },
            220
        );
    }


    /* =====================================
       RESET
    ===================================== */

    function reset() {

        phaseIndex = 0;

        hitsTaken = 0;

        locked = false;


        clearTimeout(
            lockTimer
        );


        updateHUD();
    }


    /* =====================================
       TEMPORARY TEST

       We'll remove this when battle.js
       handles real collisions.

       Calling:
       ForecastPhases.testHit()

       simulates ONE legitimate hit.
    ===================================== */

    function testHit() {

        const result =
            confirmedHit();


        console.log(
            "Forecast phase test:",
            result
        );


        return result;
    }


    /* =====================================
       PUBLIC API
    ===================================== */

    return {

        getPhase,
        getPhaseIndex,
        getHitsTaken,
        getAllPhases,

        isFinalPhase,
        isLocked,
        isPhaseUnlocked,

        confirmedHit,

        reset,

        testHit

    };

})();


/* =========================================
   INITIALIZE HUD
========================================= */

window.addEventListener(
    "DOMContentLoaded",
    () => {

        ForecastPhases.reset();

    }
);