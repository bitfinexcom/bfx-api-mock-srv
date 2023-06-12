'use strict'

const express = require('express')
const Bluebird = require('bluebird')
const bodyParser = require('body-parser')
const _keys = require('lodash/keys')
const _isFunction = require('lodash/isFunction')
const _isUndefined = require('lodash/isUndefined')
const debug = require('debug')('bfx:api-mock-srv:rest2')

const MockServer = require('../server')
const RESTV2_MOCK_METHODS = require('./methods')

/**
 * REST v2 API server mock
 *
 * Exposes the same routes as the real API, and maps them to a response table.
 * Multiple potential responses can be defined for endpoints with arguments,
 * with the best match sent to clients on request.
 *
 * i.e. If the following responses are configured:
 * - `orders.tBTCUSD: [42]`
 * - `orders: [41]`
 *
 * A `GET` on `/v2/auth/r/orders/tBTCUSD/hist` would return `[42]`, but a query
 * for a different symbol (`tETHUSD`) would return `[41]`.
 *
 * @class
 * @augments MockServer
 */
class MockRESTv2Server extends MockServer {
  /**
   * @param {object} [args={}] - args
   * @param {number} [args.apiPort=9999] - API port number
   * @param {number} [args.cmdPort=9998] - command port number
   * @param {boolean} [args.listen=true] - enables auto listen()
   */
  constructor (args = {}) {
    const { apiPort = 9999, cmdPort = 9998, listen = true } = args

    super({ cmdPort })

    this._apiServer = express()
    this._apiServer.use(bodyParser.json())
    this._apiServerHTTP = null
    this._apiPort = apiPort

    _keys(RESTV2_MOCK_METHODS).forEach((route) => {
      const auth = route.split('/')[2] === 'auth'

      const routeData = RESTV2_MOCK_METHODS[route]
      let routeKey = routeData
      let routeType = auth ? 'post' : 'get'
      if(Array.isArray(routeData)) {
        routeKey = routeData[0]
        routeType = routeData[1].toLowerCase()
      }
      this._generateRoute(
        routeType, route, routeKey
      )
    })

    if (listen) {
      this.listen()
    }
  }

  /**
   * @static
   *
   * @param {express.Request} req - request
   * @param {string} routeKey - key
   * @returns {string[]} keys
   */
  static keysForRoute (req, routeKey) {
    const args = Object.assign(
      {}, req.params || {}, req.query || {}, req.body || {}
    )

    // Replace {tokens} with data values, where possible
    let tokens = routeKey.split('.').map((token) => {
      if (token[0] !== '{' || token[token.length - 1] !== '}') {
        return token
      }

      const val = args[token.substring(1, token.length - 1)]

      return _isUndefined(val) ? '' : val
    })

    const keys = []

    while (tokens.length > 0) {
      keys.push(tokens.join('.'))
      tokens = tokens.splice(0, tokens.length - 1)
    }

    return keys
  }

  /**
   * @private
   *
   * @param {string} type - 'post' or 'get'
   * @param {string} route - route
   * @param {string} routeKey - key
   */
  _generateRoute (type, route, routeKey) {
    this._apiServer[type](route, (req, res) => {
      const keys = MockRESTv2Server.keysForRoute(req, routeKey)

      // Check keys in order of token qty
      for (let i = 0; i < keys.length; i++) {
        if (this._responses.has(keys[i])) {
          const response = this._responses.get(keys[i])

          if (!response) continue // could be null

          try {
            const data = _isFunction(response) ? response() : JSON.parse(response)
            return res.json(data)
          } catch (err) {
            return res.status(500).json({
              error: 'bad response json'
            })
          }
        }
      }

      return res.status(404).json({
        error: 'unknown arguments',
        keys
      })
    })
  }

  /**
   * Starts the API server listening on the configured port. This is a no-op if
   * the server is already up
   */
  listen () {
    if (this._apiServerHTTP) {
      return
    }

    super.listen()
    this._apiServerHTTP = this._apiServer.listen(this._apiPort)

    debug('rest2 api server listening on port %d', this._apiPort)
  }

  /**
   * Closes the API server if it is running; This is a no-op if it is not.
   *
   * @async
   * @returns {Promise} p
   */
  async close () {
    await super.close()

    if (!this._apiServerHTTP) {
      return null
    }

    return new Bluebird((resolve, reject) => {
      this._apiServerHTTP.close((err) => {
        if (err) {
          reject(err)
          return
        }

        this._apiServerHTTP = null
        debug('rest2 api server closed')
        resolve()
      })
    })
  }
}

module.exports = MockRESTv2Server
