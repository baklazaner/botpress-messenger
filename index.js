const Messenger = require('./messenger');

module.exports = {
  ready: function(skin) {

    const messenger = new Messenger({
      skin: skin,
      accessToken: 'EAAIuc82XAP8BALmmjJ7rD3pbakkzCXpz3Pq311bYAMIYw5nzXW8SoGoNqiZAEqAiHo1HdZA9MrUpgcfc5dp6KsZBi9oq3ZBs4sGorCcod0uZBYsd61HYdfA0SfPv6EZCral46cxNFHmhKI4vb46vAWuEmD3KOuW8ZAimyTXlv1GWAZDZD',
      verifyToken: 'Hello',
      appSecret: 'ffb21fa310eabaac543407bae8404869'
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
