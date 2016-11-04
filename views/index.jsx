import React from 'react'
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
  ListGroupItem
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
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleRemoveFromList = this.handleRemoveFromList.bind(this)
    this.handleAddToList = this.handleAddToList.bind(this)
    this.handleAddToPersistentMenuList = this.handleAddToPersistentMenuList.bind(this)
    this.handleValidation = this.handleValidation.bind(this)
    this.handleConnection = this.handleConnection.bind(this)
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

  handleSubmit(event) {
    this.setState({loading:true})
     axios.post("/api/skin-messenger/config", {
       applicationID: this.state.applicationID,
       accessToken: this.state.accessToken,
       verifyToken: this.state.verifyToken,
       appSecret: this.state.appSecret,
       validated: this.state.validated,
       connected: this.state.connected,
       displayGetStarted: this.state.displayGetStarted,
       greetingMessage: this.state.greetingMessage,
       persistentMenu: this.state.persistentMenu,
       persistentMenuItems: this.state.persistentMenuItems,
       automaticallyMarkAsRead: this.state.automaticallyMarkAsRead,
       trustedDomains: this.state.trustedDomains
    })
     .then((res) => {
       this.setState({
         message:'success',
         loading:false,
         error: null
       })
     })
     .catch((err) => {
      this.setState({
        loading: false,
        error: err.response.data.message
      })
     });
   }

   handleChange(event){
     var { name, value } = event.target

     var connectionInputList = ['applicationID', 'accessToken', 'verifyToken', 'appSecret']
     if(_.includes(connectionInputList, name)){
       this.setState({validated:false})
     }

     this.setState({message:'warning'})
     this.setState({[name]: value})
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
    this.setState({ connected: !this.state.connected })
    setImmediate(() => this.handleSubmit(event))
  }

  handleChangeCheckBox(event){
    this.setState({message:'warning'})
    var { name } = event.target
    if(this.state[name] == true){
      this.setState({[name]: false})
    } else {
      this.setState({[name]: true})
    }
  }

  handleRemoveFromList(value, name){
    this.setState({message:'warning'})
    this.setState({[name]: _.without(this.state[name], value)})
  }

  handleAddToList(name){
    this.setState({message:'warning'})
    var txtInput = document.getElementById('newValueToList').value
    // TODO: Validate url with regex
    if(txtInput !== ''){
      this.setState({[name]: _.concat(this.state[name], txtInput)})
      document.getElementById('newValueToList').value = ''
    }
  }

  handleAddToPersistentMenuList(name){
    this.setState({message:'warning'})

    var item = {
      type: document.getElementById('newPersistantMenuType').value,
      title: document.getElementById('newPersistantMenuTitle').value,
      value: document.getElementById('newPersistantMenuValue').value
    }

    if(item.type !== '' && item.title !== '' && item.value !== ''){
      this.setState({[name]: _.concat(this.state[name], item)})
      document.getElementById('newPersistantMenuType').selected = 'postback'
      document.getElementById('newPersistantMenuTitle').value = ''
      document.getElementById('newPersistantMenuValue').value = ''
    }
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
          <FormControl id={name} name={name} {...props} type="text"
            value={this.state[name]} onChange={this.handleChange.bind(this)} />
        </Col>
      </FormGroup>
    )
  }

  renderTextAreaInput(label, name, props = {}){
    return (
      <FormGroup>
        {this.renderLabel(label)}
        <Col sm={7}>
          <FormControl id={name} name={name} {...props} componentClass="textarea" rows="3"
            value={this.state[name]} onChange={this.handleChange.bind(this)}/>
        </Col>
      </FormGroup>
    )
  }

  renderCheckBox(label, name){
    return (
      <FormGroup>
        {this.renderLabel(label)}
        <Col sm={7}>
          <Checkbox name={name} checked={this.state[name]} onChange={this.handleChangeCheckBox}/>
        </Col>
      </FormGroup>
    )
  }

  renderSimpleList(label, name){
    return (
      <div>
        <FormGroup>
          {this.renderLabel(label)}
          <Col sm={7}>
            <ControlLabel>Current list of trusted domains:</ControlLabel>
            <ListGroup>
              {this.state[name].map((value) => {
                return (
                  <ListGroupItem key={value}>
                    {value} <Glyphicon className="pull-right" glyph="remove" onClick={() => this.handleRemoveFromList(value, name)} />
                </ListGroupItem>
                )
              })}
            </ListGroup>
          </Col>
        </FormGroup>
        <FormGroup>
          <Col smOffset={3} sm={7}>
            <ControlLabel>Add a new domain:</ControlLabel>
            <FormControl id="newValueToList" type="text"/>
            <Button bsStyle="primary" active onClick={() => this.handleAddToList(name)}>
              <Glyphicon glyph="plus" /> Add
            </Button>
          </Col>
        </FormGroup>
      </div>
    )
  }

  renderPersistentMenuList(label, name){
    return (
      <div>
        <FormGroup>
          {this.renderLabel(label)}
          <Col sm={7}>
            <ControlLabel>Current menu items:</ControlLabel>
            <ListGroup>
              {this.state[name].map((item) => {
                return (
                  <ListGroupItem key={item.title}>
                    {item.type + " - " + item.title + " - " + item.value}
                    <Glyphicon  className="pull-right" glyph="remove" onClick={() => this.handleRemoveFromList(item, name)} />
                  </ListGroupItem>
                )
              })}
            </ListGroup>
          </Col>
        </FormGroup>
        <FormGroup>
          <Col smOffset={3} sm={7}>
            <ControlLabel>Add a new item:</ControlLabel>
            <FormControl id="newPersistantMenuType" componentClass="select" placeholder="postback">
              <option value="postback">Postback</option>
              <option value="url">URL</option>
            </FormControl>
            <FormControl id="newPersistantMenuTitle" type="text" placeholder="Title"/>
            <FormControl id="newPersistantMenuValue" type="text" placeholder="Value"/>
            <Button bsStyle="primary" active onClick={() => this.handleAddToPersistentMenuList(name)}>
              <Glyphicon glyph="plus" /> Add
            </Button>
          </Col>
        </FormGroup>
      </div>
    )
  }

  renderSaveButton(){
    return (
      <FormGroup>
        <Col sm={12}>
          <Button className="pull-right" bsStyle="success" active onClick={this.handleSubmit}>
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

  renderInnerValidation(name){
    if(this.state[name]){
      return (
          <ControlLabel>All your connection settings are valid.</ControlLabel>
      )
    } else {
      return (
        <Button bsStyle="primary" active onClick={this.handleValidation}>
          Validate now!
        </Button>
      )
    }
  }

  renderValidationButton(label, name){
    return (
      <FormGroup>
        {this.renderLabel(label)}
        <Col sm={7}>
          {this.renderInnerValidation(name)}
        </Col>
      </FormGroup>
    )
  }

  renderInnerConnection(name){
    if(this.state[name]){
      return (
        <Button bsStyle="danger" active onClick={this.handleConnection}>
          <Glyphicon glyph="stop"/> Disconnect
        </Button>
      )
    } else {
       return (
         <Button bsStyle="success" active onClick={this.handleConnection}>
           <Glyphicon glyph="play"/> Connect now!
         </Button>
       )
    }

  }

  renderConnectionButton(name){
    return (
      <FormGroup>
        <Col smOffset={3} sm={7}>
          {this.renderInnerConnection(name)}
        </Col>
      </FormGroup>
    )
  }

  renderForm(){
    return (
      <Form horizontal>
        {this.state.error && this.renderErrorMessage()}
        <Panel header="Connexion">
          {this.renderTextInput("Application ID", "applicationID", {disabled: this.state.connected})}
          {this.renderTextAreaInput("Access Token", "accessToken", {disabled: this.state.connected})}
          {this.renderTextInput("Verify Token", "verifyToken", {disabled: this.state.connected})}
          {this.renderTextInput("App Secret", "appSecret", {disabled: this.state.connected})}
          {this.renderValidationButton("Validation", "validated")}
          {this.state.validated && this.renderConnectionButton("connected")}
        </Panel>
        <Panel header="General">
          {this.renderCheckBox("Display Get Started", "displayGetStarted")}
          {this.renderTextAreaInput("Greating message", "greetingMessage")}
          {this.renderCheckBox("Persistant menu", "persistentMenu")}
          {this.state.persistentMenu && this.renderPersistentMenuList("Menu items", "persistentMenuItems")}
          {this.renderCheckBox("Automatically mark as read", "automaticallyMarkAsRead")}
        </Panel>
        <Panel header="Advanced">
          {this.renderSimpleList("Trusted Domains", "trustedDomains")}
        </Panel>
        {this.renderSaveButton()}
      </Form>
    )
  }

  renderMainPanel(){
    if(this.state.message && this.state.message === 'success'){
      return (
        <Panel header="Messenger settings - New settings have been updated correctly!" bsStyle="success">
          {this.renderForm()}
        </Panel>
      )
    } else if (this.state.message && this.state.message === 'warning') {
      return (
        <Panel header="Messenger settings - Be carreful, some changes are not saved..." bsStyle="warning">
          {this.renderForm()}
        </Panel>
      )
    } else if (this.state.error) {
      return (
        <Panel header="Messenger settings - Error updating settings" bsStyle="danger">
          {this.renderForm()}
        </Panel>
      )
    } else {
      return (
        <Panel header="Messenger settings" bsStyle="info">
          {this.renderForm()}
        </Panel>
      )
    }
  }

  render() {
    if(this.state.loading) return null;
    return (
      <div>
        {this.renderMainPanel()}
      </div>
    )
  }
}
