'use strict'

const _ = require('lodash')

const validateUserId = (userId) => {
  if (!/[0-9]+/.test(userId)) {
    throw new Error('Invalid userId')
  }
}

const validateText = (text) => {
  if (typeof(text) !== 'string' || text.length > 300) {
    throw new Error('Text must be a string less than 300 chars.')
  }
}

const validateQuickReplies = (quick_replies) => {
  if (!_.isArray(quick_replies)) {
    throw new Error('quick_replies must be an array')
  }

  _.forEach(quick_replies, validateQuickReply)
}

const validateQuickReply = (quick_reply) => {
  if (typeof(quick_reply) !== 'string') {
    if (!quick_reply || typeof(quick_reply.title) !== 'string') {
      throw new Error('Expected quick_reply to be a string or an object' +
        'with a title.')
    }
  }
}

const validateTyping = (typing) => {
  if (!_.isBoolean(typing) && !_.isNumber(typing)) {
    throw new Error('Expected typing to be a boolean of a number')
  }
}

const validateAttachmentType = (type) => {
  if (typeof(type) !== 'string') {
    throw new Error('Expected attachment type to be a text')
  }

  if (!_.includes(['image', 'video', 'audio', 'file'], type.toLowerCase())) {
    throw new Error('Invalid attachment type')
  }
}

const validateUrl = (url) => {
  if (typeof(url) !== 'string') {
    throw new Error('Expected URL to be a string')
  }
}

const validateTemplatePayload = (payload) => {
  if (!_.isPlainObject(payload)) {
    throw new Error('Template payload must be a plain object')
  }

  if (typeof(payload.template_type) !== 'string') {
    throw new Error('"template_type" must be set')
  }
}

const validatePersistentMenu = (elements) => {
  if (!_.isArray(elements)) {
    throw new Error('Expected elements to be an array')
  }

  _.forEach(elements, (element) => {
    if (!_.isPlainObject(element)) {
      throw new Error('Expected element to be a plain object')
    }
  })
}

const createText = (userId, text, options) => {
  validateUserId(userId)
  validateText(text)

  if (options && options.quick_replies) {
    validateQuickReplies(options.quick_replies)
  }

  if (options && options.typing) {
    validateTyping(options.typing)
  }

  return {
    platform: 'facebook',
    type: 'text',
    text: text,
    raw: {
      to: userId,
      message: text,
      typing: (options && options.typing),
      quick_replies: options && options.quick_replies,
      waitRead: options && options.waitRead,
      waitDelivery: options && options.waitDelivery
    }
  }
}

const createAttachment = (userId, type, url, options) => {
  validateUserId(userId)
  validateAttachmentType(type)
  validateUrl(url)

  if (options && options.quick_replies) {
    validateQuickReplies(options.quick_replies)
  }

  if (options && options.typing) {
    validateTyping(options.typing)
  }

  return {
    platform: 'facebook',
    type: 'attachment',
    text: 'Attachment (' + type + ') : ' + url,
    raw: {
      to: userId,
      type: type,
      url: url,
      typing: (options && options.typing),
      quick_replies: options && options.quick_replies,
      waitRead: options && options.waitRead,
      waitDelivery: options && options.waitDelivery
    }
  }
}

const createTemplate = (userId, payload, options) => {
  validateUserId(userId)
  validateTemplatePayload(payload)

  if (options && options.typing) {
    validateTyping(options.typing)
  }

  return {
    platform: 'facebook',
    type: 'template',
    text: 'Template (' + payload.template_type + ')',
    raw: {
      to: userId,
      payload: payload,
      typing: (options && options.typing),
      waitRead: options && options.waitRead,
      waitDelivery: options && options.waitDelivery
    }
  }
}

const createTyping = (userId, typing) => {
  validateUserId(userId)
  validateTyping(typing)

  return {
    platform: 'facebook',
    type: 'typing',
    text: 'Typing: ' + typing,
    raw: {
      to: userId,
      typing: typing
    }
  }
}

const createSeen = (userId) => {
  validateUserId(userId)

  return {
    platform: 'facebook',
    type: 'seen',
    text: 'Mark as seen',
    raw: {
      to: userId
    }
  }
}

const createPersistentMenu = (elements) => {
  if (!elements) {
    return {
      platform: 'facebook',
      type: 'persistent_menu',
      text: 'Delete the persistent menu',
      raw: {
        delete: true
      }
    }
  }

  validatePersistentMenu(elements)
  return {
    platform: 'facebook',
    type: 'persistent_menu',
    text: 'Set persistent menu: ' + elements.length + ' items',
    raw: {
      delete: false,
      elements: elements
    }
  }
}

const createGreetingText = (text) => {
  if (text && text.length > 160) {
    throw new Error('Greeting text must be less than 160 chars')
  }

  return {
    platform: 'facebook',
    type: 'greeting_text',
    text: 'Set greeting text: ' + text,
    raw: {
      text: text
    }
  }
}

const createGetStarted = (postback) => {
  return {
    platform: 'facebook',
    type: 'get_started',
    text: 'Setting get started button: ' + !!postback,
    raw: {
      enabled: !!postback,
      postback: postback
    }
  }
}

const createWhitelistedDomains = (domains) => {
  if (domains && !_.every(domains, _.isString)) {
    throw new Error('Expected domains to be a list of string')
  }

  return {
    platform: 'facebook',
    type: 'whitelisted_domains',
    text: 'Setting whitelisted domains',
    raw: {
      domains: domains
    }
  }
}

module.exports = {
  createText,
  createAttachment,
  createTemplate,
  createTyping,
  createSeen,
  createGetStarted,
  createPersistentMenu,
  createGreetingText,
  createWhitelistedDomains
}
