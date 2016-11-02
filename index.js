var path = require('path')
var fs = require('fs')

const Messenger = require('./messenger');
const LRU = require('lru-cache');


var loadConfigFromFile = (file) => {

  if(!fs.existsSync(file)){
    const config = {
      accessToken : "EAAIuc82XAP8BALmmjJ7rD3pbakkzCXpz3Pq311bYAMIYw5nzXW8SoGoNqiZAEqAiHo1HdZA9MrUpgcfc5dp6KsZBi9oq3ZBs4sGorCcod0uZBYsd61HYdfA0SfPv6EZCral46cxNFHmhKI4vb46vAWuEmD3KOuW8ZAimyTXlv1GWAZDZD",
      verifyToken : "Hello",
      appSecret : "ffb21fa310eabaac543407bae8404869"
    }
    saveConfigToFile(config,file)
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"))
}

var saveConfigToFile = (config, file) => {
  fs.writeFileSync(file, JSON.stringify(config))
}

module.exports = {
  ready: function(skin) {
    const file = path.join(skin.projectLocation, skin.botfile.modulesConfigDir, 'skin-messenger.json')
    const config = loadConfigFromFile(file)

    console.log(skin.incoming)

    const users = require('./users')(skin);

    const messenger = new Messenger({
      skin: skin,
      accessToken: config.accessToken,
      verifyToken: config.verifyToken,
      appSecret: config.appSecret
    });

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
        skin.incoming({
          platform: 'facebook',
          type: 'message', // TODO make this more specific
          user: profile,
          text: payload.message.text, // TODO make this more specific
          raw: payload
        })
      })
    });

    messenger.on('message', function(payload) {
      console.log(payload)
      messenger.sendTextMessage(payload.sender.id, 'you said: ' + payload.message.text, null, {typing:true})
    });

    skin.getRouter("skin-messenger")
    .get("/config", (req, res, next) => {
      res.send(config)
    })

    skin.getRouter("skin-messenger")
    .post("/config", (req, res, next) => {
      config.accessToken = req.body.accessToken;
      config.verifyToken = req.body.verifyToken;
      config.appSecret = req.body.appSecret;

      messenger.setConfig(config)
      saveConfigToFile(config, file)

      res.sendStatus(200)
    })
  }
}
