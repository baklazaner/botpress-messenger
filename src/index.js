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
      applicationID: "614024858763519",
      accessToken : "EAAIuc82XAP8BALmmjJ7rD3pbakkzCXpz3Pq311bYAMIYw5nzXW8SoGoNqiZAEqAiHo1HdZA9MrUpgcfc5dp6KsZBi9oq3ZBs4sGorCcod0uZBYsd61HYdfA0SfPv6EZCral46cxNFHmhKI4vb46vAWuEmD3KOuW8ZAimyTXlv1GWAZDZD",
      appSecret : "ffb21fa310eabaac543407bae8404869",
      verifyToken : uuid.v4(),
      validated: false,
      connected: false,
      hostname: '',
      ngrok: false,
      displayGetStarted : false,
      greetingMessage : "Basic Greeting Message",
      persistentMenu : false,
      persistentMenuItems : [
        { type: "postback", title: "Text Postback", value: "postback text" },
        { type: "url", title: "Text url", value: "http://www.facebook.com" }
      ],
      automaticallyMarkAsRead : false,
      trustedDomains : ['http://www.facebook.com', 'http://www.google.com']
    }
    saveConfigToFile(config,file)
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"))
}

var saveConfigToFile = (config, file) => {
  fs.writeFileSync(file, JSON.stringify(config))
}

let messenger = null

module.exports = {
  outgoing: function(event, next) {

    if(event.platform !== 'facebook') {
      return next()
    }

    if(!messenger) {
      return next('Module is not initialized yet.')
    }

    if(!outgoing[event.type]) {
      return next('Unsupported event type: ' + event.type)
    }

    outgoing[event.type](event, next, messenger)
  },
  init: function(bp) {
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
