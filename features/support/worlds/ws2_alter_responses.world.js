'use strict'

const { setWorldConstructor } = require('cucumber')
const WS2Server = require('../../../lib/servers/ws2')

class WS2AlterResponsesWorld {
  constructor () {
    this._ws = null
  }

  startServer () {
    if (this._ws) return
    this._ws = new WS2Server({ listen: true })
  }

  stopServer () {
    if (!this._ws) return Promise.resolve()

    return this._ws.close().then(() => {
      this._ws = null
    })
  }
}

setWorldConstructor(WS2AlterResponsesWorld)

module.exports = WS2AlterResponsesWorld
