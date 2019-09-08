'use strict'

process.env.DEBUG = 'bfx:*'

const assert = require('assert')
const debug = require('debug')('bfx:api:mock-srv:examples:endpoint-test')
const { MockRESTv2Server } = require('../')
const { RESTv2 } = require('bfx-api-node-rest')

debug('spawning mock server...')

const srv = new MockRESTv2Server({ listen: true })
const rest = new RESTv2({
  apiKey: 'dummy',
  apiSecret: 'dummy',
  url: 'http://localhost:9999'
})

const fundingOffer = [
  41215275, 'fUSD', 1524784806000, 1524784806000, 1000, 1000, 'FRRDELTAVAR',
  null, null, 0, 'ACTIVE', null, null, null, 0, 30, 0, 0, null, 0, 0.00207328
]

srv.setResponse('f_offers.fUSD', [fundingOffer])

debug('requesting preset response...')

rest.fundingOffers('fUSD').then(([incomingFundingOffer]) => {
  assert.deepStrictEqual(incomingFundingOffer, fundingOffer)

  debug('correct response received')
  srv.close()
}).catch((e) => {
  debug(`error: ${e.message}`)
})
