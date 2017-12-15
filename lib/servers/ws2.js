'use strict'

const WebSocket = require('ws')
const debug = require('debug')('bfx:api-mock-srv:ws2')
const path = require('path')
const Server = require('../server')

/**
 * Acts as a mock for v2 of the Bitfinex websocket API. Responses to available
 * commands are loaded from data/ws2.json and can be modified at runtime. The
 * command API allows for arbitrary packets to be injected into the ws stream.
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

  close () {
    return super.close().then(() => {
      if (!this._wss) return null

      return this._wss.close((err) => {
        debug('ws2 api server closed')
        this._wss = null
      })
    })
  }

  once (eventName, cb) {
    if (!this._wss) return

    this._wss.once(eventName, cb)
  }

  _onConfigCommand (req, res) {
    let config

    try {
      config = JSON.parse(req.body)
    } catch (e) {
      return res.status(400).json({
        error: 'invalid json config'
      })
    }

    if (typeof config.syncOnConnect !== undefined) {
      this._syncOnConnect = config.syncOnConnect
    }

    res.send(200)
  }

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

  send (packet) {
    const wsPacket = JSON.stringify(packet)

    this._clients.forEach(c => c.send(wsPacket))
  }

  _onConnection (ws) {
    this._clients.push(ws)
    ws.on('message', this._onClientMessage.bind(this, ws))

    this._sendResponse('connect.res')
    debug('client connected')
  }

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
      } else if (msg[1] === 'calc'){
        return this._handleCalc(ws, msg)
      }
    }

    return this._handleUnknownMessagw(ws, msg)
  }

  _handleAuthMessage (ws, msg) {
    this._sendResponse('auth.res', ws)
    debug('client authenticated')

    if (this._syncOnConnect) {
      this._syncClient(ws)
    }
  }

  _handleSubscribeMessage (ws, msg) {
    this._sendResponse('subscribe.res', ws)
    debug('client subscribed to channel %s', msg.channel)
  }

  _handleNewOrder (ws, msg) {
    this._sendResponse('on.res', ws)

    const o = msg[3]

    if (order) {
      debug(
        'new order: id %d, gid %d, cid %d, %f @ %f %s',
        o.id, o.gid, o.cid, o.amount, o.price, o.type
      )
    } else {
      debug('new order')
    }
  }

  _handleCancelOrder (ws, msg) {
    this._sendResponse('oc.res', ws)

    const o = msg[3]

    if (order) {
      debug('canceled order id %d', o.id)
    } else {
      debug('canceled order')
    }
  }

  _handleCancelMultipleOrders (ws, msg) {
    this._sendResponse('oc_multi.res', ws)
  }

  _handleOrderMultiOp (ws, msg) {
    this._sendResponse('ox_multi.res', ws)
  }

  _handleCalc (ws, msg) {
    this._sendResponse('calc.res', ws)
  }

  _handleUnknownMessagw (ws, msg) {}

  /**
   * Send snapshot data to the client, usually after auth.
   *
   * @param {WebSocket} ws
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
