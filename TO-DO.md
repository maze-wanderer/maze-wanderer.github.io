
# TO DO:

## level design screen
- 1 level design screen. 1 level test screen (hash arg) 
- menu for selecting current object
- click to place. again to remove/replace
- launch button open current spec in test screen

## Game play

- move to recursive logic for triggering of some object interactions. More distant interactions are queued?
- arrows passing directly underneath boulders trip immediately (recursively)
- prioritisation of boulder triggering remains unclear 
- baby monsters pass through dirt presumably not intended
- game crashes when big monsters meet bombs

## Style

- nothing outstanding


-------------------------------------------------------------


{ "    O  Boulder",
"  < >  Arrows",
"    ^  Balloon",
"    :  Earth",
"    !  Landmine",
"    *  Treasure",
"  / \\  Deflectors",
"    +  Cage",
"_ = #  Rock (# indestructable)",
"    T  Teleport",
"    A  Arrival (1 max)",
"    X  Exit (always 1)",
"    @  Start (always 1)",
"    M  Big Monster (1 max)",
"    S  Baby Monster",
"    -  Alternative space",
"    C  Time Capsule",
"    ~  Thingy",
"    B  Bomb",
NULL }
