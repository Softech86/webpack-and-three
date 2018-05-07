import React, { Component } from 'react';
import './App.css';
import 'normalize.css'

import { Playground } from './3d.js'

class App extends Component {

  constructor (props) {
    super(props);

    this.state = {
      element: null
    }
  }

  render() {
    return (
      <div className="App" id="app" ref={ x => x && this.state.element && x.appendChild(this.state.element) }/>
    );
  }

  componentDidMount () {
    const playground = new Playground(true)
    this.setState( { element: playground.getDomElement() } );

    playground.startRender()
  }

}

export default App;
