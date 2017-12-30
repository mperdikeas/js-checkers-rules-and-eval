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
    IGameRules, EvaluateFT, ListMovesFT, MinMaxFT, TMinMaxResult, NextStateFT
} from 'minmax-wt-alpha-beta-pruning';

import {ASNU, IBlowUp} from './util.js';

import {MovePath, Board, PieceOnBoard} from './checkers.js';


class GameState {
    board: Board;
    lightSideMoving: boolean;

    constructor(board: Board, lightSideMoving: boolean) {
        this.board = board;
        this.lightSideMoving = lightSideMoving;
    }
    allPiecesOfMovingSide(): Array<PieceOnBoard> {
        return this.board.allPiecesOfSide(this.lightSideMoving);
    }
}

class PointAndMovePath {
    point: Point;
    movePath: MovePath;

    constructor(point: Point, movePath: MovePath) {
        this.point = point;
        this.movePath = movePath;
    }
    includesJump(): boolean {
        let lastPoint: Point = this.point;
        for (let i = 0; i < this.movePath.points.length; i++) {
            if (!lastPoint.equalsWithin(this.movePath.points[i], 1))
                return true;
            lastPoint = this.movePath.points[i];
        }
        return false;
    }
}

function nextState(gs: GameState, pmvp: PointAndMovePath): GameState {
    const newGameBoard: Board = gs.board.effectMove(pmvp.point, pmvp.movePath);
    return new GameState(newGameBoard, !gs.lightSideMoving);
}

(nextState: NextStateFT<GameState, PointAndMovePath>)

function listMoves(gs: GameState): Array<PointAndMovePath> {
    const rv: Array<PointAndMovePath> = [];
    const pieces: Array<PieceOnBoard> = gs.allPiecesOfMovingSide();
    for (let i = 0; i < pieces.length ; i++) {
        const moves: Array<MovePath> = pieces[i].possibleMovePaths();
        for (let m = 0; m < moves.length; m ++) {
            rv.push(new PointAndMovePath(pieces[i].p, moves[m]));
        }
    }
    // Instead of using a straightforward loop, show-off by using reduce.
    const jumpDetected: boolean = rv.reduce(function(accum, current) {
        if (accum)
            return true;
        else {
            if (current.includesJump())
                return true;
            else
                return accum;
        }
    }, false);
    if (!jumpDetected) // if at least one move is a jump then remove all moves that are not jumps (English Draughts rules: jumping is mandatory if a jump can be made)
        return rv;
    else
        return rv.filter((x)=>x.includesJump());
}

function terminalStateEval(gs: GameState): ?number {
    const pieces: Array<PieceOnBoard> = gs.allPiecesOfMovingSide();
    if (pieces.length===0)
        return Number.NEGATIVE_INFINITY; // we have no pieces left, hence, we lost the game
    for (let i = 0; i < pieces.length ; i++)
        if (pieces[i].canMove())
            return null; // if at least one of our pieces can make a move, then the state is not terminal
    return Number.NEGATIVE_INFINITY; // none of our pieces may move (they're all blocked), hence, we lost the game
}

(listMoves: ListMovesFT<GameState, PointAndMovePath>)

const gameRules: IGameRules<GameState, PointAndMovePath> = {
    listMoves: listMoves,
    nextState: nextState,
    terminalStateEval: terminalStateEval
};




exports.gameRules = gameRules;
exports.GameState = GameState;
exports.PointAndMovePath = PointAndMovePath;


