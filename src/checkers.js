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


import type {
    IGameRules, EvaluateFT, ListMovesFT, MinMaxFT, TMinMaxResult
} from 'minmax-wt-alpha-beta-pruning';

import {ASNU} from './util.js';


class Piece {
    p: Point;
    sideA: boolean; // side 'A' is assumed to be the side whose pieces advance towards greater y-coordinates on the board (the 'light' side). If false, then this piece belongs to side 'B' (the 'dark' side).
    constructor(p: Point, sideA: boolean) {
        this.p = p;
        this.sideA = sideA;
    }
    moves(board: Board): Array<MovePath> {
        return pieceMoves(board, this);
    }    
}


class MovePath {
    // a move path is a sequence of points

    points: Array<Point>;

    constructor(points: Array<Point>) {
        this.points = points;
    }
}


function pieceMoves(board: Board, pc: Piece): Array<MovePath> {
    const rv: Array<MovePath> = [];
    Array.prototype.push.apply(rv, slideMoves(board, pc));
    Array.prototype.push.apply(rv, jumpMoves (board, pc));
    return rv;
}

function jumpMoves(board: Board, pc: Piece): Array<MovePath> {
    const rv: Array<MovePath> = [];


    function landingAfterJumpMaybe(from: Point, p: Point): ?Point {
        if (board.squaresHostOppositeSidePieces(from, p)) {
            const jump: Vector = (new Vector(from, p)).scalarMul(2); // this is correct as we are implementing the English / American version of checkers and not the international Polish version. As such, the jump is always of distance 2.
            const landing: Point = from.add(jump.asFreeVector());
            if (board.pointLiesInside(landing) && (board.isSquareEmpty(landing)))
                return landing;
        } else
            return null;
    }


//    TODO: move the calculation of the slide points and pivot points in the Man and King classes
    
    function _jumpMoves(accum: Array<Point>, from: Point) {
        const DW: Point = from.add(new Point(-1, pc.sideA?+1:-1)); // diagonal west
        const DE: Point = from.add(new Point(+1, pc.sideA?+1:-1)); // diagonal east

        const canMakeNoFurtherJump: boolean = true; // TODO
        if (canMakeNoFurtherJump)
            rv.push(new MovePath(accum));
        else {
            [DW, DE].forEach(function (candidateJumpPivot) {
                const landingAfterJumpPoint: ?Point = ASNU(landingAfterJumpMaybe(from, candidateJumpPivot));
                if (landingAfterJumpPoint!=null) {
                    _jumpMoves(accum.concat(landingAfterJumpPoint), landingAfterJumpPoint);
                }
            });
        }
    }
    
    _jumpMoves([], pc.p);
    return rv;
}

function slideMoves(board: Board, pc: Piece): Array<MovePath> {
    const rv: Array<MovePath> = [];
    const DFW: Point = pc.p.add(new Point(-1, pc.sideA?+1:-1)); // diagonal forward west
    const DFE: Point = pc.p.add(new Point(+1, pc.sideA?+1:-1)); // diagonal forward east
    const DBW: Point = pc.p.add(new Point(-1, pc.sideA?-1:+1)); // diagonal backward west
    const DBE: Point = pc.p.add(new Point(+1, pc.sideA?-1:+1)); // diagonal backward east    

    const candidateSlidePoints: Array<Point> = [DFW, DFE];
    if (pc instanceof King) {
        Array.prototype.push.apply(candidateSlidePoints, [DBW, DBE]);
    }
    candidateSlidePoints.forEach(function (candidateSlidePoint: Point) {
        if (board.pointLiesInsideAndIsEmpty(candidateSlidePoint))
            rv.push(new MovePath([candidateSlidePoint]));
    });

    return rv;
}
    
class Man extends Piece {
    constructor(p: Point, sideA: boolean) {
        super(p, sideA);

    }
}



class King extends Piece {
    constructor(p: Point, sideA: boolean) {
        super(p, sideA);
    }
}

// TODO: upgrade to the latest flow bin

class Board {
    rect: Rectangle;
    pieces: Array<Piece>;
    constructor(width: number, height: number, pieces: Array<Piece>) {
        this.rect = new Rectangle(new Point(0,height-1), new Point(width-1, 0));
        this.pieces = pieces;
    }
    pieceOnSquare(p: Point): ?Piece {
        return null;
    }
    isSquareEmpty(p: Point): boolean {
        const pieceMaybe: ?Piece = this.pieceOnSquare(p);
        if (pieceMaybe===null)
            return true;
        else {
            assert.isTrue(pieceMaybe!==undefined);
            return false;
        }
    }
    squaresHostOppositeSidePieces(p1: Point, p2: Point): boolean {
        if (this.isSquareEmpty(p1) || this.isSquareEmpty(p2))
            return false;
        else {
            const pc1: ?Piece = this.pieceOnSquare(p1);
            const pc2: ?Piece = this.pieceOnSquare(p2);
            if ((pc1!=null) && (pc2!=null)) {
                return pc1.sideA===!pc2.sideA;
            } else {
                assert.fail(0, 0, "impossible at this stage! We've already checked that the squares are not empty");
                return false; // only to satisfy flowtype
            }
        }
    }
    pointLiesInside(p: Point): boolean {
        return this.rect.pointLiesInside(p);
    }

    pointLiesInsideAndIsEmpty(p: Point): boolean {
        return this.pointLiesInside(p) && this.isSquareEmpty(p);
    }
}
