const handleText = (event, next, messenger) => {
  messenger.sendTextMessage(
    event.raw.to,
    event.raw.message,
    event.raw.quick_replies,
    event.raw)
  .then(() => next())
  .catch(err => next(err))
}

const handleAttachment = (event, next, messenger) => {
  messenger.sendAttachment(
    event.raw.to,
    event.raw.type,
    event.raw.url,
    event.raw.quick_replies,
    event.raw)
  .then(() => next())
  .catch(err => next(err))
}

const handleTemplate = (event, next, messenger) => {
  messenger.sendTemplate(
    event.raw.to,
    event.raw.payload,
    event.raw)
  .then(() => next())
  .catch(err => next(err))
}

const handleTyping = (event, next, messenger) => {
  messenger.sendTypingIndicator(
    event.raw.to,
    event.raw.typing)
  .then(() => next())
  .catch(err => next(err))
}

const handleSeen = (event, next, messenger) => {
  messenger.sendAction(event.raw.to, 'mark_seen')
  .then(() => next())
  .catch(err => next(err))
}

const handleGetStarted = (event, next, messenger) => {
  if(event.raw.enabled) {
    messenger.setGetStartedButton(event.raw.postback)
    .then(() => next())
    .catch(err => next(err))
  } else {
    messenger.deleteGetStartedButton()
    .then(() => next())
    .catch(err => next(err))
  }
}

const handlePersistentMenu = (event, next, mesenger) => {
  if(event.raw.delete) {
    messenger.deletePersistentMenu()
    .then(() => next())
    .catch(err => next(err))
  } else {
    mesenger.setPersistentMenu(event.raw.elements)
    .then(() => next())
    .catch(err => next(err))
  }
}

const handleGreetingText = (event, next, messenger) => {
  if(event.raw.text) {
    messenger.setGreetingText(event.raw.text)
    .then(() => next())
    .catch(err => next(err))
  } else {
    messenger.deleteGreetingText(event.raw.text)
    .then(() => next())
    .catch(err => next(err))
  }
}

const handleWhitelistedDomains = (event, next, messenger) => {
  messenger.setWhitelistedDomains(event.raw.domains)
  .then(() => next())
  .catch(err => next(err))
}

module.exports = {
  'text': handleText,
  'attachment': handleAttachment,
  'template': handleTemplate,
  'typing': handleTyping,
  'seen': handleSeen,
  'greeting_text': handleGreetingText,
  'persistent_menu': handlePersistentMenu,
  'whitelisted_domains': handleWhitelistedDomains,
  'get_started': handleGetStarted
}
