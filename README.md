# Bitfinex API Mock Server

This repo hosts mock servers for the WSv2 and RESTv2 Bitfinex APIs, and is intended for testing the Bitfinex API libraries.

### Features

* Provides realistic API responses for WSv2
* Provides configurable responses for RESTv2
* Allows for basic testing of API libraries without a live API connection

### Installation

```bash
npm i --save bfx-api-mock-srv
```

### Quickstart & Example
```js
const assert = require('assert')
const debug = require('debug')('bfx:api:mock-srv:examples:endpoint-test')
const { MockRESTv2Server } = require('bfx-api-mock-srv')
const { RESTv2 } = require('bfx-api-node-rest')

debug('spawning mock server...')

const srv = new MockRESTv2Server({ listen: true })
const rest = new RESTv2({
  apiKey: 'dummy',
  apiSecret: 'dummy',
  url: 'http://localhost:9999',
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
```

### Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request
