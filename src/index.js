var path = require('path')
var fs = require('fs')
const LRU = require('lru-cache')
const _ = require('lodash')
const uuid = require('node-uuid')

const Messenger = require('./messenger')
const actions = require('./actions')
const outgoing = require('./outgoing')
const ngrok = require('./ngrok')

var loadConfigFromFile = (file) => {

  if(!fs.existsSync(file)){
    const config = {
      applicationID: "",
      accessToken : "",
      appSecret : "",
      verifyToken : uuid.v4(),
      validated: false,
      connected: false,
      hostname: '',
      ngrok: false,
      displayGetStarted : false,
      greetingMessage : "Default greeting message",
      persistentMenu : false,
      persistentMenuItems : [],
      automaticallyMarkAsRead : false,
      trustedDomains : []
    }
    saveConfigToFile(config,file)
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"))
}

var saveConfigToFile = (config, file) => {
  fs.writeFileSync(file, JSON.stringify(config))
}

let messenger = null

const outgoingMiddleware = (event, next) => {
  if(event.platform !== 'facebook') {
    return next()
  }

  if(!outgoing[event.type]) {
    return next('Unsupported event type: ' + event.type)
  }

  outgoing[event.type](event, next, messenger)
}

module.exports = {
  init: function(bp) {

    bp.registerMiddleware({
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
      var pipeName = name.replace(/^create/, 'pipe')
      bp.messenger[pipeName] = function() {
        var msg = action.apply(this, arguments)
        bp.outgoing(msg)
      }
    })
  },
  ready: function(bp) {
    const file = path.join(bp.projectLocation, bp.botfile.modulesConfigDir, 'botpress-messenger.json')
    const config = loadConfigFromFile(file)

    messenger = new Messenger(bp, config);

    const users = require('./users')(bp, messenger);

    const messagesCache = LRU({
      max: 10000,
      maxAge: 60 * 60 * 1000
    })

    messenger.on('message', function(payload) {
      const userId = payload.sender.id
      const mid = payload.message.mid

      if(messagesCache.has(mid)) {
        // We already processed this message
        return
      } else {
        // Mark it as processed
        messagesCache.set(mid, true)
      }

      users.getOrFetchUserProfile(userId)
      .then((profile) => {
        // push the message to the incoming middleware
        bp.incoming({
          platform: 'facebook',
          type: 'message', // TODO make this more specific
          user: profile,
          text: payload.message.text, // TODO make this more specific
          raw: payload
        })
      })
    });

    bp.getRouter("botpress-messenger")
    .get("/config", (req, res, next) => {
      res.send(messenger.getConfig())
    })

    bp.getRouter("botpress-messenger")
      .post("/config", (req, res, next) => {
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
    .get('/ngrok', (req, res, next) => {
      ngrok.getUrl()
      .then(url => res.send(url))
    })

    bp.getRouter('botpress-messenger')
    .post('/connection', (req, res, next) => {
      if(messenger.getConfig().connected) {
        messenger.disconnect()
        .then(() => res.sendStatus(200))
        .catch((err) => res.status(500).send({ message: err.message }))
      } else {
        messenger.connect()
        .then(() => res.sendStatus(200))
        .catch((err) => res.status(500).send({ message: err.message }))
      }
    })

    bp.getRouter("botpress-messenger")
    .post("/validation", (req, res, next) => {
      messenger.sendValidationRequest(req.body.applicationID, req.body.accessToken)
      .then((json) => {
        res.send(json)
      })
      .catch((err) => {
        res.status(500).send({message:err.message})
      })
    })
  }
}
