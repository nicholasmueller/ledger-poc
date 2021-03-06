"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.listTokens = listTokens;
exports.listTokensForCryptoCurrency = listTokensForCryptoCurrency;
exports.listTokenTypesForCryptoCurrency = listTokenTypesForCryptoCurrency;
exports.findTokenByTicker = findTokenByTicker;
exports.findTokenById = findTokenById;
exports.findTokenByAddress = findTokenByAddress;
exports.getTokenById = getTokenById;
exports.findCompoundToken = findCompoundToken;
exports.hasTokenId = void 0;

var _currencies = require("./currencies");

var _erc = _interopRequireDefault(require("../data/erc20"));

var _trc = _interopRequireDefault(require("../data/trc10"));

var _trc2 = _interopRequireDefault(require("../data/trc20"));

var _asa = _interopRequireDefault(require("../data/asa"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const emptyArray = [];
const tokensArray = [];
const tokensArrayWithDelisted = [];
const tokensByCryptoCurrency = {};
const tokensByCryptoCurrencyWithDelisted = {};
const tokensById = {};
const tokensByTicker = {};
const tokensByAddress = {};
addTokens(_erc.default.map(convertERC20));
addTokens(_trc.default.map(convertTRONTokens("trc10")));
addTokens(_trc2.default.map(convertTRONTokens("trc20")));
addTokens(_asa.default.map(convertAlgorandASATokens));
const defaultTokenListOptions = {
  withDelisted: false
};
/**
 *
 */

function listTokens(options) {
  const {
    withDelisted
  } = _objectSpread(_objectSpread({}, defaultTokenListOptions), options);

  return withDelisted ? tokensArrayWithDelisted : tokensArray;
}
/**
 *
 */


function listTokensForCryptoCurrency(currency, options) {
  const {
    withDelisted
  } = _objectSpread(_objectSpread({}, defaultTokenListOptions), options);

  if (withDelisted) {
    return tokensByCryptoCurrencyWithDelisted[currency.id] || emptyArray;
  }

  return tokensByCryptoCurrency[currency.id] || emptyArray;
}
/**
 *
 */


function listTokenTypesForCryptoCurrency(currency) {
  return listTokensForCryptoCurrency(currency).reduce((acc, cur) => {
    const tokenType = cur.tokenType;

    if (acc.indexOf(tokenType) < 0) {
      return [...acc, tokenType];
    }

    return acc;
  }, []);
}
/**
 *
 */


function findTokenByTicker(ticker) {
  return tokensByTicker[ticker];
}
/**
 *
 */


function findTokenById(id) {
  return tokensById[id];
}
/**
 *
 */


function findTokenByAddress(address) {
  return tokensByAddress[address.toLowerCase()];
}
/**
 *
 */


const hasTokenId = id => id in tokensById;
/**
 *
 */


exports.hasTokenId = hasTokenId;

function getTokenById(id) {
  const currency = findTokenById(id);

  if (!currency) {
    throw new Error(`token with id "${id}" not found`);
  }

  return currency;
}
/**
 * if a given token account is a token that can be used in compound, give the associated compound token (cToken)
 * @param {*} token
 */


function findCompoundToken(token) {
  // TODO can be optimized by generating a direct map
  return listTokensForCryptoCurrency(token.parentCurrency, {
    withDelisted: true
  }).find(t => t.compoundFor === token.id);
}

function comparePriority(a, b) {
  return Number(!!b.disableCountervalue) - Number(!!a.disableCountervalue);
}

function addTokens(list) {
  list.forEach(token => {
    if (!token.delisted) tokensArray.push(token);
    tokensArrayWithDelisted.push(token);
    tokensById[token.id] = token;

    if (!tokensByTicker[token.ticker] || comparePriority(token, tokensByTicker[token.ticker]) > 0) {
      tokensByTicker[token.ticker] = token;
    }

    tokensByAddress[token.contractAddress.toLowerCase()] = token;
    const {
      parentCurrency
    } = token;

    if (!(parentCurrency.id in tokensByCryptoCurrency)) {
      tokensByCryptoCurrency[parentCurrency.id] = [];
    }

    if (!(parentCurrency.id in tokensByCryptoCurrencyWithDelisted)) {
      tokensByCryptoCurrencyWithDelisted[parentCurrency.id] = [];
    }

    if (!token.delisted) tokensByCryptoCurrency[parentCurrency.id].push(token);
    tokensByCryptoCurrencyWithDelisted[parentCurrency.id].push(token);
  });
}

function convertERC20([parentCurrencyId, token, ticker, magnitude, name, ledgerSignature, contractAddress, disableCountervalue, delisted, countervalueTicker, compoundFor]) {
  return {
    type: "TokenCurrency",
    id: "ethereum/erc20/" + token,
    ledgerSignature,
    contractAddress,
    parentCurrency: (0, _currencies.getCryptoCurrencyById)(parentCurrencyId),
    tokenType: "erc20",
    name,
    ticker,
    delisted,
    disableCountervalue: !!disableCountervalue || !!(0, _currencies.findCryptoCurrencyByTicker)(ticker),
    // if it collides, disable
    countervalueTicker,
    compoundFor: compoundFor ? "ethereum/erc20/" + compoundFor : undefined,
    units: [{
      name,
      code: ticker,
      magnitude
    }]
  };
}

function convertAlgorandASATokens([id, abbr, name, contractAddress, precision]) {
  return {
    type: "TokenCurrency",
    id: `algorand/asa/${id}`,
    contractAddress,
    parentCurrency: (0, _currencies.getCryptoCurrencyById)("algorand"),
    tokenType: "asa",
    name,
    ticker: abbr,
    disableCountervalue: true,
    units: [{
      name,
      code: abbr,
      magnitude: precision
    }]
  };
}

function convertTRONTokens(type) {
  return ([id, abbr, name, contractAddress, precision, delisted, ledgerSignature]) => ({
    type: "TokenCurrency",
    id: `tron/${type}/${id}`,
    contractAddress,
    parentCurrency: (0, _currencies.getCryptoCurrencyById)("tron"),
    tokenType: type,
    name,
    ticker: abbr,
    delisted,
    disableCountervalue: true,
    ledgerSignature,
    units: [{
      name,
      code: abbr,
      magnitude: precision
    }]
  });
}
//# sourceMappingURL=tokens.js.map