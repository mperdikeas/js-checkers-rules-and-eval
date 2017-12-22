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

 // ASsert Not Undefined
function ASNU<T>(x: T): T { 
    assert.isFalse(x===undefined);
    return x;
}

function IBlowUp<T>(x: T, context?: ?string = null): T {
    const TEXT: string = 'you are not supposed to have reached the line that calls me';
    let msg: ?string = null;
    if (context==null) {
        ASNU(context);        
        msg = TEXT;
    } else {
        msg = `${TEXT}, context is: [${context}]`;
    }
    assert.fail(0, 0, msg);
    return x;
}

function areDeeplyEqual<T>(as: Array<T>, bs: Array<T>) {
    // if the other bs is a falsy value, return
    if (!bs)
        return false;

    // compare lengths - can save a lot of time
    if (as.length != bs.length)
        return false;

    for (var i = 0, l=as.length; i < l; i++) {
        // Check if we have nested arrays
  //      console.log(`comparing: [${as[i]}] with: [${bs[i]}]`);
        if (as[i] instanceof Array && bs[i] instanceof Array) {
            // recurse into the nested arrays
            if (!as[i].equals(bs[i]))
                return false;
        }
        else if (as[i] != bs[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
//            console.log(`found: [${as[i]}] to be unequal to: [${bs[i]}]`);
            return false;
        }
    }
    return true;
}   

exports.ASNU    = ASNU;
exports.IBlowUp = IBlowUp
exports.areDeeplyEqual = areDeeplyEqual
