import { getCryptoCurrencyById, findCryptoCurrencyByTicker } from "./currencies";
import erc20tokens from "../data/erc20";
import trc10tokens from "../data/trc10";
import trc20tokens from "../data/trc20";
import asatokens from "../data/asa";
const emptyArray = [];
const tokensArray = [];
const tokensArrayWithDelisted = [];
const tokensByCryptoCurrency = {};
const tokensByCryptoCurrencyWithDelisted = {};
const tokensById = {};
const tokensByTicker = {};
const tokensByAddress = {};
addTokens(erc20tokens.map(convertERC20));
addTokens(trc10tokens.map(convertTRONTokens("trc10")));
addTokens(trc20tokens.map(convertTRONTokens("trc20")));
addTokens(asatokens.map(convertAlgorandASATokens));
const defaultTokenListOptions = {
  withDelisted: false
};
/**
 *
 */

export function listTokens(options) {
  const {
    withDelisted
  } = { ...defaultTokenListOptions,
    ...options
  };
  return withDelisted ? tokensArrayWithDelisted : tokensArray;
}
/**
 *
 */

export function listTokensForCryptoCurrency(currency, options) {
  const {
    withDelisted
  } = { ...defaultTokenListOptions,
    ...options
  };

  if (withDelisted) {
    return tokensByCryptoCurrencyWithDelisted[currency.id] || emptyArray;
  }

  return tokensByCryptoCurrency[currency.id] || emptyArray;
}
/**
 *
 */

export function listTokenTypesForCryptoCurrency(currency) {
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

export function findTokenByTicker(ticker) {
  return tokensByTicker[ticker];
}
/**
 *
 */

export function findTokenById(id) {
  return tokensById[id];
}
/**
 *
 */

export function findTokenByAddress(address) {
  return tokensByAddress[address.toLowerCase()];
}
/**
 *
 */

export const hasTokenId = id => id in tokensById;
/**
 *
 */

export function getTokenById(id) {
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

export function findCompoundToken(token) {
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
    parentCurrency: getCryptoCurrencyById(parentCurrencyId),
    tokenType: "erc20",
    name,
    ticker,
    delisted,
    disableCountervalue: !!disableCountervalue || !!findCryptoCurrencyByTicker(ticker),
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
    parentCurrency: getCryptoCurrencyById("algorand"),
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
    parentCurrency: getCryptoCurrencyById("tron"),
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