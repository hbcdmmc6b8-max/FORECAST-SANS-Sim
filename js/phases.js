/* =========================================================
   FORECAST!SANS — SAME END ANYWAY
   V1 PHASE SYSTEM

   EXACT PROGRESSION:
   1 -> 1.5 -> 2 -> 2.5 -> 3 -> 3.5 -> 4 -> 4.5 -> 5

   A phase advances ONLY when Battle confirms
   that the protagonist actually hit Forecast.
========================================================= */

const ForecastPhases = (() => {
    "use strict";

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

    /*
        Prevents one attack/projectile from counting
        multiple times during a phase transition.
    */
    let locked = false;
    let unlockTimer = null;

    const TRANSITION_LOCK_MS = 900;


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


    function confirmedHit() {
        /*
            Battle.js is the ONLY place that should
            call this after a real protagonist hit.
        */

        if (locked) {
            return {
                advanced: false,
                reason: "locked",
                phase: getPhase(),
                phaseIndex,
                hitsTaken
            };
        }


        /*
            NO PHASE 6.

            We intentionally do not define Forecast's
            final defeat condition here.
        */
        if (isFinalPhase()) {
            return {
                advanced: false,
                reason: "final-phase",
                phase: getPhase(),
                phaseIndex,
                hitsTaken
            };
        }


        locked = true;

        hitsTaken++;
        phaseIndex++;


        const result = {
            advanced: true,
            phase: getPhase(),
            phaseIndex,
            hitsTaken,
            final: isFinalPhase()
        };


        window.dispatchEvent(
            new CustomEvent(
                "forecast-phase-change",
                {
                    detail: result
                }
            )
        );


        if (unlockTimer) {
            clearTimeout(unlockTimer);
        }


        unlockTimer = setTimeout(
            () => {
                locked = false;
                unlockTimer = null;
            },
            TRANSITION_LOCK_MS
        );


        return result;
    }


    function reset() {
        phaseIndex = 0;
        hitsTaken = 0;
        locked = false;

        if (unlockTimer) {
            clearTimeout(unlockTimer);
            unlockTimer = null;
        }

        window.dispatchEvent(
            new CustomEvent(
                "forecast-phase-reset",
                {
                    detail: {
                        phase: getPhase(),
                        phaseIndex,
                        hitsTaken
                    }
                }
            )
        );
    }


    /*
        Handy for development without changing
        the real battle progression rules.
    */
    function debugAdvance() {
        return confirmedHit();
    }


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
        debugAdvance
    };

})();