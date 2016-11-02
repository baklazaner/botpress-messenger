const Messenger = require('./messenger');
const LRU = require('lru-cache');

module.exports = {
  ready: function(skin) {

    console.log(skin.incoming)

    const users = require('./users')(skin);

    const messenger = new Messenger({
      skin: skin,
      accessToken: 'EAAIuc82XAP8BALmmjJ7rD3pbakkzCXpz3Pq311bYAMIYw5nzXW8SoGoNqiZAEqAiHo1HdZA9MrUpgcfc5dp6KsZBi9oq3ZBs4sGorCcod0uZBYsd61HYdfA0SfPv6EZCral46cxNFHmhKI4vb46vAWuEmD3KOuW8ZAimyTXlv1GWAZDZD',
      verifyToken: 'Hello',
      appSecret: 'ffb21fa310eabaac543407bae8404869'
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
         
      })
    });

    messenger.on('message', function(payload) {
      console.log(payload)
      messenger.sendTextMessage(payload.sender.id, 'you said: ' + payload.message.text, null, {typing:true})
    });

  }
}

// module.exports = (skin) => {

//   const messenger = new Messenger({
//     skin: skin,
//     accessToken: 'EAAIuc82XAP8BALmmjJ7rD3pbakkzCXpz3Pq311bYAMIYw5nzXW8SoGoNqiZAEqAiHo1HdZA9MrUpgcfc5dp6KsZBi9oq3ZBs4sGorCcod0uZBYsd61HYdfA0SfPv6EZCral46cxNFHmhKI4vb46vAWuEmD3KOuW8ZAimyTXlv1GWAZDZD',
//     verifyToken: 'Hello',
//     appSecret: ''
//   })

//   setInterval(() => {
//     skin.notif({
//       message: 'Hello, notification'
//     })
//   }, 8000)

//   skin.events.on('hello.notification', () => {
//     skin.notif({
//       message: 'Hello, notification',
//       level: 'error'
//     })
//   })
// }
