# botpress-messenger

Official Facebook Messenger connector for Botpress. This module has been build to accelerate and facilitate development of Messenger's bots.

## Installation

By using CLI, users only need to type this command in their terminal to add messenger module to their bot.

`botpress install messenger`

By using Botpress UI, it's also possible to easily install it.

![Install modules](/assets/install-messenger-module.png)

## Get started

To setup this module, users need to fill connexion settings directly in UI.

![Connexion settings](/assets/connexion-settings.png)

1. Create a **Facebook page** \([link](https://www.facebook.com/pages/create)\) and a **Facebook application** \([link](https://developers.facebook.com)\)

  ![Create app](/assets/create-app-facebook.png)

2. Get **App ID** and **App Secret** on dashboard of developers page [](#applicationid) [](#appsecret)

  ![App id and app secret](/assets/app-id-app-secret.png)

3. Get **Access token** on Messenger section of developers [](#accesstoken)

  page

  ![Access token](/assets/access-token.png)

4. Setup **Hostname** [](#hostname)

  4.1. Users need to manually enter their hostname or use **ngrok** to locally deploy their bot \([learn more about ngrok](https://ngrok.com)\).[](#ngrok)

  4.2. Users don't have to setup webhook on developers page, this module automatically setup it via Facebook API.

5. **Validate** and **Connect**! [](#validation)

To see in details how to configure completly this module, videos are available on our Youtube Channel (soon).

#### Using ngrok

As you can see in module UI, users can

## Features

* Messages

* Buttons

* Templates

* Referrals

* Postbacks

* Delivery and read receipts

* Quick replies

* Automatic typing indicator

* Persistent menu

* Getting started button

* Getting started text

* Trusted domains

* Save users in DB

* Automatic profile lookup

* Webhook security check

## Reference

#### Messages

#### Buttons

CODE

\(facebook developers guide link\)

#### Buttons

#### Templates

#### Referrals

#### Postbacks

#### Delivery and read receipts

#### Quick replies

#### Automatic typing indicator

#### Display Get Started [](#displaygetstarted])

To active get started button on Messenger, users can modify display setting directly in user interface \([facebook doc](https://developers.facebook.com/docs/messenger-platform/thread-settings/get-started-button)\).

![Get started button](/assets/get-started-button.png)

#### Greeting message [](#greetingmessage)

Directly in module view, users are able to modify greeting message \([facebook doc](https://developers.facebook.com/docs/messenger-platform/thread-settings/greeting-text)\).

![Greeting message](/assets/greeting-message.png)

#### Persistent menu [](#persistentmenu)

Users can directly modify persistent menu in module user interface. By using UI, it's possible to add, modify and remove items \([facebook doc](https://developers.facebook.com/docs/messenger-platform/thread-settings/persistent-menu)\).

![Persistent menu](/assets/persistant-menu.png)

#### Automatically mark as read [](#automaticallymarkasread)

Directly in UI, users can setup if they want to automatically mark all messages as read ([facebook doc](https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read)).

![](/assets/mark-as-read.png)

#### Trusted domains [](#trusteddomains)

By using UI, users can configure \(add, modify and remove\) trusted domains ([facebook doc](https://developers.facebook.com/docs/messenger-platform/thread-settings/domain-whitelisting)\).

![Trusted domains](/assets/trusted-domains.png)

#### Automatic profile lookup

#### Save users in Database

#### Webhook security check

## Example

* Botpress examples (soon).

* Youtube Channel (soon).

### Community

### License

botpress-messenger is licensed under AGPL-3.0
