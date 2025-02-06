
// Two functions approach and move and the rules for direct object interactions (not remote triggers)

// Rules for interactions. Tree structured:
//
// - L1: class of current static occupant of coordinates (x,y)
//   - L2: direction of approach of moving element
//     - L3: class of moving element entering the cell
//       - L4: outcome

var rules = {
    "player": {
        "top": { "boulder": "killed", "big monster": "killed", "baby monster": "killed" },
        "side": { "boulder": "no", "right arrow": "killed", "left arrow": "killed", "big monster": "killed", "baby monster": "killed" },
        "bottom": { "balloon": "no", "big monster": "killed", "baby monster": "killed" },
    },
    
    // edible (non-directional)
    "diamond": { "any":{ "player": "eat", "other": "no" } },
    "dirt": { "any":{ "player": "eat", "other": "no" } },
    "add moves": { "any":{ "player": "eat", "other": "no" } },
    
    // static (non-directional)
    "dark wall": { "any":{ "any": "no" } },
    "light wall": { "any":{ "any": "no" } },
    "left slope": { "any": { "player": "no", "other": "deflect" } },
    "right slope": { "any": { "player": "no", "other": "deflect" } },
    "fire": { "any": { "player": "killed", "other": "no" } },
    "portal in": { "any": { "player": "teleport", "other": "no" } },
    "exit": { "any": { "player": "exit", "other": "no" } },
    "cage": { "any": { "baby monster": "eat", "other": "no" } },
    
    // dynamic
    "left arrow": {
        "side": { "any": "no" },
        "top": { "player": "push", "other": "no" },
        "bottom": { "player": "push", "other": "no" }
    },
    "right arrow": {
        "side": { "any": "no" },
        "top": { "player": "push", "other": "no" },
        "bottom": { "player": "push", "other": "no" }
    },
    "boulder": {
        "side": { "player": "push", "other": "deflect" },
        "top": { "boulder": "deflect", "other": "no" },
        "bottom": { "any": "no" }
    },
    "balloon": {
        "side": {
            "player": "push", 
            "right arrow": "eat",
            "left arrow": "eat",
            "other": "no"
        },
        "top": { "any": "no" },
        "bottom": { "any": "no" }
    },
    "big monster": {
        "any": {
            "player": "killed",
            "left arrow": "eat",
            "right arrow": "eat",
            "boulder": "eat",
            "balloon": "no",      // guess
            "baby monster": "yes" // guess
        }
    },
    "baby monster": {
        "any": {
            "player": "killed",
            "left arrow": "yes",  // guess
            "right arrow": "yes", // guess
            "boulder": "yes",
            "balloon": "yes",     // guess
            "baby monster": "yes",
            "big monster": "yes"  // guess
        }
    }
}


// manage the logic of any object moving from one grid cell to another

function approach(x1, y1, x2, y2, approacher, deadly, approacher_id) {

    if(x2 < 1 || x2 > 40 || y2 < 1 || y2 > 16) return false;  // edge of canvas
    // if(verbose) console.log( `approach ${x1}, ${y1}, ${x2}, ${y2}, ${approacher}` );

    var occupant_id = id_element(x2, y2, approacher);
    if(occupant_id === -1) return true;  // cell is unoccupied
    
    var occupant_type = e[occupant_id].type;
    var top_branch = rules[occupant_type];
    var top_branch_keys = Object.keys(top_branch);
    var mid_branch, rule;
    
    // direction
    if( top_branch_keys.indexOf("any") > -1 ) {
        mid_branch = top_branch["any"];
    }
    else {
        var dir;
        if(x1 !== x2) {
            dir = 'side';
        }
        else if(y1 > y2) {
            dir = 'top';
        }
        else dir = 'bottom';
        mid_branch = top_branch[dir];
    }
    mid_branch_keys = Object.keys(mid_branch);
        if( mid_branch_keys.indexOf(approacher) > -1 ) {
            rule = mid_branch[approacher];
        } else rule = mid_branch["other"];

    switch(rule) {

        case 'no':
            return false;
        
        case 'yes':
            return true;

        case 'eat':
            
            switch(occupant_type){

                case 'diamond':
                    diamonds_collected ++;
                    document.getElementById('diamondsRemaining').textContent = "💎 " + (diamonds_target - diamonds_collected);
                    playSound('diamond');
                    break;

                case 'add moves':
                    if(moves_remaining !== 99999) moves_remaining += 250;
                    break;

                case 'dirt':
                    playSound('dirt');
                    break;
                
                case 'big monster':
                    console.log('big monster was killed');
                    break;

                case 'cage':
                    e[approacher_id].type = 'diamond'; // caged
                    break;

            }
            kill_element(occupant_id);
            return true;

        
        case 'teleport':
            kill_element(id_element(portal_out.x, portal_out.y)); // eat anything at portal out
            e[playerID].x = portal_out.x;
            e[playerID].y = portal_out.y;
            kill_element(occupant_id); // remove teleporter from screen
            e[playerID].sprite.x = mapX(e[playerID].x);
            e[playerID].sprite.y = mapY(e[playerID].y);
            triggers(x2, y2, portal_out.x, portal_out.y, type = 'player');
            playSound('teleport');
            return false;

        case 'killed':
            if(!deadly) return false; // elements must move 1 cell before becoming deadly

            switch(approacher){

                case 'boulder':
                    message('messenger', "Killed by a falling boulder!");
                    playSound('killed');
                    break;

                case 'left arrow':
                    message('messenger', 'Killed by a speeding arrow!');
                    playSound('killed');
                    break;
                
                case 'right arrow':
                    message('messenger', 'Killed by a speeding arrow!');
                    playSound('killed');
                    break;

                case 'player':

                    switch(occupant_type){
                        case 'fire':
                            message('messenger', "You were killed by an exploding landmine!");
                            playSound('landmine');
                            break;
                        case 'big monster':
                            message('messenger', "You were killed by a hungry monster!");
                            playSound('killed');
                            break;
                        case 'baby monster':
                            message('messenger', "You were killed by the little monsters!");
                            playSound('killed');
                            break;
                        default:
                            message('messenger', "Unknown cause of death please investigate 1");
                            break;
                    }
                    break;
                
                case 'big monster':
                    message('messenger', "You were killed by a hungry monster!");
                    playSound('monsters');
                    break;
                
                case 'baby monster':
                    message('messenger', "You were killed by the little monsters!");
                    playSound('monsters');
                    break;
                
                default:
                    message('messenger', "Unknown cause of death please investigate 2");
                    break;
            }
            
            e[playerID].sprite.setTexture('player dead');
            kill = true;
            busy = true;
            return false;
    
        case 'exit':
            if(diamonds_collected == diamonds_target) {
                message('messenger', 'Level complete!', 'next');
                if(sound){
                    playSound('exit1');
                    playSound('exit2');
                }
                return true;
            } else{
                message('messenger', "Collect all the treasure 💎 first!", fun = 'exit blocked');
                return false;
            }

        case 'push':
            var dx = x2 - x1;
            var dy = y2 - y1;
            var x3 = x2 + dx;
            var y3 = y2 + dy;
            if(x3 < 1 || x3 > 40 || y3 < 1 || y3 > 16) return false;
            push_cell = id_element(x3, y3);  // what if occupied by a baby monster (and nothing else)?
            if(push_cell >= 0) return false;
            e[occupant_id].x = x3;
            e[occupant_id].y = y3;
            e[occupant_id].sprite.x = mapX(x3);
            e[occupant_id].sprite.y = mapY(y3);
            if(verbose) console.log(`added ${occupant_id} to queue 1`);
            if(queue.indexOf(occupant_id) === -1) queue.push(occupant_id);  // once pushed an object becomes mobile
            // move(occupant_id, occupant_type); // once pushed an object becomes mobile
            return true;
         
        case 'deflect':

            switch(approacher) {

                case 'boulder':
                    // left deflection
                    if(id_element(x2 - 1, y2 + 1) === -1 &&   // top left cell empty
                    id_element(x2 - 1, y2) === -1 &&       // left cell empty
                    x2 - 1 >= 1 &&                         // not off canvas
                    occupant_type !== 'right slope') {
                        return (x2 - 1) + ',' + y2;
                    }
                    // right deflection
                    else if(id_element(x2 + 1, y2 + 1) === -1 &&  // top right cell empty
                            id_element(x2 + 1, y2) === -1 &&      // right cell empty
                            x2 + 1 <= 40 && 
                            occupant_type !== 'left slope') {
                        return (x2 + 1) + ',' + y2;
                    }
                    break;

                case 'right arrow':
                    // up deflection
                    if( id_element(x1, y1 + 1) === -1 &&      // top cell empty
                        id_element(x2, y1 + 1) === -1 &&      // top right empty
                        y2 < 16 &&                            // not off canvas
                        occupant_type !== 'right slope') {
                            return x2 + ',' + (y2 + 1)
                        }
                    // down deflection
                    else if(id_element(x1, y2 - 1) === -1 &&  // bottom cell empty
                            id_element(x2, y2 - 1) === -1 &&  // bottom right empty
                            y2 > 1 &&                         // not off canvas
                            occupant_type === 'right slope') {
                                return x2 + ',' + (y2 - 1);
                            }
                    break;

                case 'left arrow':
                    // up deflection
                    if( id_element(x1, y1 + 1) === -1 &&      // top cell empty
                        id_element(x2, y1 + 1) === -1 &&      // top left empty
                        y2 < 16 &&                            // not off canvas
                        occupant_type !== 'left slope') {
                            return x2 + ',' + (y2 + 1);
                        }
                    // down deflection
                    else if(id_element(x1, y1 - 1) === -1 &&  // bottom cell empty
                            id_element(x2, y1 - 1) === -1 &&  // bottom left empty
                            y2 > 1 &&                         // not off canvas
                            occupant_type === 'left slope') {
                                return x2 + ',' + (y2 - 1);
                            }
                    break;

                case 'balloon':
                    // left deflection
                    if( id_element(x2 - 1, y2) === -1 &&      // top left cell empty
                        id_element(x2 - 1, y1) === -1 &&      // left cell empty
                        x2 - 1 >= 1 &&                        // not off canvas
                        occupant_type === 'right slope') {
                            return (x2 - 1) + ',' + y2;
                        }
                    // right deflection
                    else if(id_element(x2 + 1, y2) === -1 &&  // top right cell empty
                            id_element(x2 + 1, y1) === -1 &&  // right cell empty
                            x2 + 1 <= 40 &&
                            occupant_type === 'left slope') {
                                return (x2 + 1) + ',' + y2;
                            }
                    break;
            } // end approacher switch

            return false;

    } // end rule switch
}

//----------------------------------------------------------------------------------

// dynamic logic for mobile elements

function move(id, type = '', deadly = false) {
    if(kill) return false;
    busy = true;     // pause other elements
    hold_move = true;     // pause user inputs
    if(verbose) console.log('move ' + String(id));
    if(type === '') type = e[id].type;
    
    // which way will the element move
    var dx, dy;
    if(type === 'boulder') { dx = 0; dy = -1; }
    if(type === 'left arrow') { dx = -1; dy = 0; }
    if(type === 'right arrow') { dx = 1; dy = 0; }
    if(type === 'balloon') { dx = 0; dy = 1; }
    var x1 = e[id].x;
    var y1 = e[id].y;
    if(verbose) console.log( `    ${x1},${y1}` );
    
    // check if it's possible to move to the target cell. For deflections approach function
    // will report false and handle the movement itself
    var target_accessible = approach(x1, y1, x1 + dx, y1 + dy, type, deadly, id);

    if(target_accessible) {
        if(target_accessible === true) { // move to target
            e[id].x = x1 + dx;
            e[id].y = y1 + dy;
        }
        else {  // deflected so target_accessible are new coordinates
            if(verbose) console.log('deflected');
            var xy = target_accessible.split(',').map(x => x * 1);
            e[id].x = xy[0];
            e[id].y = xy[1];
        }
        e[id].sprite.x = mapX(e[id].x);
        e[id].sprite.y = mapY(e[id].y);
        
        // triggers
        triggers(x1, y1, e[id].x, e[id].y, type);
        sleep(speed).then(() => { move(id, type, deadly = true); });
        return true;  // so queue handler knows if a movement took place
    } else {
        busy = false;
        hold_move = false;
        if(verbose) console.log( `end move ${id}` );
        if(type == 'boulder' && deadly) playSound('boulder');
        return false
    }
}
