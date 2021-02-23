
// Baby monster rules:
// - follow maze or canvas edge left
// - turn to diamonds when caged
// - boulders pass through them?
// - arrows / balloons?


function check_wall(x, y, w) {
    // given x and y coords and a direction string, return id of any element at that new position
    w = w.split(',').map(i => i * 1); // split and coerce numeric
    return id_element(x + w[0], y + w[1]); // check for occupant
}

// maze-following logic influenced by this article:
// https://web.archive.org/web/20200930150926/https://bradleycarey.com/posts/2012-08-15-maze-solving-algorithms-wall-follower/

function baby_monster_move(id) {
    // move baby monster with given id

    var m = e[id],
        priorities;
    
    if(m.last_dir === undefined) baby_monster_initialise(id);
    if(m.last_dir === undefined) return; // initialisation failed

    switch(m.last_dir){
        case "0,1":  // UP
            priorities = ['-1,0', '0,1', '1,0', '0,-1'];
            break;
        case "1,0":  // RIGHT
            priorities = ['0,1', '1,0', '0,-1', '-1,0'];
            break;
        case "0,-1":  // DOWN
            priorities = ['1,0', '0,-1', '-1,0', '0,1'];
            break;
        case "-1,0":  // LEFT
            priorities = ['0,-1', '-1,0', '0,1', '1,0'];
            break;
    }
    
    // array of ids of any neighbouring elements (-1 if cell empty)
    var environ = priorities.map(p => check_wall(m.x, m.y, p));
    var elements = environ.map(i => e[i]);
    var new_dir;

    for(var i=0; i<4; i++){
        if(elements[i] === undefined) {
            new_dir = priorities[i];
            break;
        }
        else {
            if( ['player', 'cage', 'dirt', 'baby monster'].indexOf(elements[i].type) > -1 ) {
                new_dir = priorities[i];
                break;
            }
        }
    }

    if(new_dir === undefined) return; // no move
    var new_dirs = new_dir.split(',').map(i => i * 1);
    var target_accessible = approach(e[id].x, e[id].y, m.x + new_dirs[0], m.y + new_dirs[1], 'baby monster', true, id);
    var x1 = m.x;
    var y1 = m.y;
    e[id].x = m.x + new_dirs[0];
    e[id].y = m.y + new_dirs[1];
    e[id].last_dir = new_dir;
    if(e[id].type == 'diamond'){
        e[id].sprite.setTexture('diamond');
    }
    e[id].sprite.x = mapX(e[id].x);
    e[id].sprite.y = mapY(e[id].y);
    triggers(x1, y1, e[id].x, e[id].y, 'baby monster');
    return;
}



function baby_monster_initialise(id) {
    // set initial direction of baby monster with given id
    // also reactivates baby monsters that got stuck
    var m = e[id];
    
    // anti-clockwise from top checks first adjacent cells then diagonally
    var offsets = ['0,1', '-1,0', '0,-1',  '1,0', '-1,1','-1,-1', '1,-1', '1,1'];
    var vectors =  ['1,0',  '0,1', '-1,0', '0,-1',  '0,1', '-1,0', '0,-1', '1,0'];

    var environ = offsets.map(o => check_wall(m.x, m.y, o));
    var objects = environ.filter(i => i > -1) // ignore vacant cells and player/cages
                         .filter(i => ['player', 'cage', 'dirt', 'baby monster'].indexOf(e[i].type) === -1);
    // select first match and set initial direction
    if(objects.length > 0) {
        var anchor_id = environ.indexOf(objects[0]);
        e[id].last_dir = vectors[anchor_id];
    } else e[id].last_dir = '0,-1'; // to review (e.g. L46)
    return;
}

