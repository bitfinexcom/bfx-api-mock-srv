<a name="REST2Server"></a>

## REST2Server
REST v2 API server mock

Exposes the same routes as the real API, and maps them to a response table.
Multiple potential responses can be defined for endpoints with arguments,
with the best match sent to clients on request.

i.e. If the following responses are configured:
  orders.tBTCUSD: [42],
  orders: [41]
A GET on /v2/auth/r/orders/tBTCUSD/hist would return [42], but a query for
a different symbol (tETHUSD) would return [41].

**Kind**: global class  

* [REST2Server](#REST2Server)
    * [new REST2Server(args)](#new_REST2Server_new)
    * [.listen()](#REST2Server+listen)
    * [.close()](#REST2Server+close) ⇒ <code>Promise</code>

<a name="new_REST2Server_new"></a>

### new REST2Server(args)

| Param | Type | Description |
| --- | --- | --- |
| args | <code>Object</code> |  |
| args.apiPort | <code>number</code> |  |
| args.cmdPort | <code>number</code> |  |
| args.listen | <code>boolean</code> | if true, listen() is called automatically |

<a name="REST2Server+listen"></a>

### resT2Server.listen()
Starts the API server listening on the configured port. This is a no-op if
the server is already up

**Kind**: instance method of [<code>REST2Server</code>](#REST2Server)  
<a name="REST2Server+close"></a>

### resT2Server.close() ⇒ <code>Promise</code>
Closes the API server if it is running; This is a no-op if it is not.

**Kind**: instance method of [<code>REST2Server</code>](#REST2Server)  
**Returns**: <code>Promise</code> - p - resolves/rejects on success/error  
