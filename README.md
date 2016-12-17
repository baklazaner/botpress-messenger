# botpress-messenger

Official Facebook Messenger connector module for [Botpress](http://github.com/botpress/botpress). 

This module has been build to accelerate and facilitate development of Messenger bots.

## Installation

Installing modules on Botpress is simple. By using the CLI, you only need to type this command in your terminal to add the messenger module to your bot.

``` 
botpress install messenger
```

It's also possible to install it through the Botpress UI in the modules section.

<img alt='Connexion settings' src='/assets/install-messenger-module.png' width='500px' />

## Get started

To setup connexion of your chatbot to Messenger, you need to fill the connexion settings directly in the module interface. In fact, you only need to follow these 5 steps and your bot will be active.

Settings can also be set programmatically by providing the settings in the `${modules_config_dir}/botpress-messenger.json`

<img alt='Connexion settings' src='assets/connexion-settings.png' width='700px'/>

##### 1. Create a [**Facebook page**](https://www.facebook.com/pages/create) and a [**Messenger application**](https://developers.facebook.com).
  
<img alt='Create app' src='/assets/create-app-facebook.png' width='500px' />

##### 2. Get App ID and App Secret
These information are available on dashboard of developers page. You only need to copy them in module interface.

<img alt='App id' src='/assets/app-id-app-secret.png' width='400px' />

##### 3. Get Access token
Acces token is available in Messenger section of developers. You need to copy it in the appropriate section of botpress-messenger UI.

<img alt='Acces token' src='/assets/access-token.png' width='500px;' />

##### 4. Setup Hostname

  4.1. You need to manually enter your hostname or you cans use **[ngrok](#ngrok)** to locally deploy your chatbot ([learn more about ngrok]((https://ngrok.com))

  4.2. You don't have to setup webhook on Facebook developers page, this module automatically do it for you via Facebook API.

##### 5. Validate and Connect! 

To see in details how to configure completly this module, videos are available on our Youtube Channel \(soon\).


## Features

### Incoming

* [Profile](#profile)
* [Text messages](#text-messages) 
* [Postbacks](#postbacks)
* [Attachments](#attachments)
* [Referrals](#referrals)
* [Quick replies](#quick-replies)
* [Optins](#optins)
* [Delivery](#delivery)
* [Read](#read)

### Outgoing

* [Text messages](#text-messages)
* [Attachments](#attachments)
* [Templates](#templates)
* [Quick replies](#quick-replies)
* [Automatic typing indicator](#automatic-typing-indicator)
* [Postbacks](#postbacks)
* [Referrals](#referrals)
* [Display Get Started](#display-get-started)
* [Greeting message](#greeting-message)
* [Persistent menu](#persistent-menu)
* [Automatically mark as read](#automatically-mark-as-read)
* [Trusted domains](#trusted-domains)
* [Save users in DB](#save-users-in-db)
* [Automatic profile lookup](#automatic-profile-lookup)
* [Webhook security check](#webhook-security-check)

## Reference

### Incoming

You can listen to incoming event easily with Botpress by using `bp` built-in `hear` function. You only need to listen to specific Messenger event to be able to react to user's actions.

```js
bp.hear({ platform: 'facebook', type: 'postback', text: 'GET_STARTED' }, (event, next) => {
      bp.messenger.pipeText(event.user.id, 'Welcome on Botpress!!!')
   }
})
```

In fact, this module preprocesses almost all types of message (message, attachment, postback, quick_reply, delivery, read, optin, referrals...) and send them to incoming middlewares. When you build a bot or a module, you can access to all information about incoming messages that have been send to  middlewares.

```js
bp.middlewares.sendIncoming({
   platform: 'facebook',
   type: 'message',
   user: profile,
   text: e.message.text,
   raw: e
})
```

#### Profile

You can acces to all user's profile information by using this module. A cache have been implemented to fetch all information about users and this information is sent to middlewares.

```js
{
  id: profile.id,
  platform: 'facebook',
  gender: profile.gender,
  timezone: profile.timezone,
  locale: profile.locale
}
```

**Note**: All new users are automatically saved by this module in Botpress built-in database (`bp.db`). 

#### Text messages

An `event` is sent to middlewares for each incoming text message from Messenger platform with all specific information.

```js
{
  platform: 'facebook',
  type: 'message',
  user: profile,
  text: e.message.text,
  raw: e
}
```

Then, you can listen easily to this `event` in your module or bot

```js
bp.hear('hello')
```

#### Postbacks

```js
{
  platform: 'facebook',
  type: 'postback',
  user: profile,
  text: e.postback.payload,
  raw: e
}
```

#### Attachments

```js
{
  platform: 'facebook',
  type: 'attachments',
  user: profile,
  text: e.message.attachments,
  raw: e
}
```

#### Referrals

```js
{
  platform: 'facebook',
  type: 'referral',
  user: profile,
  text: e.referral.ref,
  raw: e
}
```

#### Quick Replies

```js
{
  platform: 'facebook',
  type: 'quick_reply',
  user: profile,
  text: e.message.quick_reply.payload,
  raw: e
}
```

#### Optins

```js
{
  platform: 'facebook',
  type: 'optin',
  user: profile,
  text: e.optin.ref,
  raw: e
}
```

#### Delivery

```js
{
  platform: 'facebook',
  type: 'delivery',
  user: profile,
  text: e.delivery.watermark,
  raw: e
}
```

#### Read

```js
{
  platform: 'facebook',
  type: 'read',
  user: profile,
  text: e.read.watermark,
  raw: e
}
```

### Outgoing

By using our module, you can send anything you want to your users on Messenger. In fact, this module support all types of messenge that are available on Facebook (text, images, videos, audios, webviews...).

### Text messages

In code, it is simple to send a message text to a specific users ([facebook doc](https://developers.facebook.com/docs/messenger-platform/send-api-reference/text-message)).

#### `sendText(userId, text, [options])` -> Promise

##### Arguments

1. ` userId ` (_String_): Correspond to unique Messenger's recipient identifier. Usually, this `recipient_id` is available from input message.

2. ` text ` (_String_): Text message that will be send to user.

3. ` options ` (_Object_): An object that may contain: 
- `quick_replies` which is an array of quick replies to attach to the message
- `typing` indicator. true for automatic timing calculation or a number in milliseconds (turns off automatically)
- `waitDelivery` the returning Promise will resolve only when the message is delivered to the user
- `waitRead` the returning Promise will resolve only when the user reads the message

##### Returns

(_Promise_): Send to outgoing middlewares a formatted `Object` than contains all information (platform, type, text, raw) about the text message that needs to be sent to Messenger platform. The promise resolves when the message was successfully sent to facebook, except if you set the `waitDelivery` or `waitRead` options.

##### Example

```js
const userId = 'USER_ID'
const text = "Select between these two options?"
const options = {
  quick_replies: [
    {
      content_type: "text",
      title: "Option 1",
      payload: "DEVELOPER_DEFINED_PAYLOAD_FOR_OPTION_1"
    },
    {
      content_type:"text",
      title:"Option 2",
      payload: "DEVELOPER_DEFINED_PAYLOAD_FOR_OPTION_2"
    }
  ],
  typing: true,
  waitRead: true
}

bp.messenger.sendText(userId, text, options)
.then(() => {
  // the message was read because of `waitRead` option  
})
```

### Attachments

By using this function, you can send any type of attachment to your users ([facebook doc](https://developers.facebook.com/docs/messenger-platform/send-api-reference/contenttypes)).

#### `sendAttachment(userId, type, url, [options])` -> Promise

##### Arguments

1. ` userId ` (_String_): Correspond to unique Messenger's recipient identifier

2. ` type ` (_String_): Specific type of  attachment can be `'audio'`, `'file'`, `'image'` or `'video'` 

3. ` url ` (_String_): Correspond to specific url of the attachment that need to be sent.

4. ` options ` (_Object_): An object that may contain:
- `quick_replies`
- `typing`
- `waitDelivery` the returning Promise will resolve only when the message is delivered to the user
- `waitRead` the returning Promise will resolve only when the user reads the message

##### Returns

(_Promise_): Send to outgoing middlewares a formatted `Object` than contains all information (platform, type, text, raw) about the attachment that needs to be sent to Messenger platform.

##### Example

```js
const userId = 'USER_ID'
const type = 'image'
const url = 'https://github.com/botpress/botpress/blob/master/images/botpress-dark.png?raw=true'

bp.messenger.sendAttachment(userId, type, url)
```

### Templates

By using this module, it's easy to send any type of supported template to your users ([facebook doc](https://developers.facebook.com/docs/messenger-platform/send-api-reference/templates)).

#### `sendTemplate(userId, payload, [options])` -> Promise

##### Arguments

1. ` userId ` (_String_): Correspond to unique Messenger's recipient identifier

2. ` payload ` (_Object_): Specific `payload` object for your selected template. Actually, many types of template (button, generic, list, receipt...) are supported by Messenger.

3. ` options ` (_Object_): An object that may contains:
- `typing`
- `waitDelivery` the returning Promise will resolve only when the message is delivered to the user
- `waitRead` the returning Promise will resolve only when the user reads the message

##### Returns

(_Promise_): Send to outgoing middlewares a formatted `Object` than contains all information (platform, type, text, raw) about the template that needs to be sent.

##### Example

```js
const userId = 'USER_ID'
const payload = {
    template_type: "button",
    text: "Have you seen our awesome website?",
    buttons: [
        {
            type: "web_url",
            url: "https://www.botpress.io",
            title: "Show Website"
        }
    ]
}

bp.messenger.sendTemplate(userId, payload, { typing: 2000 })
```

#### Quick replies
By using `options` argument, you can easily add quick replies to text messages or attachments. 

```js
const options = {
    quick_replies: [
        {
            content_type :"text",
            title: "Option",
            payload: "DEVELOPER_DEFINED_PAYLOAD_FOR_OPTION"
        }
    ]
}
``` 

// Automatic typing indicator

As quick replies, you can add an automatic typing indicator to your messages by adding `typing` to `options` argument.

```js
const options = { typing: true }
```


#### Postbacks

This module support postbacks. Postbacks occur when a Postback button, Get Started button, Persistent menu or Structured Message is tapped ([facebook doc](https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback)).

#### Referrals

This module also support referrals. In fact, the value of the `ref` parameter is passed by the server via webhook and we are able to access these referrals in parameters of input messages ([facebook doc](https://developers.facebook.com/docs/messenger-platform/webhook-reference/referral)). 

#### Display Get Started

To active get started button on Messenger, users can modify display setting directly in user interface ([facebook doc](https://developers.facebook.com/docs/messenger-platform/thread-settings/get-started-button)).

<img alt='Get started button' src='/assets/display-get-started.png' width='600px' />


#### Greeting message

Directly in module view, users are able to modify greeting message ([facebook doc](https://developers.facebook.com/docs/messenger-platform/thread-settings/greeting-text)).


<img alt='Greeting message' src='/assets/greeting-message.png' width='600px' />

#### Persistent menu

Users can directly modify persistent menu in module user interface. By using UI, it's possible to add, modify and remove items \([facebook doc](https://developers.facebook.com/docs/messenger-platform/thread-settings/persistent-menu)\).

<img alt='Persistent menu' src='/assets/persistent-menu.png' width='600px' />

#### Automatically mark as read

Directly in UI, users can setup if they want to automatically mark all messages as read ([facebook doc](https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read)).

<img alt='Mark as read' src='/assets/automatically-mark-as-read.png' width='600px' />

#### Trusted domains

By using UI, users can configure \(add, modify and remove\) trusted domains ([facebook doc](https://developers.facebook.com/docs/messenger-platform/thread-settings/domain-whitelisting)).

<img alt='Trusted domains' src='/assets/trusted-domains.png' width='600px'/>

#### Automatic profile lookup

Profiles are automatically lookedup using Facebook Graph API. The profile of the user can be found in the incoming middleware events: `event.user`

The following properties are available: first_name, last_name, locale, gender, timezone.
 
#### Save users in Database

Users are automatically persisted in the built-in botpress database using the built-in `bp.db.saveUser` function.

#### Webhook security check

botpress-messenger verifies that requests really come from Facebook's servers by validating requests hash.

## Example

* Botpress examples \(soon\).
* Youtube Channel \(soon\).

### Community

There's a [public chatroom](http://www.gitter.im/botpress/core) where you are welcome to join and ask any question and even help others.

### License

botpress-messenger is licensed under AGPL-3.0

