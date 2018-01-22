<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

-   [Btc](#btc)
    -   [getWalletPublicKey](#getwalletpublickey)
    -   [signTransaction](#signtransaction)
    -   [signMessageNew](#signmessagenew)
    -   [createPaymentTransactionNew](#createpaymenttransactionnew)
    -   [signP2SHTransaction](#signp2shtransaction)
    -   [splitTransaction](#splittransaction)
    -   [serializeTransactionOutputs](#serializetransactionoutputs)
    -   [serializeTransaction](#serializetransaction)
    -   [displayTransactionDebug](#displaytransactiondebug)
-   [Eth](#eth)
    -   [getAddress](#getaddress)
    -   [signTransaction](#signtransaction-1)
    -   [getAppConfiguration](#getappconfiguration)
    -   [signPersonalMessage](#signpersonalmessage)
-   [Xrp](#xrp)
    -   [getAddress](#getaddress-1)
    -   [signTransaction](#signtransaction-2)
    -   [getAppConfiguration](#getappconfiguration-1)
-   [Transport](#transport)
    -   [exchange](#exchange)
    -   [setScrambleKey](#setscramblekey)
    -   [close](#close)
    -   [on](#on)
    -   [off](#off)
    -   [setDebugMode](#setdebugmode)
    -   [send](#send)
    -   [list](#list)
    -   [listen](#listen)
    -   [open](#open)
    -   [create](#create)
-   [TransactionInput](#transactioninput)
-   [TransactionOutput](#transactionoutput)
-   [Transaction](#transaction)
-   [HttpTransport](#httptransport)
-   [TransportNodeHid](#transportnodehid)
    -   [create](#create-1)
-   [TransportU2F](#transportu2f)
    -   [open](#open-1)
-   [BluetoothTransport](#bluetoothtransport)
    -   [listen](#listen-1)
    -   [open](#open-2)

## Btc

Bitcoin API.

**Parameters**

-   `transport` **[Transport](#transport)&lt;any>** 

**Examples**

```javascript
import Btc from "@ledgerhq/hw-app-btc";
const btc = new Btc(transport)
```

### getWalletPublicKey

**Parameters**

-   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** a BIP 32 path

**Examples**

```javascript
btc.getWalletPublicKey("44'/0'/0'/0").then(o => o.bitcoinAddress)
```

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;{publicKey: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String), bitcoinAddress: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String), chainCode: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)}>** 

### signTransaction

**Parameters**

-   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `lockTime` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)**  (optional, default `DEFAULT_LOCKTIME`)
-   `sigHashType` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)**  (optional, default `SIGHASH_ALL`)

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Buffer](https://nodejs.org/api/buffer.html)>** 

### signMessageNew

You can sign a message according to the Bitcoin Signature format and retrieve v, r, s given the message and the BIP 32 path of the account to sign.

**Parameters**

-   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `messageHex` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

**Examples**

```javascript
btc.signMessageNew_async("44'/60'/0'/0'/0", Buffer.from("test").toString("hex")).then(function(result) {
var v = result['v'] + 27 + 4;
var signature = Buffer.from(v.toString(16) + result['r'] + result['s'], 'hex').toString('base64');
console.log("Signature : " + signature);
}).catch(function(ex) {console.log(ex);});
```

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;{v: [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number), r: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String), s: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)}>** 

### createPaymentTransactionNew

To sign a transaction involving standard (P2PKH) inputs, call createPaymentTransactionNew with the following parameters

**Parameters**

-   `inputs` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;\[[Transaction](#transaction), [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number), [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?, [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)?]>** is an array of [ transaction, output_index, optional redeem script, optional sequence ] where-   transaction is the previously computed transaction object for this UTXO
    -   output_index is the output in the transaction used as input for this UTXO (counting from 0)
    -   redeem script is the optional redeem script to use when consuming a Segregated Witness input
    -   sequence is the sequence number to use for this input (when using RBF), or non present
-   `associatedKeysets` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** is an array of BIP 32 paths pointing to the path to the private key used for each UTXO
-   `changePath` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** is an optional BIP 32 path pointing to the path to the public key used to compute the change address
-   `outputScriptHex` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `lockTime` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** is the optional lockTime of the transaction to sign, or default (0)
-   `sigHashType` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** is the hash type of the transaction to sign, or default (all)
-   `outputScript`  is the hexadecimal serialized outputs of the transaction to sign

**Examples**

```javascript
btc.createPaymentTransactionNew(
[ [tx1, 1] ],
["0'/0/0"],
undefined,
"01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac"
).then(res => ...);
```

Returns **any** the signed transaction ready to be broadcast

### signP2SHTransaction

To obtain the signature of multisignature (P2SH) inputs, call signP2SHTransaction_async with the folowing parameters

**Parameters**

-   `inputs` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;\[[Transaction](#transaction), [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number), [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?, [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)?]>** is an array of [ transaction, output_index, redeem script, optional sequence ] where-   transaction is the previously computed transaction object for this UTXO
    -   output_index is the output in the transaction used as input for this UTXO (counting from 0)
    -   redeem script is the mandatory redeem script associated to the current P2SH input
    -   sequence is the sequence number to use for this input (when using RBF), or non present
-   `associatedKeysets` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** is an array of BIP 32 paths pointing to the path to the private key used for each UTXO
-   `outputScriptHex` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `lockTime` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** is the optional lockTime of the transaction to sign, or default (0)
-   `sigHashType` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** is the hash type of the transaction to sign, or default (all)
-   `outputScript`  is the hexadecimal serialized outputs of the transaction to sign

**Examples**

```javascript
btc.signP2SHTransaction(
[ [tx, 1, "52210289b4a3ad52a919abd2bdd6920d8a6879b1e788c38aa76f0440a6f32a9f1996d02103a3393b1439d1693b063482c04bd40142db97bdf139eedd1b51ffb7070a37eac321030b9a409a1e476b0d5d17b804fcdb81cf30f9b99c6f3ae1178206e08bc500639853ae"] ],
["0'/0/0"],
"01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac"
).then(result => ...);
```

Returns **any** the signed transaction ready to be broadcast

### splitTransaction

For each UTXO included in your transaction, create a transaction object from the raw serialized version of the transaction used in this UTXO.

**Parameters**

-   `transactionHex` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

**Examples**

```javascript
const tx1 = btc.splitTransaction("01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000");
```

Returns **[Transaction](#transaction)** 

### serializeTransactionOutputs

**Parameters**

-   `$0` **any** 
    -   `$0.outputs`  

**Examples**

```javascript
const tx1 = btc.splitTransaction("01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000");
const outputScript = btc.serializeTransactionOutputs(tx1).toString('hex');
```

Returns **[Buffer](https://nodejs.org/api/buffer.html)** 

### serializeTransaction

**Parameters**

-   `transaction` **[Transaction](#transaction)** 

### displayTransactionDebug

**Parameters**

-   `transaction` **[Transaction](#transaction)** 

## Eth

Ethereum API

**Parameters**

-   `transport` **[Transport](#transport)&lt;any>** 

**Examples**

```javascript
import Eth from "@ledgerhq/hw-app-eth";
const eth = new Eth(transport)
```

### getAddress

get Ethereum address for a given BIP 32 path.

**Parameters**

-   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** a path in BIP 32 format
-   `boolDisplay` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 
-   `boolChaincode` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 

**Examples**

```javascript
eth.getAddress("44'/60'/0'/0'/0").then(o => o.address)
```

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;{publicKey: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String), address: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String), chainCode: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?}>** an object with a publicKey, address and (optionally) chainCode

### signTransaction

You can sign a transaction and retrieve v, r, s given the raw transaction and the BIP 32 path of the account to sign

**Parameters**

-   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `rawTxHex` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

**Examples**

```javascript
eth.signTransaction("44'/60'/0'/0'/0", "e8018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a2487400080").then(result => ...)
```

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;{s: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String), v: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String), r: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)}>** 

### getAppConfiguration

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;{arbitraryDataEnabled: [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number), version: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)}>** 

### signPersonalMessage

You can sign a message according to eth_sign RPC call and retrieve v, r, s given the message and the BIP 32 path of the account to sign.

**Parameters**

-   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `messageHex` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

**Examples**

```javascript
eth.signPersonalMessage("44'/60'/0'/0'/0", Buffer.from("test").toString("hex")).then(result => {
var v = result['v'] - 27;
v = v.toString(16);
if (v.length < 2) {
v = "0" + v;
}
console.log("Signature 0x" + result['r'] + result['s'] + v);
})
```

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;{v: [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number), s: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String), r: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)}>** 

## Xrp

Ripple API

**Parameters**

-   `transport` **[Transport](#transport)&lt;any>** 

**Examples**

```javascript
import Xrp from "@ledgerhq/hw-app-xrp";
const xrp = new Xrp(transport);
```

### getAddress

get Ripple address for a given BIP 32 path.

**Parameters**

-   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** a path in BIP 32 format
-   `display` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** optionally enable or not the display
-   `chainCode` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** optionally enable or not the chainCode request
-   `ed25519` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** optionally enable or not the ed25519 curve (secp256k1 is default)

**Examples**

```javascript
const result = await xrp.getAddress("44'/144'/0'/0/0");
const { publicKey, address } = result;
```

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;{publicKey: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String), address: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String), chainCode: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?}>** an object with a publicKey, address and (optionally) chainCode

### signTransaction

sign a Ripple transaction with a given BIP 32 path

**Parameters**

-   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** a path in BIP 32 format
-   `rawTxHex` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** a raw transaction hex string
-   `ed25519` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** optionally enable or not the ed25519 curve (secp256k1 is default)

**Examples**

```javascript
const signature = await xrp.signTransaction("44'/144'/0'/0/0", "12000022800000002400000002614000000001315D3468400000000000000C73210324E5F600B52BB3D9246D49C4AB1722BA7F32B7A3E4F9F2B8A1A28B9118CC36C48114F31B152151B6F42C1D61FE4139D34B424C8647D183142ECFC1831F6E979C6DA907E88B1CAD602DB59E2F");
```

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** a signature as hex string

### getAppConfiguration

get the version of the Ripple app installed on the hardware device

**Examples**

```javascript
const result = await xrp.getAppConfiguration();

{
  "version": "1.0.3"
}
```

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;{version: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)}>** an object with a version

## Transport

Transport defines the generic interface to share between node/u2f impl
A **Descriptor** is a parametric type that is up to be determined for the implementation.
it can be for instance an ID, an file path, a URL,...

### exchange

low level api to communicate with the device
This method is for implementations to implement but should not be directly called.
Instead, the recommanded way is to use send() method

Type: function (apdu: [Buffer](https://nodejs.org/api/buffer.html)): [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Buffer](https://nodejs.org/api/buffer.html)>

**Parameters**

-   `apdu`  the data to send

Returns **any** a Promise of response data

### setScrambleKey

set the "scramble key" for the next exchanges with the device.
Each App can have a different scramble key and they internally will set it at instanciation.

Type: function (key: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)): void

**Parameters**

-   `key`  the scramble key

### close

close the exchange with the device.

Type: function (): [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;void>

Returns **any** a Promise that ends when the transport is closed.

### on

Listen to an event on an instance of transport.
Transport implementation can have specific events. Here is the common events:

-   `"disconnect"` : triggered if Transport is disconnected

**Parameters**

-   `eventName` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `cb` **[Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)** 

### off

Stop listening to an event on an instance of transport.

**Parameters**

-   `eventName` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `cb` **[Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)** 

### setDebugMode

Enable or not logs of the binary exchange

**Parameters**

-   `debug` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 

### send

wrapper on top of exchange to simplify work of the implementation.

**Parameters**

-   `cla`  
-   `ins`  
-   `p1`  
-   `p2`  
-   `data`  
-   `statusList`  is a list of accepted status code (shorts). [0x9000] by default

Returns **any** a Promise of response buffer

### list

List once all available descriptors. For a better granularity, checkout `listen()`.

Type: function (): [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;Descriptor>>

**Examples**

```javascript
TransportFoo.list().then(descriptors => ...)
```

Returns **any** a promise of descriptors

### listen

Listen all device events for a given Transport. The method takes an Obverver of DescriptorEvent and returns a Subscription (according to Observable paradigm <https://github.com/tc39/proposal-observable> )
a DescriptorEvent is a `{ descriptor, type }` object. type can be `"add"` or `"remove"` and descriptor is a value you can pass to `open(descriptor)`.
each listen() call will first emit all potential device already connected and then will emit events can come over times,
for instance if you plug a USB device after listen() or a bluetooth device become discoverable.

Type: function (observer: Observer&lt;DescriptorEvent&lt;Descriptor>>): Subscription

**Parameters**

-   `observer`  is an object with a next, error and complete function (compatible with observer pattern)

**Examples**

```javascript
const sub = TransportFoo.listen({
next: e => {
if (e.type==="add") {
sub.unsubscribe();
const transport = await TransportFoo.open(e.descriptor);
...
}
},
error: error => {},
complete: () => {}
})
```

Returns **any** a Subscription object on which you can `.unsubscribe()` to stop listening descriptors.

### open

attempt to create a Transport instance with potentially a descriptor.

Type: function (descriptor: Descriptor, timeout: [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)): [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Transport](#transport)&lt;Descriptor>>

**Parameters**

-   `descriptor`  : the descriptor to open the transport with.
-   `timeout`  : an optional timeout

**Examples**

```javascript
TransportFoo.open(descriptor).then(transport => ...)
```

Returns **any** a Promise of Transport instance

### create

create() allows to open the first descriptor available or throw if there is none.
**DEPRECATED**: use `list()` or `listen()` and `open()` instead.

**Parameters**

-   `timeout` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 
-   `debug` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)**  (optional, default `false`)

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Transport](#transport)&lt;Descriptor>>** 

## TransactionInput

Type: {prevout: [Buffer](https://nodejs.org/api/buffer.html), script: [Buffer](https://nodejs.org/api/buffer.html), sequence: [Buffer](https://nodejs.org/api/buffer.html)}

**Properties**

-   `prevout` **[Buffer](https://nodejs.org/api/buffer.html)** 
-   `script` **[Buffer](https://nodejs.org/api/buffer.html)** 
-   `sequence` **[Buffer](https://nodejs.org/api/buffer.html)** 

## TransactionOutput

Type: {amount: [Buffer](https://nodejs.org/api/buffer.html), script: [Buffer](https://nodejs.org/api/buffer.html)}

**Properties**

-   `amount` **[Buffer](https://nodejs.org/api/buffer.html)** 
-   `script` **[Buffer](https://nodejs.org/api/buffer.html)** 

## Transaction

Type: {version: [Buffer](https://nodejs.org/api/buffer.html), inputs: [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[TransactionInput](#transactioninput)>, outputs: [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[TransactionOutput](#transactionoutput)>?, locktime: [Buffer](https://nodejs.org/api/buffer.html)?}

**Properties**

-   `version` **[Buffer](https://nodejs.org/api/buffer.html)** 
-   `inputs` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[TransactionInput](#transactioninput)>** 
-   `outputs` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[TransactionOutput](#transactionoutput)>?** 
-   `locktime` **[Buffer](https://nodejs.org/api/buffer.html)?** 

## HttpTransport

**Extends Transport**

HTTP transport implementation

**Parameters**

-   `url` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

## TransportNodeHid

**Extends Transport**

node-hid Transport implementation

**Parameters**

-   `device` **HID.HID** 
-   `ledgerTransport` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)**  (optional, default `true`)
-   `timeout` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)**  (optional, default `0`)
-   `debug` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)**  (optional, default `false`)

**Examples**

```javascript
import TransportNodeHid from "@ledgerhq/hw-transport-node-u2f";
...
TransportNodeHid.create().then(transport => ...)
```

### create

static function to create a new Transport from the first connected Ledger device found in USB

**Parameters**

-   `timeout` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 
-   `debug` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[TransportNodeHid](#transportnodehid)>** 

## TransportU2F

**Extends Transport**

U2F web Transport implementation

**Parameters**

-   `timeoutSeconds` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)**  (optional, default `20`)

**Examples**

```javascript
import TransportU2F from "@ledgerhq/hw-transport-u2f";
...
TransportU2F.create().then(transport => ...)
```

### open

static function to create a new Transport from a connected Ledger device discoverable via U2F (browser support)

**Parameters**

-   `_` **any** 
-   `timeout` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[TransportU2F](#transportu2f)>** 

## BluetoothTransport

**Extends Transport**

react-native bluetooth BLE implementation

**Parameters**

-   `device` **Device** 
-   `writeCharacteristic` **Characteristic** 
-   `notifyCharacteristic` **Characteristic** 

**Examples**

```javascript
import BluetoothTransport from "@ledgerhq/react-native-hw-transport-ble";
```

### listen

**Parameters**

-   `observer` **any** 

### open

**Parameters**

-   `device` **Device** 