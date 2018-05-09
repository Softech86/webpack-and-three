import * as Three from 'three'
import Tween from 'tween.js'
import OrbitControls from './util/OrbitControls.js'

import dat from 'dat.gui'
import Stats from 'stats-js'

import {
    Cube,
    Hero
} from './class/Object.js'
import {
    COLOR
} from './util/config.js'
import {
    random
} from 'lodash'
import {
    create
} from 'handlebars';

window.Tween = Tween
window.Three = Three

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

        this.initThree()
        this.initCamera()
        this.initScene()
        this.initLight()
        this.initControl()
        this.initObjects()
        this.initAnimations()
    }

    initThree() {
        this.renderer = new Three.WebGLRenderer({
            antialias: true
        })
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.setClearColor(COLOR.white)
        this.renderer.shadowMap.enabled = true


        if (this.DEBUG) {
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
        this.camera.zoom = 15
        this.camera.clearViewOffset()

        if (this.DEBUG) {
            const guiParams = this.guiParams

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

        if (this.DEBUG) {
            Object.assign(this.guiParams, {
                fog: 0.01
            })
            this.gui.add(this.guiParams, 'fog', 0, 0.02).step(0.001)

            UpdateManager.getInstance().addUpdateFunction(this, function () {
                this.scene.fog = new Three.FogExp2(COLOR.white, this.guiParams.fog)
            })
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
    }
    initObjects() {
        this.manager = UpdateManager.getInstance()

        if (this.DEBUG) {
            const helper = new Three.GridHelper(600, 60, COLOR.red, COLOR.darkGray);
            this.scene.add(helper);
        }

        const floorGeometry = new Three.PlaneBufferGeometry(200, 200);
        const floorMaterial = new Three.MeshPhongMaterial({
            color: COLOR.lightGray
        })
        const floorMesh = new Three.Mesh(floorGeometry, floorMaterial);
        floorMesh.receiveShadow = true;
        floorMesh.rotation.x = -Math.PI / 2.0;
        this.scene.add(floorMesh);

    }

    async initAnimations() {
        const cubes = []

        const createCube = (position = [20, 20, 0]) => {

            const cube = new Cube({
                position
            })
            this.scene.add(cube.object)

            const distance = random(3, 6) * 5 // [15, 30] with step 5

            return {
                cube,
                distance
            }
        }

        const moveCubes = async () => {
            const cubeInfo = createCube()

            const promises = [...cubes.map(({
                    cube
                }) =>
                cube.moveBy({
                    position: [-cubeInfo.distance, 0, 0],
                    duration: cubeInfo.distance / 20 * 1000,
                    easing: Tween.Easing.Cubic.Out
                })
            ), cubeInfo.cube.fall()]
            await Promise.all(promises)

            cubes.push(cubeInfo)

            if (cubes.length > 6) {
                const dumpedCube = cubes.splice(0, 1)[0]
                this.scene.remove(dumpedCube.cube.object)
            }
        }

        let mutex = 0

        // cubes.push(...[0, 20].map(x => createCube([x, 20, 0])))
        window.cubes = cubes


        const hero = new Hero({
            position: [0, 24, 0]
        })
        const addCube = async (x) => {
            await delay(x * 600)
            const cubeInfo = createCube([x * 20, 20, 0])
            cubes.push(cubeInfo)
            await cubeInfo.cube.fall()
        }
        const addHero = async () => {
            await delay(1000)
            this.scene.add(hero.object)
            await hero.fall()
        }

        await Promise.all([...[0, 1].map(x => addCube(x)), addHero()])


        window.hero = hero

        window.addEventListener('keydown', e => {
            console.log('keydown', e.keyCode)
            if (e.keyCode === 32) {

                if (mutex !== 0) {
                    return
                }
                hero.startSquat()

                mutex = 1
            }
            if (e.keyCode === 65) {}
        })

        window.addEventListener('keyup', async e => {
            console.log('keyup', e.keyCode)
            if (e.keyCode === 32) {
                if (mutex !== 1) {
                    return
                }
                mutex = 2

                await Promise.all([moveCubes(), hero.stopSquat()])

                mutex = 0
            }
        })
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

    getDomElement() {
        return this.renderer.domElement
    }

}