
// Global variables. See dom-functions.js for control globals

var cookies,             // retrieve any pre-existing cookie with detail of current and maximum levels
    create_this = 0,     // globalise the create() function's methods for level management
    level,               // current level
    lines,               // level's ascii definition split into lines
    level_title,         // title from ascii blob (not used)
    e,                   // main container for element and their sprites. Top level order is preserved so n == id for e[n].id
    queue,               // element triggers not actioned immediately are queued
    playerID,            // e[id].id of player sprite
    exitID,              // e[id].id of exit sprite
    portal_out,          // {x,y} object of any teleport destination 
    sound = false,       // sounds boolean
    verbose = false,     // more reporting to console.log
    debug = false,

    // game flow variables
    speed = 20,          // delay of moving objects (lower = faster)
    input_sleeping,      // boolean for user input delay
    busy = false,        // pause everything while any element is moving
    hold_move = false,   // hold player's movement until all element moves + triggers complete
    hold_dead = false,   // hold player's movement when killed
    dead = false,        // switch true to trigger load_level on next update
    kill,                // switch true to 
    moves_remaining,     // running countdown
    diamonds_target,     // target = sum of diamonds and baby monster/cage pairs
    diamonds_collected,  // running tally

    // DOM variables
    cursors,             // variable for cursor keys
    return_press = false,// for stationary moves
    tap = false,         // for stationary moves
    keydown = 0,         // keypress timer
    grid = false,        // show/hide grid
    grid_array = [],     // grid array
    main_div,            // main game panel object
    
    // monster variables
    big_monster,         // boolean of whether level has a big monster
    monsterID,           // e[id].id of of big monster sprite
    monster_move,        // boolean for controlling when monsters move
    baby_monsters;       // array of baby monster ids

var dists = {
    "-2,-2": 2.8, "-1,-2": 2.2, "0,-2": 2, "1,-2": 2.2, "2,-2": 2.8, 
    "-2,-1": 2.2, "-1,-1": 1.4, "0,-1": 1, "1,-1": 1.4, "2,-1": 2.2, 
    "-2,0": 2, "-1,0": 1, "0,0": 0, "1,0": 1, "2,0": 2, 
    "-2,1": 2.2, "-1,1": 1.4, "0,1": 1, "1,1": 1.4, "2,1": 2.2, 
    "-2,2": 2.8, "-1,2": 2.2, "0,2": 2, "1,2": 2.2, "2,2": 2.8
};

var type_order = { "boulder": 1, "left arrow": 2, "right arrow": 3 ,'balloon': 4 };

window.onerror = function (msg, url, lineNo, columnNo, error) {
    if(debug){
        var error_msg = ['msg: ' + msg, 'url: ' + url, 'lineNo: ' + lineNo, 'columnNo: ' + columnNo, 'error: ' + error].join('\n');
        window.alert(error_msg);
    }
}

const sounds = {
    'teleport': new Audio('./sounds/teleport.wav'),
    'tick': new Audio('./sounds/tick.wav'),
    'diamond': new Audio('./sounds/diamond.wav'),
    'landmine': new Audio('./sounds/landmine.wav'),
    'arrow': new Audio('./sounds/arrow.wav'),
    'killed': new Audio('./sounds/killed.wav'),
    'boulder': new Audio('./sounds/boulder.wav'),
    'dirt': new Audio('./sounds/dirt.wav'),
    'monsters': new Audio('./sounds/monsters.wav'),
    'exit1': new Audio('./sounds/exit1.wav'),
    'exit2': new Audio('./sounds/exit2.wav')
};

