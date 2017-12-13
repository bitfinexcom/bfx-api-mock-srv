'use strict'

const assert = require('assert')
const { setWorldConstructor } = require('cucumber')
const WS2Server = require('../../../lib/servers/ws2')

class WS2AlterResponsesWorld {
  constructor () {
    this._ws = null
  }

  createServer () {
    assert(!this._ws)
    this._ws = new WS2Server({ listen: true })
  }

  resetServer () {
    return new Promise((resolve, reject) => {
      if (!this._ws) return resolve()

      this._ws.once('close', () => {
        this._ws = null
        resolve()
      })

      this._ws.close()
    }).then(() => {
      return this.createServer()
    })
  }
}

setWorldConstructor(WS2AlterResponsesWorld)

module.exports = WS2AlterResponsesWorld