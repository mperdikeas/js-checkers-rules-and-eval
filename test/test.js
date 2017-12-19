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



// import {Point, between, foo} from '../src/index.js'; // it is important that types are imported from ../src and not from ../lib if you want Flow to perform static type checking in your test code. Quite simply, the files in ../lib are stripped from type checking annotations. ** HOWEVER **, if this package is to be used as a library we also have to add 'test/' in the .npmignore file otherwise the importation from src fails when we try to use this module from npm.

/* example code of how to use generic type definitions in Flow start */
//type RelationFT<T> = (a: T, b: T) => boolean;
/*
import type {DemonstrateUseOfExportedTypes} from '../src/point.js';
const foobarzar : DemonstrateUseOfExportedTypes = {a: 1, b: '2'};

function partialSorting<T>(_vs: Array<T>, isGreaterThan: RelationFT<T>): Array<T> {
    const n: number = _vs.length;
    const vs : Array<T> = _vs.slice();
    while (true) {
        let flipHappened = false;
        for (let i = 0; i < n ; i++) {
            if (isGreaterThan(vs[i], vs[i+1])) {
                const tmp = vs[i];
                vs[i]     = vs[i+1];
                vs[i+1]   = tmp;
                flipHappened = true;
            }
        }
        if (!flipHappened)
            break;
    }
    return vs;
}
 example code of how to use generic type definitions in Flow end 


describe('Point', function () {
    describe('rotate90Right', function () {
        it('should work'
           , function () {
               let s : number = Point.foo();
               const p = new Point(1,3);
               const expected = new Point(-3, 1);
               assert.isTrue(p.rotate90Right().equals(expected));
               assert.isTrue(_.isEqual(p.rotate90Right(), expected));
           });     
    });
    describe('rotate90Left', function () {
        it('should work'
           , function () {
               const p = new Point(1,3);
               const expected = new Point(3, -1);
               assert.isTrue(p.rotate90Left().equals(expected));
               assert.isTrue(_.isEqual(p.rotate90Left(), expected));
           });     
    });
    describe('rotate90Left and rotate90Right', function () {
        it('should cancel each other out', function () {
            const p = new Point(Math.random()*10-5, Math.random()*10-5);
            const p2 = p.rotate90Right().rotate90Left();
            const p3 = p.rotate90Left().rotate90Right();
            assert.isTrue(p2.equals(p));
            assert.isTrue(_.isEqual(p, p2));
            assert.isTrue(p3.equals(p));
            assert.isTrue(_.isEqual(p, p3));
        });
        describe ('four of the kind is back where we started', function() {
            it('rotate90Right', function() {
                const p = new Point(Math.random()*10-5, Math.random()*10-5);
                const p2 = p.rotate90Right().rotate90Right().rotate90Right().rotate90Right();
                assert.isTrue(p2.equals(p));
                assert.isTrue(_.isEqual(p, p2));
            });
            it('rotate90Left', function() {
                const p = new Point(Math.random()*10-5, Math.random()*10-5);
                const p2 = p.rotate90Left().rotate90Left().rotate90Left().rotate90Left();
                assert.isTrue(p2.equals(p));
                assert.isTrue(_.isEqual(p, p2));
            });            
        });
    });
    describe('test throw assertions', function() {
        it('works with my own throws', function() {
            assert.throws(()=>{
                foo();
            }, Error);
        });
        it('works with chai throws', function() {
            assert.throws(()=>{
                const p: Point = new Point(2,3);
                // $SuppressFlowFinding: this is done on purpose to test the throw of the exception
                p.add(3);
            }, AssertionError);
        });
        it('works with chai throws #2', function() {
            assert.throws(()=>{
                const p: Point = new Point(2,3);
                // $SuppressFlowFinding: this is done on purpose to test the throw of the exception
                p.add(3);                
            }, Error);
        });
        it('weird', function() {
            assert.throws(()=>{
                throw 1;
            }, undefined);
        });
    });

    describe('foo', function() { // https://stackoverflow.com/q/46457351/274677
        it('works', function() {
            assert.throws( ()=>{throw new Error('foo')}
                           , Error, /f../);
            assert.throws( ()=>{throw new AssertionError()}
                           , Error);
            assert.throws( ()=>{throw new AssertionError()}
                           , AssertionError);
            assert.throws( ()=>{assert.isTrue(false, 'foobar');}
                           , Error, /.*bar/);
            assert.throws( ()=>{assert.isTrue(false, 'foobarzar');}
                           , AssertionError, /^foobarzar/);
        });
    });
});

const TEST_IF_STACK_TRACE_LINE_NUMBERS_ARE_CORRECTLY_REPORTED = false;

if (TEST_IF_STACK_TRACE_LINE_NUMBERS_ARE_CORRECTLY_REPORTED)
describe('between', function () {
    it('should work' , function () {
        assert.isTrue(!between(-0.00000000001, 0, 1)); 
        assert.isTrue( between(0,0,1));
        assert.isTrue( between(0.9999,0,1));
        assert.isTrue(!between(1,1,0,1));
        assert.isTrue( between(2,1,3));
        assert.isTrue(!between(2,3,1));
    });
    it('do stack traces work?' , function () { 
        assert.isTrue(false);
    });
    it('do stack traces work? (2)' , function () {
        (new Point(0,0)).equals(new Point(1,1));
    });
    it('do stack traces work? (3)' , function () {
        foo();
    });            
});
*/
