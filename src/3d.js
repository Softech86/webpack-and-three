import * as Three from 'three'
import Tween from 'tween.js'
import OrbitControls from './util/OrbitControls.js'

import dat from 'dat.gui'
import Stats from 'stats-js'

import {
    Cube,
    Hero
} from './class/Object.js'
import * as COLOR from './util/color.js'
import {
    random,
    sum
} from 'lodash'

window.random = random

function delay(duration = 1000) {
    return new Promise((resolve, reject) => setTimeout(resolve, duration))
}

class UpdateManager {

    static _instance = null

    constructor() {
        this.funcs = []
    }

    static getInstance() {
        if (!this._instance) {
            this._instance = new UpdateManager()
        }
        return this._instance
    }

    addUpdateFunction(object, func) {
        this.funcs.push(func.bind(object))
    }

    execute() {
        this.funcs.forEach(x => x())
    }

}

export class Playground {
    constructor(DEBUG = false) {
        this.DEBUG = DEBUG
        this.MOBILE = window.innerWidth <= 480

        this._eventTarget = {}
        this.initThree()
        this.initCamera()
        this.initScene()
        this.initLight()
        this.initControl()
        this.initObjects() 
        this.initEventListener() // WARNING: binded while objects still moving!
        // this.initAnimations().then(this.initEventListener.bind(this))
    }

    bindEvent(key, func) {
        Object.assign(this._eventTarget, {
            [key]: func
        })
    }

    getTrigger () {
        return document.querySelector('#trigger')
    }

    dispatchEvent(key, ...para) {
        this._eventTarget[key] && this._eventTarget[key](...para)
    }

    initThree() {
        this.renderer = new Three.WebGLRenderer({
            antialias: true
        })
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.setClearColor(COLOR.white)
        this.renderer.shadowMap.enabled = true


        if (this.DEBUG) {

            window.Tween = Tween
            window.Three = Three

            this.gui = new dat.GUI()
            this.guiParams = {
                camera_x: 0,
                camera_y: 0,
                camera_z: 10,
                zoom: 15
            }
            this.gui.add(this.guiParams, 'camera_x', -100, 100).step(0.1).listen()
            this.gui.add(this.guiParams, 'camera_y', -100, 100).step(0.1).listen()
            this.gui.add(this.guiParams, 'camera_z', -100, 100).step(0.1).listen()
            this.gui.add(this.guiParams, 'zoom', 0, 30).step(0.1).listen()
            this.gui.open();

            this.stats = new Stats();
            this.stats.domElement.style.position = 'absolute';
            this.stats.domElement.style.left = '0px';
            this.stats.domElement.style.top = '0px';
            document.body.appendChild(this.stats.domElement);
        }
    }
    initCamera() {
        // this.camera = new Three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.camera = new Three.OrthographicCamera(-window.innerWidth / 2, window.innerWidth / 2, window.innerHeight / 2, -window.innerHeight / 2, -1000, 1000);

        this.camera.position.set(-20, 14, 16)
        this.camera.zoom = this.MOBILE ? 10.5 : 15
        this.camera.clearViewOffset()

        if (this.DEBUG) {
            const guiParams = this.guiParams
            window.camera = this.camera

            UpdateManager.getInstance().addUpdateFunction(this.camera, function () {
                const {
                    x,
                    y,
                    z,
                } = this.position

                guiParams.zoom = this.zoom
                guiParams.camera_x = x
                guiParams.camera_y = y
                guiParams.camera_z = z
            })
        }
    }
    initScene() {
        this.scene = new Three.Scene()
        this.scene.fog = new Three.FogExp2(COLOR.white, 0.01)

        const floorGeometry = new Three.PlaneBufferGeometry(200, 200);
        const floorMaterial = new Three.MeshPhongMaterial({
            color: COLOR.lightGray
        })
        const floorMesh = new Three.Mesh(floorGeometry, floorMaterial);
        floorMesh.receiveShadow = true;
        floorMesh.rotation.x = -Math.PI / 2.0;
        this.scene.add(floorMesh);

        if (this.DEBUG) {
            Object.assign(this.guiParams, {
                fog: 0.01
            })
            this.gui.add(this.guiParams, 'fog', 0, 0.02).step(0.001)

            UpdateManager.getInstance().addUpdateFunction(this, function () {
                this.scene.fog = new Three.FogExp2(COLOR.white, this.guiParams.fog)
            })

            const helper = new Three.GridHelper(600, 60, COLOR.red, COLOR.darkGray);
            this.scene.add(helper);
        }
    }
    initLight() {
        const light = new Three.AmbientLight(COLOR.gray); // soft white light
        this.scene.add(light);

        var spotLight = new Three.SpotLight(0xffffff, .8)
        spotLight.position.set(30, 100, 20)
        spotLight.castShadow = true

        console.log(spotLight.shadow.mapSize)
        spotLight.shadow.mapSize.width = 4096;
        spotLight.shadow.mapSize.height = 4096;

        spotLight.castShadow = true;
        spotLight.angle = 0.9;
        spotLight.penumbra = 0.2;
        spotLight.decay = 2;
        spotLight.distance = 0;

        this.scene.add(spotLight)

        if (this.DEBUG) {
            this.scene.add(new Three.SpotLightHelper(spotLight))

            Object.assign(this.guiParams, {
                light_x: 30,
                light_y: 100,
                light_z: 20
            })
            this.gui.add(this.guiParams, 'light_x', -100, 100).step(1)
            this.gui.add(this.guiParams, 'light_y', -100, 100).step(1)
            this.gui.add(this.guiParams, 'light_z', -100, 100).step(1)


            const guiParams = this.guiParams
            UpdateManager.getInstance().addUpdateFunction(spotLight.position, function () {
                this.set(guiParams.light_x, guiParams.light_y, guiParams.light_z)
            })
        }
    }
    initControl() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        if (!this.DEBUG) {
            this.controls.dispose()
        }
    }

    async initObjects() {
        this.manager = UpdateManager.getInstance()

        const hero = new Hero({
            position: [0, 24, 0]
        })
        const addHero = async () => {
            await delay(1000)
            this.scene.add(hero.object)
            await hero.fall()
        }

        const cubes = []

        this.hero = hero
        this.cubes = cubes

        if (this.DEBUG) {
            window.cubes = cubes
            window.hero = hero
        }

        await Promise.all([...[0, 1].map(async x => {
            await delay(x * 600)
            await this.addCube(x * 20, true)
        }), addHero()])
    } 

    getLastCube () {
        return this.cubes.slice(-1)[0]
    }

    async addCube (distance, directionX) { // [15, 30] with step 5
        const cubes = this.cubes
        const lastCube = this.getLastCube()
        const lastCubePos = lastCube ? lastCube.getPosition().toArray() : [0, 0, 0]
        directionX = directionX || random(0, 9) % 2

        const cube = directionX ? new Cube({
            position: [distance, 20, lastCubePos[2]],
            direction: 'X'
        }) : new Cube({
            position: [lastCubePos[0], 20, -distance],
            direction: 'Z'
        })
        this.scene.add(cube.object)
        cubes.push(cube)
        await cube.fall()

        if (cubes.length > 6) {
            const dumpedCube = cubes.splice(0, 1)[0]
            this.scene.remove(dumpedCube.object)
        }
    }

    async moveCubes (distance, duration) {
        console.log(duration)
        const toX = this.getLastCube().direction === 'X'
        await Promise.all(this.cubes.map(cube => {
            cube.moveBy({
                position: toX ? [-distance, 0, 0] : [0, 0, distance],
                duration,
                easing: Tween.Easing.Sinusoidal.Out
            })
        }))
    }

    async collisionDetection (jumpHeight, jumpDuration) {
        // if (heroFailed) {
        //     endGame()
        // } else if (heroOnLastCube) {
        //     createNewCube
        // {}
        const hero = this.hero
        const cubes = this.cubes
        const size = hero.getSize().body
        const {
            x,
            y,
            z
        } = hero.getPosition()


        let flag = 1
        for (let cube of cubes.slice(-2).reverse()) {
            const dots = [-size[1], 0, size[1]].map(d => cube.contain([x + d, y - size[2], z]))

            if (sum(dots) >= 2) {
                // land on
                if (flag) {
                    this.dispatchEvent('score')
                    this.dispatchEvent('color', cube.color)
                    await this.addCube(cube.getPosition().x + random(4, 10) * 3)
                }
                break
            } else if (sum(dots) === 1) {
                if (!dots[0]) {
                    // Fall from left
                    console.log('Fall from left')
                    const axis = cube.getBounding().x.min
                    await hero.rotateAloneZ(axis, {
                        rotation: [0, 0, Math.PI / 2],
                        easing: Tween.Easing.Bounce.Out
                    })
                    await hero.moveBy({
                        position: [0, -6, 0]
                    })
                    await this.gameover()
                } else {
                    // Fall from right
                    console.log('Fall from right')

                    const axis = cube.getBounding().x.max
                    await hero.rotateAloneZ(axis, {
                        rotation: [0, 0, -Math.PI / 2],
                        easing: Tween.Easing.Bounce.Out
                    })
                    await hero.moveBy({
                        position: [0, -6, 0]
                    })
                    await this.gameover()
                }
                break
            } else {
                flag -= 1
            }
        }
        if (flag === -1) {
            const down = 10
            const deltaT = 60 * (Math.sqrt(2 * jumpHeight + 2 * down) - Math.sqrt(2 * jumpHeight))

            const h = jumpHeight
            const d = down
            const dt = deltaT
            const t0 = jumpDuration

            const easing = x => h * dt * dt / d / t0 / t0 * x * x + 2 * h * dt / d / t0 * x

            await hero.moveBy({
                position: [0, -down, 0],
                duration: deltaT,
                easing
            })
            await this.gameover()
        }
    }

    async gameover () {
        const cubes = this.cubes

        console.log('Gameover!')
        this.dispatchEvent('gameover', this.getLastCube().color)

        const shouldLookAt = cubes.slice(-2).map(c => c.getPosition().toArray()).reduce((s, c) => s.map((x, i) => x + c[i] * .5), [0, 0, 0])
        let lookAt = [0, 0, 0]

        const {x, y, z} = this.camera.position
        const r = Math.sqrt(x * x + z * z)
        const theta0 = Math.atan(x / z)
        
        const circle = () => {
            // console.log('circle')
            new Tween.Tween().to(null, 20000).onUpdate(ratio => {
                const theta = ratio * Math.PI * 2 + theta0
                this.camera.position.x = lookAt[0] + r * Math.sin(theta)
                this.camera.position.z = lookAt[2] + r * Math.cos(theta)
                this.camera.position.y = y
                this.camera.lookAt(...lookAt)

                // console.log(this.camera.position.toArray())
                // console.log(theta, lookAt)
            }).onComplete(circle).start()
        }
    
        new Tween.Tween(lookAt).to(shouldLookAt, 10000).start()
        circle()
    }

    initEventListener () {

        let mutex = 0

        const down = e => {
            // console.log('keydown', e.keyCode)
            // if (e.keyCode === 32) {

            if (mutex !== 0) {
                return
            }

            this.dispatchEvent('down')
            this.hero.startSquat()

            mutex = 1
            // }
            // if (e.keyCode === 65) {}
        }
        const up = async e => {
            // console.log('keyup', e.keyCode)
            // if (e.keyCode === 32) {
            if (mutex !== 1) {
                return
            }
            mutex = 2
            this.dispatchEvent('up')

            const toX = this.getLastCube().direction === 'X'
            const squatRatio = this.hero.stopSquat() // [0, 1]
            const distance = squatRatio * 30
            const height = squatRatio * 20

            const duration = Math.sqrt(2 * height) * 60

            this.dispatchEvent('energy', squatRatio)


            await Promise.all([this.moveCubes(distance, duration * 2), this.hero.jump(height, duration, squatRatio > 0.2, toX)])

            await this.collisionDetection(height, duration)

            mutex = 0
            // }
        }
        
        this.getTrigger().addEventListener('mousedown', down)
        this.getTrigger().addEventListener('touchstart', down)
        this.getTrigger().addEventListener('mouseup', up)
        this.getTrigger().addEventListener('touchend', up)
        this.getTrigger().addEventListener('touchcancel', up)
    }

    render() {
        if (this.DEBUG) {
            this.stats.begin();
        }
        this.animationFrame = requestAnimationFrame(this.render.bind(this))

        Tween.update()
        this.manager.execute()
        this.renderer.render(this.scene, this.camera)

        if (this.DEBUG) {
            this.stats.end();
        }
    }

    startRender() {
        this.stopRender()
        this.render()
    }

    stopRender() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame)
        }
        this.animationFrame = null
    }

    reset () {
        Tween.removeAll()

        this.camera.position.set(-20, 14, 16)
        this.camera.zoom = this.MOBILE ? 10.5 : 15
        this.camera.lookAt(0, 0, 0)
        this.camera.clearViewOffset()

        this.cubes.forEach(cube => this.scene.remove(cube.object))
        this.scene.remove(this.hero.object)

        this.initObjects()
    }

    getDomElement() {
        return this.renderer.domElement
    }

}