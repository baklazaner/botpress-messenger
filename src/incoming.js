const LRU = require('lru-cache')
const Users = require('./users')

module.exports = (bp, messenger) => {

  const users = Users(bp, messenger)

  const messagesCache = LRU({
    max: 10000,
    maxAge: 60 * 60 * 1000
  })

  messenger.on('message', function(payload) {
    const userId = payload.sender.id
    const mid = payload.message.mid

    if (messagesCache.has(mid)) {
      // We already processed this message
      return
    } else {
      // Mark it as processed
      messagesCache.set(mid, true)
    }

    users.getOrFetchUserProfile(userId)
    .then(profile => {
      // push the message to the incoming middleware
      bp.incoming({
        platform: 'facebook',
        type: 'message',
        user: profile,
        text: payload.message.text,
        raw: payload
      })
    })
  })

  messenger.on('attachment', () => {
    bp.logger.warn('[messenger] NOT IMPLEMENTED, Attachment')
  })

  messenger.on('postback', () => {
    bp.logger.warn('[messenger] NOT IMPLEMENTED, postback')
  })

  messenger.on('quick_reply', () => {
    bp.logger.warn('[messenger] NOT IMPLEMENTED, quick_reply')
  })

  messenger.on('authentication', () => {
    bp.logger.warn('[messenger] NOT IMPLEMENTED, AUTH')
  })

  messenger.on('delivery', () => {
    bp.logger.warn('[messenger] NOT IMPLEMENTED, delivery')
  })

  messenger.on('read', () => {
    bp.logger.warn('[messenger] NOT IMPLEMENTED, read')
  })

  messenger.on('account_linking', () => {
    bp.logger.warn('[messenger] NOT IMPLEMENTED, account_link')
  })

  messenger.on('optin', () => {
    bp.logger.warn('[messenger] NOT IMPLEMENTED, optin')
  })

  messenger.on('referral', () => {
    bp.logger.warn('[messenger] NOT IMPLEMENTED, referral')
  })

}
