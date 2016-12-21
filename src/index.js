const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const uuid = require('uuid')
const Promise = require('bluebird')

const Messenger = require('./messenger')
const actions = require('./actions')
const outgoing = require('./outgoing')
const incoming = require('./incoming')
const ngrok = require('./ngrok')

/**
 * Load config from given file path
 *
 * If the file doesn't exist,
 * then it will write default one into the given file path
 *
 * @param {string} file - the file path
 * @return {Object} config object
 */
const loadConfigFromFile = file => {

  if (!fs.existsSync(file)) {
    const config = {
      applicationID: '',
      accessToken : '',
      appSecret : '',
      verifyToken : uuid.v4(),
      validated: false,
      connected: false,
      hostname: '',
      ngrok: false,
      displayGetStarted : false,
      greetingMessage : 'Default greeting message',
      persistentMenu : false,
      persistentMenuItems : [],
      automaticallyMarkAsRead : true,
      trustedDomains : [],
      autoRespondGetStarted: true,
      autoResponse: 'Hello!'
    }
    saveConfigToFile(config, file)
  }

  return overwriteConfig(file)
}

const overwriteConfig = file => {
  let config = JSON.parse(fs.readFileSync(file))

  if (!config.verifyToken || config.verifyToken.length <= 1) {
    config.verifyToken = uuid.v4()
    saveConfigToFile(config, file)
  }

  if (process.env.MESSENGER_APP_ID) {
    config.applicationID = process.env.MESSENGER_APP_ID
  }

  if (process.env.MESSENGER_ACCESS_TOKEN) {
    config.accessToken = process.env.MESSENGER_ACCESS_TOKEN
  }

  if (process.env.MESSENGER_APP_SECRET) {
    config.appSecret = process.env.MESSENGER_APP_SECRET
  }

  return config
}

var saveConfigToFile = (config, file) => {
  fs.writeFileSync(file, JSON.stringify(config))
}

let messenger = null
const outgoingPending = outgoing.pending

const outgoingMiddleware = (event, next) => {
  if (event.platform !== 'facebook') {
    return next()
  }

  if (!outgoing[event.type]) {
    return next('Unsupported event type: ' + event.type)
  }

  const setValue = method => (...args) => {
    if (event.__id && outgoingPending[event.__id]) {

      if (args && args[0] && args[0].message_id) {
        let ts = args[0].message_id.split(':')[0]
        ts = ts && ts.substr(4)
        outgoingPending[event.__id].timestamp = parseInt(ts)
        outgoingPending[event.__id].mid = args[0].message_id
      }

      if (method === 'resolve' && (event.raw.waitDelivery || event.raw.waitRead)) {
        // We skip setting this value because we wait
      } else {
        outgoingPending[event.__id][method].apply(null, args)
        delete outgoingPending[event.__id]
      }
    }
  }
  
  outgoing[event.type](event, next, messenger)
  .then(setValue('resolve'), setValue('reject'))
}

module.exports = {
  init: function(bp) {

    bp.middlewares.register({
      name: 'messenger.sendMessages',
      type: 'outgoing',
      order: 100,
      handler: outgoingMiddleware,
      module: 'botpress-messenger',
      description: 'Sends out messages that targets platform = messenger.' +
      ' This middleware should be placed at the end as it swallows events once sent.'
    })

    bp.messenger = {}
    _.forIn(actions, (action, name) => {
      var sendName = name.replace(/^create/, 'send')
      bp.messenger[sendName] = Promise.method(function() {
        var msg = action.apply(this, arguments)
        msg.__id = new Date().toISOString() + Math.random()
        const resolver = { event: msg }
        
        const promise = new Promise(function(resolve, reject) {
          resolver.resolve = resolve
          resolver.reject = reject
        })
        
        outgoingPending[msg.__id] = resolver
        
        bp.middlewares.sendOutgoing(msg)
        return promise
      })
    })
  },
  ready: function(bp) {
    const file = path.join(bp.projectLocation, bp.botfile.modulesConfigDir, 'botpress-messenger.json')
    const config = loadConfigFromFile(file)

    messenger = new Messenger(bp, config)

    // regenerate a new ngrok url and update it to facebook
    if (config.ngrok && config.connected) {
      bp.logger.debug('[messenger] updating ngrok to facebook')
      ngrok.getUrl(bp.botfile.port)
      .then(url => {
        messenger.setConfig({ hostname: url.replace(/https:\/\//i, '') })
        saveConfigToFile(messenger.getConfig(), file)
        return messenger.updateSettings()
        .then(() => messenger.connect())
      })
      .then(() => bp.notifications.send({
        level: 'info',
        message: 'Upgraded messenger app webhook with new ngrok url'
      }))
      .catch(err => {
        bp.logger.error('[messenger] error updating ngrok', err)
        bp.notifications.send({
          level: 'error',
          message: 'Error updating app webhook with new ngrok url. Please see logs for details.'
        })
      })
    }

    incoming(bp, messenger)

    bp.getRouter('botpress-messenger')
    .get('/config', (req, res) => {
      res.send(messenger.getConfig())
    })

    bp.getRouter('botpress-messenger')
    .post('/config', (req, res) => {
      messenger.setConfig(req.body)
      saveConfigToFile(messenger.getConfig(), file)
      messenger.updateSettings()
      .then(() => {
        res.sendStatus(200)
      })
      .catch((err) => {
        res.status(500).send({ message: err.message })
      })
    })

    bp.getRouter('botpress-messenger')
    .get('/ngrok', (req, res) => {
      ngrok.getUrl()
      .then(url => res.send(url))
    })

    bp.getRouter('botpress-messenger')
    .post('/connection', (req, res) => {
      if (messenger.getConfig().connected) {
        messenger.disconnect()
        .then(() => res.sendStatus(200))
        .catch((err) => res.status(500).send({ message: err.message }))
      } else {
        messenger.connect()
        .then(() => res.sendStatus(200))
        .catch((err) => res.status(500).send({ message: err.message }))
      }
    })

    bp.getRouter('botpress-messenger')
    .post('/validation', (req, res) => {
      messenger.sendValidationRequest()
      .then((json) => {
        res.send(json)
      })
      .catch((err) => {
        res.status(500).send({ message: err.message })
      })
    })

    bp.getRouter('botpress-messenger')
    .get('/homepage', (req, res) => {
      const packageJSON = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json')))
      res.send({ homepage: packageJSON.homepage })
    })
  }
}
