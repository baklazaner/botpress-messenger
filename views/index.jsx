import React from 'react'
import { Button } from 'react-bootstrap'
import axios from 'axios'

import style from './style.scss'

export default class MessengerModule extends React.Component {

  constructor(props){
    super(props)
    this.state = {loading:true}
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
       accessToken: this.state.accessToken,
       verifyToken: this.state.verifyToken,
       appSecret: this.state.appSecret})
     .then((res) => {
       this.setState({
         message:'Your file have been updated correctly.',
         loading:false,
         ...res.data
       })
     });
   }

  handleChange(event){
    var { name, value } = event.target
    this.setState({[name]: value})
  }

  render() {
    if(this.state.loading) return null;

    return (
      <div>
        { this.state.message && <div>{this.state.message}</div>}
        <input name="accessToken" type="text" placeholder="accessToken" value={this.state.accessToken} onChange={this.handleChange.bind(this)}/>
        <input name="verifyToken" type="text" placeholder="verifyToken" value={this.state.verifyToken} onChange={this.handleChange.bind(this)}/>
        <input name="appSecret" type="text" placeholder="appSecret" value={this.state.appSecret} onChange={this.handleChange.bind(this)}/>
        <button onClick={this.handleSubmit.bind(this)}>
          Submit
        </button>
      </div>
    );
  }
}
