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
  InputGroup
} from 'react-bootstrap'
import axios from 'axios'
import _ from 'lodash'

import style from './style.scss'

export default class MessengerModule extends React.Component {

  constructor(props){
    super(props)

    this.state = {loading:true}

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
  }

  componentDidMount(){
    axios.get("/api/skin-messenger/config")
    .then((res) => {
      this.setState({
        loading:false,
        ...res.data
      })
    });
  }

  handleSaveChanges(event) {
    this.setState({loading:true})

    axios.post("/api/skin-messenger/config", _.omit(this.state, 'loading'))
    .then(res => {
      this.setState({
        message: 'success',
        loading: false,
        error: null
      })
    })
    .catch((err) => {
     this.setState({
       loading: false,
       error: err.response.data.message
     })
    })
  }

   handleChange(event){
     var { name, value } = event.target

     var connectionInputList = ['applicationID', 'accessToken', 'verifyToken', 'appSecret']
     if(_.includes(connectionInputList, name)){
       this.setState({ validated:false })
     }

     this.setState({ message:'warning', [name]: value })
   }

  handleValidation(event){
    axios.post("/api/skin-messenger/validation", {
      applicationID: this.state.applicationID,
      accessToken: this.state.accessToken
     })
    .then((res) => {
      this.setState({validated: true})
    })
    .catch((res) => {
      // TODO: Add to errors printing
      console.log(res)
    })
  }

  handleConnection(event){

    axios.post("/api/skin-messenger/connection", {
      applicationID: this.state.applicationID,
      accessToken: this.state.accessToken,
      appSecret: this.state.appSecret,
      hostname: this.state.hostname
     })
    .then((res) => {
      this.setState({ connected: !this.state.connected })
      setImmediate(() => this.handleSaveChanges(event))
    })
    .catch((res) => {
      // TODO: Add to errors printing
      console.log(res)
    })
  }

  handleChangeCheckBox(event){
    this.setState({message:'warning'})
    var { name } = event.target
    this.setState({[name]: !this.state[name]})
  }

  handleChangeNGrokCheckBox(event){
    this.setState({
      message: 'warning',
      ngrok: !this.state.ngrok
    })  
  }

  handleRemoveFromList(value, name){
    this.setState({message:'warning'})
    this.setState({[name]: _.without(this.state[name], value)})
  }

  handleAddToTrustedDomainsList(){
    this.setState({message:'warning'})
    const input = ReactDOM.findDOMNode(this.trustedDomainInput)
    if(input && input.value !== ''){
      this.setState({
        trustedDomains: _.concat(this.state.trustedDomains, input.value)
      })
      input.value = ''
    }
  }

  handleAddToPersistentMenuList() {
    this.setState({message:'warning'})

    const type = ReactDOM.findDOMNode(this.newPersistentMenuType)
    const title = ReactDOM.findDOMNode(this.newPersistentMenuTitle)
    const value = ReactDOM.findDOMNode(this.newPersistentMenuValue)
    const item = {
      type: type && type.value,
      title: title && title.value,
      value: value && value.value
    }

    if(_.some(_.values(item), _.isEmpty)) {
      return
    }

    this.setState({
      persistentMenuItems: _.concat(this.state.persistentMenuItems, item)
    })

    type.selected = 'postback'
    title.value = ''
    value.value = ''
  }

  renderLabel(label){
    return (
      <Col componentClass={ControlLabel} sm={3}>
        {label}
      </Col>
    )
  }

  renderTextInput(label, name, props = {}){
    return (
      <FormGroup>
        {this.renderLabel(label)}
        <Col sm={7}>
          <FormControl name={name} {...props} type="text"
            value={this.state[name]} onChange={this.handleChange} />
        </Col>
      </FormGroup>
    )
  }

  renderHostnameTextInput(props){
    const prefix = 'https://'
    const suffix = '/api/skin-messenger/webhook'

    const getValidationState = () => {
      if(this.state.hostname){
        var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi
        var regex = new RegExp(expression)

        var completeURL = prefix + this.state.hostname + suffix
        return regex.test(completeURL) ? 'success' : 'error'
      }
    }

    return (
      <FormGroup validationState={getValidationState()}>
        {this.renderLabel('Hostname')}
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

  renderNGrokCheckbox(props){
    return (
      <FormGroup>
        {this.renderLabel('Use ngrok')}
        <Col sm={7}>
          <Checkbox name='ngrok' {...props} checked={this.state.ngrok}
            onChange={this.handleChangeNGrokCheckBox} />
        </Col>
      </FormGroup>
    )
  }

  renderTextAreaInput(label, name, props = {}){
    return (
      <FormGroup>
        {this.renderLabel(label)}
        <Col sm={7}>
          <FormControl name={name} {...props}
            componentClass="textarea" rows="3"
            value={this.state[name]}
            onChange={this.handleChange} />
        </Col>
      </FormGroup>
    )
  }

  renderCheckBox(label, name){
    return (
      <FormGroup>
        {this.renderLabel(label)}
        <Col sm={7}>
          <Checkbox name={name} checked={this.state[name]}
            onChange={this.handleChangeCheckBox} />
        </Col>
      </FormGroup>
    )
  }

  renderDomainElement(domain) {
    const removeHandler = () => this.handleRemoveFromList(domain, "trustedDomains")

    return <ListGroupItem key={domain}>
      {domain}
      <Glyphicon className="pull-right" glyph="remove" onClick={removeHandler} />
    </ListGroupItem>
  }

  renderTrustedDomainList(){
    const trustedDomainElements = this.state.trustedDomains.map(this.renderDomainElement)

    return (
      <div>
        <FormGroup>
          {this.renderLabel("Trusted Domains")}
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
            <Button bsStyle="primary" active onClick={() => this.handleAddToTrustedDomainsList()}>
              <Glyphicon glyph="plus" /> Add
            </Button>
          </Col>
        </FormGroup>
      </div>
    )
  }

  renderPersistentMenuItem(item) {
    const handleRemove = () => this.handleRemoveFromList(item, 'persistentMenuItems')
    return <ListGroupItem key={item.title}>
        {item.type + " | " + item.title + " | " + item.value}
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
            <Button bsStyle="primary" active onClick={() => this.handleAddToPersistentMenuList()}>
              <Glyphicon glyph="plus"/> Add
            </Button>
          </Col>
        </FormGroup>
      </div>
    )
  }

  renderSaveButton() {
    return (
      <FormGroup>
        <Col sm={12}>
          <Button className="pull-right" bsStyle="success" active onClick={this.handleSaveChanges}>
            <Glyphicon glyph="floppy-disk"/> Save
          </Button>
        </Col>
      </FormGroup>
    )
  }

  renderErrorMessage() {
    return <p className={style.errorMessage}>
      {this.state.error}
    </p>
  }

  renderConnectionValidation() {
    const validatedText = <ControlLabel>All your connection settings are valid.</ControlLabel>
    const button = <Button bsStyle="primary" active onClick={this.handleValidation}>Validate now!</Button>

    return <FormGroup>
        {this.renderLabel('Validation')}
        <Col sm={7}>
          {this.state.validated ? validatedText : button}
        </Col>
      </FormGroup>
  }

  renderConnectionButton() {
    const disconnectButton = (
      <Button bsStyle="danger" active onClick={this.handleConnection}>
        <Glyphicon glyph="stop"/> Disconnect
      </Button>
    )

    const connectButton = (
       <Button bsStyle="success" active onClick={this.handleConnection}>
         <Glyphicon glyph="play"/> Connect now!
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

  renderForm(){
    return (
      <Form horizontal>
        {this.state.error && this.renderErrorMessage()}

        <Panel header="Connexion">
          {this.renderTextInput("Application ID", "applicationID", { disabled: this.state.connected })}
          {this.renderTextAreaInput("Access Token", "accessToken", { disabled: this.state.connected })}
          {this.renderTextInput("App Secret", "appSecret", { disabled: this.state.connected })}
          {this.renderHostnameTextInput({ disabled: (this.state.ngrok || this.state.connected) })}
          {this.renderNGrokCheckbox( {disabled: this.state.connected} )}
          {this.renderConnectionValidation()}
          {this.state.validated && this.renderConnectionButton()}
        </Panel>

        <Panel header='General'>
          {this.renderCheckBox('Display Get Started', 'displayGetStarted')}
          {this.renderTextAreaInput('Greating message', 'greetingMessage')}
          {this.renderCheckBox('Persistent menu', 'persistentMenu')}
          {this.state.persistentMenu && this.renderPersistentMenuList()}
          {this.renderCheckBox('Automatically mark as read', 'automaticallyMarkAsRead')}
        </Panel>

        <Panel header='Advanced'>
          {this.renderTrustedDomainList()}
        </Panel>

        {this.renderSaveButton()}
      </Form>
    )
  }

  renderMainPanel(){
    let style = 'info'
    let header = 'Messenger settings'

    if(this.state.message && this.state.message === 'success') {
      style = 'success'
      header += ' | New settings have been updated successfully'
    } else if (this.state.message && this.state.message === 'warning') {
      style = 'warning'
      header += ' | You have unsaved changes'
    } else if (this.state.error) {
      style = 'danger'
      hander += ' | Error updating settings'
    }

    return <Panel header={header} bsStyle={style}>
      {this.renderForm()}
    </Panel>
  }

  render() {
    return <div>
      {this.state.loading ? null : this.renderMainPanel()}
    </div>
  }
}
