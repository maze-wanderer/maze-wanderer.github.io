
# TO DO:

## Game play

- move to recursive logic for triggering of some object interactions. More distant interactions are queued?
    - arrows passing directly underneath boulders trip immediately (recursively)
- boulder rules for trigger prioritisation
- implement monsters
    - big monsters chase
    - baby monsters follow maze left?

## Style

- svg boulder


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
