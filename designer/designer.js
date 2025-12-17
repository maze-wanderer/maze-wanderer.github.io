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
// positions for elements that must be unique (only one instance allowed)
var singlePos = {
    'player': { x: -1, y: -1 },
    'portal in': { x: -1, y: -1 },
    'portal out': { x: -1, y: -1 },
    'exit': { x: -1, y: -1 },
    'big monster': { x: -1, y: -1 }
};

// sprite cache for preloaded images
var spriteCache = {};

// drawing state for drag-paint behavior
var isDrawing = false;
var lastPaintX = -1, lastPaintY = -1;
var drawingStarted = false;

function preloadSprites(callback){
    // exclude space and portal-out placeholders; walls now have builder SVGs we will preload
    var types = Object.values(elements).filter(t => t && t !== 'space' && t !== 'portal out');
    // unique
    types = Array.from(new Set(types));
    var pending = types.length;
    if(pending === 0){ if(callback) callback(); return; }
    types.forEach(function(type){
        var fname;
        if(type === 'dark wall') fname = 'builder-dark-wall';
        else if(type === 'light wall') fname = 'builder-light-wall';
        else fname = type.replace(/\s+/g,'-');
        var img = new Image();
        img.onload = function(){ spriteCache[type] = img; if(--pending === 0 && callback) callback(); };
        img.onerror = function(){ console.warn('Designer: failed to preload', fname); spriteCache[type] = null; if(--pending === 0 && callback) callback(); };
        img.src = '/sprites/' + fname + '.svg';
    });
}

var sprite_scales = {
    'diamond': 0.43, 'add moves': 0.04, 'boulder': 0.2, 'dirt': 0.1, 'left slope': 0.18, 'right slope': 0.18, 
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
    // Prefer reading an actual cell's size if the grid exists, otherwise fall back to container width
    var cellWpx, cellHpx;
    var grid = document.getElementById('dom-grid');
    if(grid){
        var sample = grid.querySelector('.designer-cell');
        if(sample){
            cellWpx = Math.max(8, Math.floor(sample.clientWidth));
            cellHpx = Math.max(8, Math.floor(sample.clientHeight));
        }
    }
    if(!cellWpx || !cellHpx){
        var container = document.getElementById('game-area');
        var contWidth = (container && container.clientWidth) ? container.clientWidth : window.innerWidth;
        cellWpx = Math.floor(contWidth / 40);
        cellHpx = Math.floor(h / 16);
    }
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
            // Use builder SVGs for wall buttons so they render consistently
            var cachedWall = spriteCache[type];
            var fname = (type === 'dark wall') ? 'builder-dark-wall' : 'builder-light-wall';
            if(cachedWall){
                var imgEl = cachedWall.cloneNode();
                imgEl.alt = type;
                imgEl.style.pointerEvents = 'none';
                imgEl.style.maxWidth = 'none';
                imgEl.style.maxHeight = 'none';
                // size based on button pixels in next tick
                (function(b, img){ setTimeout(function(){ var bw = b.clientWidth||34; var bh = b.clientHeight||34; var boxSize = Math.max(12, Math.floor(Math.min(bw,bh)*0.6)); img.style.width = boxSize + 'px'; img.style.height = boxSize + 'px'; },0); })(btn, imgEl);
                btn.appendChild(imgEl);
            } else {
                var img = document.createElement('img');
                img.alt = type;
                img.src = '/sprites/' + fname + '.svg';
                img.style.pointerEvents = 'none';
                img.style.maxWidth = 'none';
                img.style.maxHeight = 'none';
                (function(b, img){ setTimeout(function(){ var bw = b.clientWidth||34; var bh = b.clientHeight||34; var boxSize = Math.max(12, Math.floor(Math.min(bw,bh)*0.6)); img.style.width = boxSize + 'px'; img.style.height = boxSize + 'px'; },0); })(btn, img);
                btn.appendChild(img);
            }
        } else if(type === 'portal out'){
            // portal-out is not a sprite; show a labeled swatch 'A' (destination marker)
            var swatch2 = document.createElement('div');
            swatch2.className = 'palette-swatch portal-out-swatch';
            swatch2.style.width = '16px';
            swatch2.style.height = '16px';
            swatch2.style.borderRadius = '2px';
            swatch2.style.boxSizing = 'border-box';
            swatch2.style.border = '1px solid #333';
            swatch2.style.background = '#3355aa';
            swatch2.style.color = '#fff';
            swatch2.style.display = 'inline-flex';
            swatch2.style.alignItems = 'center';
            swatch2.style.justifyContent = 'center';
            swatch2.style.fontSize = Math.max(10, Math.round(cellHpx * 0.45)) + 'px';
            swatch2.textContent = 'A';
            swatch2.style.pointerEvents = 'none';
            btn.appendChild(swatch2);
            // measure and adjust
            (function(b, s){ setTimeout(function(){ var bw = b.clientWidth||34; var bh = b.clientHeight||34; var bs = Math.max(12, Math.floor(Math.min(bw,bh)*0.6)); s.style.width=bs+'px'; s.style.height=bs+'px'; s.style.fontSize = Math.max(10, Math.round(bs*0.45))+'px'; },0); })(btn, swatch2);
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
                imgEl.style.maxWidth = 'none';
                imgEl.style.maxHeight = 'none';
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
                img.style.maxWidth = 'none';
                img.style.maxHeight = 'none';
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
    // ensure some right padding so an external sidebar won't overlap the right-hand row numbers
    container.style.boxSizing = 'border-box';
    container.style.paddingRight = '72px';
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
    // add a slightly larger gap between the main grid and the right-hand numbers
    rightNums.style.marginLeft = '12px';
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

    // walls: render using builder SVGs if available, otherwise fall back to a colored background
    if(type === 'dark wall' || type === 'light wall'){
        var cw_local = el.clientWidth || (Math.floor((document.getElementById('game-area').clientWidth||window.innerWidth)/40));
        var ch_local = el.clientHeight || Math.floor(h / 16);
        var cachedWall = spriteCache[type];
        if(cachedWall){
            var imgEl = cachedWall.cloneNode();
            imgEl.alt = type;
            var size = Math.round(Math.min(cw_local, ch_local) * 0.95);
            imgEl.style.width = size + 'px';
            imgEl.style.height = size + 'px';
            imgEl.style.pointerEvents = 'none';
            el.appendChild(imgEl);
            return;
        } else {
            // fallback: use same colored background as before
            if(type === 'dark wall') el.style.background = '#777';
            else el.style.background = '#888';
            el.textContent = '';
            return;
        }
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
    var selType = elements[key];

    // If clicking with the same selection, toggle clear the cell
    if(current === key){
        // clear cell
        rows[y][x] = ' ';
        // if it was a unique element, clear its stored position
        var curType = elements[current];
        if(curType && singlePos[curType]){
            singlePos[curType].x = -1;
            singlePos[curType].y = -1;
        }
        return;
    }

    // If placing a unique element, remove any existing instance first
    if(selType && singlePos[selType]){
        var prev = singlePos[selType];
        if(prev.x !== -1 && prev.y !== -1){
            rows[prev.y][prev.x] = ' ';
            updateDomCell(prev.x, prev.y);
        }
        rows[y][x] = key;
        singlePos[selType].x = x;
        singlePos[selType].y = y;
        return;
    }

    // If overwriting a unique element with a different key, clear its stored position
    var curType = elements[current];
    if(curType && singlePos[curType]){
        singlePos[curType].x = -1;
        singlePos[curType].y = -1;
    }

    rows[y][x] = key;
}

// Convert client coordinates to grid cell indexes (returns null if outside)
function getGridCoordsFromClient(clientX, clientY){
    var grid = document.getElementById('dom-grid');
    if(!grid) return null;
    var rect = grid.getBoundingClientRect();
    if(clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
    var cellWpx = rect.width / 40;
    var cellHpx = rect.height / 16;
    var x = Math.floor((clientX - rect.left) / cellWpx);
    var y = Math.floor((clientY - rect.top) / cellHpx);
    x = Math.max(0, Math.min(39, x));
    y = Math.max(0, Math.min(15, y));
    return { x: x, y: y };
}

// Paint (set) a cell without toggle behavior. Enforces uniqueness similar to setCell.
function paintCell(x, y, key){
    if(x < 0 || x > 39 || y < 0 || y > 15) return;
    var current = rows[y][x];
    // If painting same visible key, avoid redundant writes
    if(current === key) return;

    // Erase case
    if(key === ' '){
        var curType = elements[current];
        if(curType && singlePos[curType]){
            singlePos[curType].x = -1;
            singlePos[curType].y = -1;
        }
        rows[y][x] = ' ';
        updateDomCell(x, y);
        lastPaintX = x; lastPaintY = y;
        return;
    }

    var selType = elements[key];
    // If placing a unique element, remove any existing instance first
    if(selType && singlePos[selType]){
        var prev = singlePos[selType];
        if(prev.x !== -1 && prev.y !== -1){
            rows[prev.y][prev.x] = ' ';
            updateDomCell(prev.x, prev.y);
        }
        rows[y][x] = key;
        singlePos[selType].x = x;
        singlePos[selType].y = y;
        updateDomCell(x, y);
        lastPaintX = x; lastPaintY = y;
        return;
    }

    // If overwriting a unique element, clear its stored position
    var curType = elements[current];
    if(curType && singlePos[curType]){
        singlePos[curType].x = -1;
        singlePos[curType].y = -1;
    }

    rows[y][x] = key;
    updateDomCell(x, y);
    lastPaintX = x; lastPaintY = y;
}

function paintAtClient(clientX, clientY){
    var pt = getGridCoordsFromClient(clientX, clientY);
    if(!pt) return;
    if(pt.x === lastPaintX && pt.y === lastPaintY) return;
    paintCell(pt.x, pt.y, selectedKey);
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

// Save current level as a local text file (prompts user download)
function saveLevelToFile(){
    var out = exportLevel();
    var filename = (document.getElementById('level-title').value || 'designer-level').replace(/[^a-z0-9_.-]/ig, '_') + '.txt';
    var blob = new Blob([out], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(url); try{ document.body.removeChild(a); } catch(e){} }, 150);
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
        // If there is a site sidebar, reduce its width to half so it doesn't crowd the designer.
        (function halveSidebar(){
            var selectors = ['#sidebar', '.sidebar', 'aside', '.site-sidebar', '.page-sidebar'];
            for(var i=0;i<selectors.length;i++){
                var s = document.querySelector(selectors[i]);
                if(!s) continue;
                try{
                    var cs = window.getComputedStyle(s);
                    var w = parseFloat(cs.width) || 0;
                    if(w <= 0) continue;
                    var newW = Math.max(36, Math.round(w/2));
                    s.style.width = newW + 'px';
                    // if the designer container exists, reduce its right padding to match smaller sidebar
                    var container = document.getElementById('game-area');
                    if(container){ container.style.paddingRight = Math.max(12, Math.round(newW/2)) + 'px'; }
                } catch(e){ /* ignore */ }
                break; // apply to first matching selector only
            }
        })();
        document.getElementById('btn-clear').addEventListener('click', function(){ clearGrid(); });
        document.getElementById('btn-export').addEventListener('click', function(){ openInGame(); });
        // repurpose 'Encode for URL' button as a 'Save to file' download
        var btnSave = document.getElementById('btn-encode-url');
        if(btnSave) btnSave.addEventListener('click', function(){ saveLevelToFile(); });

        // --- Draw/paint handlers (mouse + touch) ---
        // Allow drag-painting while left mouse button is held (or touch held)
        var gridEl = document.getElementById('dom-grid');
        if(gridEl){
            gridEl.addEventListener('mousedown', function(ev){
                if(ev.button !== 0) return; // only left button
                ev.preventDefault();
                isDrawing = true;
                drawingStarted = false;
                lastPaintX = -1; lastPaintY = -1;
                document.body.style.userSelect = 'none';
                // do NOT paint on mousedown so the existing click handler can toggle correctly
            });

            document.addEventListener('mousemove', function(ev){
                if(!isDrawing) return;
                ev.preventDefault();
                drawingStarted = true;
                paintAtClient(ev.clientX, ev.clientY);
            });

            document.addEventListener('mouseup', function(ev){
                if(!isDrawing) return;
                // If user dragged (drawingStarted === true) we've already painted along the path.
                // If drawingStarted === false, do nothing here and allow the cell's click handler
                // to run (it implements the toggle behavior for single clicks).
                isDrawing = false;
                drawingStarted = false;
                lastPaintX = -1; lastPaintY = -1;
                try{ document.body.style.userSelect = ''; } catch(e){}
            });

            // touch support
            gridEl.addEventListener('touchstart', function(ev){
                if(!ev.touches || ev.touches.length === 0) return;
                // preventDefault to avoid generating a synthetic click and to stop scrolling
                ev.preventDefault();
                isDrawing = true;
                drawingStarted = false;
                lastPaintX = -1; lastPaintY = -1;
                document.body.style.userSelect = 'none';
                // do NOT paint immediately; wait for touchmove so taps are handled as taps
            }, { passive: false });

            document.addEventListener('touchmove', function(ev){
                if(!isDrawing) return;
                if(!ev.touches || ev.touches.length === 0) return;
                ev.preventDefault();
                drawingStarted = true;
                var t = ev.touches[0];
                paintAtClient(t.clientX, t.clientY);
            }, { passive: false });

            document.addEventListener('touchend', function(ev){
                if(!isDrawing) return;
                // If the touch did not move (drawingStarted === false), treat this as a tap
                // and set/toggle the touched cell. Use changedTouches[0] for coordinates.
                if(!drawingStarted){
                    var t = (ev.changedTouches && ev.changedTouches[0]) ? ev.changedTouches[0] : null;
                    if(t){
                        var pt = getGridCoordsFromClient(t.clientX, t.clientY);
                        if(pt) { setCell(pt.x, pt.y, selectedKey); updateDomCell(pt.x, pt.y); }
                    }
                }
                isDrawing = false;
                drawingStarted = false;
                lastPaintX = -1; lastPaintY = -1;
                try{ document.body.style.userSelect = ''; } catch(e){}
            });
        }

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
                        var box = b.querySelector('.palette-swatch');
                                if(img){
                                    // size images using our spritePixelSizeForCell helper for parity with game
                                    var dimr = spritePixelSizeForCell((img.alt || ''), cellWpx, cellHpx);
                                    img.style.width = dimr.w + 'px';
                                    img.style.height = dimr.h + 'px';
                                    img.style.maxWidth = 'none';
                                    img.style.maxHeight = 'none';
                                }
                                if(box){
                                            // size the swatch based on the actual button pixel size so it doesn't collapse
                                            var bw = b.clientWidth || cellWpx || 34;
                                            var bh = b.clientHeight || cellHpx || 34;
                                            var boxSize = Math.max(12, Math.round(Math.min(bw, bh) * 0.6));
                                            box.style.width = boxSize + 'px';
                                            box.style.height = boxSize + 'px';
                                        }
                    }
                }
            }
        });
    });
});
