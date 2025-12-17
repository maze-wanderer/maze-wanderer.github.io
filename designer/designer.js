// Minimal designer for building levels (40x16)
// Uses same sizing logic as main `game.js` so canvas matches appearance

var main_div = document.getElementById('game-area');

function calculateDimensions() {
    var w = main_div.offsetWidth || 800;
    var win_height = window.innerHeight;
    var min_ratio = (1.25 * 18) / 40;
    if(win_height/w < min_ratio) w = win_height / min_ratio;
    var h = 1.25 * 16 * w / 40;
    return { w: w, h: h };
}

var dims = calculateDimensions();
var w = dims.w;
var h = dims.h;
var cellW = w / 40;
var cellH = h / 16;
var scaler = w / 800;

function mapX (x) { return (x * cellW - cellW) + (10 * scaler); }
function mapY (y) { return (h - (y * cellH)) + (13 * scaler); }

// element keys and display labels (subset and ordering)
var paletteKeys = ["@"," ","=","#","/","\\","O","*",":","<",">","!","^","T","A","X","C","S","M","+","B"];
var elements = {
    "@": "player",
    " ": "space",
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

// model: 2D array rows[y][x] where y = 0..15 (top..bottom), x = 0..39
var rows = [];
for(var r=0;r<16;r++){ rows.push(new Array(40).fill(' ')); }

var selectedKey = '@';
// single player position (only one '@' allowed)
var playerPos = { x: -1, y: -1 };

// sprite cache for preloaded images
var spriteCache = {};

function preloadSprites(callback){
    var types = Object.values(elements).filter(t => t && t !== 'space' && t !== 'dark wall' && t !== 'light wall');
    // unique
    types = Array.from(new Set(types));
    var pending = types.length;
    if(pending === 0){ if(callback) callback(); return; }
    types.forEach(function(type){
        var fname = type.replace(/\s+/g,'-');
        var img = new Image();
        img.onload = function(){ spriteCache[type] = img; if(--pending === 0 && callback) callback(); };
        img.onerror = function(){ console.warn('Designer: failed to preload', fname); spriteCache[type] = null; if(--pending === 0 && callback) callback(); };
        img.src = '/sprites/' + fname + '.svg';
    });
}

var sprite_scales = {
    'diamond': 0.43, 'add moves': 0.04, 'boulder': 0.2, 'dirt': 0.15, 'left slope': 0.18, 'right slope': 0.18, 
    'fire': 0.3, 'portal in': 0.01, 'exit': 0.25, 'left arrow': 0.2, 'right arrow': 0.2, 'balloon': 0.4, 
    'baby monster': 0.17, 'big monster': 0.17, 'cage': 0.2, 'bomb': 0.4, 'player': 0.17, 'player left': 0.17, 
    'player right': 0.17, 'player up': 0.17, 'player down': 0.17, 'player dead': 0.17
}

function spritePixelSizeForCell(type, cellWpx, cellHpx){
    var scaleHint = sprite_scales[type] || 0.2;
    // approximate Phaser rendering: use a multiplier to map scaleHint->pixel fraction of cell height
    var approx = Math.round(4 * scaleHint * cellHpx);
    var maxDim = Math.round(Math.min(cellWpx, cellHpx) * 0.95);
    var size = Math.min(Math.max(12, approx), maxDim);
    return { w: size, h: size };
}

// build palette UI
function buildPalette(){
    var pal = document.getElementById('top-palette') || document.getElementById('palette');
    pal.innerHTML = '';
    // compute cell pixel sizes (match grid sizing logic)
    var container = document.getElementById('game-area');
    var contWidth = (container && container.clientWidth) ? container.clientWidth : window.innerWidth;
    var cellWpx = Math.floor(contWidth / 40);
    var cellHpx = Math.floor(h / 16);
    paletteKeys.forEach(function(k){
        var btn = document.createElement('button');
        btn.title = elements[k] || k;
        btn.style.margin = '4px';
        btn.style.padding = '4px';
        btn.style.width = '34px';
        btn.style.height = '34px';
        btn.style.display = 'inline-flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.background = '#222';
        btn.style.border = '1px solid #333';
        btn.style.cursor = 'pointer';
        btn.onclick = function(){ selectedKey = k; updatePaletteSelection(); };
        btn.dataset.key = k;

        var type = elements[k];
        if(!type || type === 'space'){
            // show dot for empty
            btn.textContent = '\u00B7';
        } else if(type === 'dark wall' || type === 'light wall'){
            // colored box for walls
            var box = document.createElement('div');
            var boxSize = Math.max(12, Math.round(Math.min(cellWpx, cellHpx) * 0.5));
            box.style.width = boxSize + 'px';
            box.style.height = boxSize + 'px';
            box.style.borderRadius = '2px';
            box.style.boxSizing = 'border-box';
            box.style.border = '1px solid #222';
            box.style.background = (type === 'dark wall') ? '#777' : '#888';
            btn.appendChild(box);
        } else {
            // try to show sprite SVG from cache (preloaded)
            var cached = spriteCache[type];
            if(cached){
                var imgEl = cached.cloneNode();
                imgEl.alt = type;
                var dim = spritePixelSizeForCell(type, cellWpx, cellHpx);
                imgEl.style.width = dim.w + 'px';
                imgEl.style.height = dim.h + 'px';
                imgEl.style.pointerEvents = 'none';
                btn.appendChild(imgEl);
            } else {
                // fallback to creating an image (will load if not preloaded)
                var img = document.createElement('img');
                var fname = type.replace(/\s+/g,'-');
                img.src = '/sprites/' + fname + '.svg';
                img.alt = type;
                var dim2 = spritePixelSizeForCell(type, cellWpx, cellHpx);
                img.style.width = dim2.w + 'px';
                img.style.height = dim2.h + 'px';
                img.style.pointerEvents = 'none';
                img.onerror = function(){ btn.textContent = k === ' ' ? '\u00B7' : k; };
                btn.appendChild(img);
            }
        }
        pal.appendChild(btn);
    });
    updatePaletteSelection();
}

function updatePaletteSelection(){
    var pal = document.getElementById('top-palette') || document.getElementById('palette');
    if(!pal) return;
    Array.from(pal.children).forEach(function(b){
        b.style.outline = (b.dataset.key === selectedKey) ? '2px solid magenta' : 'none';
    });
}

// DOM-based grid editor (40x16)
function buildDomGrid(){
    var container = document.getElementById('game-area');
    container.innerHTML = '';
    // We'll create a wrapper column that contains: top numbers, middle (left numbers + grid + right numbers), bottom numbers
    var wrapperCol = document.createElement('div');
    wrapperCol.style.display = 'flex';
    wrapperCol.style.flexDirection = 'column';
    wrapperCol.style.alignItems = 'center';

    // compute sizes
    var contWidth = container.clientWidth || window.innerWidth;
    var cellWpx = Math.floor(contWidth / 40);
    var totalW = cellWpx * 40;
    var cellHpx = Math.floor(h / 16);

    // top column numbers
    var topNums = document.createElement('div');
    topNums.id = 'col-top';
    topNums.style.display = 'grid';
    topNums.style.gridTemplateColumns = 'repeat(40, ' + cellWpx + 'px)';
    topNums.style.width = totalW + 'px';
    topNums.style.margin = '0 auto';
    topNums.style.height = Math.round(cellHpx * 0.6) + 'px';
    topNums.style.alignItems = 'center';
    topNums.style.justifyItems = 'center';
    for(var i=1;i<=40;i++){ var n = document.createElement('div'); n.textContent = i; n.style.color='#ddd'; n.style.fontSize='0.8em'; topNums.appendChild(n); }
    wrapperCol.appendChild(topNums);

    // middle row: left numbers, grid, right numbers
    var middle = document.createElement('div');
    middle.style.display = 'flex';
    middle.style.flexDirection = 'row';
    middle.style.alignItems = 'stretch';

    var leftNums = document.createElement('div');
    leftNums.id = 'row-left';
    leftNums.style.display = 'grid';
    leftNums.style.gridTemplateRows = 'repeat(16, ' + cellHpx + 'px)';
    leftNums.style.marginRight = '4px';
    for(var ry=16; ry>=1; ry--){ var rn = document.createElement('div'); rn.textContent = ry; rn.style.color='#ddd'; rn.style.display='flex'; rn.style.alignItems='center'; rn.style.justifyContent='center'; leftNums.appendChild(rn); }
    middle.appendChild(leftNums);

    var grid = document.createElement('div');
    grid.id = 'dom-grid';
    grid.style.display = 'grid';
    grid.style.gap = '0px';
    grid.style.background = '#222';
    grid.style.gridTemplateColumns = 'repeat(40, ' + cellWpx + 'px)';
    grid.style.width = totalW + 'px';
    grid.style.height = (cellHpx * 16) + 'px';
    grid.style.boxSizing = 'border-box';

    for(var y=0;y<16;y++){
        for(var x=0;x<40;x++){
            var cell = document.createElement('div');
            cell.className = 'designer-cell';
            cell.id = 'cell-' + x + '-' + y;
            cell.dataset.x = x; cell.dataset.y = y;
            cell.style.boxSizing = 'border-box';
            cell.style.width = cellWpx + 'px';
            cell.style.height = cellHpx + 'px';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.fontFamily = 'monospace';
            cell.style.fontSize = Math.round(cellHpx * 0.6) + 'px';
            cell.style.color = '#fff';
            cell.style.background = '#111';
            cell.style.border = '1px solid #333';
            // initial render (will be updated by updateDomGrid)
            cell.innerHTML = '';
            (function(cx,cy){
                cell.addEventListener('click', function(){ setCell(cx,cy, selectedKey); updateDomCell(cx,cy); });
            })(x,y);
            grid.appendChild(cell);
        }
    }

    middle.appendChild(grid);

    var rightNums = document.createElement('div');
    rightNums.id = 'row-right';
    rightNums.style.display = 'grid';
    rightNums.style.gridTemplateRows = 'repeat(16, ' + cellHpx + 'px)';
    rightNums.style.marginLeft = '4px';
    for(var ry=16; ry>=1; ry--){ var rn2 = document.createElement('div'); rn2.textContent = ry; rn2.style.color='#ddd'; rn2.style.display='flex'; rn2.style.alignItems='center'; rn2.style.justifyContent='center'; rightNums.appendChild(rn2); }
    middle.appendChild(rightNums);

    wrapperCol.appendChild(middle);

    // bottom column numbers
    var bottomNums = document.createElement('div');
    bottomNums.id = 'col-bottom';
    bottomNums.style.display = 'grid';
    bottomNums.style.gridTemplateColumns = 'repeat(40, ' + cellWpx + 'px)';
    bottomNums.style.width = totalW + 'px';
    bottomNums.style.margin = '0 auto';
    bottomNums.style.height = Math.round(cellHpx * 0.6) + 'px';
    bottomNums.style.alignItems = 'center';
    bottomNums.style.justifyItems = 'center';
    for(var i=1;i<=40;i++){ var nb = document.createElement('div'); nb.textContent = i; nb.style.color='#ddd'; nb.style.fontSize='0.8em'; bottomNums.appendChild(nb); }
    wrapperCol.appendChild(bottomNums);

    container.appendChild(wrapperCol);
}

function updateDomCell(x,y){
    var el = document.getElementById('cell-' + x + '-' + y);
    if(!el) return;
    var ch = rows[y][x];
    // clear
    el.innerHTML = '';
    el.style.background = '#111';
    el.style.border = '1px solid #333';

    // determine type
    var type = elements[ch] || null;
    if(!type || type === 'space'){
        // show dot for empty
        el.textContent = '';
        return;
    }

    // walls: draw colored background instead of sprite
    if(type === 'dark wall'){
        el.style.background = '#777';
        el.textContent = '';
        return;
    }
    if(type === 'light wall'){
        el.style.background = '#888';
        el.textContent = '';
        return;
    }

    // other types: use preloaded image if available, otherwise load by src
    var cached = spriteCache[type];
    var cw = el.clientWidth || (Math.floor((document.getElementById('game-area').clientWidth||window.innerWidth)/40));
    var chPx = el.clientHeight || Math.floor(h / 16);
    var imgW = Math.max(12, Math.round(cw * 0.75));
    var imgH = Math.max(12, Math.round(chPx * 0.75));
    if(cached){
        var imgEl = cached.cloneNode();
        imgEl.alt = type;
        var dim = spritePixelSizeForCell(type, cw, chPx);
        imgEl.style.width = dim.w + 'px';
        imgEl.style.height = dim.h + 'px';
        imgEl.style.objectFit = 'contain';
        imgEl.style.pointerEvents = 'none';
        el.appendChild(imgEl);
    } else {
        var filename = type.replace(/\s+/g,'-');
        var img = document.createElement('img');
        img.src = '/sprites/' + filename + '.svg';
        img.alt = type;
        var dim = spritePixelSizeForCell(type, cw, chPx);
        img.style.width = dim.w + 'px';
        img.style.height = dim.h + 'px';
        img.style.objectFit = 'contain';
        img.style.pointerEvents = 'none';
        el.appendChild(img);
    }
}

function updateDomGrid(){
    for(var y=0;y<16;y++) for(var x=0;x<40;x++) updateDomCell(x,y);
}

function setCell(x,y,key){
    // x:0..39, y:0..15 (top..bottom)
    var current = rows[y][x];

    // If clicking with the same selection, toggle clear the cell
    if(current === key){
        // clear cell
        rows[y][x] = ' ';
        // if it was the player, clear playerPos
        if(key === '@'){
            playerPos.x = -1; playerPos.y = -1;
        }
        return;
    }

    // If placing player '@', remove any existing player first
    if(key === '@'){
        if(playerPos.x !== -1 && playerPos.y !== -1){
            // clear previous player cell
            rows[playerPos.y][playerPos.x] = ' ';
            updateDomCell(playerPos.x, playerPos.y);
        }
        rows[y][x] = '@';
        playerPos.x = x; playerPos.y = y;
        return;
    }

    // If overwriting a player with a different key, clear playerPos
    if(current === '@'){
        playerPos.x = -1; playerPos.y = -1;
    }

    rows[y][x] = key;
}

function clearGrid(){
    for(var y=0;y<16;y++) for(var x=0;x<40;x++) rows[y][x] = ' ';
    updateDomGrid();
}

function exportLevel(){
    // rows array top..bottom -> produce 16 lines each 40 chars
    var lines = rows.map(r => r.join(''));
    var title = document.getElementById('level-title').value || 'Designer Level';
    var moves = document.getElementById('level-moves').value || '99999';
    lines.push(title);
    lines.push(moves);
    var out = lines.join('\n');
    document.getElementById('export-area').value = out;
    return out;
}

function encodeForURL(){
    var out = exportLevel();
    // replace newlines with semicolon placeholder as used by the main game's test mode
    var semi = out.replace(/\n/g, ';');
    var encoded = encodeURIComponent(semi);
    document.getElementById('export-area').value = semi;
    var link = window.location.origin + window.location.pathname.replace('/designer/','/') + '#level=' + encoded + '&num=0';
    // show link below textarea
    var area = document.getElementById('export-area');
    area.value = semi + '\n\nEncoded for URL (use as index.html#level=<encoded>):\n' + link;
}

function openInGame(){
    // export current level, encode with semicolon placeholders, and navigate to main page
    var out = exportLevel();
    var semi = out.replace(/\n/g, ';');
    var encoded = encodeURIComponent(semi);
    var link = window.location.origin + window.location.pathname.replace('/designer/','/') + '#level=' + encoded + '&num=0';
    // open the main site in a new tab and remove opener for safety
    var win = window.open(link, '_blank');
    if(win) try { win.opener = null; } catch(e) { /* ignore */ }
}

// attach DOM events
window.addEventListener('load', function(){
    // preload sprite assets first, then build UI
    preloadSprites(function(){
        // build the DOM grid (40x16) first so container widths are available
        buildDomGrid();
        // then build palette (which sizes images based on container width)
        buildPalette();
        updateDomGrid();
        document.getElementById('btn-clear').addEventListener('click', function(){ clearGrid(); });
        document.getElementById('btn-export').addEventListener('click', function(){ openInGame(); });
        document.getElementById('btn-encode-url').addEventListener('click', function(){ encodeForURL(); });

        // respond to resize
        window.addEventListener('resize', function(){
            var newDims = calculateDimensions();
            w = newDims.w; h = newDims.h;
            cellW = w/40; cellH = h/16; scaler = w/800;
            // rebuild grid with new pixel-perfect cell size so all 40 columns fit
            var container = document.getElementById('game-area');
            var grid = document.getElementById('dom-grid');
            if(grid && container){
                // recompute sizes
                var contWidth = container.clientWidth || window.innerWidth;
                var cellWpx = Math.floor(contWidth / 40);
                var totalW = cellWpx * 40;
                var cellHpx = Math.floor(h / 16);
                grid.style.gridTemplateColumns = 'repeat(40, ' + cellWpx + 'px)';
                grid.style.width = totalW + 'px';
                grid.style.height = (cellHpx * 16) + 'px';
                // update top/bottom number rows
                var topNums = document.getElementById('col-top');
                var bottomNums = document.getElementById('col-bottom');
                if(topNums){ topNums.style.gridTemplateColumns = 'repeat(40, ' + cellWpx + 'px)'; topNums.style.width = totalW + 'px'; topNums.style.height = Math.round(cellHpx * 0.6) + 'px'; }
                if(bottomNums){ bottomNums.style.gridTemplateColumns = 'repeat(40, ' + cellWpx + 'px)'; bottomNums.style.width = totalW + 'px'; bottomNums.style.height = Math.round(cellHpx * 0.6) + 'px'; }
                // update left/right number columns
                var leftNums = document.getElementById('row-left');
                var rightNums = document.getElementById('row-right');
                if(leftNums) leftNums.style.gridTemplateRows = 'repeat(16, ' + cellHpx + 'px)';
                if(rightNums) rightNums.style.gridTemplateRows = 'repeat(16, ' + cellHpx + 'px)';
                var cells = document.getElementsByClassName('designer-cell');
                for(var i=0;i<cells.length;i++){
                    cells[i].style.width = cellWpx + 'px';
                    cells[i].style.height = cellHpx + 'px';
                    cells[i].style.fontSize = Math.round(cellHpx * 0.6) + 'px';
                }
                // update palette image/button sizes to match cell scaling
                var pal = document.getElementById('top-palette') || document.getElementById('palette');
                if(pal){
                    var buttons = pal.getElementsByTagName('button');
                    for(var bi=0; bi<buttons.length; bi++){
                        var b = buttons[bi];
                        var img = b.querySelector('img');
                        var box = b.querySelector('div');
                        if(img){
                            var imgSizeW = Math.max(16, Math.round(cellWpx * 0.75));
                            var imgSizeH = Math.max(16, Math.round(cellHpx * 0.75));
                            img.style.width = imgSizeW + 'px';
                            img.style.height = imgSizeH + 'px';
                        }
                        if(box){
                            var boxSize = Math.max(12, Math.round(Math.min(cellWpx, cellHpx) * 0.5));
                            box.style.width = boxSize + 'px';
                            box.style.height = boxSize + 'px';
                        }
                    }
                }
            }
        });
    });
});
