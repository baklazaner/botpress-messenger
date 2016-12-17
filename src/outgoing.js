const handleText = (event, next, messenger) => {
  return messenger.sendTextMessage(
    event.raw.to,
    event.raw.message,
    event.raw.quick_replies,
    event.raw)
  .then(() => next())
  .catch(err => {
    next(err)
    throw err
  })
}

const handleAttachment = (event, next, messenger) => {
  return messenger.sendAttachment(
    event.raw.to,
    event.raw.type,
    event.raw.url,
    event.raw.quick_replies,
    event.raw)
  .then(() => next())
  .catch(err => {
    next(err)
    throw err
  })
}

const handleTemplate = (event, next, messenger) => {
  return messenger.sendTemplate(
    event.raw.to,
    event.raw.payload,
    event.raw)
  .then(() => next())
  .catch(err => {
    next(err)
    throw err
  })
}

const handleTyping = (event, next, messenger) => {
  return messenger.sendTypingIndicator(
    event.raw.to,
    event.raw.typing)
  .then(() => next())
  .catch(err => {
    next(err)
    throw err
  })
}

const handleSeen = (event, next, messenger) => {
  return messenger.sendAction(event.raw.to, 'mark_seen')
  .then(() => next())
  .catch(err => {
    next(err)
    throw err
  })
}

const handleGetStarted = (event, next, messenger) => {
  if (event.raw.enabled) {
    return messenger.setGetStartedButton(event.raw.postback)
    .then(() => next())
    .catch(err => {
      next(err)
      throw err
    })
  } else {
    return messenger.deleteGetStartedButton()
    .then(() => next())
    .catch(err => {
      next(err)
      throw err
    })
  }
}

const handlePersistentMenu = (event, next, messenger) => {
  if (event.raw.delete) {
    return messenger.deletePersistentMenu()
    .then(() => next())
    .catch(err => {
      next(err)
      throw err
    })
  } else {
    return messenger.setPersistentMenu(event.raw.elements)
    .then(() => next())
    .catch(err => {
      next(err)
      throw err
    })
  }
}

const handleGreetingText = (event, next, messenger) => {
  if (event.raw.text) {
    return messenger.setGreetingText(event.raw.text)
    .then(() => next())
    .catch(err => {
      next(err)
      throw err
    })
  } else {
    return messenger.deleteGreetingText(event.raw.text)
    .then(() => next())
    .catch(err => {
      next(err)
      throw err
    })
  }
}

const handleWhitelistedDomains = (event, next, messenger) => {
  return messenger.setWhitelistedDomains(event.raw.domains)
  .then(() => next())
  .catch(err => {
    next(err)
    throw err
  })
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
