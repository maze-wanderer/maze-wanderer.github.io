
// Game setup and Phaser flow

main_div = document.getElementById('game-area');
main_div.onclick = function(e) { tap = true; };

// Function to calculate game dimensions
function calculateDimensions() {
    var w = main_div.offsetWidth;
    var win_height = window.innerHeight;
    var min_ratio = (1.25 * 18) / 40;
    if(win_height/w < min_ratio) w = win_height / min_ratio;
    
    var h = 1.25 * 16 * w / 40;
    return { w: w, h: h };
}

// Calculate initial dimensions
var dims = calculateDimensions();
var w = dims.w;
var h = dims.h;

// Force recalculation if on mobile - layout may not be settled yet
// In landscape mode, the game-area should have full available width
if(window.innerHeight < window.innerWidth) {  // landscape orientation
    // In landscape, give it time to layout
    var originalW = w;
    setTimeout(function() {
        var newDims = calculateDimensions();
        // Only update if width changed significantly (more than 10%)
        if(Math.abs(newDims.w - originalW) / originalW > 0.1) {
            w = newDims.w;
            h = newDims.h;
            cellW = w / 40;
            cellH = h / 16;
            scaler = w / 800;
            msg_yoffset = h - 250;
            root.style.setProperty('--msgYoffset', msg_yoffset + 'px');
            // Resize the game if it exists
            if(typeof game !== 'undefined') {
                game.scale.resize(w, h);
            }
        }
    }, 200);
}

var cellW = w / 40;
var cellH = h / 16;
var scaler = w / 800;
var msg_yoffset = h - 250;
var root = document.querySelector(':root');
root.style.setProperty('--msgYoffset', msg_yoffset + 'px');

// Test mode: allow supplying a single level string in the URL hash
// Example: index.html#level=<encoded-level-string>&num=0
var test_mode = false;
var test_level_string = null;
var test_level_decoded = null;

(function(){
    var hash_to_game_map = {
        'p': '@',
        '.': ' ',
        'h': '-',
        'w': '=',
        'l': '#',
        'f': '/',
        'r': '\\',
        'o': 'O',
        'd': '*',
        't': ':',
        'a': '<',
        'e': '>',
        'i': '!',
        'b': '^',
        'n': 'T',
        'u': 'A',
        'x': 'X',
        'm': 'C',
        'y': 'S',
        'g': 'M',
        'c': '+',
        'q': 'B',
        '~': '\n'
    };

    try {
        var hash = window.location.hash || '';
        if(hash.length > 1) {
            var params = new URLSearchParams(hash.substring(1));
            if(params.has('level')){
                test_level_string = decodeURIComponent(params.get('level'));
                
                test_level_array = test_level_string.split('');
                // decode just the grid layout chars 
                for(i=0; i<656; i++){
                    var spritecode = hash_to_game_map[test_level_string[i]];
                    test_level_array[i] = spritecode;
                }
                test_level_decoded = test_level_array.join('');

                test_mode = true;
                // if(typeof level_num === 'undefined') level_num = 0;
                // if(params.has('num')) level_num = Number(params.get('num'));
                console.log('Test mode enabled: using level from URL hash');
            }
        }
    } catch (err) {
        console.warn('Error parsing URL hash for test level:', err);
    }
})();

// functions to map grid positions to canvas
function mapX (x) { return (x * cellW - cellW) + (10 * scaler); }
function mapY (y) { return (h - (y * cellH)) + (13 * scaler); }

var elements = {
    "@": "player", 
    " ": "space", 
    "-": "space",
    "=": "dark wall", 
    "#": "light wall", 
    "/": "left slope", 
    "\\": "right slope",
    "O": "boulder", 
    "*": "diamond", 
    ":": "dirt", 
    "<": "left arrow", 
    ">": "right arrow", 
    "!": "fire", 
    "^": "balloon",
    "T": "portal in", 
    "A": "portal out", 
    "X": "exit", 
    "C": "add moves", 
    "S": "baby monster", 
    "M": "big monster", 
    "+": "cage",
    "B": "bomb"
};

// general sleeper function
const sleep = (milliseconds) => { return new Promise(resolve => setTimeout(resolve, milliseconds)) }  


// reads in data and builds the level. Accepts level number and option to purge existing level

function load_level(level_number) {
    
    level_num = level_number;
    saveCookie('current_level', level_num);
    big_monster = false;

    // remove all elements and sprites
    if(create_this.children.list.length > 0) create_this.children.list = [];
    e = [];

    // If test_mode is enabled and we have a level string from the URL hash,
    // use that directly instead of retrieving from Phaser's text cache.
    var data;
    if(test_mode && test_level_decoded !== null) {
        data = test_level_decoded;
    } else {
        data = create_this.cache.text.get(`data${level_number}`);
    }
    level = data;
    console.log('load_level: ' + level);
    lines = level.split('\n');
    level_title = lines[16]; // NEED TO FAIL-PROOF THIS 
    // document.getElementById('gameNote').textContent = level_title;
    // document.getElementById('gameLevel').textContent = 'Level: ' + level_number;
    moves_remaining = Number(lines[17]); // NEED TO FAIL-PROOF THIS 
    if(moves_remaining === 0) moves_remaining = 99999;  // 99999 denotes unlimited moves and will not count down
    document.getElementById('movesRemaining').textContent = "⏳ " + [moves_remaining, 'unlimited'][(moves_remaining === 99999)+0];
    portal_out = { "x": -1, "y": -1 }; // global
    monster = false;

    // iterate rows and columns
    for(y=16; y>0; y--) {
        for(x=1; x<=40; x++) {
            var key = lines[16 - y].substr(x - 1, 1);
            if( Object.keys(elements).indexOf(key) === -1 ) continue; // skip non-game letters (e.b. in "Booby Trap" in L14)
            var new_element = {'id': e.length, 'key': key, 'type': elements[key], 'x': x, 'y': y }; // new element for array e[]
            if( [' ','-','A'].indexOf(key) === -1 ) e.push(new_element); // omit spaces and portal out
            if(elements[key] === 'portal out') portal_out = { "x": x, "y": y };
            if(new_element.type === 'big monster'){
                big_monster = true;
                monsterID = new_element.id;
            }
        }
    }

    // diamond target is sum of diamonds plus count of baby monster/cage pairs
    baby_monsters = e.filter(i => i.type == 'baby monster').map(i => i.id); // baby monster ids
    diamonds_target = e.filter(i => i.type == 'diamond').length + Math.min(baby_monsters.length, e.filter(i => i.type == 'cage').length);
    diamonds_collected = 0;
    document.getElementById('diamondsRemaining').textContent = "💎 " + (diamonds_target - diamonds_collected);

    // if there are baby monsters build a wall around the game area to remove need for extra logic to contain them
    if(baby_monsters.length > 0){
        var k = e.length;
        for( var x = 1; x <= 40; x++ ) {
            e.push({ "id": k, "key": "#", "type": "light wall", "x": x, "y": 0 });
            e.push({ "id": k+1, "key": "#", "type": "light wall", "x": x, "y": 17 });
            k += 2;
        }
        for( var y = 1; y <= 16; y++ ) {
            e.push({ "id": k, "key": "#", "type": "light wall", "x": 0, "y": y });
            e.push({ "id": k+1, "key": "#", "type": "light wall", "x": 41, "y": y });
            k += 2;
        }
    }
    
    // walls are rectangles. all others are vector sprites
    var dark_wall_graphics = create_this.add.graphics({ fillStyle: { color: 0x777777 } });
    var light_wall_graphics = create_this.add.graphics({ fillStyle: { color: 0x888888 } });
    
    for(var i=0; i<e.length; i++) {

        switch(e[i].type){

            case 'dark wall':
                e[i].sprite = new Phaser.Geom.Rectangle( e[i].x * cellW - cellW, h - (e[i].y * cellH), cellW, cellH, '#000', '#000' );
                dark_wall_graphics.fillRectShape(e[i].sprite);
                break;
            
            case 'light wall':
                e[i].sprite = new Phaser.Geom.Rectangle( e[i].x * cellW - cellW, h - (e[i].y * cellH), cellW, cellH, '#000', '#000' );
                light_wall_graphics.fillRectShape(e[i].sprite);
                break;
            
            case 'player':
                playerID = i;
                break;
            
            case 'exit':
                exitID = i; // no break
            
            default:
                // all other elements have types with types matching sprite variables
                e[i].sprite = create_this.add.image(mapX(e[i].x), mapY(e[i].y), e[i].type);
                break;
        }
    }
    // render player sprites last
    e[playerID].sprite = create_this.add.image(mapX(e[playerID].x), mapY(e[playerID].y), 'player');
    
    // initialise globals
    cursors = create_this.input.keyboard.createCursorKeys();
    queue = [];
    busy = false;
    hold_move = false;
    hold_dead = false;
    dead = false;
    kill = false;
}


// e[] index position of any element at coordinates (x,y). Multiple elements mostly cannot co-occupy 
// the same cell. The only exceptions to this are baby monsters which do not interact with other mobile
// elements except the player.

function id_element(x, y, type = undefined) {
    match = e.filter(i => i.x == x && i.y == y);
    if(match.length > 1 && type !== 'player') match = match.filter(m => m.type !== 'baby monster');
    if(match.length == 0) return -1;
    return match[0].id;
}

function kill_element(id) {
    if(id === -1) return;       // enables e.g. kill_element(id_element(x,y))
    e[id].sprite.destroy(true); // remove from canvas
    e[id].x = -1;               // prevent id_element() identifying them
}

function count_move() {
    if(moves_remaining !== 99999){
        moves_remaining--;
        document.getElementById('movesRemaining').textContent = "⏳ " + moves_remaining;
        if(moves_remaining == 0) {
            console.log(e[playerID].x + ',' + e[playerID].y);
            console.log(e[exitID].x + ',' + e[exitID].y);
            if(e[playerID].x == e[exitID].x && e[playerID].y == e[exitID].y) return;
            dead = true;
            e[playerID].sprite.setTexture('player dead');
            kill = true;
            busy = true;
            message('messenger', "You ran out of time!");
        }
    }
}

//-----------------------------------------------------------------------------------

// PHASER

var config = {
    parent: 'game-area',
    type: Phaser.AUTO,
    width: w,
    height: h,
    // backgroundColor: '#000',
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    fps: {
        target: 30,
        min: 30,
        forceSetTimeOut: true
    },
    audio: {
        disableWebAudio: true
    }
}

function preload () {
    if(!test_mode){
        for(var i=0; i<=61; i++) this.load.text({ key: `data${i}`, url: `./screens/screen.${i}.txt` });
    } else {
        // In test mode we skip bulk loading of screen files; we'll use the
        // provided `test_level_string` directly in `load_level()`.
        console.log('Preload: test mode - skipping bulk screen loads');
    }
    // this.load.image('mist', 'backgrounds/mist.jpg');

    var sprite_scales = {
        'diamond': 0.43, 'add moves': 0.04, 'boulder': 0.2, 'dirt': 0.15, 'left slope': 0.18, 'right slope': 0.18, 
        'fire': 0.3, 'portal in': 0.01, 'exit': 0.25, 'left arrow': 0.2, 'right arrow': 0.2, 'balloon': 0.4, 
        'baby monster': 0.17, 'big monster': 0.17, 'cage': 0.2, 'bomb': 0.4, 'player': 0.17, 'player left': 0.17, 
        'player right': 0.17, 'player up': 0.17, 'player down': 0.17, 'player dead': 0.17
    }

    // sprites
    Object.keys(sprite_scales).map(s => {
        this.load.svg(s, `sprites/${s.replace(' ','-')}.svg`, { scale: sprite_scales[s] * scaler });
    });

    // sounds
    // var sounds = ['teleport','tick','diamond','landmine','arrow','killed','boulder','dirt','monsters','exit1','exit2'];
    // sounds.map(s => this.load.audio(`sound-${s}`, `sounds/${s}.wav`));
}


function playSound(soundName) {
    if(!sound){ return; }
    if (sounds[soundName]) {
        // Stop other sounds if necessary
        for (const sound in sounds) {
            if (sounds.hasOwnProperty(sound) && sound !== soundName) {
                sounds[sound].pause();
                sounds[sound].currentTime = 0;
            }
        }
        
        sounds[soundName].play().catch(error => {
            if (error.name !== 'AbortError') {
                console.error('Error playing sound:', error);
            }
        });
    } else {
        console.error('Sound not found:', soundName);
    }
}


function create () {
    create_this = this;
    load_level(level_num);
}


function update () {
    
    if(busy) return;
    
    if(queue.length !== 0) {
        for(var i=0; i<queue.length; i++) {
            var q = queue[i];
            queue = queue.filter((x,ind) => ![i].includes(ind)); // remove from queue
            var moved = move(q);
            if(moved){
                if(sound && ['left arrow','right arrow'].indexOf(e[q].type) > -1) playSound('arrow');
                break;
            }
        }
    }
    else {
        
        // monster moves
        if(monster_move) {

            if(big_monster) {
                var freex = false, freey = false;
            
                var dx = e[playerID].x - e[monsterID].x;
                if(dx !== 0) freex = approach(e[monsterID].x, e[monsterID].y, e[monsterID].x + Math.sign(dx), e[monsterID].y, 'big monster', deadly=true, monsterID);
                
                var dy = e[playerID].y - e[monsterID].y;
                if(dy !== 0) freey = approach(e[monsterID].x, e[monsterID].y, e[monsterID].x, e[monsterID].y + Math.sign(dy), 'big monster', deadly=true, monsterID);
                
                var monster_decision = 'none';
                if(Math.abs(dx) > Math.abs(dy)) {  // x has priority
                    if(freex) monster_decision = 'x';
                    else if(freey) monster_decision = 'y';
                }
                else {    // y has priority
                    if(freey) monster_decision = 'y';
                    else if(freex) monster_decision = 'x';
                }
        
                // action move
                if( monster_decision == 'x' ) {
                    e[monsterID].x += Math.sign(dx);
                    e[monsterID].sprite.x = mapX(e[monsterID].x);
                }
                else if( monster_decision == 'y' ) {
                    e[monsterID].y += Math.sign(dy);
                    e[monsterID].sprite.y = mapY(e[monsterID].y);
                }
            }

            // baby monsters
            baby_monsters = e.filter(i => i.type == 'baby monster').map(i => i.id);
            baby_monsters.map(id => baby_monster_move(id));
            
            monster_move = false;
        }
    }

    if(dead) {
        load_level(level_num);
        return;
    }

    if( !input_sleeping && !hold_move && !hold_dead ) {

        if(cursors.left.isDown || cursors.right.isDown || cursors.up.isDown || cursors.down.isDown || return_press || tap || swipeX || swipeY ) {

            playSound('tick');
            if(return_press || tap){
                console.log();
                return_press = false;
                tap = false;
                monster_move = true;
                count_move();
                return;
            }

            // key inputs
            var dx = 0, dy = 0, x1, y1, x2, y2;
            if ( cursors.left.isDown || swipeX === -1 ) { dx = -1; }
            else if ( cursors.right.isDown || swipeX === 1 ) { dx = 1; }
            else if ( cursors.down.isDown || swipeY === 1 ) { dy = -1; }
            else if ( cursors.up.isDown || swipeY === -1 ) { dy = 1; }
            swipeX = 0; // reset
            swipeY = 0;

            x1 = e[playerID].x;
            y1 = e[playerID].y;
            x2 = x1 + dx;
            y2 = y1 + dy;

            var target_accessible = approach(x1, y1, x2, y2, 'player', 'false', playerID);

            if(target_accessible) {
                // update sprite appearance
                if( dx < 0) e[playerID].sprite.setTexture('player left');
                else if (dx > 0) e[playerID].sprite.setTexture('player right');
                else if (dy < 0) e[playerID].sprite.setTexture('player down');
                else if (dy > 0) e[playerID].sprite.setTexture('player up');

                e[playerID].x = x2;
                e[playerID].y = y2;
                e[playerID].sprite.x = mapX(e[playerID].x);
                e[playerID].sprite.y = mapY(e[playerID].y);

                // if(x2 === 25 && y2  === 11) toggle_grid(); // dims test
                
                // triggers
                triggers(x1, y1, x2, y2, 'player');
            }
            
            monster_move = true;
            input_sleeping = true;
            var sleeptime = [150, 50][ (keydown > 0)+0 ];
            keydown++;
            sleep(sleeptime).then(() => { input_sleeping = false; });

            count_move();
        }
    }
}

// Delay game creation to allow layout to settle
setTimeout(function() {
    // Recalculate dimensions - layout should be settled by now
    var newDims = calculateDimensions();
    w = newDims.w;
    h = newDims.h;
    config.width = w;
    config.height = h;
    cellW = w / 40;
    cellH = h / 16;
    scaler = w / 800;
    msg_yoffset = h - 250;
    root.style.setProperty('--msgYoffset', msg_yoffset + 'px');
    
    var game = new Phaser.Game(config, 'game-area');
    game.input.enabled = false;
}, 100);
