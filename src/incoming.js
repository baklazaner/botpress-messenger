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
    const mid = payload.message && payload.message.mid

    if (mid && messagesCache.has(mid)) {
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
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'message',
        user: profile,
        text: e.message.text,
        raw: e
      })
    })
  })

  messenger.on('attachment', e => {
    preprocessEvent(e)
    .then(profile => {

      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'attachments',
        user: profile,
        text: e.message.attachments,
        raw: e
      })
    })
  })

  messenger.on('postback', e => {
    preprocessEvent(e)
    .then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'postback',
        user: profile,
        text: e.postback.payload,
        raw: e
      })

      if (e.postback.payload === 'GET_STARTED') {
        const mConfig = messenger.getConfig()
        if (mConfig.displayGetStarted && mConfig.autoRespondGetStarted) {
          bp.messenger.pipeText(profile.id, mConfig.autoResponse)
        }
      }
    })
  })

  messenger.on('quick_reply', e => {
    preprocessEvent(e)
    .then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'quick_reply',
        user: profile,
        text: e.message.quick_reply.payload,
        raw: e
      })
    })
  })

  messenger.on('delivery', e => {
    preprocessEvent(e)
    .then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'delivery',
        user: profile,
        text: e.delivery.watermark.toString(),
        raw: e
      })
    })
  })

  messenger.on('read', e => {
    preprocessEvent(e)
    .then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'read',
        user: profile,
        text: e.read.watermark.toString(),
        raw: e
      })
    })
  })

  messenger.on('account_linking', () => {
    bp.logger.warn('[messenger] ACCOUNT_LINKING NOT IMPLEMENTED, Your pull requests are welcome :)')
  })

  messenger.on('optin', e => {
    preprocessEvent(e)
    .then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'optin',
        user: profile,
        text: e.optin.ref,
        raw: e
      })
    })
  })

  messenger.on('referral', e => {
    preprocessEvent(e)
    .then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'referral',
        user: profile,
        text: e.referral.ref,
        raw: e
      })
    })
  })

}
