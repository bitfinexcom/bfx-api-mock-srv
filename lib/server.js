'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const debug = require('debug')('bfx:api-mock-srv:server')
const fs = require('fs')

/**
 * Mock server base class, listens for commands to get/set responses
 */
class Server {
  /**
   * @param {Object} args
   * @param {number} cmdPort - port to listen on for HTTP command API
   * @param {string} dataPath - path to JSON file with responses
   */
  constructor (args = { cmdPort: 9998 }, dataPath) {
    this._cmdServer = express()
    this._cmdServer.use(bodyParser.json())
    this._cmdServerHTTP = null
    this._cmdPort = args.cmdPort || 9998
    this._responses = new Map()

    this._cmdServer.get('/:key', this._onGetResponse.bind(this))
    this._cmdServer.post('/:key', this._onSetResponse.bind(this))

    if (dataPath) {
      this._loadResponsesFromFile(dataPath)
    }
  }

  /**
   * Clears & resets the responses map with the contents of the specified file.
   * Responses are unmodified on failure.
   *
   * @param {string} path
   */
  _loadResponsesFromFile (path) {
    let data

    try {
      const dataJSON = fs.readFileSync(path)
      data = JSON.parse(dataJSON)
    } catch (e) {
      debug('error loading data from path %s: %j', path, e)
      return
    }

    const keys = Object.keys(data)
    this._responses.clear()

    for (let i = 0; i < keys.length; i++) {
      this._responses.set(keys[i], data[keys[i]])
    }
  }

  listen () {
    if (this._cmdServerHTTP) return

    this._cmdServerHTTP = this._cmdServer.listen(this._cmdPort)
    debug('cmd server listening on port %d', this._cmdPort)
  }

  close () {
    if (!this._cmdServerHTTP) return Promise.resolve()

    return new Promise((resolve, reject) => {
      this._cmdServerHTTP.close((err) => {
        if (err) return reject(err)

        this._cmdServerHTTP = null
        debug('cmd server closed')
        resolve()
      })
    })
  }

  _onGetResponse (req, res) {
    const key = decodeURIComponent(req.params.key)
    const data = this.getResponse(key)

    if (!data) {
      return res.status(404).json({
        error: 'unknown key'
      })
    }

    res.status(200).json(data)
  }

  _onSetResponse (req, res) {
    const key = decodeURIComponent(req.params.key)
    const set = this.setResponse(key, req.body)

    if (!set) {
      return res.status(404).json({
        error: 'unknown key'
      })
    }

    res.sendStatus(200)
    debug('updated response for key %s', key)
  }

  getResponse (key) {
    return this._responses.get(key)
  }

  setResponse (key, data) {
    this._responses.set(key, JSON.stringify(data))
    return true
  }
}

module.exports = Server
