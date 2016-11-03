const handleText = (event, next, messenger) => {
  messenger.sendTextMessage(
    event.raw.to,
    event.raw.message,
    event.raw.quick_replies,
    event.raw)
}

const handleAttachment = (event, next, messenger) => {
  messenger.sendAttachment(
    event.raw.to,
    event.raw.type,
    event.raw.url,
    event.raw.quick_replies,
    event.raw)
}

const handleTemplate = (event, next, messenger) => {
  messenger.sendTemplate(
    event.raw.to,
    event.raw.payload,
    event.raw)
}

const handleTyping = (event, next, messenger) => {
  messenger.sendTypingIndicator(
    event.raw.to,
    event.raw.typing)
}

const handleSeen = (event, next, messenger) => {
  messenger.sendAction(event.raw.to, 'mark_seen')
}

const handleGetStarted = (event, next, messenger) => {
  if(event.raw.enabled) {
    messenger.setGetStartedButton(event.raw.postback)
  } else {
    messenger.deleteGetStartedButton()
  }
}

const handlePersistentMenu = (event, next, mesenger) => {
  if(event.raw.delete) {
    messenger.deletePersistentMenu()
  } else {
    mesenger.setPersistentMenu(event.raw.elements)
  }
}

const handleGreetingText = (event, next, messenger) => {
  if(event.raw.text) {
    messenger.setGreetingText(event.raw.text)
  } else {
    messenger.deleteGreetingText(event.raw.text)
  }
}

const handleWhitelistedDomains = (event, next, messenger) => {
  messenger.setWhitelistedDomains(event.raw.domains)
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
