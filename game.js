/* ==========================================
   FORECAST!SANS SIM — GAME CONTROLLER V0.2
========================================== */

(() => {

    let currentMenu = "weapon";

    let selectedAbility = "GLOCK";

    const movement = {
        up: false,
        down: false,
        left: false,
        right: false
    };


    /* ======================================
       START
    ====================================== */

    window.addEventListener(
        "DOMContentLoaded",
        () => {

            const canvas =
                document.getElementById(
                    "gameCanvas"
                );


            if (!canvas) {

                console.error(
                    "FORECAST: gameCanvas not found."
                );

                return;
            }


            ForecastPhases.reset();
            Weapons.reset();
            Eyes.reset();
            Techniques.reset();

            Battle.init(canvas);


            setupMenus();
            setupAttackButton();
            setupKeyboard();
            setupMobileMovement();


            openMenu("weapon");

            updateMovement();

        }
    );


    /* ======================================
       MENU SETUP
    ====================================== */

    function setupMenus() {

        const buttons =
            document.querySelectorAll(
                ".menu-button"
            );


        buttons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const menu =
                        button.dataset.menu;

                    openMenu(menu);

                }
            );

        });
    }


    function openMenu(menu) {

        currentMenu = menu;


        document
            .querySelectorAll(
                ".menu-button"
            )
            .forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.menu ===
                    menu
                );

            });


        switch (menu) {

            case "weapon":
                renderWeapons();
                break;

            case "eyes":
                renderEyes();
                break;

            case "technique":
                renderTechniques();
                break;

            case "forecast":
                renderForecast();
                break;
        }
    }


    /* ======================================
       ABILITY PANEL
    ====================================== */

    function clearAbilityPanel() {

        const panel =
            document.getElementById(
                "abilityOptions"
            );


        if (panel) {
            panel.innerHTML = "";
        }


        return panel;
    }


    function setAbilityTitle(text) {

        const title =
            document.getElementById(
                "abilityTitle"
            );


        if (title) {
            title.textContent = text;
        }
    }


    function createAbilityButton({
        name,
        unlocked = true,
        requiredPhase = null,
        selected = false,
        onClick
    }) {

        const button =
            document.createElement(
                "button"
            );


        button.className =
            "ability-option";


        if (selected) {

            button.classList.add(
                "selected"
            );
        }


        if (unlocked) {

            button.textContent =
                name;

        }

        else {

            button.textContent =
                `${name} · LOCKED P${requiredPhase}`;

            button.style.opacity =
                "0.42";
        }


        button.addEventListener(
            "click",
            () => {

                if (!unlocked) {

                    Battle.say(
                        `${name} unlocks at Phase ${requiredPhase}.`
                    );

                    return;
                }


                onClick();

                selectedAbility =
                    name;

                updateSelectedDisplay();

                refreshCurrentMenu();

            }
        );


        return button;
    }


    function refreshCurrentMenu() {

        openMenu(
            currentMenu
        );
    }


    /* ======================================
       WEAPONS
    ====================================== */

    const weaponUnlocks = {

        "GLOCK": "1",

        "SMG": "1.5",

        "AR": "2",

        "DMR": "2.5",

        "SHOTGUN": "3",

        "GASTER HAND": "3",

        "EXECUTION SCYTHE": "4"

    };


    function renderWeapons() {

        setAbilityTitle(
            "ARSENAL"
        );


        const panel =
            clearAbilityPanel();


        Weapons
            .getList()
            .forEach(name => {

                const required =
                    weaponUnlocks[name] ||
                    "1";


                const unlocked =
                    hasPhase(required);


                const button =
                    createAbilityButton({

                        name,

                        unlocked,

                        requiredPhase:
                            required,

                        selected:
                            Weapons
                                .getSelected()
                            === name,

                        onClick: () => {

                            Weapons.select(
                                name
                            );


                            Battle.say(
                                `${name} selected.`
                            );
                        }

                    });


                panel.appendChild(
                    button
                );

            });
    }


    /* ======================================
       EYES
    ====================================== */

    function renderEyes() {

        setAbilityTitle(
            "EYES"
        );


        const panel =
            clearAbilityPanel();


        Eyes
            .getList()
            .forEach(name => {

                const data =
                    Eyes.getData(name);


                const unlocked =
                    Eyes.isUnlocked(name);


                const button =
                    createAbilityButton({

                        name,

                        unlocked,

                        requiredPhase:
                            data.requiredPhase,

                        selected:
                            Eyes.getSelected()
                            === name,

                        onClick: () => {

                            Eyes.select(name);


                            Battle.say(
                                `${name}: ${data.description}`
                            );
                        }

                    });


                panel.appendChild(
                    button
                );

            });
    }


    /* ======================================
       TECHNIQUES
    ====================================== */

    function renderTechniques() {

        setAbilityTitle(
            "TECHNIQUES"
        );


        const panel =
            clearAbilityPanel();


        Techniques
            .getList()
            .forEach(name => {

                const data =
                    Techniques
                        .getData(name);


                const unlocked =
                    Techniques
                        .isUnlocked(name);


                const button =
                    createAbilityButton({

                        name,

                        unlocked,

                        requiredPhase:
                            data.requiredPhase,

                        selected:
                            Techniques
                                .getSelected()
                            === name,

                        onClick: () => {

                            Techniques.select(
                                name
                            );


                            Battle.say(
                                `${name}: ${data.description}`
                            );
                        }

                    });


                panel.appendChild(
                    button
                );

            });
    }


    /* ======================================
       FORECAST MENU
    ====================================== */

    function renderForecast() {

        setAbilityTitle(
            "FORECAST"
        );


        const panel =
            clearAbilityPanel();


        const options = [

            {
                name:
                    "PREDICT",

                requiredPhase:
                    "1.5",

                description:
                    "Reveal the protagonist's current trajectory.",

                activate: () => {

                    Battle.flashTargetLine(
                        1800
                    );

                    Battle.say(
                        "Future trajectory acquired."
                    );
                }
            },

            {
                name:
                    "DEEP FORECAST",

                requiredPhase:
                    "3",

                description:
                    "Extend prediction farther into the next movement.",

                activate: () => {

                    Battle.activateObserve(
                        3500
                    );

                    Battle.say(
                        "Multiple possibilities overlap."
                    );
                }
            },

            {
                name:
                    "ABSOLUTE FORECAST",

                requiredPhase:
                    "4.5",

                description:
                    "Expose hostile trajectories for an extended period.",

                activate: () => {

                    Battle.activateObserve(
                        6000
                    );

                    Battle.flashTargetLine(
                        6000
                    );

                    Battle.say(
                        "The next possibilities are visible."
                    );
                }
            }

        ];


        options.forEach(option => {

            const unlocked =
                hasPhase(
                    option.requiredPhase
                );


            const button =
                createAbilityButton({

                    name:
                        option.name,

                    unlocked,

                    requiredPhase:
                        option.requiredPhase,

                    selected:
                        selectedAbility ===
                        option.name,

                    onClick: () => {

                        selectedAbility =
                            option.name;

                        option.activate();
                    }

                });


            panel.appendChild(
                button
            );

        });
    }


    /* ======================================
       MAIN ATTACK BUTTON
    ====================================== */

    function setupAttackButton() {

        const button =
            document.getElementById(
                "attackButton"
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "pointerdown",
            event => {

                event.preventDefault();

                useCurrentAbility();

            }
        );
    }


    function useCurrentAbility() {

        switch (currentMenu) {

            case "weapon":

                selectedAbility =
                    Weapons.getSelected();

                Weapons.attack();

                break;


            case "eyes":

                selectedAbility =
                    Eyes.getSelected();

                Eyes.activate();

                break;


            case "technique":

                selectedAbility =
                    Techniques
                        .getSelected();

                Techniques.activate();

                break;


            case "forecast":

                activateSelectedForecast();

                break;
        }


        updateSelectedDisplay();
    }


    function activateSelectedForecast() {

        switch (selectedAbility) {

            case "DEEP FORECAST":

                if (
                    hasPhase("3")
                ) {

                    Battle.activateObserve(
                        3500
                    );

                    Battle.say(
                        "Multiple possibilities overlap."
                    );
                }

                break;


            case "ABSOLUTE FORECAST":

                if (
                    hasPhase("4.5")
                ) {

                    Battle.activateObserve(
                        6000
                    );

                    Battle.flashTargetLine(
                        6000
                    );

                    Battle.say(
                        "The next possibilities are visible."
                    );
                }

                break;


            default:

                if (
                    hasPhase("1.5")
                ) {

                    selectedAbility =
                        "PREDICT";

                    Battle.flashTargetLine(
                        1800
                    );

                    Battle.say(
                        "Future trajectory acquired."
                    );
                }

                else {

                    Battle.say(
                        "FORECAST unlocks at Phase 1.5."
                    );
                }

                break;
        }
    }


    /* ======================================
       KEYBOARD
    ====================================== */

    function setupKeyboard() {

        window.addEventListener(
            "keydown",
            event => {

                const key =
                    event.key.toLowerCase();


                if (
                    [
                        "arrowup",
                        "arrowdown",
                        "arrowleft",
                        "arrowright",
                        "w",
                        "a",
                        "s",
                        "d",
                        " "
                    ].includes(key)
                ) {

                    event.preventDefault();
                }


                switch (key) {

                    case "w":
                    case "arrowup":

                        movement.up =
                            true;

                        break;


                    case "s":
                    case "arrowdown":

                        movement.down =
                            true;

                        break;


                    case "a":
                    case "arrowleft":

                        movement.left =
                            true;

                        break;


                    case "d":
                    case "arrowright":

                        movement.right =
                            true;

                        break;


                    case " ":

                        if (!event.repeat) {

                            useCurrentAbility();

                        }

                        break;


                    case "1":

                        openMenu(
                            "weapon"
                        );

                        break;


                    case "2":

                        openMenu(
                            "eyes"
                        );

                        break;


                    case "3":

                        openMenu(
                            "technique"
                        );

                        break;


                    case "4":

                        openMenu(
                            "forecast"
                        );

                        break;
                }


                updateMovement();

            }
        );


        window.addEventListener(
            "keyup",
            event => {

                const key =
                    event.key.toLowerCase();


                switch (key) {

                    case "w":
                    case "arrowup":

                        movement.up =
                            false;

                        break;


                    case "s":
                    case "arrowdown":

                        movement.down =
                            false;

                        break;


                    case "a":
                    case "arrowleft":

                        movement.left =
                            false;

                        break;


                    case "d":
                    case "arrowright":

                        movement.right =
                            false;

                        break;
                }


                updateMovement();

            }
        );


        /*
         Prevent Forecast from continuing
         to move if the tab loses focus.
        */

        window.addEventListener(
            "blur",
            () => {

                movement.up = false;
                movement.down = false;
                movement.left = false;
                movement.right = false;

                updateMovement();

            }
        );
    }


    /* ======================================
       MOBILE D-PAD
    ====================================== */

    function setupMobileMovement() {

        bindMoveButton(
            "moveUp",
            "up"
        );

        bindMoveButton(
            "moveDown",
            "down"
        );

        bindMoveButton(
            "moveLeft",
            "left"
        );

        bindMoveButton(
            "moveRight",
            "right"
        );
    }


    function bindMoveButton(
        id,
        direction
    ) {

        const button =
            document.getElementById(
                id
            );


        if (!button) {
            return;
        }


        const start =
            event => {

                event.preventDefault();

                movement[direction] =
                    true;

                updateMovement();
            };


        const stop =
            event => {

                event.preventDefault();

                movement[direction] =
                    false;

                updateMovement();
            };


        button.addEventListener(
            "pointerdown",
            start
        );


        button.addEventListener(
            "pointerup",
            stop
        );


        button.addEventListener(
            "pointercancel",
            stop
        );


        button.addEventListener(
            "pointerleave",
            event => {

                /*
                 Mouse leaving a button
                 should stop movement.

                 Touch pointer capture may
                 behave differently, so this
                 keeps controls predictable.
                */

                if (
                    event.pointerType ===
                    "mouse"
                ) {

                    stop(event);
                }
            }
        );
    }


    /* ======================================
       MOVEMENT VECTOR
    ====================================== */

    function updateMovement() {

        let x = 0;
        let y = 0;


        if (movement.left) {
            x--;
        }

        if (movement.right) {
            x++;
        }

        if (movement.up) {
            y--;
        }

        if (movement.down) {
            y++;
        }


        Battle.setMovement(
            x,
            y
        );
    }


    /* ======================================
       PHASE CHECK
    ====================================== */

    function hasPhase(
        requiredPhase
    ) {

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


        const current =
            ForecastPhases
                .getPhaseIndex();


        const required =
            order.indexOf(
                String(
                    requiredPhase
                )
            );


        return (
            required !== -1 &&
            current >= required
        );
    }


    /* ======================================
       SELECTED ABILITY DISPLAY
    ====================================== */

    function updateSelectedDisplay() {

        const display =
            document.getElementById(
                "selectedAbility"
            );


        if (!display) {
            return;
        }


        switch (currentMenu) {

            case "weapon":

                display.textContent =
                    Weapons.getSelected();

                break;


            case "eyes":

                display.textContent =
                    Eyes.getSelected();

                break;


            case "technique":

                display.textContent =
                    Techniques
                        .getSelected();

                break;


            case "forecast":

                display.textContent =
                    selectedAbility;

                break;
        }
    }


    /* ======================================
       PHASE MENU REFRESH

       phases.js calls Battle when a new
       phase is reached. We hook that callback
       so newly unlocked abilities appear
       immediately.
    ====================================== */

    const originalPhaseCallback =
        Battle.onPhaseChanged;


    Battle.onPhaseChanged =
        function(
            phase,
            index
        ) {

            originalPhaseCallback(
                phase,
                index
            );


            refreshCurrentMenu();


            window.setTimeout(
                () => {

                    Battle.say(
                        `Phase ${phase}. New possibilities unlocked.`
                    );

                },

                350
            );
        };

})();