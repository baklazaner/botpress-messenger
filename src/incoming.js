import LRU from 'lru-cache'
import Users from './users'
import Promise from 'bluebird'

module.exports = (bp, messenger) => {

  const users = Users(bp, messenger)

  const messagesCache = LRU({
    max: 10000,
    maxAge: 60 * 60 * 1000
  })

  const preprocessEvent = payload => {
    const userId = payload.sender.id
    const mid = payload.message.mid

    if (messagesCache.has(mid)) {
      // We already processed this message
      return Promise.resolve(null)
    } else {
      // Mark it as processed
      messagesCache.set(mid, true)
    }

    return users.getOrFetchUserProfile(userId)
  }

  messenger.on('message', e => {
    preprocessEvent(e)
    .then(profile => {
      // push the message to the incoming middleware
      bp.incoming({
        platform: 'facebook',
        type: 'message',
        user: profile,
        text: e.message.text,
        raw: e
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
