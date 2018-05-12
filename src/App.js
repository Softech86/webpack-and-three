import React, { Component } from 'react';
import './App.scss';
import 'normalize.css'

import { Playground } from './3d.js'
import { getBrightness, toHex } from './util/color.js'

import Tween from 'tween.js'

window.getBrightness = getBrightness
class App extends Component {

  constructor (props) {
    super(props);

    this.state = {
      element: null,
      gameover: false,
      score: 0,
      scoreColorLight: false,
      energy: 0,
      color: '#909090',
      triggerDown: false
    }
  }

  render() {
    return (
      <div className="App" id="app" className={ [this.state.gameover ? 'gameover' : '', this.state.scoreColorLight ? 'light' : ''].join(' ') }>
        <div className="canvas-container" style={{
          filter: `grayscale(${0.4*(1  - Math.pow(this.state.energy, 1/3))})`
        }} ref={ x => {
          if (x && this.state.element) {
            if (x.firstElementChild) {
              x.removeChild(x.firstElementChild)
            } 
            x.appendChild(this.state.element) 
          }
        } }></div>

        <div className="shade" />
        <div className="score"><span className="text">Score</span><span>{ this.state.score }</span></div>
        {
          this.state.gameover ? 
          <div className="button" id="restart" onClick={this.reset.bind(this)}>Jump Again</div> : ""
        }

        <div className={"button " + (this.state.triggerDown ? 'down' : '')} id="trigger" hidden={this.state.gameover} style={{color: this.state.energy > 0 ? 'gray' : 'black'}}>
          <span>Biu</span>
          <i className="energy" style={{height: this.state.energy * 100 + '%', backgroundColor: this.state.color}}/>
        </div> 
      </div>
    );
  }

  componentDidMount () {
    this.gameStart()
  }

  gameStart () {
    console.log(this)
    const playground = new Playground()
    window.playground = playground
    this.setState( { element: playground.getDomElement() } )
    // this.forceUpdate()

    playground.bindEvent('score', () => this.setState({score: this.state.score + 1}) )
    playground.bindEvent('color', color => this.setState({color: toHex(color)}) )
    playground.bindEvent('down', color => this.setState({triggerDown: true}) )
    playground.bindEvent('up', color => this.setState({triggerDown: false}) )
    
    
    playground.bindEvent('energy', e =>
      new Tween.Tween().to(null, 800 + 1200 * e).easing(Tween.Easing.Quadratic.Out).onUpdate(i => this.setState({energy: e - e * i})).start()
    )
    playground.bindEvent('gameover', color => {
      this.setState({scoreColorLight: true}) // getBrightness(color) < 0.5
      this.setState({gameover: true})
    })
    playground.startRender()

    this.playground = playground
  }

  reset () {
    this.setState( { scoreColorLight: false, gameover: false, score: 0, energy: 0, color: '#909090' } )
    this.playground.reset()
  }

}

export default App;
