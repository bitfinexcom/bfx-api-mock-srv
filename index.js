'use strict'

const MockServer = require('./lib/server')
const MockWSv2Server = require('./lib/ws2')
const MockRESTv2Server = require('./lib/rest2')

/**
 * This module hosts mock servers for the
 * {@link module:bfx-api-mock-srv.MockWSv2Server|WSv2} and
 * {@link module:bfx-api-mock-srv.MockRESTv2Server|RESTv2} Bitfinex APIs, and
 * is intended for testing the Bitfinex API libraries.
 *
 * @license Apache-2.0
 * @module bfx-api-mock-srv
 * @example
 * const { MockRESTv2Server } = require('bfx-api-mock-srv')
 *
 * const FUNDING_OFFER = [
 *   41215275, 'fUSD', 1524784806000, 1524784806000, 1000, 1000, 'FRRDELTAVAR',
 *   null, null, 0, 'ACTIVE', null, null, null, 0, 30, 0, 0, null, 0,
 *   0.00207328
 * ]
 *
 * debug('spawning mock server...')
 *
 * const srv = new MockRESTv2Server({ listen: true })
 * const rest = new RESTv2({
 *   apiKey: 'dummy',
 *   apiSecret: 'dummy',
 *   url: 'http://localhost:9999'
 * })
 *
 * srv.setResponse('f_offers.fUSD', [FUNDING_OFFER])
 *
 * debug('requesting preset response...')
 *
 * rest.fundingOffers('fUSD').then(([incomingFundingOffer]) => {
 *   assert.deepStrictEqual(incomingFundingOffer, FUNDING_OFFER)
 *
 *   debug('correct response received')
 *   srv.close()
 *
 *   return null
 * }).catch((e) => {
 *   debug(`error: ${e.message}`)
 * })
 */

module.exports = {
  MockServer,
  MockWSv2Server,
  MockRESTv2Server
}
