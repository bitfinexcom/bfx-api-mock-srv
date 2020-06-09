'use strict'

const WS = require('ws')
const path = require('path')
const express = require('express') // eslint-disable-line
const _isArray = require('lodash/isArray')
const _isEmpty = require('lodash/isEmpty')
const _isString = require('lodash/isString')
const _isUndefined = require('lodash/isUndefined')
const debug = require('debug')('bfx:api-mock-srv:ws2')

const MockServer = require('../server')

/**
 * Acts as a mock for v2 of the Bitfinex websocket API. Responses to available
 * commands are loaded from data/ws2.json and can be modified at runtime. The
 * command API allows for arbitrary packets to be injected into the ws stream.
 *
 * Responses are of the form `[{ packets: [...] }]`, where mulitple packets are
 * sent in order. A packet can be a string referencing another response by key.
 *
 * @class
 * @augments MockServer
 */
class MockWSv2Server extends MockServer {
  /**
   * Spawns a new mock WS2 API server. Supported commands:
   * - POST /send - body is parsed as JSON and sent to all clients
   * - POST /config - body is parsed as JSON, and valid config keys are saved
   *
   * @param {object} [args=[]] - arguments
   * @param {number} [args.apiPort=9997] - which port to listen on for ws
   *   clients
   * @param {number} [args.cmdPort=9996] - which port to listen on for commands
   * @param {boolean} [args.syncOnConnect=true] - send snapshots to clients on
   *   connect
   * @param {boolean} [args.listen=true] - if true, listen() is called
   *   automatically
   */
  constructor (args = {}) {
    const {
      apiPort = 9997, cmdPort = 9996, syncOnConnect = true, listen = true
    } = args

    super({ cmdPort }, path.join(__dirname, '../../data/ws2.json'))

    this._apiPort = apiPort
    this._syncOnConnect = syncOnConnect

    this._cmdServer.post('/send', this._onSendCommand.bind(this))
    this._cmdServer.post('/config', this._onConfigCommand.bind(this))

    if (listen) {
      this.listen()
    }
  }

  /**
   * Returns server active status
   *
   * @returns {boolean} open
   */
  isOpen () {
    return !!this._wss
  }

  /**
   * @private
   *
   * @param {string} key - key
   * @param {WS.WebSocket} ws - ws client
   */
  _sendResponse (key, ws) {
    if (!this._responses.has(key)) {
      ws.send(JSON.stringify({ error: 'no response configured' }))
      return
    }

    const packets = this._prepareResponsePackets(key)

    if (_isEmpty(packets)) {
      return // no response
    }

    for (let i = 0; i < packets.length; i++) {
      ws.send(JSON.stringify(packets[i]))
    }
  }

  /**
   * @private
   *
   * @param {string} key - key
   * @returns {Array} packets
   */
  _prepareResponsePackets (key) {
    const res = this._responses.get(key)

    if (!res || !res.packets || res.packets.length === 0) {
      return []
    }

    const responsePackets = []
    let packet

    for (let i = 0; i < res.packets.length; i++) {
      if (!res.packets[i]) {
        continue
      }

      packet = res.packets[i]

      if (_isString(packet)) { // ref to another response
        this._prepareResponsePackets(packet).forEach((p) => {
          responsePackets.push(p)
        })
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

    this._wss = new WS.Server({
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
   * @async
   * @returns {Promise} p
   */
  async close () {
    await super.close()

    if (!this._wss) {
      return
    }

    this._wss.close((err) => {
      if (err) {
        debug('error: %s', err)
      } else {
        debug('ws2 api server closed')
        this._wss = null
      }
    })
  }

  /**
   * Configures an event handler to be called once when the specified event is
   * emitted by the API server. No-op if the server is not yet up.
   *
   * @param {string} eventName - event name
   * @param {Function} cb - callback
   */
  once (eventName, cb) {
    if (!this._wss) {
      return
    }

    this._wss.once(eventName, cb)
  }

  /**
   * @private
   *
   * @param {express.Request} req - request
   * @param {express.Response} res - response
   */
  _onConfigCommand (req, res) {
    let config

    try {
      config = JSON.parse(req.body)
    } catch (e) {
      res.status(400).json({ error: 'invalid json config' })
      return
    }

    if (!_isUndefined(config.syncOnConnect)) {
      this._syncOnConnect = config.syncOnConnect
    }

    res.send(200)
  }

  /**
   * @private
   *
   * @param {express.Request} req - request
   * @param {express.Response} res - response
   */
  _onSendCommand (req, res) {
    let packet

    try {
      packet = JSON.parse(req.body)
    } catch (e) {
      res.status(400).json({ error: 'invalid json data' })
      return
    }

    this.send(packet)
    res.send(200)

    debug('sent packet to clients: %j', packet)
  }

  /**
   * Sends the provided packet to all connected clients
   *
   * @param {object|Array} packet - stringifed before being sent
   */
  send (packet) {
    const wsPacket = JSON.stringify(packet)

    this._clients.forEach(c => c.send(wsPacket))
  }

  /**
   * @private
   *
   * @param {WS.WebSocket} ws - ws client
   */
  _onConnection (ws) {
    this._clients.push(ws)
    ws.on('message', this._onClientMessage.bind(this, ws))

    this._sendResponse('connect.res', ws)
    debug('client connected')
  }

  /**
   * @private
   *
   * @param {WS.WebSocket} ws - ws client
   * @param {string} msgJSON - message as SON
   */
  _onClientMessage (ws, msgJSON) {
    const msg = JSON.parse(msgJSON)

    this.emit('message', ws, msg)

    if (msg.event === 'auth') {
      this._handleAuthMessage(ws)
    } else if (msg.event === 'subscribe') {
      this._handleSubscribeMessage(ws, msg)
    } else if (_isArray(msg)) {
      if (msg[0] !== 0) {
        return
      }

      if (msg[1] === 'on') {
        this._handleNewOrder(ws, msg)
      } else if (msg[1] === 'oc') {
        this._handleCancelOrder(ws, msg)
      } else if (msg[1] === 'oc_multi') {
        this._handleCancelMultipleOrders(ws)
      } else if (msg[1] === 'ox_multi') {
        this._handleOrderMultiOp(ws)
      } else if (msg[1] === 'calc') {
        this._handleCalc(ws)
      }
    }
  }

  /**
   * @private
   *
   * @param {WS.WebSocket} ws - ws client
   */
  _handleAuthMessage (ws) {
    this._sendResponse('auth.res', ws)
    debug('client authenticated')

    if (this._syncOnConnect) {
      this._syncClient(ws)
    }
  }

  /**
   * @private
   *
   * @param {WS.WebSocket} ws - ws client
   * @param {object} msg - message
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
   *
   * @param {WS.WebSocket} ws - ws client
   * @param {Array} msg - message
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
   *
   * @param {WS.WebSocket} ws - ws client
   * @param {Array} msg - message
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
   *
   * @param {WS.WebSocket} ws - ws client
   */
  _handleCancelMultipleOrders (ws) {
    this._sendResponse('oc_multi.res', ws)
  }

  /**
   * @private
   *
   * @param {WS.WebSocket} ws - ws client
   */
  _handleOrderMultiOp (ws) {
    this._sendResponse('ox_multi.res', ws)
  }

  /**
   * @private
   *
   * @param {WS.WebSocket} ws - ws client
   */
  _handleCalc (ws) {
    this._sendResponse('calc.res', ws)
  }

  /**
   * Send snapshot data to the client, usually after auth.
   *
   * @private
   *
   * @param {WS.WebSocket} ws - ws client
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

module.exports = MockWSv2Server
