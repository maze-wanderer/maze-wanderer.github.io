// Logic for triggering elements

// "The sequencing for movements was rather obscure as it used a recursion checking all the relevant offsets in a specific order. 
//  This didn't matter usually, but in some complex movements it could change the way a screen worked out."

// rules for triggering other elements. Tree structured:
//
// - L1: direction of movement of moving element
//   - L2: class of moving element
//     - L3: class of neighbour
//       - vector list of triggers for given elements, relative position and movement dir
//             Format: (dx,dy) string vector of moving element - neighbour
//             e.g. boulder at (5,11) and player at (5,10) is vector "0,-1"

var trigger_rules = {
    "up": {
        "player": {
            "boulder": ['-1,-1', '-1,0', '1,-1', '1,0'],
            "balloon": ['-1,1', '-1,2', '0,1', '0,2', '1,1', '1,2'],
            "right arrow": ['1,0', '1,1', '2,0', '2,1', '0,1'],
            "left arrow": ['-1,0', '-1,1', '-2,0', '-2,1', '0,1']
        },
        "balloon": {
            "boulder": ['-1,-1', '-1,0', '1,-1', '1,0'],
            "balloon": ['-1,1', '-1,2', '0,1', '0,2', '1,1', '1,2'],
            "right arrow": ['1,0', '1,1', '2,0', '2,1'],
            "left arrow": ['-1,0', '-1,1', '-2,0', '-2,1']
        },
        "baby monster": {
            "boulder": ['-1,-1', '-1,0', '1,-1', '1,0'],
            "balloon": ['-1,1', '-1,2', '0,1', '0,2', '1,1', '1,2'],
            "right arrow": ['1,0', '1,1', '2,0', '2,1', '0,1'],
            "left arrow": ['-1,0', '-1,1', '-2,0', '-2,1', '0,1']
        },
        "big monster": {
            "boulder": ['-1,-1', '-1,0', '1,-1', '1,0'],
            "balloon": ['-1,1', '-1,2', '0,1', '0,2', '1,1', '1,2'],
            "right arrow": ['1,0', '1,1', '2,0', '2,1', '0,1'],
            "left arrow": ['-1,0', '-1,1', '-2,0', '-2,1', '0,1']
        }
    },
    "down": {
        "player": {
            "boulder": ['-1,-1', '-1,-2', '0,-1', '0,-2', '1,-1', '1,-2'],
            "balloon": ['1,1', '1,-1'],
            "right arrow": ['1,0', '1,-1', '2,0', '2,-1', '0,-1'],
            "left arrow": ['-1,0', '-1,-1', '-2,0', '-2,-1', '0,-1']
        },
        "boulder": {
            "boulder": ['-1,-1', '-1,-2', '0,-1', '0,-2', '1,-1', '1,-2'],
            "balloon": ['1,1', '1,-1'],
            "right arrow": ['1,0', '1,-1', '2,0', '2,-1'],
            "left arrow": ['-1,0', '-1,-1', '-2,0', '-2,-1']
        },
        "baby monster": {
            "boulder": ['-1,-1', '-1,-2', '0,-1', '0,-2', '1,-1', '1,-2'],
            "balloon": ['1,1', '1,-1'],
            "right arrow": ['1,0', '1,-1', '2,0', '2,-1', '0,-1'],
            "left arrow": ['-1,0', '-1,-1', '-2,0', '-2,-1', '0,-1']
        },
        "big monster": {
            "boulder": ['-1,-1', '-1,-2', '0,-1', '0,-2', '1,-1', '1,-2'],
            "balloon": ['1,1', '1,-1'],
            "right arrow": ['1,0', '1,-1', '2,0', '2,-1', '0,-1'],
            "left arrow": ['-1,0', '-1,-1', '-2,0', '-2,-1', '0,-1']
        }
    },
    "left": {
        "player": {
            "boulder": ['-1,0','0,-1', '0,-2', '-1,-1', '-1,-2'],
            "balloon": ['0,1', '0,2', '-1,1', '-1,2'],
            "left arrow": ['-1,-1', '-1,0', '-1,1', '-2,-1', '-2,0', '-2,1'],
            "right arrow": ['0,-1', '1,-1', '0,1', '1,1']
        },
        "left arrow": {
            "boulder": ['-1,0','0,-1', '0,-2', '-1,-1', '-1,-2', '2,-1'],
            "balloon": ['0,1', '0,2', '-1,1', '-1,2'],
            "left arrow": ['-1,-1', '-1,0', '-1,1', '-2,-1', '-2,0', '-2,1'],
            "right arrow": ['0,-1','1,-1', '0,1', '1,1']
        },
        "baby monster": {
            "boulder": ['-1,0','0,-1', '0,-2', '-1,-1', '-1,-2'],
            "balloon": ['0,1', '0,2', '-1,1', '-1,2'],
            "left arrow": ['-1,-1', '-1,0', '-1,1', '-2,-1', '-2,0', '-2,1'],
            "right arrow": ['0,-1', '1,-1', '0,1', '1,1']
        },
        "big monster": {
            "boulder": ['-1,0','0,-1', '0,-2', '-1,-1', '-1,-2'],
            "balloon": ['0,1', '0,2', '-1,1', '-1,2'],
            "left arrow": ['-1,-1', '-1,0', '-1,1', '-2,-1', '-2,0', '-2,1'],
            "right arrow": ['0,-1', '1,-1', '0,1', '1,1']
        }
    },
    "right": {
        "player": {
            "boulder": ['1,0','0,-1', '0,-2', '1,-1', '1,-2'],
            "balloon": ['0,1', '0,2', '1,1', '1,2'],
            "right arrow": ['0,-1', '1,-1', '1,0', '1,1', '2,-1', '2,0', '2,1'],
            "left arrow": ['0,-1', '-1,-1', '0,1', '-1,1']
        },
        "right arrow": {
            "boulder": ['1,0','0,-1', '0,-2', '1,-1', '1,-2', '-2,-1'],
            "balloon": ['0,1', '0,2', '1,1', '1,2'],
            "right arrow": ['0,-1', '1,-1', '1,0', '1,1', '2,-1', '2,0', '2,1'],
            "left arrow": ['0,-1', '-1,-1', '0,1', '-1,1']
        },
        "baby monster": {
            "boulder": ['1,0','0,-1', '0,-2', '1,-1', '1,-2'],
            "balloon": ['0,1', '0,2', '1,1', '1,2'],
            "right arrow": ['0,-1', '1,-1', '1,0', '1,1', '2,-1', '2,0', '2,1'],
            "left arrow": ['0,-1', '-1,-1', '0,1', '-1,1']
        },
        "big monster": {
            "boulder": ['1,0','0,-1', '0,-2', '1,-1', '1,-2'],
            "balloon": ['0,1', '0,2', '1,1', '1,2'],
            "right arrow": ['0,-1', '1,-1', '1,0', '1,1', '2,-1', '2,0', '2,1'],
            "left arrow": ['0,-1', '-1,-1', '0,1', '-1,1']
        }
    },
    "teleport": {  // how teleporting triggers elements is mostly guesswork
        "player": {
            "right arrow": ['2,0', '1,0', '2,1', '1,1', '2,-1', '1,-1'],  // e.g. Level 3
            "left arrow": ['-2,0', '-1,0', '-2,1', '-1,1', '-2,-1', '-1,-1'],
            "boulder": ['-1,-1', '-1,-2', '0,-1', '0,-2', '1,-1', '1,-2'],
            "balloon": ['-1,1', '-1,2', '0,1', '0,2', '1,1', '1,2']
        }
    }
}

// function offset(x1, y1, x2, y2) { return String(x1 - x2) + ',' + String(y1 - y2); }

function triggers(x1, y1, x2, y2, type = '') {
    if(kill) return;
    // if(x1 == 6 && y1 ==13) console.log(x1, y1, x2, y2, type);
    // console.log(x1, y1, x2, y2, type);
    if(type === '') {
        var id = id_element(x2, y2);
        type = e[id].type;
    };
    var dir;
    if(x1 === x2 && y1 === y2) return;
    var dx = x2 - x1;
    var dy = y2 - y1;
    
    // certain element types can trigger only when moving in certain directions

    function get_dir(dx, dy){
        var dir;
        if(dx > 0) dir = 'right';
        else if(dx < 0) dir = 'left';
        else if(dy > 0) dir = 'up';
        else dir = 'down';
        return dir;
    }

    switch(type){

        case 'player':     // can trigger in any direction
            if(Math.abs(dx) + Math.abs(dy) > 1) dir = 'teleport';
            else dir = get_dir(dx, dy);
            break;

        case 'boulder':    // can trigger by downward motion
            if(dy < 0) dir = 'down';
            else return;   // we assume that sideways or diagonal (deflected) movement does not trigger others
            break;

        case 'left arrow': // can trigger by leftward motion
            if(dx < 0) dir = 'left';
            else return;   // see boulder assumption
            break;

        case 'right arrow': // etc
            if(dx > 0) dir = 'right';
            else return;    // // see boulder assumption
            break;

        case 'balloon':     // can trigger by upward motion
            if(dy > 0) dir = 'up';
            else return;    // // see boulder assumption
            break;

        case 'baby monster':// any direction
            dir = get_dir(dx, dy);
            break;
    }

    var neighbours = e.filter(i => i.x >= x1 - 2 && i.x <= x1 + 2 && i.y >= y1 - 2 && i.y <= y1 + 2)
                      .filter(i => ['boulder','right arrow','left arrow','balloon'].indexOf(i.type) > -1);

    // order of neighbours is unknown. But apparently:
    //   - opposing arrows trigger left arrow first
    //   - boulders on the left trigger first
    //   - do boulders have general priority over arrows?
    //   - lower boulders always trigger before higher ones, or more nuanced?
    //   - which triggers are queued and which trigger instantly?

    neighbours = neighbours.map(n => {
        n.offset = String(x1 - n.x) + ',' + String(y1 - n.y);
        n.dist = dists[n.offset];
        n.ntype = type_order[n.type];
        return n;
    });

    neighbours = tidy(neighbours, arrange(['ntype', 'dist', desc('y'), desc('x')]) );

    for(var i=0; i<neighbours.length; i++) {
        var n = neighbours[i];
        // var n_offset = String(x1 - n.x) + ',' + String(y1 - n.y);//  offset(x1, y1, n.x, n.y);
        var rule_set = trigger_rules[dir][type][n.type];
        // console.log(type, dir, n.type);
        if(rule_set.indexOf(n.offset) > -1) {
            if(queue.indexOf(n.id) === -1) queue.push(n.id);
            if(verbose) console.log(`added ${n.id} to queue 2`);
        }
    }
}

var nx;
