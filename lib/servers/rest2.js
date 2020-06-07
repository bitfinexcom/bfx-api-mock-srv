'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const debug = require('debug')('bfx:api-mock-srv:rest2')
const Server = require('../server')

const METHODS = {
  '/v2/ticker/:symbol': 'ticker.{symbol}',
  '/v2/tickers': 'tickers',
  '/v2/tickers/hist': 'tickers_hist',
  '/v2/stats1/:key/:context': 'stats.{key}.{context}',
  '/v2/status/:type': 'status_messages.{type}.{keys}',
  '/v2/candles/:key/:section': 'candles.{key}.{section}',
  '/v2/conf/pub([:])list([:])pair([:])exchange([:])inactive\*': 'inactive_symbols', // eslint-disable-line
  '/v2/conf/pub([:])list([:])pair([:])exchange\*': 'symbols', // eslint-disable-line
  '/v2/conf/pub([:])list([:])pair([:])futures\*': 'futures', // eslint-disable-line
  '/v2/conf/pub([:])list([:])pair([:])margin\*': 'margins', // eslint-disable-line
  '/v2/conf/pub([:])list([:])currency\*': 'currencies', // eslint-disable-line
  '/v2/trades/:symbol/hist': 'public_trades.{symbol}.{start}.{end}.{limit}.{sort}',
  '/v2/liquidations/hist': 'liquidations.{start}.{end}.{limit}.{sort}',
  '/v2/pulse/profile/:nickname': 'public_pulse_profile.{nickname}',
  '/v2/pulse/hist': 'public_pulse_hist',
  '/v2/calc/trade/avg': 'market_average_price.{symbol}.{amount}',

  '/v2/auth/r/alerts': 'alerts.{type}',
  '/v2/auth/w/alert/set': 'alert_set.{type}.{symbol}.{price}',
  '/v2/auth/w/alert/del': 'alert_del.{symbol}.{price}',
  '/v2/auth/w/deriv/collateral/set': 'derivs_pos_col_set.{symbol}.{collateral}',
  '/v2/auth/r/trades/hist': 'trades.{start}.{end}.{limit}.{sort}',
  '/v2/auth/r/trades/:symbol/hist': 'trades.{symbol}.{start}.{end}.{limit}.{sort}',
  '/v2/auth/r/wallets': 'wallets',
  '/v2/auth/r/logins/hist': 'logins_hist.{start}.{end}.{limit}',
  '/v2/auth/r/audit/hist': 'change_log.{start}.{end}.{limit}',
  '/v2/auth/r/wallets/hist': 'wallets_hist.{end}.{currency}',
  '/v2/auth/r/orders': 'active_orders',
  '/v2/auth/r/orders/hist': 'orders.{start}.{end}.{limit}',
  '/v2/auth/r/orders/:symbol/hist': 'orders.{symbol}.{start}.{end}.{limit}',
  '/v2/auth/r/order/:symID/trades': 'order_trades.{symID}.{start}.{end}.{limit}',
  '/v2/auth/r/positions': 'positions',
  '/v2/auth/r/positions/hist': 'positions_hist.{start}.{end}.{limit}',
  '/v2/auth/r/positions/snap': 'positions_snap.{start}.{end}.{limit}',
  '/v2/auth/r/positions/audit': 'positions_audit.{id}.{start}.{end}.{limit}',
  '/v2/auth/r/funding/offers/hist': 'f_offer_hist.{start}.{end}.{limit}',
  '/v2/auth/r/funding/offers/:symbol': 'f_offers.{symbol}',
  '/v2/auth/r/funding/offers/:symbol/hist': 'f_offer_hist.{symbol}.{start}.{end}.{limit}',
  '/v2/auth/r/funding/loans/hist': 'f_loan_hist.{start}.{end}.{limit}',
  '/v2/auth/r/funding/loans/:symbol': 'f_loans.{symbol}',
  '/v2/auth/r/funding/loans/:symbol/hist': 'f_loan_hist.{symbol}.{start}.{end}.{limit}',
  '/v2/auth/r/funding/credits/hist': 'f_credit_hist.{start}.{end}.{limit}',
  '/v2/auth/r/funding/credits/:symbol': 'f_credits.{symbol}',
  '/v2/auth/r/funding/credits/:symbol/hist': 'f_credit_hist.{symbol}.{start}.{end}.{limit}',
  '/v2/auth/r/funding/trades/:symbol/hist': 'f_trade_hist.{symbol}.{start}.{end}.{limit}',
  '/v2/auth/r/funding/trades/hist': 'f_trade_hist.{start}.{end}.{limit}',
  '/v2/auth/r/info/margin/:key': 'margin_info.{key}',
  '/v2/auth/r/info/funding/:key': 'f_info.{key}',
  '/v2/auth/r/stats/perf:1D/hist': 'performance',
  '/v2/auth/calc/order/avail': 'calc.{symbol}.{dir}.{rate}.{type}',
  '/v2/auth/r/ledgers/:symbol/hist': 'ledgers.{symbol}.{start}.{end}.{limit}',
  '/v2/auth/r/ledgers/hist': 'ledgers',
  '/v2/auth/r/movements/:symbol/hist': 'movements.{symbol}.{start}.{end}.{limit}',
  '/v2/auth/r/movements/hist': 'movements',
  '/v2/auth/r/info/user': 'user_info',
  '/v2/auth/r/int/summary': 'account_summary',
  '/v2/auth/w/pulse/add': 'add_pulse.{title}.{content}',
  '/v2/auth/w/pulse/del': 'delete_pulse.{pid}',
  '/v2/auth/r/pulse/hist': 'pulse_hist.{isPublic}',
  '/v2/auth/w/deposit/invoice': 'generate_invoice.{currency}.{wallet}.{amount}',
  '/v2/auth/w/funding/keep': 'keep_funding.{type}.{id}',
  '/v2/auth/w/order/cancel/multi': 'cancel_order_multi.{id}',
  '/v2/auth/w/order/multi': 'order_multi_op.{ops}'
}

/**
 * REST v2 API server mock
 *
 * Exposes the same routes as the real API, and maps them to a response table.
 * Multiple potential responses can be defined for endpoints with arguments,
 * with the best match sent to clients on request.
 *
 * i.e. If the following responses are configured:
 *   orders.tBTCUSD: [42],
 *   orders: [41]
 * A GET on /v2/auth/r/orders/tBTCUSD/hist would return [42], but a query for
 * a different symbol (tETHUSD) would return [41].
 */
class REST2Server extends Server {
  /**
   * @param {Object} args
   * @param {number} args.apiPort
   * @param {number} args.cmdPort
   * @param {boolean} args.listen - if true, listen() is called automatically
   */
  constructor (args = { apiPort: 9999, cmdPort: 9998, listen: true }) {
    super(args)

    this._apiServer = express()
    this._apiServer.use(bodyParser.json())
    this._apiServerHTTP = null
    this._apiPort = args.apiPort || 9999

    Object.keys(METHODS).forEach((route) => {
      const auth = route.split('/')[2] === 'auth'

      this._generateRoute(auth ? 'post' : 'get', route, METHODS[route])
    })

    if (args.listen) {
      this.listen()
    }
  }

  /**
   * @private
   */
  static _keysForRoute (req, routeKey) {
    const args = Object.assign(
      {}, req.params || {}, req.query || {}, req.body || {}
    )

    // Replace {tokens} with data values, where possible
    let tokens = routeKey.split('.').map((token) => {
      if (token[0] !== '{' || token[token.length - 1] !== '}') return token

      const val = args[token.substring(1, token.length - 1)]
      return typeof val !== 'undefined' ? val : ''
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
   */
  _generateRoute (type, route, routeKey) {
    this._apiServer[type](route, (req, res) => {
      const keys = REST2Server._keysForRoute(req, routeKey)

      // Check keys in order of token qty
      for (let i = 0; i < keys.length; i++) {
        if (this._responses.has(keys[i])) {
          const response = this._responses.get(keys[i])
          if (!response) continue // could be null

          try {
            return res.json(JSON.parse(response))
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
    if (this._apiServerHTTP) return

    super.listen()
    this._apiServerHTTP = this._apiServer.listen(this._apiPort)

    debug('rest2 api server listening on port %d', this._apiPort)
  }

  /**
   * Closes the API server if it is running; This is a no-op if it is not.
   *
   * @return {Promise} p - resolves/rejects on success/error
   */
  close () {
    return super.close().then(() => {
      if (!this._apiServerHTTP) return null

      return new Promise((resolve, reject) => {
        this._apiServerHTTP.close((err) => {
          if (err) return reject(err)

          this._apiServerHTTP = null
          debug('rest2 api server closed')
          resolve()
        })
      })
    })
  }

  /**
   * @private
   */
  _sendResponse (key, res) {
    if (!this._responses.has(key)) {
      return res.status(404).json({
        error: 'no response configured'
      })
    }

    res.json(this._responses.get(key))
  }
}

module.exports = REST2Server
