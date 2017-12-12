'use strict'

const WebSocket = require('ws')
const debug = require('bfx:api-mock-srv:ws2')
const path = require('path')
const Server = require('../server')

class WS2Server extends Server {
  constructor (args = { apiPort: 9997, cmdPort: 9996, listen: true }) {
    super(args, path.join(__dirname, '../../data/ws2.json'))

    this._apiPort = args.apiPort || 9997

    this._cmdServer.post('/send', this._onSendCommand.bind(this))

    if (listen) {
      this.listen()
    }
  }

  _sendResponse (key, ws) {
    if (!this._responses.has(key)) {
      return ws.send(JSON.stringify({
        error: 'no response configured'
      }))
    }

    ws.send(JSON.stringify(this._responses.get(key)))
  }

  listen () {
    if (this._wss !== null) return

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
    if (this._wss === null) return

    this._wss.once('close', () => this._wss = null)
    this._wss.close()

    debug('ws2 api server closed')
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

    this._sendResponse('server.info')
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
      if (msg[1] !== 'on') return

      // For order conf requests
      // TODO: Split this up to notify on cancel, fill, etc
      this._sendResponse('n.on-req', ws)
    }
  }

  _handleAuthMessage (ws, msg) {
    this._sendResponse('server.auth', ws)

    debug('client authenticated')
  }

  _handleSubscribeMessage (ws, msg) {
    this._sendResponse('channel.subscribed', ws)

    debug('client subscribed to channel %s', msg.channel)
  }
}

module.exports = MockWSServer
