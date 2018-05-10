import React, { Component } from 'react';
import './App.css';
import 'normalize.css'

import { Playground } from './3d.js'

class App extends Component {

  constructor (props) {
    super(props);

    this.state = {
      element: null,
      gameover: false,
      score: 0,
      scoreColorLight: true // TODO: add score color
    }
  }

  render() {
    return (
      <div className="App" id="app" ref={ x => x && this.state.element && x.appendChild(this.state.element) }>
        <div id="score" className={ this.state.gameover ? 'center' : '' }>{ this.state.score }</div>
      </div>
    );
  }

  componentDidMount () {
    const playground = new Playground()
    this.setState( { element: playground.getDomElement() } );

    playground.bindEvent('score', () => this.setState({score: this.state.score + 1}) )
    playground.bindEvent('gameover', () => this.setState({gameover: true}) )
    playground.startRender()
  }

}

export default App;
