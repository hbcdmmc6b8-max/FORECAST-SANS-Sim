/* ==========================================
   FORECAST!SANS SIM — WEAPONS
========================================== */

const Weapons = (() => {

    const weaponList = [
        "GLOCK",
        "SMG",
        "AR",
        "DMR",
        "SHOTGUN",
        "EXECUTION SCYTHE",
        "GASTER HAND"
    ];

    const cooldowns = {
        "GLOCK": 260,
        "SMG": 600,
        "AR": 500,
        "DMR": 900,
        "SHOTGUN": 850,
        "EXECUTION SCYTHE": 950,
        "GASTER HAND": 1100
    };

    let selected = "GLOCK";
    let lastAttack = 0;


    function getList() {
        return [...weaponList];
    }


    function getSelected() {
        return selected;
    }


    function select(name) {

        if (!weaponList.includes(name)) {
            return false;
        }

        selected = name;

        return true;
    }


    function canAttack() {

        const now = performance.now();

        return (
            now - lastAttack >=
            cooldowns[selected]
        );

    }


    function attack() {

        if (!canAttack()) {
            return false;
        }

        /*
         Battle owns the projectile system.

         weapons.js only decides WHAT attack
         should happen.
        */

        if (
            typeof Battle === "undefined"
        ) {
            return false;
        }

        lastAttack = performance.now();


        switch (selected) {

            case "GLOCK":
                glock();
                break;

            case "SMG":
                smg();
                break;

            case "AR":
                ar();
                break;

            case "DMR":
                dmr();
                break;

            case "SHOTGUN":
                shotgun();
                break;

            case "EXECUTION SCYTHE":
                executionScythe();
                break;

            case "GASTER HAND":
                gasterHand();
                break;

        }

        return true;
    }


    /* ======================================
       GLOCK

       Simple precise shot.
    ====================================== */

    function glock() {

        Battle.spawnBossProjectile({

            type: "round",

            speed: 520,

            damage: 13,

            size: 6,

            count: 1,

            spread: 0,

            life: 2.2

        });

    }


    /* ======================================
       SMG

       Short rapid burst.
    ====================================== */

    function smg() {

        const delays = [
            0,
            65,
            130,
            195,
            260,
            325
        ];


        delays.forEach(
            (delay, index) => {

                window.setTimeout(() => {

                    Battle.spawnBossProjectile({

                        type: "round",

                        speed: 570,

                        damage: 4,

                        size: 4,

                        count: 1,

                        spread:
                            index % 2 === 0
                            ? -0.08
                            : 0.08,

                        life: 1.9

                    });

                }, delay);

            }
        );

    }


    /* ======================================
       AR

       Controlled three-shot burst.
    ====================================== */

    function ar() {

        [0, 95, 190].forEach(
            (delay, index) => {

                window.setTimeout(() => {

                    Battle.spawnBossProjectile({

                        type: "round",

                        speed: 610,

                        damage: 7,

                        size: 5,

                        count: 1,

                        spread:
                            (index - 1) *
                            0.035,

                        life: 2

                    });

                }, delay);

            }
        );

    }


    /* ======================================
       DMR

       Slow but heavy precision shot.
    ====================================== */

    function dmr() {

        if (Battle.flashTargetLine) {
            Battle.flashTargetLine(180);
        }


        window.setTimeout(() => {

            Battle.spawnBossProjectile({

                type: "piercing",

                speed: 850,

                damage: 24,

                size: 7,

                count: 1,

                spread: 0,

                life: 1.5

            });

        }, 180);

    }


    /* ======================================
       SHOTGUN

       Wide close-range burst.
    ====================================== */

    function shotgun() {

        Battle.spawnBossProjectile({

            type: "pellet",

            speed: 480,

            damage: 5,

            size: 5,

            count: 7,

            spread: 0.36,

            life: 0.75

        });

    }


    /* ======================================
       EXECUTION SCYTHE

       Large sweeping melee attack.
    ====================================== */

    function executionScythe() {

        if (
            Battle.spawnScytheAttack
        ) {

            Battle.spawnScytheAttack({

                damage: 32,

                duration: 420,

                reach: 115

            });

        }

    }


    /* ======================================
       GASTER HAND

       Forecast's supernatural weapon.

       Charges briefly, then releases
       a large energy attack.
    ====================================== */

    function gasterHand() {

        if (
            Battle.spawnGasterHand
        ) {

            Battle.spawnGasterHand({

                chargeTime: 380,

                damage: 36,

                width: 32,

                duration: 520

            });

        }

    }


    /* ======================================
       RESET
    ====================================== */

    function reset() {

        selected = "GLOCK";

        lastAttack = 0;

    }


    return {

        getList,

        getSelected,

        select,

        attack,

        reset

    };

})();