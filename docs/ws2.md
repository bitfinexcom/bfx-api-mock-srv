<a name="WS2Server"></a>

## WS2Server
Acts as a mock for v2 of the Bitfinex websocket API. Responses to available
commands are loaded from data/ws2.json and can be modified at runtime. The
command API allows for arbitrary packets to be injected into the ws stream.

If `syncOnConnect` is true, clients receive snapshots when connecting

Responses are of the form [{ packets: [...] }], where mulitple packets are
sent in order. A packet can be a string referencing another response by key.

**Kind**: global class  
**See**: ws2.json  

* [WS2Server](#WS2Server)
    * [new WS2Server(args)](#new_WS2Server_new)
    * [.listen()](#WS2Server+listen)
    * [.close()](#WS2Server+close) ⇒ <code>Promise</code>
    * [.once(eventName, cb)](#WS2Server+once)
    * [.send(packet)](#WS2Server+send)

<a name="new_WS2Server_new"></a>

### new WS2Server(args)
Spawns a new mock WS2 API server. Supported commands:
  POST /send - body is parsed as JSON and sent to all clients
  POST /config - body is parsed as JSON, and valid config keys are saved


| Param | Type | Description |
| --- | --- | --- |
| args | <code>Object</code> |  |
| args.apiPort | <code>number</code> | which port to listen on for ws clients |
| args.cmdPort | <code>number</code> | which port to listen on for commands |
| args.syncOnConnect | <code>boolean</code> | send snapshots to clients on connect |
| args.listen | <code>boolean</code> | if true, listen() is called automatically |

<a name="WS2Server+listen"></a>

### wS2Server.listen()
Starts the API server listening on the configured port. This is a no-op if
the server is already up

**Kind**: instance method of [<code>WS2Server</code>](#WS2Server)  
<a name="WS2Server+close"></a>

### wS2Server.close() ⇒ <code>Promise</code>
Closes the API server if it is running; This is a no-op if it is not.

**Kind**: instance method of [<code>WS2Server</code>](#WS2Server)  
**Returns**: <code>Promise</code> - p - resolves/rejects on success/error  
<a name="WS2Server+once"></a>

### wS2Server.once(eventName, cb)
Configures an event handler to be called once when the specified event is
emitted by the API server. No-op if the server is not yet up.

**Kind**: instance method of [<code>WS2Server</code>](#WS2Server)  

| Param | Type |
| --- | --- |
| eventName | <code>string</code> | 
| cb | <code>function</code> | 

<a name="WS2Server+send"></a>

### wS2Server.send(packet)
Sends the provided packet to all connected clients

**Kind**: instance method of [<code>WS2Server</code>](#WS2Server)  

| Param | Type | Description |
| --- | --- | --- |
| packet | <code>\*</code> | stringifed before being sent |

