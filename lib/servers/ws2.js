'use strict'

const WebSocket = require('ws')
const debug = require('debug')('bfx:api-mock-srv:ws2')
const path = require('path')
const Server = require('../server')

/**
 * Acts as a mock for v2 of the Bitfinex websocket API. Responses to available
 * commands are loaded from data/ws2.json and can be modified at runtime. The
 * command API allows for arbitrary packets to be injected into the ws stream.
 *
 * If `syncOnConnect` is true, clients receive snapshots when connecting
 *
 * Responses are of the form [{ packets: [...] }], where mulitple packets are
 * sent in order. A packet can be a string referencing another response by key.
 *
 * @see ws2.json
 */
class WS2Server extends Server {
  /**
   * Spawns a new mock WS2 API server. Supported commands:
   *   POST /send - body is parsed as JSON and sent to all clients
   *   POST /config - body is parsed as JSON, and valid config keys are saved
   *
   * @param {Object} args
   * @param {number} args.apiPort - which port to listen on for ws clients
   * @param {number} args.cmdPort - which port to listen on for commands
   * @param {boolean} args.syncOnConnect - send snapshots to clients on connect
   * @param {boolean} args.listen - if true, listen() is called automatically
   */
  constructor (args = {
    apiPort: 9997,
    cmdPort: 9996,
    syncOnConnect: true,
    listen: true
  }) {
    if (!args.cmdPort) args.cmdPort = 9996

    super(args, path.join(__dirname, '../../data/ws2.json'))

    this._apiPort = args.apiPort || 9997
    this._syncOnConnect = args.syncOnConnect === true

    this._cmdServer.post('/send', this._onSendCommand.bind(this))
    this._cmdServer.post('/config', this._onConfigCommand.bind(this))

    if (args.listen) {
      this.listen()
    }
  }

  /**
   * @private
   */
  _sendResponse (key, ws) {
    if (!this._responses.has(key)) {
      return ws.send(JSON.stringify({
        error: 'no response configured'
      }))
    }

    const packets = this._prepareResponsePackets(key)
    if (packets === null) return // no response

    for (let i = 0; i < packets.length; i++) {
      ws.send(JSON.stringify(packets[i]))
    }
  }

  /**
   * @private
   */
  _prepareResponsePackets (key) {
    const res = this._responses.get(key)
    if (!res || !res.packets || res.packets.length === 0) return null

    const responsePackets = []
    let packet

    for (let i = 0; i < res.packets.length; i++) {
      if (!res.packets[i]) continue
      packet = res.packets[i]

      if (typeof packet === 'string') { // ref to another response
        const subResPackets = this._prepareResponsePackets(packet)

        if (subResPackets !== null) {
          subResPackets.forEach(p => responsePackets.push(p))
        }
      } else {
        responsePackets.push(packet)
      }
    }

    return responsePackets
  }

  /**
   * Starts the API server listening on the configured port. This is a no-op if
   * the server is already up
   */
  listen () {
    if (this._wss) return

    super.listen()

    this._wss = new WebSocket.Server({
      perMessageDeflate: false,
      port: this._apiPort
    })

    this._clients = []
    this._wss.on('connection', this._onConnection.bind(this))

    debug('ws2 api server listening on port %d', this._apiPort)
  }

  /**
   * Closes the API server if it is running; This is a no-op if it is not.
   *
   * @return {Promise} p - resolves/rejects on success/error
   */
  close () {
    return super.close().then(() => {
      if (!this._wss) return null

      return this._wss.close((err) => {
        if (err) {
          console.error(err)
          return
        }

        debug('ws2 api server closed')
        this._wss = null
      })
    })
  }

  /**
   * Configures an event handler to be called once when the specified event is
   * emitted by the API server. No-op if the server is not yet up.
   *
   * @param {string} eventName
   * @param {Function} cb
   */
  once (eventName, cb) {
    if (!this._wss) return

    this._wss.once(eventName, cb)
  }

  /**
   * @private
   */
  _onConfigCommand (req, res) {
    let config

    try {
      config = JSON.parse(req.body)
    } catch (e) {
      return res.status(400).json({
        error: 'invalid json config'
      })
    }

    if (typeof config.syncOnConnect !== 'undefined') {
      this._syncOnConnect = config.syncOnConnect
    }

    res.send(200)
  }

  /**
   * @private
   */
  _onSendCommand (req, res) {
    let packet

    try {
      packet = JSON.parse(req.body)
    } catch (e) {
      return res.status(400).json({
        error: 'invalid json data'
      })
    }

    this.send(packet)
    res.send(200)

    debug('sent packet to clients: %j', packet)
  }

  /**
   * Sends the provided packet to all connected clients
   *
   * @param {*} packet - stringifed before being sent
   */
  send (packet) {
    const wsPacket = JSON.stringify(packet)

    this._clients.forEach(c => c.send(wsPacket))
  }

  /**
   * @private
   */
  _onConnection (ws) {
    this._clients.push(ws)
    ws.on('message', this._onClientMessage.bind(this, ws))

    this._sendResponse('connect.res', ws)
    debug('client connected')
  }

  /**
   * @private
   */
  _onClientMessage (ws, msgJSON) {
    const msg = JSON.parse(msgJSON)

    this.emit('message', ws, msg)

    if (msg.event === 'auth') {
      return this._handleAuthMessage(ws, msg)
    } else if (msg.event === 'subscribe') {
      return this._handleSubscribeMessage(ws, msg)
    } else if (Array.isArray(msg)) {
      if (msg[0] !== 0) return

      if (msg[1] === 'on') {
        return this._handleNewOrder(ws, msg)
      } else if (msg[1] === 'oc') {
        return this._handleCancelOrder(ws, msg)
      } else if (msg[1] === 'oc_multi') {
        return this._handleCancelMultipleOrders(ws, msg)
      } else if (msg[1] === 'ox_multi') {
        return this._handleOrderMultiOp(ws, msg)
      } else if (msg[1] === 'calc') {
        return this._handleCalc(ws, msg)
      }
    }

    return this._handleUnknownMessagw(ws, msg)
  }

  /**
   * @private
   */
  _handleAuthMessage (ws, msg) {
    this._sendResponse('auth.res', ws)
    debug('client authenticated')

    if (this._syncOnConnect) {
      this._syncClient(ws)
    }
  }

  /**
   * @private
   */
  _handleSubscribeMessage (ws, msg) {
    msg.event = 'subscribed'
    msg.chanId = Math.floor(Math.random() * 10000)

    ws.send(JSON.stringify(msg))

    // this._sendResponse('subscribe.res', ws)
    debug('client subscribed to channel %s', msg.channel)
  }

  /**
   * @private
   */
  _handleNewOrder (ws, msg) {
    this._sendResponse('on.res', ws)

    const o = msg[3]

    if (o) {
      debug(
        'new order: gid %d, cid %d, %f @ %f %s',
        o.gid, o.cid, o.amount, o.price, o.type
      )
    } else {
      debug('new order')
    }
  }

  /**
   * @private
   */
  _handleCancelOrder (ws, msg) {
    this._sendResponse('oc.res', ws)

    const o = msg[3]

    if (o) {
      debug('canceled order id %d', o.id)
    } else {
      debug('canceled order')
    }
  }

  /**
   * @private
   */
  _handleCancelMultipleOrders (ws, msg) {
    this._sendResponse('oc_multi.res', ws)
  }

  /**
   * @private
   */
  _handleOrderMultiOp (ws, msg) {
    this._sendResponse('ox_multi.res', ws)
  }

  /**
   * @private
   */
  _handleCalc (ws, msg) {
    this._sendResponse('calc.res', ws)
  }

  /**
   * @private
   */
  _handleUnknownMessagw (ws, msg) {}

  /**
   * Send snapshot data to the client, usually after auth.
   *
   * @param {WebSocket} ws
   * @private
   */
  _syncClient (ws) {
    this._sendResponse('ps', ws)
    this._sendResponse('ws', ws)
    this._sendResponse('os', ws)
    this._sendResponse('fos', ws)
    this._sendResponse('fcs', ws)
    this._sendResponse('fls', ws)
    this._sendResponse('ats', ws)
  }
}

module.exports = WS2Server
