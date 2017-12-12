'use strict'

const express = require('express')
const debug = require('bfx:api-mock-srv:rest2')
const Server = require('../server')

class REST2Server extends Server {
  constructor (args = { apiPort: 9999, cmdPort: 9998, listen: true }) {
    super(args)

    this._apiServer = express()
    this._apiPort = args.apiPort || 9999

    this._apiServer.get('/tickers', this._onGetTickers.bind(this))

    if (args.listen) {
      this.listen()
    }
  }

  listen () {
    super.listen()
    this._apiServer.listen(this._apiPort)

    debug('rest2 api server listening on port %d', this._apiPort)
  }

  _sendResponse (key, res) {
    if (!this._responses.has(key)) {
      return res.status(404).json({
        error: 'no response configured'
      })
    }

    res.json(this._responses.get(key))
  }

  _onGetTickers (req, res) {
    const symbols = (req.query.symbols || '').split(',')

    // do something with symbols

    this._sendResponse('tickers', res)
  }

  // more handlers

}

module.exports = Server
