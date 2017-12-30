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
import {BoardSpecificationError, JaggedLinesError, UnrecognizedCharacter, UnexpectedCheckeredPattern, boardFromString} from '../src/checkers.js';

assert.isOk(Board);

describe('Board', function () {
    describe('toString and fromString and various other methods', function () {
        describe('malformed string cases', function() {
            it('case 1' , function () {
                try {
                    boardFromString(
`
m.
xxx                      
`);
                    assert.fail(0, 0, 'error not thrown as expected');                    
                } catch (e) {
                    assert.isTrue( e instanceof JaggedLinesError);
                    assert.strictEqual(e.expecting, 2);
                    assert.strictEqual(e.found, 3);
                    assert.strictEqual(e.offendingLine, 1);
                }
            });
            it('case 2' , function () {
                try {
                    boardFromString(
`
mm
mm
`);
                    assert.fail(0, 0, 'error not thrown as expected');                    
                } catch (e) {
                  if (e instanceof BoardSpecificationError) {                    
                      assert.isTrue( e instanceof UnexpectedCheckeredPattern);
                      assert.strictEqual(e.patternEstablished, true);
                      assert.strictEqual(e.patternEncountered, false);
                      assert.strictEqual(e.offendingI, 1);
                      assert.strictEqual(e.offendingJ, 0);
                  } else
                        throw e;
                }
            });
            it('case 3' , function () {
                try {
                    boardFromString(
`
m.
.x
`);
                    assert.fail(0, 0, 'error not thrown as expected');
                } catch (e) {
                    if (e instanceof BoardSpecificationError) {
                        assert.isTrue( e instanceof UnrecognizedCharacter);
                        assert.strictEqual(e.lineNum, 1);
                        assert.strictEqual(e.linePos, 1);
                        assert.strictEqual(e.offendingCharacter, 'x');
                    } else
                        throw e;
                }
            });
            it('case 4' , function () {
                try {
                    boardFromString(
`
x
`);
                    assert.fail(0, 0, 'error not thrown as expected');
                } catch (e) {
                    if (e instanceof BoardSpecificationError) {
                        assert.isTrue( e instanceof UnrecognizedCharacter);
                        assert.strictEqual(e.lineNum, 0);
                        assert.strictEqual(e.linePos, 0);
                        assert.strictEqual(e.offendingCharacter, 'x');
                    } else
                        throw e;
                }
            });
            it('case 5' , function () {
                try {
                    boardFromString(
`
....x..
`);
                    assert.fail(0, 0, 'error not thrown as expected');
                } catch (e) {
                    if (e instanceof BoardSpecificationError) {
                        assert.isTrue( e instanceof UnrecognizedCharacter);
                        assert.strictEqual(e.lineNum, 0);
                        assert.strictEqual(e.linePos, 4);
                        assert.strictEqual(e.offendingCharacter, 'x');
                    } else
                        throw e;
                }
            });                        
        });
        describe('correct boards', function() {
            it('case 0 (totally empty 1x1 board)' , function () {
                const s: string =
`
.
`;
                const b: Board = boardFromString(s);
                assert.strictEqual(b.toString(), s.trim());
                for (let i = 0; i < b.width(); i++)
                    for (let j = 0; j < b.width(); j++)
                        assert.isTrue(b.isCellEmpty(new Point(i, j)));
            });            
            it('case 1 (totally empty)' , function () {
                const s: string =
`
..
..
`;
                const b: Board = boardFromString(s);
                assert.strictEqual(b.toString(), s.trim());
                for (let i = 0; i < b.width(); i++)
                    for (let j = 0; j < b.width(); j++)
                        assert.isTrue(b.isCellEmpty(new Point(i, j)));
            });
            it('case 2 (bunch of totally empty boards)' , function () {
                const boardSpecs: Array<string> =
                          [
`
.......
.......
`,
`
..
..
..
..
..
`
,
`
.....
.....
.....
.....`
                          ];
                boardSpecs.forEach(function(boardSpec) {
                    const b: Board = boardFromString(boardSpec);
                    assert.strictEqual(b.toString(), boardSpec.trim());
                    for (let i = 0; i < b.width(); i++)
                        for (let j = 0; j < b.height(); j++) {
                            assert.isTrue(b.isCellEmpty(new Point(i, j)));
                        }
                });
            });
            it('case 3' , function () {
                const s: string =
`
....m
...K.
`;
                const b: Board = boardFromString(s);
                assert.strictEqual(b.toString(), s.trim());
                assert.isTrue(b.squaresHostOppositeSidePieces(new Point(3,0), new Point(4,1)));
                assert.isTrue(b.squaresHostOppositeSidePieces(new Point(4,1), new Point(3,0))); 
                // 1st elimination
                const s2: string =
`
.....
...K.
`;
                const b2: Board = b.eliminateAt(new Point(4, 1)); // this is the non-mutating version
                assert.strictEqual(b .toString(),  s.trim());                
                assert.strictEqual(b2.toString(), s2.trim());
                // 2nd elimination
                const s3: string =
`
.....
.....
`;
                const b3: Board = b2.eliminateAt(new Point(3, 0));
                assert.strictEqual(b3.toString(), s3.trim());                
            });
            it('case 4' , function () {
                const s: string =
`
k.M.m
.k.K.
`;
                const b: Board = boardFromString(s);
                assert.strictEqual(b.toString(), s.trim());
            });
            it('case 4' , function () {
                const s: string =
`
......
.m.M.k
k.k.k.
.K.K.K
m.M.m.
`;
                const b: Board = boardFromString(s);
                assert.strictEqual(b.toString(), s.trim());
            });                        
        });    
    });
});
