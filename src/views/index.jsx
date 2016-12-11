import React from 'react'
import ReactDOM from 'react-dom'
import {
  Form,
  FormGroup,
  FormControl,
  Col,
  Button,
  ControlLabel,
  Panel,
  Checkbox,
  Glyphicon,
  ListGroup,
  ListGroupItem,
  InputGroup,
  Alert
} from 'react-bootstrap'
import _ from 'lodash'
import Promise from 'bluebird'

import style from './style.scss'

export default class MessengerModule extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      loading:true,
      message: null,
      error: null,
      initialStateHash: null
    }

    this.handleChange = this.handleChange.bind(this)
    this.handleChangeCheckBox = this.handleChangeCheckBox.bind(this)
    this.handleSaveChanges = this.handleSaveChanges.bind(this)
    this.handleRemoveFromList = this.handleRemoveFromList.bind(this)
    this.handleAddToTrustedDomainsList = this.handleAddToTrustedDomainsList.bind(this)
    this.handleAddToPersistentMenuList = this.handleAddToPersistentMenuList.bind(this)
    this.handleValidation = this.handleValidation.bind(this)
    this.handleConnection = this.handleConnection.bind(this)
    this.renderPersistentMenuItem = this.renderPersistentMenuItem.bind(this)
    this.renderDomainElement = this.renderDomainElement.bind(this)
    this.handleChangeNGrokCheckBox = this.handleChangeNGrokCheckBox.bind(this)
    this.handleDismissError = this.handleDismissError.bind(this)
    this.renderGetStartedMessage = this.renderGetStartedMessage.bind(this)
  }

  getAxios() {
    return this.props.bp.axios
  }

  componentDidMount() {
    this.getAxios().get('/api/botpress-messenger/config')
    .then((res) => {
      this.setState({
        loading: false,
        ...res.data
      })

      setImmediate(() => {
        this.setState({ initialStateHash: this.getStateHash() })
      })
    })

    this.getAxios().get('/api/botpress-messenger/homepage')
    .then((res) => {
      this.setState({
        homepage: res.data.homepage
      })
    })
  }

  getStateHash() {
    const hashingStateItems = [
      'accessToken',
      'appSecret',
      'applicationID',
      'automaticallyMarkAsRead',
      'displayGetStarted',
      'greetingMessage',
      'hostname',
      'ngrok',
      'persistentMenu',
      'persistentMenuItems',
      'trustedDomains'
    ]

    return hashingStateItems.map((i) => {
      return this.state[i]
    }).join(' ')
  }

  handleSaveChanges() {
    this.setState({ loading:true })

    return this.getAxios().post('/api/botpress-messenger/config', _.omit(this.state, 'loading', 'initialStateHash', 'message', 'error'))
    .then(() => {
      this.setState({
        message: {
          type: 'success',
          text: 'Your configuration have been saved correctly.'
        },
        loading: false,
        initialStateHash: this.getStateHash()
      })
    })
    .catch((err) => {
      this.setState({
        message: {
          type: 'danger',
          text: 'An error occured during you were trying to save configuration: ' + err.response.data.message
        },
        loading: false,
        initialStateHash: this.getStateHash()
      })
    })
  }

  handleChange(event) {
    var { name, value } = event.target

    var connectionInputList = ['applicationID', 'accessToken', 'hostname', 'ngrok', 'appSecret']
    if (_.includes(connectionInputList, name)) {
      this.setState({ validated: false })
    }

    this.setState({
      [name]: value
    })
  }

  handleValidation() {
    this.getAxios().post('/api/botpress-messenger/validation', {
      applicationID: this.state.applicationID,
      accessToken: this.state.accessToken
    })
    .then(() => {
      this.setState({validated: true})
    })
    .catch(err => {
      this.setState({ error: err.response.data.message, loading: false })
    })
  }

  handleConnection(event) {
    let preConnection = Promise.resolve()

    if (this.state.initialStateHash && this.state.initialStateHash !== this.getStateHash()) {
      preConnection = this.handleSaveChanges()
    }

    preConnection.then(() => {
      return this.getAxios().post('/api/botpress-messenger/connection', {
        applicationID: this.state.applicationID,
        accessToken: this.state.accessToken,
        appSecret: this.state.appSecret,
        hostname: this.state.hostname
      })
      .then(() => {
        this.setState({ connected: !this.state.connected })
        window.setTimeout(::this.handleSaveChanges, 100)
      })
      .catch(err => {
        this.setState({ error: err.response.data.message, loading: false })
      })
    })
  }

  handleChangeCheckBox(event) {
    var { name } = event.target
    this.setState({[name]: !this.state[name]})
  }

  handleChangeNGrokCheckBox() {
    if (!this.state.ngrok) {
      this.getAxios().get('/api/botpress-messenger/ngrok')
      .then(res => {
        this.setState({ hostname: res.data.replace(/https:\/\//i, '') })
      })
    }

    this.setState({
      validated: false,
      ngrok: !this.state.ngrok
    })
  }

  handleRemoveFromList(value, name) {
    this.setState({
      [name]: _.without(this.state[name], value)
    })
  }

  handleAddToTrustedDomainsList() {
    const input = ReactDOM.findDOMNode(this.trustedDomainInput)
    if (input && input.value !== '') {
      this.setState({
        trustedDomains: _.concat(this.state.trustedDomains, input.value)
      })
      input.value = ''
    }
  }

  handleAddToPersistentMenuList() {

    const type = ReactDOM.findDOMNode(this.newPersistentMenuType)
    const title = ReactDOM.findDOMNode(this.newPersistentMenuTitle)
    const value = ReactDOM.findDOMNode(this.newPersistentMenuValue)
    const item = {
      type: type && type.value,
      title: title && title.value,
      value: value && value.value
    }

    if (_.some(_.values(item), _.isEmpty)) {
      return
    }

    this.setState({
      persistentMenuItems: _.concat(this.state.persistentMenuItems, item)
    })

    type.selected = 'postback'
    title.value = ''
    value.value = ''
  }

  handleDismissError() {
    this.setState({ error: null })
  }

  renderLabel(label, link) {
    return (
      <Col componentClass={ControlLabel} sm={3}>
        {label} <small>(<a target="_blank" href={link}>?</a>)</small>
      </Col>
    )
  }

  renderTextInput(label, name, link, props = {}) {
    return (
      <FormGroup>
        {this.renderLabel(label, link)}
        <Col sm={7}>
          <FormControl name={name} {...props} type="text"
            value={this.state[name]} onChange={this.handleChange} />
        </Col>
      </FormGroup>
    )
  }

  renderGetStartedMessage() {
    return <div>
      {this.renderCheckBox('Auto respond to GET_STARTED postback', 'autoRespondGetStarted', this.state.homepage+'#display-get-started')}
      {this.state.autoRespondGetStarted && this.renderTextAreaInput('Auto response', 'autoResponse', this.state.homepage+'#greeting-message')}
    </div>
  }

  renderHostnameTextInput(props) {
    const prefix = 'https://'
    const suffix = '/api/botpress-messenger/webhook'

    const getValidationState = () => {
      if (this.state.hostname) {
        var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi
        var regex = new RegExp(expression)

        var completeURL = prefix + this.state.hostname + suffix
        return regex.test(completeURL) ? 'success' : 'error'
      }
    }

    return (
      <FormGroup validationState={getValidationState()}>
        {this.renderLabel('Hostname', this.state.homepage+'#4-setup-hostname')}
        <Col sm={7}>
          <InputGroup>
            <InputGroup.Addon>{prefix}</InputGroup.Addon>
            <FormControl name="hostname" {...props} type="text"
              value={this.state.hostname} onChange={this.handleChange} />
            <InputGroup.Addon>{suffix}</InputGroup.Addon>
          </InputGroup>
        </Col>
      </FormGroup>

    )
  }

  renderNGrokCheckbox(props) {
    return (
      <FormGroup>
        {this.renderLabel('Use ngrok', 'https://ngrok.com/')}
        <Col sm={7}>
          <Checkbox name='ngrok' {...props} checked={this.state.ngrok}
            onChange={this.handleChangeNGrokCheckBox} />
        </Col>
      </FormGroup>
    )
  }

  renderTextAreaInput(label, name, link, props = {}) {
    return (
      <FormGroup>
        {this.renderLabel(label, link)}
        <Col sm={7}>
          <FormControl name={name} {...props}
            componentClass="textarea" rows="3"
            value={this.state[name]}
            onChange={this.handleChange} />
        </Col>
      </FormGroup>
    )
  }

  renderCheckBox(label, name, link) {
    return (
      <FormGroup>
        {this.renderLabel(label, link)}
        <Col sm={7}>
          <Checkbox name={name} checked={this.state[name]}
            onChange={this.handleChangeCheckBox} />
        </Col>
      </FormGroup>
    )
  }

  renderDomainElement(domain) {
    const removeHandler = () => this.handleRemoveFromList(domain, 'trustedDomains')

    return <ListGroupItem key={domain}>
      {domain}
      <Glyphicon className="pull-right" glyph="remove" onClick={removeHandler} />
    </ListGroupItem>
  }

  renderTrustedDomainList() {
    const trustedDomainElements = this.state.trustedDomains.map(this.renderDomainElement)

    return (
      <div>
        <FormGroup>
          {this.renderLabel('Trusted Domains', this.state.homepage+'#trusted-domains')}
          <Col sm={7}>
            <ControlLabel>Current trusted domains:</ControlLabel>
            <ListGroup>
              {trustedDomainElements}
            </ListGroup>
          </Col>
        </FormGroup>
        <FormGroup>
          <Col smOffset={3} sm={7}>
            <ControlLabel>Add a new domain:</ControlLabel>
            <FormControl ref={(input) => this.trustedDomainInput = input} type="text"/>
            <Button className={style.messengerButton} onClick={() => this.handleAddToTrustedDomainsList()}>
              Add domain
            </Button>
          </Col>
        </FormGroup>
      </div>
    )
  }

  renderPersistentMenuItem(item) {
    const handleRemove = () => this.handleRemoveFromList(item, 'persistentMenuItems')
    return <ListGroupItem key={item.title}>
        {item.type + ' | ' + item.title + ' | ' + item.value}
        <Glyphicon
          className="pull-right"
          glyph="remove"
          onClick={handleRemove} />
      </ListGroupItem>
  }

  renderPersistentMenuList() {
    return (
      <div>
        <FormGroup>
          <Col smOffset={3} sm={7}>
            <ControlLabel>Current menu items:</ControlLabel>
            <ListGroup>
              {this.state.persistentMenuItems.map(this.renderPersistentMenuItem)}
            </ListGroup>
          </Col>
        </FormGroup>
        <FormGroup>
          <Col smOffset={3} sm={7}>
            <ControlLabel>Add a new item:</ControlLabel>
            <FormControl ref={r => this.newPersistentMenuType = r} componentClass="select" placeholder="postback">
              <option value="postback">Postback</option>
              <option value="url">URL</option>
            </FormControl>
            <FormControl ref={r => this.newPersistentMenuTitle = r} type="text" placeholder="Title"/>
            <FormControl ref={r => this.newPersistentMenuValue = r} type="text" placeholder="Value"/>
            <Button className={style.messengerButton} onClick={() => this.handleAddToPersistentMenuList()}>
              Add to menu
            </Button>
          </Col>
        </FormGroup>
      </div>
    )
  }

  renderSaveButton() {
    return (
      <Button className={style.messengerButton} onClick={this.handleSaveChanges}>
        Save
      </Button>
    )
  }

  renderConnectionValidation() {
    // const validatedText = <ControlLabel>All your connection settings are valid.</ControlLabel>
    // const button = <Button className={style.messengerButton} onClick={this.handleValidation}>Validate</Button>

    return <FormGroup>
        {this.renderLabel('Validation', this.state.homepage+'#5-validate-and-connect')}
        <Col sm={7}>
          {this.state.validated ? validatedText : button}
        </Col>
      </FormGroup>
  }

  renderConnectionButton() {
    const disconnectButton = (
      <Button className={style.messengerButton} onClick={this.handleConnection}>
        Disconnect
      </Button>
    )

    const connectButton = (
       <Button className={style.messengerButton} onClick={this.handleConnection}>
         {this.state.initialStateHash && this.state.initialStateHash !== this.getStateHash()
            ? 'Save & Connect'
            : 'Connect'
          }
       </Button>
     )

    return (
      <FormGroup>
        <Col smOffset={3} sm={7}>
          {this.state.connected ? disconnectButton : connectButton}
        </Col>
      </FormGroup>
    )
  }

  renderHeader(title) {
    return <div className={style.header}>
      <h4>{title}</h4>
      {this.renderSaveButton()}
    </div>
  }

  renderForm() {
    return (
      <Form horizontal>
        <div className={style.section}>
          {this.renderHeader('Connexion')}
          <div>
            {this.renderTextInput('Application ID', 'applicationID', this.state.homepage+'#2-get-app-id-and-app-secret', { disabled: this.state.connected })}
            {this.renderTextAreaInput('Access Token', 'accessToken', this.state.homepage+'#3-get-access-token', { disabled: this.state.connected })}
            {this.renderTextInput('App Secret', 'appSecret', this.state.homepage+'#2-get-app-id-and-app-secret', { disabled: this.state.connected })}
            {this.renderHostnameTextInput({ disabled: (this.state.ngrok || this.state.connected) })}
            {this.renderNGrokCheckbox( {disabled: this.state.connected} )}
            {this.renderConnectionButton()}
          </div>
        </div>

        <div className={style.section}>
          {this.renderHeader('General')}
          <div>
            {this.renderCheckBox('Display Get Started', 'displayGetStarted', this.state.homepage+'#display-get-started')}
            {this.state.displayGetStarted && this.renderGetStartedMessage()}
            {this.renderTextAreaInput('Greeting text', 'greetingMessage', this.state.homepage+'#greeting-message')}
            {this.renderCheckBox('Persistent menu', 'persistentMenu', this.state.homepage+'#persistent-menu')}
            {this.state.persistentMenu && this.renderPersistentMenuList()}
            {this.renderCheckBox('Automatically mark as read', 'automaticallyMarkAsRead', this.state.homepage+'#automatically-mark-as-read')}
          </div>
        </div>

        <div className={style.section}>
          {this.renderHeader('Advanced')}
          <div>
            {this.renderTrustedDomainList()}
          </div>
        </div>
      </Form>
    )
  }

  renderUnsavedAlert() {
    return (this.state.initialStateHash && this.state.initialStateHash !== this.getStateHash())
      ? <Alert bsStyle='warning'>Be careful, you have unsaved changes in your configuration...</Alert>
      : null
  }

  renderMessageAlert() {
    return this.state.message
      ? <Alert bsStyle={this.state.message.type}>{this.state.message.text}</Alert>
      : null
  }

  renderErrorAlert() {
    return (
      <Alert bsStyle="danger" onDismiss={this.handleDismissError}>
        <h4>An error occured during communication with Facebook</h4>
        <p>Details: {this.state.error}</p>
      </Alert>
    )
  }

  renderAllContent() {
    return <div>
      {this.state.error ? this.renderErrorAlert() : null}
      {this.renderUnsavedAlert()}
      {this.renderMessageAlert()}
      {this.renderForm()}
    </div>
  }

  render() {
    return this.state.loading ? null : this.renderAllContent()
  }
}
