/**
 * Messenger
 *
 * This file contains one class Messenger, which in charge of communication between
 * botpress and fb messenger.
 *
 */

const Promise = require('bluebird')
const EventEmitter = require('eventemitter2')
const crypto = require('crypto')
const fetch = require('node-fetch')
const _ = require('lodash')
const bodyParser = require('body-parser')

fetch.promise = Promise

const normalizeString = function(str) {
  return str.replace(/[^a-zA-Z0-9]+/g, '').toUpperCase()
}

class Messenger extends EventEmitter {
  constructor(bp, config) {
    super()
    if (!bp || !config) {
      throw new Error('You need to specify botpress and config')
    }

    this.setConfig(config)

    this.app = bp.getRouter('botpress-messenger', {
      'bodyParser.json': false,
      'auth': req => !/\/webhook/i.test(req.originalUrl)
    })

    this.app.use(bodyParser.json({
      verify: this._verifyRequestSignature.bind(this)
    }))

    this._initWebhook()
  }

  setConfig(config) {
    this.config = Object.assign({}, this.config, config)
  }

  getConfig() {
    return this.config
  }

  connect() {
    return this._setupNewWebhook()
    .then(() => this._subscribePage())
  }

  disconnect() {
    return this._unsubscribePage()
  }

  sendTextMessage(recipientId, text, quickReplies, options) {
    const message = { text }
    const formattedQuickReplies = this._formatQuickReplies(quickReplies)
    if (formattedQuickReplies && formattedQuickReplies.length > 0) {
      message.quick_replies = formattedQuickReplies
    }
    return this.sendMessage(recipientId, message, options)
  }

  sendButtonTemplate(recipientId, text, buttons, options) {
    const payload = {
      template_type: 'button',
      text
    }
    const formattedButtons = this._formatButtons(buttons)
    payload.buttons = formattedButtons
    return this.sendTemplate(recipientId, payload, options)
  }

  sendGenericTemplate(recipientId, elements, options) {
    const payload = {
      template_type: 'generic',
      elements
    }
    return this.sendTemplate(recipientId, payload, options)
  }

  sendTemplate(recipientId, payload, options) {
    const message = {
      attachment: {
        type: 'template',
        payload
      }
    }
    return this.sendMessage(recipientId, message, options)
  }

  sendAttachment(recipientId, type, url, quickReplies, options) {
    const message = {
      attachment: {
        type,
        payload: { url }
      }
    }
    const formattedQuickReplies = this._formatQuickReplies(quickReplies)
    if (formattedQuickReplies && formattedQuickReplies.length > 0) {
      message.quick_replies = formattedQuickReplies
    }
    return this.sendMessage(recipientId, message, options)
  }

  sendAction(recipientId, action) {
    return this.sendRequest({
      recipient: {
        id: recipientId
      },
      sender_action: action
    })
  }

  sendMessage(recipientId, message, options) {
    const onDelivery = options && options.onDelivery
    const onRead = options && options.onRead
    const req = () => this.sendRequest({
      recipient: {
        id: recipientId
      },
      message
    })
    .then((json) => {
      if (typeof onDelivery === 'function') {
        this.once('delivery', onDelivery)
      }
      if (typeof onRead === 'function') {
        this.once('read', onRead)
      }
      return json
    })

    if (options && options.typing) {
      const autoTimeout = (message && message.text) ? 500 + message.text.length * 10 : 1000
      const timeout = (typeof options.typing === 'number') ? options.typing : autoTimeout
      return this.sendTypingIndicator(recipientId, timeout).then(req)
    }

    return req()
  }

  sendValidationRequest(applicationID, accessToken) {
    return fetch(`https://graph.facebook.com/v2.7/${applicationID}/subscriptions_sample`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        object_id: applicationID,
        object: 'page',
        field: 'messages',
        custom_fields: { page_id: applicationID },
        access_token: accessToken
      })
    })
    .then(this._handleFacebookResponse)
    .then(res => res.json())
  }

  sendRequest(body, endpoint, method) {
    endpoint = endpoint || 'messages'
    method = method || 'POST'
    return fetch(`https://graph.facebook.com/v2.7/me/${endpoint}?access_token=${this.config.accessToken}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(this._handleFacebookResponse)
    .then(res => res.json())
  }

  sendThreadRequest(body, method) {
    return this.sendRequest(body, 'thread_settings', method)
  }

  sendTypingIndicator(recipientId, milliseconds) {
    let timeout = !milliseconds || isNaN(milliseconds) ? 0 : milliseconds
    timeout = Math.min(20000, timeout)

    if (milliseconds === true) {
      timeout = 1000
    }

    const before = timeout > 0
      ? Promise.resolve(this.sendAction(recipientId, 'typing_on'))
      : Promise.resolve(true)

    return before
    .delay(timeout)
    .then(() => this.sendAction(recipientId, 'typing_off'))
  }

  getUserProfile(userId) {
    const url = `https://graph.facebook.com/v2.7/${userId}?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=${this.config.accessToken}`
    return fetch(url)
      .then(this._handleFacebookResponse)
      .then(res => res.json())
      .catch(err => console.log(`Error getting user profile: ${err}`))
  }

  setWhitelistedDomains(domains) {
    const url = `https://graph.facebook.com/v2.7/me/thread_settings?fields=whitelisted_domains&access_token=${this.config.accessToken}`
    return fetch(url)
      .then(this._handleFacebookResponse)
      .then(res => res.json())
      .then((json) => {
        if (json && json.data && json.data[0]) {
          return json.data[0].whitelisted_domains
        } else {
          return []
        }
      })
      .then((oldDomains) => {
        if (!oldDomains || !oldDomains.length) {
          return
        }

        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            setting_type: 'domain_whitelisting',
            whitelisted_domains: oldDomains,
            domain_action_type: 'remove'
          })
        })
      })
      .then(this._handleFacebookResponse)
      .then(() => fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setting_type: 'domain_whitelisting',
          whitelisted_domains: domains,
          domain_action_type: 'add'
        })
      }))
      .then(this._handleFacebookResponse)
  }

  setGreetingText(text) {
    return this.sendThreadRequest({
      setting_type: 'greeting',
      greeting: { text }
    })
  }

  deleteGreetingText() {
    return this.sendThreadRequest({
      setting_type: 'greeting'
    }, 'DELETE')
  }

  setGetStartedButton(action) {
    const payload = (typeof action === 'string') ? action : 'GET_STARTED'
    if (typeof action === 'function') {
      this.on(`postback:${payload}`, action)
    }
    return this.sendThreadRequest({
      setting_type: 'call_to_actions',
      thread_state: 'new_thread',
      call_to_actions: [ { payload } ]
    })
  }

  deleteGetStartedButton() {
    return this.sendThreadRequest({
      setting_type: 'call_to_actions',
      thread_state: 'new_thread'
    }, 'DELETE')
  }

  setPersistentMenu(buttons) {
    const formattedButtons = this._formatButtons(buttons)
    return this.sendThreadRequest({
      setting_type: 'call_to_actions',
      thread_state: 'existing_thread',
      call_to_actions: formattedButtons
    })
  }

  deletePersistentMenu() {
    return this.sendThreadRequest({
      setting_type: 'call_to_actions',
      thread_state: 'existing_thread'
    }, 'DELETE')
  }

  updateSettings() {
    const updateGetStarted = () => this.config.displayGetStarted
      ? this.setGetStartedButton()
      : this.deleteGetStartedButton()

    const updateGreetingText = () => _.isEmpty(this.config.greetingMessage)
      ? this.deleteGreetingText()
      : this.setGreetingText(this.config.greetingMessage)

    const items = this._reformatPersistentMenuItems(this.config.persistentMenuItems)
    const updatePersistentMenu = () => this.config.persistentMenu
      ? this.setPersistentMenu(items)
      : this.deletePersistentMenu()

    const updateTrustedDomains = () => this.setWhitelistedDomains(this.config.trustedDomains)

    let thrown = false
    const contextifyError = (context) => (err) => {
      if (thrown) throw err
      const message = `Error setting ${context}\n${err.message}`
      thrown = true
      throw new Error(message)
    }

    return updateGetStarted()
    .catch(contextifyError('get started'))
    .then(updateGreetingText)
    .catch(contextifyError('greeting text'))
    .then(updatePersistentMenu)
    .catch(contextifyError('persistent menu'))
    .then(updateTrustedDomains)
    .catch(contextifyError('trusted domains'))
  }

  module(factory) {
    return factory.apply(this, [ this ])
  }

  _formatButtons(buttons) {
    return buttons && buttons.map((button) => {
      if (typeof button === 'string') {
        return {
          type: 'postback',
          title: button,
          payload: 'BUTTON_' + normalizeString(button)
        }
      } else if (button && button.title) {
        return button
      }
      return {}
    })
  }

  _formatQuickReplies(quickReplies) {
    return quickReplies && quickReplies.map((reply) => {
      if (typeof reply === 'string') {
        return {
          content_type: 'text',
          title: reply,
          payload: 'QR_' + normalizeString(reply)
        }
      } else if (reply && reply.title) {
        return {
          content_type: reply.content_type || 'text',
          title: reply.title,
          payload: reply.payload || 'QR_' + normalizeString(reply.title)
        }
      }
      return {}
    })
  }

  _handleEvent(type, event) {
    this.emit(type, event)
  }

  _handleMessageEvent(event) {
    const text = event.message.text
    if (!text) { return }

    this._handleEvent('message', event)

    if (event.message && this.config.automaticallyMarkAsRead) {
      this.sendAction(event.sender.id, 'mark_seen')
    }
  }

  _handleAttachmentEvent(event) {
    this._handleEvent('attachment', event)

    if (event.message && this.config.automaticallyMarkAsRead) {
      this.sendAction(event.sender.id, 'mark_seen')
    }
  }

  _handlePostbackEvent(event) {
    const payload = event.postback.payload
    if (payload) {
      this._handleEvent(`postback:${payload}`, event)
    }
    this._handleEvent('postback', event)
  }

  _handleQuickReplyEvent(event) {
    const payload = event.message.quick_reply && event.message.quick_reply.payload
    if (payload) {
      this._handleEvent(`quick_reply:${payload}`, event)
    }
    this._handleEvent('quick_reply', event)

    if (event.message && this.config.automaticallyMarkAsRead) {
      this.sendAction(event.sender.id, 'mark_seen')
    }
  }

  _handleFacebookResponse(res) {
    if (!res) return

    if (res.status < 400) {
      return res
    }

    let errorMessage = 'An error has been returned by Facebook API.'
    errorMessage += '\nStatus: ' + res.status + ' (' + res.statusText + ')'

    return Promise.resolve(true)
    .then(() => res.json())
    .then(json => {
      errorMessage += '\n' + json.error.message
    })
    .finally(() => {
      throw new Error(errorMessage)
    })
  }

  _initWebhook() {
    this.app.get('/webhook', (req, res) => {
      if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === this.config.verifyToken) {

        res.status(200).send(req.query['hub.challenge'])
      } else {
        console.error('Failed validation. Make sure the validation tokens match.')
        res.sendStatus(403)
      }
    })

    this.app.post('/webhook', (req, res) => {
      var data = req.body
      if (data.object !== 'page') {
        return
      }

      // Iterate over each entry. There may be multiple if batched.
      data.entry.forEach((entry) => {
        if (entry && !entry.messaging) {
          return
        }
        // Iterate over each messaging event
        entry.messaging.forEach((event) => {
          if (event.message && event.message.is_echo && !this.config.broadcastEchoes) {
            return
          }
          if (event.message && event.message.text) {
            if (event.message.quick_reply) {
              this._handleQuickReplyEvent(event)
            } else {
              this._handleMessageEvent(event)
            }
          } else if (event.message && event.message.attachments) {
            this._handleAttachmentEvent(event)
          } else if (event.postback) {
            this._handlePostbackEvent(event)
          } else if (event.delivery) {
            this._handleEvent('delivery', event)
          } else if (event.read) {
            this._handleEvent('read', event)
          } else if (event.account_linking) {
            this._handleEvent('account_linking', event)
          } else if (event.optin) {
            this._handleEvent('optin', event)
          } else if (event.referral) {
            this._handleEvent('referral', event)
          } else {
            console.log('Webhook received unknown event: ', event)
          }
        })
      })

      // Must send back a 200 within 20 seconds or the request will time out.
      res.sendStatus(200)
    })
  }

  _verifyRequestSignature(req, res, buf) {
    if (!/^\/webhook/i.test(req.path)) {
      return
    }

    var signature = req.headers['x-hub-signature']
    if (!signature) {
      throw new Error('Couldn\'t validate the request signature.')
    } else {
      let [, hash] = signature.split('=')
      var expectedHash = crypto.createHmac('sha1', this.config.appSecret).update(buf).digest('hex')

      if (hash != expectedHash) {
        throw new Error('Couldn\'t validate the request signature.')
      }
    }
  }

  _reformatPersistentMenuItems() {
    if (this.config.persistentMenu && this.config.persistentMenuItems) {
      return this.config.persistentMenuItems.map((item) => {

        if (item.value && item.type === 'postback') {
          item.payload = item.value
          delete item.value
        } else if (item.value && item.type === 'url') {
          item.url = item.value
          item.type = 'web_url'
          delete item.value
        }
        return item
      })
    }
  }

  _setupNewWebhook() {
    const oAuthUrl = 'https://graph.facebook.com/v2.7/oauth/access_token' +
      '?client_id=' + this.config.applicationID +
      '&client_secret=' + this.config.appSecret +
      '&grant_type=client_credentials'

    const url = `https://graph.facebook.com/v2.7/${this.config.applicationID}/subscriptions?access_token=`

    return fetch(oAuthUrl)
    .then(this._handleFacebookResponse)
    .then(res => res.json())
    .then(json => json.access_token)
    .then(token => fetch(url + token, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        object: 'page',
        callback_url: 'https://' + this.config.hostname + '/api/botpress-messenger/webhook',
        verify_token: this.config.verifyToken,
        fields: [
          'message_deliveries',
          'message_reads',
          'messages',
          'messaging_optins',
          'messaging_postbacks',
          'messaging_referrals'
        ]
      })
    }))
    .then(this._handleFacebookResponse)
    .then(res => res.json())
  }

  _subscribePage() {
    const url = 'https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=' + this.config.accessToken

    return fetch(url, { method: 'POST' })
    .then(this._handleFacebookResponse)
    .then(res => res.json())
    .catch(err => console.log(err))
  }

  _unsubscribePage() {
    const url = 'https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=' + this.config.accessToken

    return fetch(url, { method: 'DELETE' })
    .then(this._handleFacebookResponse)
    .then(res => res.json())
    .catch(err => console.log(err))
  }

}

module.exports = Messenger
