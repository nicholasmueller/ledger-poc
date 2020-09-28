"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OP_RETURN = exports.OP_CHECKSIG = exports.OP_EQUALVERIFY = exports.HASH_SIZE = exports.OP_HASH160 = exports.OP_DUP = exports.SIGHASH_ALL = exports.DEFAULT_SEQUENCE = exports.DEFAULT_LOCKTIME = exports.DEFAULT_VERSION = exports.MAX_SCRIPT_BLOCK = void 0;
// flow
const MAX_SCRIPT_BLOCK = 50;
exports.MAX_SCRIPT_BLOCK = MAX_SCRIPT_BLOCK;
const DEFAULT_VERSION = 1;
exports.DEFAULT_VERSION = DEFAULT_VERSION;
const DEFAULT_LOCKTIME = 0;
exports.DEFAULT_LOCKTIME = DEFAULT_LOCKTIME;
const DEFAULT_SEQUENCE = 0xffffffff;
exports.DEFAULT_SEQUENCE = DEFAULT_SEQUENCE;
const SIGHASH_ALL = 1;
exports.SIGHASH_ALL = SIGHASH_ALL;
const OP_DUP = 0x76;
exports.OP_DUP = OP_DUP;
const OP_HASH160 = 0xa9;
exports.OP_HASH160 = OP_HASH160;
const HASH_SIZE = 0x14;
exports.HASH_SIZE = HASH_SIZE;
const OP_EQUALVERIFY = 0x88;
exports.OP_EQUALVERIFY = OP_EQUALVERIFY;
const OP_CHECKSIG = 0xac;
exports.OP_CHECKSIG = OP_CHECKSIG;
const OP_RETURN = 0x6a;
exports.OP_RETURN = OP_RETURN;
//# sourceMappingURL=constants.js.map