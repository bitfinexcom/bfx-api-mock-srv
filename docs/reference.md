## Modules

<dl>
<dt><a href="#module_bfx-api-mock-srv">bfx-api-mock-srv</a></dt>
<dd><p>This module hosts mock servers for the
<a href="#MockWSv2Server">WSv2</a> and <a href="#MockRESTv2Server">RESTv2</a> Bitfinex
APIs, and is intended for testing the Bitfinex API libraries.</p>
</dd>
</dl>

## Classes

<dl>
<dt><a href="#MockRESTv2Server">MockRESTv2Server</a> ⇐ <code><a href="#MockServer">MockServer</a></code></dt>
<dd><p>REST v2 API server mock</p>
<p>Exposes the same routes as the real API, and maps them to a response table.
Multiple potential responses can be defined for endpoints with arguments,
with the best match sent to clients on request.</p>
<p>i.e. If the following responses are configured:</p>
<ul>
<li><code>orders.tBTCUSD: [42]</code></li>
<li><code>orders: [41]</code></li>
</ul>
<p>A <code>GET</code> on <code>/v2/auth/r/orders/tBTCUSD/hist</code> would return <code>[42]</code>, but a query
for a different symbol (<code>tETHUSD</code>) would return <code>[41]</code>.</p>
</dd>
<dt><a href="#MockServer">MockServer</a> ⇐ <code>events.EventEmitter</code></dt>
<dd><p>Mock server base class, listens for commands to get/set responses</p>
</dd>
<dt><a href="#MockWSv2Server">MockWSv2Server</a> ⇐ <code><a href="#MockServer">MockServer</a></code></dt>
<dd><p>Acts as a mock for v2 of the Bitfinex websocket API. Responses to available
commands are loaded from data/ws2.json and can be modified at runtime. The
command API allows for arbitrary packets to be injected into the ws stream.</p>
<p>Responses are of the form <code>[{ packets: [...] }]</code>, where mulitple packets are
sent in order. A packet can be a string referencing another response by key.</p>
</dd>
</dl>

<a name="module_bfx-api-mock-srv"></a>

## bfx-api-mock-srv
This module hosts mock servers for the
[WSv2](#MockWSv2Server) and [RESTv2](#MockRESTv2Server) Bitfinex
APIs, and is intended for testing the Bitfinex API libraries.

**License**: Apache-2.0  
**Example**  
```js
const { MockRESTv2Server } = require('bfx-api-mock-srv')

const FUNDING_OFFER = [
  41215275, 'fUSD', 1524784806000, 1524784806000, 1000, 1000, 'FRRDELTAVAR',
  null, null, 0, 'ACTIVE', null, null, null, 0, 30, 0, 0, null, 0,
  0.00207328
]

debug('spawning mock server...')

const srv = new MockRESTv2Server({ listen: true })
const rest = new RESTv2({
  apiKey: 'dummy',
  apiSecret: 'dummy',
  url: 'http://localhost:9999'
})

srv.setResponse('f_offers.fUSD', [FUNDING_OFFER])

debug('requesting preset response...')

rest.fundingOffers('fUSD').then(([incomingFundingOffer]) => {
  assert.deepStrictEqual(incomingFundingOffer, FUNDING_OFFER)

  debug('correct response received')
  srv.close()

  return null
}).catch((e) => {
  debug(`error: ${e.message}`)
})
```
<a name="MockRESTv2Server"></a>

## MockRESTv2Server ⇐ [<code>MockServer</code>](#MockServer)
REST v2 API server mock

Exposes the same routes as the real API, and maps them to a response table.
Multiple potential responses can be defined for endpoints with arguments,
with the best match sent to clients on request.

i.e. If the following responses are configured:
- `orders.tBTCUSD: [42]`
- `orders: [41]`

A `GET` on `/v2/auth/r/orders/tBTCUSD/hist` would return `[42]`, but a query
for a different symbol (`tETHUSD`) would return `[41]`.

**Kind**: global class  
**Extends**: [<code>MockServer</code>](#MockServer)  

* [MockRESTv2Server](#MockRESTv2Server) ⇐ [<code>MockServer</code>](#MockServer)
    * [new MockRESTv2Server([args])](#new_MockRESTv2Server_new)
    * _instance_
        * [.listen()](#MockRESTv2Server+listen)
        * [.close()](#MockRESTv2Server+close) ⇒ <code>Promise</code>
        * [.getResponse(key)](#MockServer+getResponse) ⇒ <code>string</code>
        * [.setResponse(key, data)](#MockServer+setResponse)
    * _static_
        * [.keysForRoute(req, routeKey)](#MockRESTv2Server.keysForRoute) ⇒ <code>Array.&lt;string&gt;</code>

<a name="new_MockRESTv2Server_new"></a>

### new MockRESTv2Server([args])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [args] | <code>object</code> | <code>{}</code> | args |
| [args.apiPort] | <code>number</code> | <code>9999</code> | API port number |
| [args.cmdPort] | <code>number</code> | <code>9998</code> | command port number |
| [args.listen] | <code>boolean</code> | <code>true</code> | enables auto listen() |

<a name="MockRESTv2Server+listen"></a>

### mockRESTv2Server.listen()
Starts the API server listening on the configured port. This is a no-op if
the server is already up

**Kind**: instance method of [<code>MockRESTv2Server</code>](#MockRESTv2Server)  
**Overrides**: [<code>listen</code>](#MockServer+listen)  
<a name="MockRESTv2Server+close"></a>

### mockRESTv2Server.close() ⇒ <code>Promise</code>
Closes the API server if it is running; This is a no-op if it is not.

**Kind**: instance method of [<code>MockRESTv2Server</code>](#MockRESTv2Server)  
**Overrides**: [<code>close</code>](#MockServer+close)  
**Returns**: <code>Promise</code> - p  
<a name="MockServer+getResponse"></a>

### mockRESTv2Server.getResponse(key) ⇒ <code>string</code>
Returns the configured server response for the given key

**Kind**: instance method of [<code>MockRESTv2Server</code>](#MockRESTv2Server)  
**Overrides**: [<code>getResponse</code>](#MockServer+getResponse)  
**Returns**: <code>string</code> - response - JSON  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | key |

<a name="MockServer+setResponse"></a>

### mockRESTv2Server.setResponse(key, data)
Sets the provided data as the server response for the given key.

**Kind**: instance method of [<code>MockRESTv2Server</code>](#MockRESTv2Server)  
**Overrides**: [<code>setResponse</code>](#MockServer+setResponse)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | key |
| data | <code>Array</code> \| <code>object</code> | data |

<a name="MockRESTv2Server.keysForRoute"></a>

### MockRESTv2Server.keysForRoute(req, routeKey) ⇒ <code>Array.&lt;string&gt;</code>
**Kind**: static method of [<code>MockRESTv2Server</code>](#MockRESTv2Server)  
**Returns**: <code>Array.&lt;string&gt;</code> - keys  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>express.Request</code> | request |
| routeKey | <code>string</code> | key |

<a name="MockServer"></a>

## MockServer ⇐ <code>events.EventEmitter</code>
Mock server base class, listens for commands to get/set responses

**Kind**: global class  
**Extends**: <code>events.EventEmitter</code>  

* [MockServer](#MockServer) ⇐ <code>events.EventEmitter</code>
    * [new MockServer(args, dataPath)](#new_MockServer_new)
    * [.listen()](#MockServer+listen)
    * [.close()](#MockServer+close) ⇒ <code>Promise</code>
    * [.getResponse(key)](#MockServer+getResponse) ⇒ <code>string</code>
    * [.setResponse(key, data)](#MockServer+setResponse)

<a name="new_MockServer_new"></a>

### new MockServer(args, dataPath)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| args | <code>object</code> |  | args |
| [args.cmdPort] | <code>number</code> | <code>9998</code> | port to listen on for HTTP commands |
| dataPath | <code>string</code> |  | path to JSON file with responses |

<a name="MockServer+listen"></a>

### mockServer.listen()
Starts the HTTP command server listening on the configured port. This is
a no-op if the server is already up.

**Kind**: instance method of [<code>MockServer</code>](#MockServer)  
<a name="MockServer+close"></a>

### mockServer.close() ⇒ <code>Promise</code>
Closes the command server if it is running, no-op if not.

**Kind**: instance method of [<code>MockServer</code>](#MockServer)  
**Returns**: <code>Promise</code> - p  
<a name="MockServer+getResponse"></a>

### mockServer.getResponse(key) ⇒ <code>string</code>
Returns the configured server response for the given key

**Kind**: instance method of [<code>MockServer</code>](#MockServer)  
**Returns**: <code>string</code> - response - JSON  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | key |

<a name="MockServer+setResponse"></a>

### mockServer.setResponse(key, data)
Sets the provided data as the server response for the given key.

**Kind**: instance method of [<code>MockServer</code>](#MockServer)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | key |
| data | <code>Array</code> \| <code>object</code> | data |

<a name="MockWSv2Server"></a>

## MockWSv2Server ⇐ [<code>MockServer</code>](#MockServer)
Acts as a mock for v2 of the Bitfinex websocket API. Responses to available
commands are loaded from data/ws2.json and can be modified at runtime. The
command API allows for arbitrary packets to be injected into the ws stream.

Responses are of the form `[{ packets: [...] }]`, where mulitple packets are
sent in order. A packet can be a string referencing another response by key.

**Kind**: global class  
**Extends**: [<code>MockServer</code>](#MockServer)  

* [MockWSv2Server](#MockWSv2Server) ⇐ [<code>MockServer</code>](#MockServer)
    * [new MockWSv2Server([args])](#new_MockWSv2Server_new)
    * [.isOpen()](#MockWSv2Server+isOpen) ⇒ <code>boolean</code>
    * [.listen()](#MockWSv2Server+listen)
    * [.close()](#MockWSv2Server+close) ⇒ <code>Promise</code>
    * [.once(eventName, cb)](#MockWSv2Server+once)
    * [.send(packet)](#MockWSv2Server+send)
    * [.getResponse(key)](#MockServer+getResponse) ⇒ <code>string</code>
    * [.setResponse(key, data)](#MockServer+setResponse)

<a name="new_MockWSv2Server_new"></a>

### new MockWSv2Server([args])
Spawns a new mock WS2 API server. Supported commands:
- POST /send - body is parsed as JSON and sent to all clients
- POST /config - body is parsed as JSON, and valid config keys are saved


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [args] | <code>object</code> | <code>[]</code> | arguments |
| [args.apiPort] | <code>number</code> | <code>9997</code> | which port to listen on for ws   clients |
| [args.cmdPort] | <code>number</code> | <code>9996</code> | which port to listen on for commands |
| [args.syncOnConnect] | <code>boolean</code> | <code>true</code> | send snapshots to clients on   connect |
| [args.listen] | <code>boolean</code> | <code>true</code> | if true, listen() is called   automatically |

<a name="MockWSv2Server+isOpen"></a>

### mockWSv2Server.isOpen() ⇒ <code>boolean</code>
Returns server active status

**Kind**: instance method of [<code>MockWSv2Server</code>](#MockWSv2Server)  
**Returns**: <code>boolean</code> - open  
<a name="MockWSv2Server+listen"></a>

### mockWSv2Server.listen()
Starts the API server listening on the configured port. This is a no-op if
the server is already up

**Kind**: instance method of [<code>MockWSv2Server</code>](#MockWSv2Server)  
**Overrides**: [<code>listen</code>](#MockServer+listen)  
<a name="MockWSv2Server+close"></a>

### mockWSv2Server.close() ⇒ <code>Promise</code>
Closes the API server if it is running; This is a no-op if it is not.

**Kind**: instance method of [<code>MockWSv2Server</code>](#MockWSv2Server)  
**Overrides**: [<code>close</code>](#MockServer+close)  
**Returns**: <code>Promise</code> - p  
<a name="MockWSv2Server+once"></a>

### mockWSv2Server.once(eventName, cb)
Configures an event handler to be called once when the specified event is
emitted by the API server. No-op if the server is not yet up.

**Kind**: instance method of [<code>MockWSv2Server</code>](#MockWSv2Server)  

| Param | Type | Description |
| --- | --- | --- |
| eventName | <code>string</code> | event name |
| cb | <code>function</code> | callback |

<a name="MockWSv2Server+send"></a>

### mockWSv2Server.send(packet)
Sends the provided packet to all connected clients

**Kind**: instance method of [<code>MockWSv2Server</code>](#MockWSv2Server)  

| Param | Type | Description |
| --- | --- | --- |
| packet | <code>object</code> \| <code>Array</code> | stringifed before being sent |

<a name="MockServer+getResponse"></a>

### mockWSv2Server.getResponse(key) ⇒ <code>string</code>
Returns the configured server response for the given key

**Kind**: instance method of [<code>MockWSv2Server</code>](#MockWSv2Server)  
**Overrides**: [<code>getResponse</code>](#MockServer+getResponse)  
**Returns**: <code>string</code> - response - JSON  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | key |

<a name="MockServer+setResponse"></a>

### mockWSv2Server.setResponse(key, data)
Sets the provided data as the server response for the given key.

**Kind**: instance method of [<code>MockWSv2Server</code>](#MockWSv2Server)  
**Overrides**: [<code>setResponse</code>](#MockServer+setResponse)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | key |
| data | <code>Array</code> \| <code>object</code> | data |

