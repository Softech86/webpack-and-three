import React, { Component } from 'react';
import * as THREE from 'three';
import './App.css';

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
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    this.setState( { element: renderer.domElement } );

    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    var cube = new THREE.Mesh( geometry, material );
    scene.add( cube );

    camera.position.z = 5;

    function render() {
      requestAnimationFrame( render );
      renderer.render( scene, camera );
    }
    render();
  }

}

export default App;
