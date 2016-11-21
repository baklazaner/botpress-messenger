# Botpress Messenger

A botpress module for connecting fb messenger

## Installation

Step 1: install node module into your project

In your project folder

```bash
> npm install --save botpress-messenger
```

Step 2: register this module as outgoing middleware

```javascript
// `./index.js` in you project

module.exports = function(bp) {

  // other outgoing middleware before current module

  bp.outgoing('botpress-messenger')

  // other outgoing middleware after current module

}
```

## Configuration

TODO
