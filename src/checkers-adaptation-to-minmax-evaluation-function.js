// @flow
require('source-map-support').install();

'use strict';

// The rationale behind using this idiom is described in:
//     http://stackoverflow.com/a/36628148/274677
//
if (!global._babelPolyfill) // https://github.com/s-panferov/awesome-typescript-loader/issues/121
    require('babel-polyfill');
// The above is important as Babel only transforms syntax (e.g. arrow functions)
// so you need this in order to support new globals or (in my experience) well-known Symbols, e.g. the following:
//
//     console.log(Object[Symbol.hasInstance]);
//
// ... will print 'undefined' without the the babel-polyfill being required.



import {assert} from 'chai';
import _      from 'lodash';

import {minmax} from 'minmax-wt-alpha-beta-pruning';

import {Point, Vector, Rectangle} from 'geometry-2d';

import type {Exact} from 'flow-common-types';


import type {
    IGameRules, EvaluateFT, ListMovesFT, MinMaxFT, TMinMaxResult
} from 'minmax-wt-alpha-beta-pruning';

import {ASNU, IBlowUp} from './util.js';

import {MovePath, Board, PieceOnBoard, Piece, Man, King} from './checkers.js';

import {GameState} from './checkers-adaptation-to-minmax.js';

/*

This evaluator function evaluates positions in the standard English Checkers 8X8 board only.
The below diagram shows the starting position. 'X' signs mark where Men go. Observe that
each side has an empty square on its bottom right corner. Empty squares are traditionally
light coloured as both sides move on the dark squares (this library has no concept of the
colour of the squares which is simply a visual aid for human players).

Dark side

 . X . X . X . X
 X . X . X . X .
 . X . X . X . X
 . . . . . . . .
 . . . . . . . .
 X . X . X . X .
 . X . X . X . X
 X . X . X . X .

Light side


The Dark side moves first.

The evaluator factory function "createEvaluator" creates an evaluation function that simply calculates the material score of each side
and also applies positional premiums (multipliers). The "createEvaluator" expects four arguments:

* material value of a Man
* material value of a King
* an array containing 7 arrays each containing 4 numbers. These 28 (in total numbers) correspond to the positional
  multipliers for Men of the light side. Note you only need 7 arrays, and not 8 as you cannot have a man on the 8th rank.
* an array containing 4 arrays each containing 4 numbers. This array provides the multipliers for the Kings of
  the light side for rows 1 up to 4. For rows 5 up to 8 the mirror values are used. The idea here is that Kings move
  freely about the board, so we take advantage of symmetry. We could be more nuanced if we wanted to but we don't.
 
Given the symmetry between the Light and Dark sides, the exact same positional multipliers are also applied to the Dark
side (rotated and flipped of course).

E.g. some reasonable values are the following:

* material value of a Man: 1
* material value of a King: 4
* positional multipliers for Men: [[2.2 2.5 2.5 2.5] [1 1 1 2] [2 2 2 1] [1.5 2.5 2 2.2] [2 2 2.5 1] [2 3 3 3] [3.7 3.5 3.5 3.5]]
* positional multipliers for Kings:  [[1 1 1 1] [1 1 1 2] [2 2 2 1] [1 2.5 2.5 2.7]]

The above gives this positional multipliers situation for the Men of the Light side:

TODO: I am left here, to write some utility functions to dump the positional multipliers and do the necessary
flipping and rotating. Maybe I should write another package to flip and rotate those arrays around ...


FIG. 1 - EXAMPLE POSITIONAL MULTIPLIERS FOR MEN OF
         THE LIGHT SIDE (FLIPPED FOR THE DARK)

+---+---+---+---+---+---+---+---+
|   |   |   |   |   |   |   |   |
+---+---+---+---+---+---+---+---+
|3.7|   |3.5|   |3.5|   |3.5|   |  ( array 6 )
+---+---+---+---+---+---+---+---+
|   | 2 |   | 3 |   | 3 |   | 3 |  ( array 5 )
+---+---+---+---+---+---+---+---+
| 2 |   | 2 |   |2.5|   | 1 |   |  ( array 4 )
+---+---+---+---+---+---+---+---+
|   |1.5|   |2.5|   | 2 |   |2.2|  ( array 3 )
+---+---+---+---+---+---+---+---+
| 2 |   | 2 |   | 2 |   | 1 |   |  ( array 2 )
+---+---+---+---+---+---+---+---+
|   | 1 |   | 1 |   | 1 |   | 2 |  ( array 1 )
+---+---+---+---+---+---+---+---+
|2.2|   |2.5|   |2.5|   |2.5|   |  ( array 0 )
+---+---+---+---+---+---+---+---+


FIG. 2 - EXAMPLE POSITIONAL MULTIPLIERS FOR KINGS OF
         THE LIGHT SIDE (FLIPPED FOR THE DARK)

+---+---+---+---+---+---+---+---+
|   |   |   |   |   |   |   |   |  ( array 0 flipped )
+---+---+---+---+---+---+---+---+
|   |   |   |   |   |   |   |   |  ( array 1 flipped )
+---+---+---+---+---+---+---+---+
|   |   |   |   |   |   |   |   |  ( array 2 flipped )
+---+---+---+---+---+---+---+---+
|   |   |   |   |   |   |   |   |  ( array 3 flipped )
+---+---+---+---+---+---+---+---+
|   |   |   |   |   |   |   |   |  ( array 3 )
+---+---+---+---+---+---+---+---+
|   |   |   |   |   |   |   |   |  ( array 2 )
+---+---+---+---+---+---+---+---+
|   |   |   |   |   |   |   |   |  ( array 1 )
+---+---+---+---+---+---+---+---+
|   |   |   |   |   |   |   |   |  ( array 0 )
+---+---+---+---+---+---+---+---+





*/

function createEvaluator(manValue: number, kingValue: number, positionalPremiums: Array<Array<?number>>): EvaluateFT<GameState> {

    return evaluate;

}



function pieceMaterialValue(pc: Piece): number {
    if (pc instanceof Man)
        return 1;
    else if (pc instanceof Man)
        return 3;
    else
        return IBlowUp(-1, `unrecognized piece: ${pc.constructor.name}`);
}


function materialValue(pieces: Array<PieceOnBoard>): number {
    return pieces.reduce(function (accum, current) {
        if (current.pc instanceof Man)
            return accum+1;
        else if (current.pc instanceof Man)
            return accum+2;
        else
            return IBlowUp(-1, `unrecognized piece: ${current.pc.constructor.name}`);
    }, 0);
}

function evaluate(gs: GameState): number {
    const piecesOfMovingSide   : Array<PieceOnBoard> = gs.board.allPiecesOfSide( gs.lightSideMoving);
    const piecesOfTheOtherSide : Array<PieceOnBoard> = gs.board.allPiecesOfSide(!gs.lightSideMoving);
    const diffInMaterialInFavorOfMovingSide = materialValue(piecesOfMovingSide) - materialValue(piecesOfTheOtherSide);
    return diffInMaterialInFavorOfMovingSide;
}

(evaluate: EvaluateFT<GameState>)



exports.evaluate  = evaluate;



