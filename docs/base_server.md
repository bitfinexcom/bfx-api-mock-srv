<a name="Server"></a>

## Server
Mock server base class, listens for commands to get/set responses

**Kind**: global class  

* [Server](#Server)
    * [new Server(args, dataPath)](#new_Server_new)
    * [.listen()](#Server+listen)
    * [.close()](#Server+close) ⇒ <code>Promise</code>
    * [.getResponse(key)](#Server+getResponse) ⇒ <code>string</code>
    * [.setResponse(key, data)](#Server+setResponse)

<a name="new_Server_new"></a>

### new Server(args, dataPath)

| Param | Type | Description |
| --- | --- | --- |
| args | <code>Object</code> |  |
| args.cmdPort | <code>number</code> | port to listen on for HTTP command API |
| dataPath | <code>string</code> | path to JSON file with responses |

<a name="Server+listen"></a>

### server.listen()
Starts the HTTP command server listening on the configured port. This is
a no-op if the server is already up.

**Kind**: instance method of [<code>Server</code>](#Server)  
<a name="Server+close"></a>

### server.close() ⇒ <code>Promise</code>
Closes the command server if it is running, no-op if not.

**Kind**: instance method of [<code>Server</code>](#Server)  
**Returns**: <code>Promise</code> - p - resolves upon completion  
<a name="Server+getResponse"></a>

### server.getResponse(key) ⇒ <code>string</code>
Returns the configured server response for the given key

**Kind**: instance method of [<code>Server</code>](#Server)  
**Returns**: <code>string</code> - response - JSON  

| Param | Type |
| --- | --- |
| key | <code>string</code> | 

<a name="Server+setResponse"></a>

### server.setResponse(key, data)
Sets the provided data as the server response for the given key. Note that
the data is converted to JSON.

**Kind**: instance method of [<code>Server</code>](#Server)  

| Param | Type |
| --- | --- |
| key | <code>string</code> | 
| data | <code>\*</code> | 

