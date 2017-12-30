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

const EOL: string = require('os').EOL;



import type {
    IGameRules, EvaluateFT, ListMovesFT, MinMaxFT, TMinMaxResult
} from 'minmax-wt-alpha-beta-pruning';

import {ASNU, IBlowUp} from './util.js';

function diagonalDistance(pn1: Point, pn2: Point): number {
    const v: Vector = new Vector(pn1, pn2);
    const xDelta = Math.abs(v.xDelta());
    const yDelta = Math.abs(v.yDelta());
    assert.strictEqual(xDelta, yDelta);
    return xDelta;
}

class MovePath {
    // a move path is a sequence of points
    /* TODO: I have to write certain assertions:
       (a) for slide moves there is only one element and it should be adjacent to the point the piece is on
       (b) for jump moves the distance between the points should always be exactly 2
    */

    points: Array<Point>;

    constructor(points: Array<Point>) {
        this.points = points;
    }

    toString(): string {
        return this.points.join(', ');
    }
}

class PieceOnBoard {
    b : Board;
    p : Point;
    pc: Piece;


    constructor(b: Board, p: Point, pc: Piece) {
        this.b = b;
        this.p = p;
        this.pc = pc;
    }

    translateOffsets(offsets: Array<Point>) {
        return offsets.map( offset=>this.p.add(offset) );
    }
    possibleMovePaths(): Array<MovePath> {
        const rv: Array<MovePath> = [];

        const possibleJumpMovePaths: Array<MovePath> = this.possibleJumpMovePaths();
        if (possibleJumpMovePaths.length > 0) // English draughts (and most Draughts variants I am aware of): if it is possible to jump, then you *must* jump
            return possibleJumpMovePaths;
        else {
            Array.prototype.push.apply(rv, possibleJumpMovePaths);
            const possibleSlideMovePaths: Array<MovePath> = this.possibleSlideMovePaths();
//  console.log(`possible slides: #${possibleSlideMovePaths.length}`);

    //   console.log(`possible jumps: #${possibleJumpMovePaths.length}`);
            //  console.log(possibleJumpMovePaths[0]);
            Array.prototype.push.apply(rv, possibleSlideMovePaths);
            return rv;
        }
    }
    possibleSlideMovePaths(): Array<MovePath> {
        return this.possibleSlides().map(p=>new MovePath([p]));
    }
    possibleJumpMovePaths(): Array<MovePath> {
        return jumpMoves(this.b, this.p);
    }    
    possibleSlides(): Array<Point> {
        const slidePoints: Array<Point> = this.translateOffsets(this.pc.possibleSlideOffsets());
        return slidePoints.filter(point=>this.b.pointLiesInsideAndIsEmpty(point));
    }
    possibleJumps(): Array<Point> {
        const jumpLandingPoints: Array<Point> = this.translateOffsets(this.pc.possibleJumpOffsets());
        return jumpLandingPoints.filter(jumpTo=>this.b.isJumpValid(this.p, jumpTo));
    }
    canMove(): boolean {
        if (this.possibleSlides().length>0)
            return true;
        else
            return (this.possibleJumps().length>0);
    }
}

class Piece {
    isLightSide: boolean; // the light side is assumed to be the side whose pieces advance towards greater y-coordinates on the board.
    constructor(isLightSide: boolean) {
        this.isLightSide = isLightSide;
    }
    possibleSlideOffsets(): Array<Point> {
        throw new Error('abstract in base class');
    }
    possibleJumpOffsets(): Array<Point> {
        throw new Error('abstract in base class');
    }
}



function jumpMoves(board: Board, from: Point): Array<MovePath> {


    const rv: Array<MovePath> = [];

    function _jumpMoves(accum: Array<Point>, board: Board, from: Point): void {
        const piece: ?PieceOnBoard = board.pieceOnCell(from);
        if (piece!=null) {
            const landingPoints:Array<Point> = piece.possibleJumps();
            if (landingPoints.length>0) { // the path has not ended yet, there's more jumps to be made and we *have* to make them (this is the English version of Checkers (draughts), not the Polish / International version
                for (let i = 0; i < landingPoints.length; i++) { // we recurse on each of the possible jumps
                    _jumpMoves(accum.concat(landingPoints[i]),
                               board.jump(from, landingPoints[i]),
                               landingPoints[i]);
                }
            } else {
                if (accum.length>0)
                    rv.push(new MovePath(accum)); // no more jumps on this path, no more recursion we can supply a completed MovePath
            }
        } else
            throw new Error(`bug, point 'from': ${from.toString()} is apparently empty in the following board:\n${board.toString()}\n... yet was asked to jump from it`);
    }
    
    _jumpMoves([], board, from);
    return rv;
}


function pointJumpedOver(from: Point, to: Point) {
    assert.isTrue( (Math.abs(from.x-to.x)===2) &&  (Math.abs(from.y-to.y)===2) );
    return new Point((from.x+to.x)/2, (from.y+to.y)/2);
}


class Man extends Piece {
    constructor(isLightSide: boolean) {
        super(isLightSide);

    }
    possibleSlideOffsets(): Array<Point> {
        return [
            new Point(-1, this.isLightSide?+1:-1),
            new Point(+1, this.isLightSide?+1:-1)
        ];
    }
    possibleJumpOffsets(): Array<Point> {
        return [
            new Point(-2, this.isLightSide?+2:-2),
            new Point(+2, this.isLightSide?+2:-2)
        ];
    }
    toString(): string {
        return this.isLightSide?'M':'m';
    }
}



class King extends Piece {
    constructor(isLightSide: boolean) {
        super(isLightSide);
    }
    possibleSlideOffsets(): Array<Point> {
        return [
            new Point(-1, +1),
            new Point(+1, +1),
            new Point(-1, -1),
            new Point(+1, -1)
        ];
    }
    possibleJumpOffsets(): Array<Point> {
        return [
            new Point(-2, +2),
            new Point(+2, +2),
            new Point(-2, -2),
            new Point(+2, -2)
        ];
    }
    toString(): string {
        return this.isLightSide?'K':'k';
    }    
}

const KING_LIGHT_SIDE = new King(true);
const KING_DARK_SIDE  = new King(false);
const MAN_LIGHT_SIDE  = new Man (true);
const MAN_DARK_SIDE   = new Man (false);

function pieceFromChar(s: string): Piece {
    assert.isTrue(s.length===1);
    switch (s) {
    case 'k': return KING_DARK_SIDE;
    case 'K': return KING_LIGHT_SIDE;
    case 'm': return MAN_DARK_SIDE;
    case 'M': return MAN_LIGHT_SIDE;
    default:
        throw new Error(`unhandled piece: [${s}]`); 
    }
}


// TODO: upgrade to the latest flow bin


export type PieceOnBoardAndIndex = Exact<{piece: PieceOnBoard, index: number}>

/**
 * The board is viewed as laid down on Cartesian space, not screen space.
 * E.g. greater y values are considered to be 'higher'. So the Men of the 'light side' proceed
 * towards higher y values.
 * Translate for screen just prior to rendering.
 *
 */
class Board {
    rect: Rectangle;
    pieces: Array<PieceOnBoard>;
    constructor(width: number, height: number, pieces: Array<PieceOnBoard>) {
        this.rect = new Rectangle(new Point(0,height-1), new Point(width-1, 0));
        this.pieces = pieces;
    }
    width(): number {
            // $SuppressFlowFinding:        
        return this.rect.widthAsCellSystem();
    }
    height(): number {
            // $SuppressFlowFinding:        
        return this.rect.heightAsCellSystem();
    }
    clone(): Board {
        const rv: Board = new Board(this.width(), this.height(), []);
        for (let i = 0; i < this.pieces.length; i++) {
            const newPieceOnBoard = new PieceOnBoard(rv
                                                     , new Point(this.pieces[i].p.x
                                                                 ,this.pieces[i].p.y)
                                                     , this.pieces[i].pc);
            rv.pieces.push(newPieceOnBoard);
        }
        return rv;
    }
    pieceOnCell(p: Point): ?PieceOnBoard {
        assert.isTrue(this.pointLiesInside(p));
        for (let i = 0; i < this.pieces.length; i++)
            if (this.pieces[i].p.equals(p))
                return this.pieces[i];
        return null;
    }
    allPiecesOfSide(lightSide: boolean): Array<PieceOnBoard> {
        const rv: Array<PieceOnBoard> = [];
        for (let i = 0; i < this.rect.widthAsCellSystem(); i++)
            for (let j = 0; j < this.rect.heightAsCellSystem() ; j++) {
                const piece: ?PieceOnBoard = this.pieceOnCell(new Point(i, j));
                if (piece!=null) {
                    if (piece.pc.isLightSide === lightSide)
                        rv.push(piece);
                } else
                    ASNU(piece);
            }
        return rv;
    }
    pieceOnCellAndIndex(p: Point): PieceOnBoardAndIndex {
        assert.isTrue(this.pointLiesInside(p));
        for (let i = 0; i < this.pieces.length; i++)
            if (this.pieces[i].p.equals(p))
                return {piece: this.pieces[i], index: i};
        assert.fail(0, 1, 'not found');
        return IBlowUp({piece: this.pieces[-1], index: -1});
    }
    isCellEmpty(p: Point): boolean {
        const pieceMaybe: ?PieceOnBoard = this.pieceOnCell(p);
        if (pieceMaybe===null)
            return true;
        else {
            assert.isTrue(pieceMaybe!==undefined);
            return false;
        }
    }
    squaresHostOppositeSidePieces(p1: Point, p2: Point): boolean {
        if (this.isCellEmpty(p1) || this.isCellEmpty(p2))
            return false;
        else {
            const pc1: ?PieceOnBoard = this.pieceOnCell(p1);
            const pc2: ?PieceOnBoard = this.pieceOnCell(p2);
            if ((pc1!=null) && (pc2!=null)) {
                return pc1.pc.isLightSide===!pc2.pc.isLightSide;
            } else {
                assert.fail(0, 1, "impossible at this stage! We've already checked that the squares are not empty");
                return false; // only to satisfy flowtype
            }
        }
    }
    pointLiesInside(p: Point): boolean {
        return this.rect.pointLiesInside(p);
    }

    pointLiesInsideAndIsEmpty(p: Point): boolean {
        return this.pointLiesInside(p) && this.isCellEmpty(p);
    }

    // non-mutating
    eliminateAt(p: Point): Board {
        const rv: Board = this.clone();
        rv.EliminateAt(p);
        return rv;
     }
    // mutating
    EliminateAt(p: Point): void {
        let iPos: ?number = null;
        for (let i = 0; i < this.pieces.length; i++) {
            if (this.pieces[i].p.equals(p)) {
                assert.isNull(iPos, 'impossible to find two pieces on the same point');
                iPos = i;
            }
        }
        if (iPos!=null)
            this.pieces.splice(iPos, 1);
        else {
            ASNU(iPos);
            throw new Error(`no piece found at ${p.toString()}`);
        }

    }

    jump(from: Point, to: Point): Board {
        const rv: Board = this.clone();
        rv.Jump(from, to);
        return rv;
    }
    
    // mutating ! does not account for promotion! (see Slide)
    Jump(from: Point, to: Point): void {
        assert.isTrue(this.isJumpValid(from, to));
        const pieceThatGotJumpedOver = this.pieceThatGotJumpedOver(from, to);
        if (pieceThatGotJumpedOver!=null) {
            this.EliminateAt(pieceThatGotJumpedOver.p);
            this.Slide(from, to);
        } else {
            ASNU(pieceThatGotJumpedOver);
            throw new Error('impossible');
        }
    }
    // mutating ! does not account for promotion! A single jump (jumps are implemented as an elimination and a slide) may be part of a longer chain and the piece is promoted only if it rests on the far side at the end of all jumps!
    Slide(from: Point, to: Point): void {
        assert.isFalse(this.isCellEmpty(from));
        assert.isTrue (this.isCellEmpty(to));
        const pc: ?PieceOnBoard = this.pieceOnCell(from);
        if (pc!=null) {
            pc.p = to;
        } else {
            ASNU(pc);
            throw new Error('impossible');
        }
    }

    isJumpValid(from: Point, to: Point): boolean {
        return ASNU(this.pieceThatGotJumpedOver(from, to))!==null;
    }
    pieceThatGotJumpedOver(from: Point, to: Point): ?PieceOnBoard { // if 'from'->'to' is a valid jump return the piece that got jumped over; null otherwise
        assert.isTrue (this.pointLiesInside(from));
        assert.isFalse(this.isCellEmpty  (from));
        const vector: Vector = new Vector(from, to);
        assert.isTrue( (Math.abs(vector.xDelta())==2) && // in Checkers we don't have long jumps
                       (Math.abs(vector.yDelta())==2) );
        const midWay: Point = new Point( (from.x+to.x)/2, (from.y+to.y)/2 );
        if (!this.pointLiesInside(to))
            return null;
        else if (!this.isCellEmpty(to))
            return null;
        else if ( this.isCellEmpty(midWay))
            return null;
        else {
            const jumpingPiece:       ?PieceOnBoard = this.pieceOnCell(from);
            if (jumpingPiece!=null) {
                const pieceGettingJumped: ?PieceOnBoard = this.pieceOnCell(midWay);
                if (pieceGettingJumped!=null) {
                    if (jumpingPiece.pc.isLightSide===!pieceGettingJumped.pc.isLightSide)
                        return pieceGettingJumped;
                    else
                        return null;
                } else
                    assert.fail(0, 1, "Impossible. If midWay is empty I should have already returned false");
            } else
                assert.fail(0, 1, "Impossible. I've already asserted that the 'from' square is not empty");
        }
    }

    // non-mutating
    effectMove(pn: Point, mv: MovePath): Board {
        const rv: Board = this.clone();
        rv.EffectMove(pn, mv);
        return rv;
    }

    // mutating
    EffectMove(pn: Point, mv: MovePath): void {
        assert.isFalse(this.isCellEmpty(pn));
        for (let i = 0; i < mv.points.length ; i++) {
            const from: Point = i===0?pn:mv.points[i-1];
            const dd: number = diagonalDistance(from, mv.points[i]);
            assert.isTrue((dd===1)||(dd==2)); // it's either a slide or a jump
            if (dd===1) {
                assert.isTrue(mv.points.length===1); // if it's a slide there can be only one move segment
                assert.isTrue(this.isCellEmpty(mv.points[i]));
                this.Slide(from, mv.points[i]);
            } else { // it's a jump
                this.Jump(from,  mv.points[i]);
            }
        }
        // all move segments concluded, we now need to check for promotion
        const lastPoint: Point = mv.points[mv.points.length-1];
        const piece: ?PieceOnBoard = this.pieceOnCell(lastPoint);
        if (piece!=null) {
            if ((lastPoint.y===(piece.pc.isLightSide?this.height()-1:0))
                && (piece.pc instanceof Man))
                this.Promote(lastPoint);
        } else {
            ASNU(piece);
            throw new Error('impossible');
        }
    }

    // mutating
    Promote(pn: Point) {
        const pc: PieceOnBoardAndIndex = this.pieceOnCellAndIndex(pn);
        assert.isTrue(pc.piece.pc instanceof Man);
        this.pieces.splice(pc.index, 1);
        this.pieces.push(new PieceOnBoard(this, pn, pc.piece.pc===MAN_LIGHT_SIDE?KING_LIGHT_SIDE:KING_DARK_SIDE));
    }

    

    
    cellToString(p: Point): string { // TODO: consistently use cell everywhere (or point or square, just make up your mind)
        if (this.isCellEmpty(p))
            return ".";
        else {
            const pc: ?PieceOnBoard = this.pieceOnCell(p);
            if (pc!=null) {
                return pc.pc.toString();
            } else
                return IBlowUp(`Impossible. In this branch, I've already checked that the square ${p.toString()} is not empty`);
        }
    }

    toString(): string {
        const rv = [];
        // $SuppressFlowFinding:        
        for (let j = this.rect.height(); j >=0 ; j--) {
            let line = ''; 
            // $SuppressFlowFinding:
            for (let i = 0; i <= this.rect.width(); i++)
                line = line.concat(this.cellToString(new Point(i, j)));
            rv.push(line);
        }
        return rv.join(EOL);
    }
}


/*
 It's regrettably not possible to extend Error in Babel. See:

    - http://babeljs.io/docs/usage/caveats/#classes
    - https://stackoverflow.com/a/871646/274677

 .. so we have to use the primordial way using function prototypes (but that doesn't work so well with Flow)
 Therefore I am left only with the option of creating my own classes that do not extend Error.
 

 */

class BoardSpecificationError {}

class JaggedLinesError extends BoardSpecificationError {
    expecting: number;
    found: number;
    offendingLine: number;
    constructor(expecting: number, found: number, offendingLine: number) {
        super();
        this.expecting     = expecting;
        this.found         = found;
        this.offendingLine = offendingLine;
    }
}


class UnrecognizedCharacter extends BoardSpecificationError {
    lineNum: number;
    linePos: number;
    offendingCharacter: string;
    constructor (lineNum: number, linePos: number, offendingCharacter: string) {
        super();        
        this.lineNum            = lineNum;
        this.linePos            = linePos;
        this.offendingCharacter = offendingCharacter;
    }
}

class UnexpectedCheckeredPattern extends BoardSpecificationError {
    patternEstablished: boolean;
    patternEncountered: boolean;
    offendingI        : number;
    offendingJ        : number;

    constructor(patternEstablished: boolean, patternEncountered: boolean, offendingI: number, offendingJ: number) {
        super();        
        this.patternEstablished = patternEstablished;
        this.patternEncountered = patternEncountered;
        this.offendingI         = offendingI;
        this.offendingJ         = offendingJ;
    }
}


function boardFromString(_s: string): Board {
    const s: string = _s.trim();
    /* Requirements:
       [1] must correspond to a perfect rectangle
       [2] only empty spaces and men (m, M) and kings (k, K) of both sides are allowed
       [3] all pieces must be placed on either 'dark' or 'light' squares of the board (i.e. in a checkered pattern)
     */
    const lines: Array<string> = s.split(EOL);
    const Y: number = lines.length;
    let X: ?number = null;
    let checkeredPattern: ?boolean = null; // the checkered pattern is simply whether the absolute value of the difference i-j is odd or even
    let board : ?Board = null;
    for (let j = 0 ; j < Y ; j++) {
        const lengthOfThisLine: number = lines[j].length;
        if (X===null)
            X = lengthOfThisLine;
        if (X!=null) {
            ASNU(X);
            if (lengthOfThisLine!==X)
                throw new JaggedLinesError(X, lengthOfThisLine, j);
            else {
                if (board===null)
                    board = new Board(X, Y, []); // at this point we've established the putative dimensions (if the string is well-formed) and so we can create an empty board to start populating it with pieces.
                if (board!=null) {
                    for (let i = 0; i < X; i++) {
                        if (! ['.', 'm', 'M', 'k', 'K'].includes(lines[j][i]))
                            throw new UnrecognizedCharacter(j, i, lines[j][i]);
                        else {
                            if (lines[j][i]!=='.') {
                                const patternObserved = Math.abs(i-j)%2===0;
                                if (checkeredPattern===null)
                                    checkeredPattern = patternObserved;
                                if (checkeredPattern!=null) {
                                    ASNU(checkeredPattern);
                                    if (checkeredPattern!==patternObserved)
                                        throw new UnexpectedCheckeredPattern(checkeredPattern, patternObserved, i, j);
                                    else {
                                        // at this point we can create a new piece
                                        const pc: Piece = pieceFromChar(lines[j][i]);
                                        const pcOnB: PieceOnBoard = new PieceOnBoard(board, new Point(i, Y-j-1), pc);
                                        board.pieces.push(pcOnB);
                                    }
                                } else {
                                    throw new IBlowUp(0, 'impossible for checkeredPattern to still be null at this point');
                                }
                            }
                        }
                    }
                } else {
                    ASNU(board);
                    throw new IBlowUp(0, 'impossible for the board to be null at this point');
                }
            }
        } else
            throw new IBlowUp(0, 'impossible for X to still be null at this point');
    }
    if (board != null) {
        // $SuppressFlowFinding:        
        assert.strictEqual(X, board.rect.widthAsCellSystem());
        // $SuppressFlowFinding:        
        assert.strictEqual(Y, board.rect.heightAsCellSystem());
        return board;
    } else {
        ASNU(board);
        return IBlowUp(new Board(0, 0, []), "at this point it's impossible for the board to be null");
    }
}



// private exports (only used by testing code):
exports.BoardSpecificationError = BoardSpecificationError;
exports.JaggedLinesError = JaggedLinesError;
exports.boardFromString  = boardFromString;
exports.UnrecognizedCharacter = UnrecognizedCharacter;
exports.UnexpectedCheckeredPattern = UnexpectedCheckeredPattern;
exports.MovePath = MovePath;
// public exports: 
    
exports.Piece = Piece;
exports.Man   = Man;
exports.King  = King;
exports.PieceOnBoard = PieceOnBoard;
exports.Board = Board;

