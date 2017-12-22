// @flow
require('source-map-support').install();
import 'babel-polyfill';
import {assert} from 'chai';
import AssertionError  from 'assertion-error';
assert.isOk(AssertionError);


/*const assert = require('chai').assert;
 const AssertionError = require('assertion-error');
 */

import _ from 'lodash';

import {Point} from 'geometry-2d';
import {Board} from '../src/index.js';
import {BoardSpecificationError, JaggedLinesError, UnrecognizedCharacter, UnexpectedCheckeredPattern, boardFromString, PieceOnBoard, MovePath} from '../src/checkers.js';
import {ASNU, areDeeplyEqual} from '../src/util.js';

assert.isOk(Board);

function sort(x, y) {

}
describe('Moves', function () {
    if (false)
    describe('simple slides', function () {
        it('case 1' , function () {
            const s: string =
`
....
....
.m..
....`;
            const b: Board = boardFromString(s);
            assert.strictEqual(b.toString(), s.trim());
            const p = new Point(1,1);
            const pc: ?PieceOnBoard = b.pieceOnCell(p);
            if (pc!=null) {
                const movePaths: Array<MovePath> = pc.possibleMovePaths();
                const eventualBoards: Array<Board> = [];
                movePaths.forEach(function (movePath) {
                    const board: Board = b.effectMove(p, movePath);
                    eventualBoards.push(board);
                });
                const eventualBoardsSpecsExpected = [
`....
....
....
k...`.trim(),
`....
....
....
..k.`.trim()
                ];
                assert.isTrue(areDeeplyEqual(eventualBoards.map((x)=>x.toString().trim()).sort()
                                             , eventualBoardsSpecsExpected.sort()));
            } else {
                ASNU(pc);
                assert.fail(0, 1);
           }
        });
        it('case 2' , function () {
            const s: string =
                      `
....
....
.M..
....`;
            const b: Board = boardFromString(s);
            assert.strictEqual(b.toString(), s.trim());
            const p = new Point(1,1);
            const pc: ?PieceOnBoard = b.pieceOnCell(p);
            if (pc!=null) {
                const movePaths: Array<MovePath> = pc.possibleMovePaths();
                const eventualBoards: Array<Board> = [];
                movePaths.forEach(function (movePath) {
                    const board: Board = b.effectMove(p, movePath);
                    eventualBoards.push(board);
                });
                const eventualBoardsSpecsExpected = [
                    `....
M...
....
....`.trim(),
                    `....
..M.
....
....`.trim()
                ];
                assert.isTrue(areDeeplyEqual(eventualBoards.map((x)=>x.toString().trim()).sort()
                                             , eventualBoardsSpecsExpected.sort()));
            } else {
                ASNU(pc);
                assert.fail(0, 1);
            }
        });
    });
    describe('two paths of a single jump each', function () {
        it('case 1' , function () {
            const s: string =
`
.....
.m.k.
..M..
.....`;
            const b: Board = boardFromString(s);
            assert.strictEqual(b.toString(), s.trim());
            const p = new Point(2,1);
            const pc: ?PieceOnBoard = b.pieceOnCell(p);
            if (pc!=null) {
                const movePaths: Array<MovePath> = pc.possibleMovePaths();
                const eventualBoards: Array<Board> = [];
                movePaths.forEach(function (movePath) {
                    const board: Board = b.effectMove(p, movePath);
                    eventualBoards.push(board);
                });
                const eventualBoardsSpecsExpected = [
`
K....
...k.
.....
.....`.trim(),
`
....K
.m...
.....
.....`.trim()
                ];
                assert.isTrue(areDeeplyEqual(eventualBoards.map((x)=>x.toString().trim()).sort()
                                             , eventualBoardsSpecsExpected.sort()));
            } else {
                ASNU(pc);
                assert.fail(0, 1);
           }
        });
    });
    describe('two paths of two jumps each', function () {
        it('case 1' , function () {
            const s: string =
`
...m....
..M.K...
........
..M...M.
........
........
........
........`;
            const b: Board = boardFromString(s);
            assert.strictEqual(b.toString(), s.trim());
            const p = new Point(3,7);
            const pc: ?PieceOnBoard = b.pieceOnCell(p);
            if (pc!=null) {
                const movePaths: Array<MovePath> = pc.possibleMovePaths();
                const eventualBoards: Array<Board> = [];
                movePaths.forEach(function (movePath) {
                    const board: Board = b.effectMove(p, movePath);
                    eventualBoards.push(board);
                });
                const eventualBoardsSpecsExpected = [
`
........
....K...
........
......M.
...m....
........
........
........`.trim(),
`
........
..M.....
........
..M.....
.......m
........
........
........`.trim()
                ];
                assert.isTrue(areDeeplyEqual(eventualBoards.map((x)=>x.toString().trim()).sort()
                                             , eventualBoardsSpecsExpected.sort()));
            } else {
                ASNU(pc);
                assert.fail(0, 1);
           }
        });
    });
    describe('two paths of three jumps each and Kinging on one of them', function () {
        it('case 1' , function () {
            const s: string =
`
........
...m....
..M.K...
........
..M...M.
........
..K...m.
........`;
            const b: Board = boardFromString(s);
            assert.strictEqual(b.toString(), s.trim());
            const p = new Point(3,6);
            const pc: ?PieceOnBoard = b.pieceOnCell(p);
            if (pc!=null) {
                const movePaths: Array<MovePath> = pc.possibleMovePaths();
                const eventualBoards: Array<Board> = [];
                movePaths.forEach(function (movePath) {
                    const board: Board = b.effectMove(p, movePath);
                    eventualBoards.push(board);
                });
                const eventualBoardsSpecsExpected = [
`
........
........
....K...
........
......M.
........
......m.
.k......`.trim(),
`
........
........
..M.....
........
..M.....
.......m
..K...m.
........`.trim()
                ];
                assert.isTrue(areDeeplyEqual(eventualBoards.map((x)=>x.toString().trim()).sort()
                                             , eventualBoardsSpecsExpected.sort()));
            } else {
                ASNU(pc);
                assert.fail(0, 1);
           }
        });
    });
    describe('a single path of 3 jumps, reaching the far side, Kinging but no subsequent jump (turn ends there)', function () {
        it('case 1' , function () {
            const s: string =
`
........
.m......
..M.....
........
..M.....
........
..K.M...
........`;  /* NB: In this position a slide is theoretically possible but disallowed under the rules of the game as
                   a jump is also possible and jumps must always be taken in preference to slides.
            */
            const b: Board = boardFromString(s);
            assert.strictEqual(b.toString(), s.trim());
            const p = new Point(1,6);
            const pc: ?PieceOnBoard = b.pieceOnCell(p);
            if (pc!=null) {
                const movePaths: Array<MovePath> = pc.possibleMovePaths();
                const eventualBoards: Array<Board> = [];
                movePaths.forEach(function (movePath) {
                    const board: Board = b.effectMove(p, movePath);
                    eventualBoards.push(board);
                });
                const eventualBoardsSpecsExpected = [
`
........
........
........
........
........
........
....M...
...k....`.trim(), // NB: an additional jump is theoretically possible but Kinging ends the turn in English draughts.
                ];
                assert.isTrue(areDeeplyEqual(eventualBoards.map((x)=>x.toString().trim()).sort()
                                             , eventualBoardsSpecsExpected.sort()));
            } else {
                ASNU(pc);
                assert.fail(0, 1);
           }
        });
    });
    describe('a series of jumps showing that jumped-over pieces are eliminated immediately and not available to be jumped again in the same  move', function() {
        it('case 1' , function () {
            const s: string =
`
........
........
.m.m....
K.......
.m.m....
........
........
........`; // men are removed from the board as soon as they are jumped, otherwise jump sequences might be infinitely long (circles)
            const b: Board = boardFromString(s);
            assert.strictEqual(b.toString(), s.trim());
            const p = new Point(0, 4);
            const pc: ?PieceOnBoard = b.pieceOnCell(p);
            if (pc!=null) {
                const movePaths: Array<MovePath> = pc.possibleMovePaths();
                const eventualBoards: Array<Board> = [];
                movePaths.forEach(function (movePath) {
                    const board: Board = b.effectMove(p, movePath);
                    eventualBoards.push(board);
                });
                const IDENTICAL_POSITION_ARRIVED_BY_TWO_DIFFERENT_MOVE_SEQUENCES =
`
........
........
........
K.......
........
........
........
........`.trim(); // depending on whether the King jumps clockwise or counter-clockwise
                const eventualBoardsSpecsExpected = [
                    IDENTICAL_POSITION_ARRIVED_BY_TWO_DIFFERENT_MOVE_SEQUENCES,
                    IDENTICAL_POSITION_ARRIVED_BY_TWO_DIFFERENT_MOVE_SEQUENCES
                ];
                assert.isTrue(areDeeplyEqual(eventualBoards.map((x)=>x.toString().trim()).sort()
                                             , eventualBoardsSpecsExpected.sort()));
            } else {
                ASNU(pc);
                assert.fail(0, 1);
           }
        });
    });  
});
