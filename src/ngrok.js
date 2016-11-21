'use strict'

const Promise = require('bluebird')
const ngrok = require('ngrok')
let url = null

module.exports = {
  getUrl: (port) => {
    if (url) {
      return Promise.resolve(url)
    }

    return Promise.fromCallback(callback => {
      ngrok.connect(port || 3000, callback)
    })
    .then(u => url = u)
  },
  stop: () => {
    if (url) {
      ngrok.disconnect(url)
      url = null
    }
  }
}
