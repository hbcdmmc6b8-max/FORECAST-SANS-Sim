/* ==========================================
   FORECAST!SANS SIM — PHASE SYSTEM
========================================== */

const ForecastPhases = (() => {

    const phases = [
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

    let currentIndex = 0;

    // Prevents one attack from triggering several phases.
    let transitionLocked = false;

    let totalHitsTaken = 0;


    /* ======================================
       GETTERS
    ====================================== */

    function getPhase() {
        return phases[currentIndex];
    }

    function getPhaseIndex() {
        return currentIndex;
    }

    function getHitsTaken() {
        return totalHitsTaken;
    }

    function isFinalPhase() {
        return currentIndex === phases.length - 1;
    }

    function isLocked() {
        return transitionLocked;
    }


    /* ======================================
       CONFIRMED PROTAGONIST HIT
    ====================================== */

    function confirmedHit() {

        if (transitionLocked) {
            return false;
        }

        // Phase 5 does NOT lead to Phase 6.
        if (isFinalPhase()) {

            if (
                typeof Battle !== "undefined" &&
                Battle.onFinalPhaseHit
            ) {
                Battle.onFinalPhaseHit();
            }

            return false;
        }


        transitionLocked = true;

        totalHitsTaken++;

        currentIndex++;

        updateHUD();

        playTransition();


        /*
         Give the transition time to finish.

         This also prevents one lingering projectile
         from counting as several separate hits.
        */

        window.setTimeout(() => {

            transitionLocked = false;

        }, 1250);


        /*
         Tell the battle system that Forecast
         successfully entered another phase.
        */

        if (
            typeof Battle !== "undefined" &&
            Battle.onPhaseChanged
        ) {

            Battle.onPhaseChanged(
                getPhase(),
                currentIndex
            );

        }

        return true;
    }


    /* ======================================
       HUD
    ====================================== */

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


                if (index < currentIndex) {

                    node.classList.add(
                        "completed"
                    );

                }

                else if (
                    index === currentIndex
                ) {

                    node.classList.add(
                        "active"
                    );

                }

            }
        );

    }


    /* ======================================
       TRANSITION EFFECT
    ====================================== */

    function playTransition() {

        const transition =
            document.getElementById(
                "phaseTransition"
            );

        const big =
            document.getElementById(
                "phaseTransitionBig"
            );


        if (!transition || !big) {
            return;
        }


        big.textContent =
            `PHASE ${getPhase()}`;


        /*
         Restart CSS animation even if
         another phase transition happened
         recently.
        */

        transition.classList.remove(
            "show"
        );

        void transition.offsetWidth;

        transition.classList.add(
            "show"
        );


        const game =
            document.getElementById(
                "game"
            );


        if (game) {

            game.classList.remove("hit");

            void game.offsetWidth;

            game.classList.add("hit");

        }

    }


    /* ======================================
       RESET
    ====================================== */

    function reset() {

        currentIndex = 0;

        totalHitsTaken = 0;

        transitionLocked = false;

        updateHUD();

    }


    /* ======================================
       PUBLIC API
    ====================================== */

    return {

        confirmedHit,

        getPhase,

        getPhaseIndex,

        getHitsTaken,

        isFinalPhase,

        isLocked,

        reset

    };

})();


/* Initial HUD state */

window.addEventListener(
    "DOMContentLoaded",
    () => {

        ForecastPhases.reset();

    }
);