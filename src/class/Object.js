import * as Three from 'three'
import Tween from 'tween.js'

import {
    random
} from 'lodash'
import * as COLOR from '../util/color.js'

class Object3d {
    constructor({
        Geometry,
        Material
    }, {
        size,
        position,
        color
    }) {
        this.size = size
        this.position = position
        this.color = color

        const cubeGeometry = new Geometry(...this.size)
        const cubeMaterial = new Material({
            color: this.color
        })
        const object = new Three.Mesh(cubeGeometry, cubeMaterial)
        object.castShadow = true
        object.receiveShadow = true
        object.position.set(...this.position)
        this.object = object
    }

    moveTo({
        position,
        duration = 1000,
        easing = Tween.Easing.Linear.None,
        delay = 0
    } = {}) {
        return new Promise((resolve, reject) => {
            new Tween.Tween(this.object.position).to(new Three.Vector3(...position), duration).delay(delay).easing(easing).onComplete(resolve).start()
        })
    }

    moveBy({
        position,
        duration = 1000,
        easing = Tween.Easing.Linear.None,
        delay = 0
    } = {}) {
        return new Promise((resolve, reject) => {
            new Tween.Tween(this.object.position).to(new Three.Vector3(...position).add(this.object.position), duration).delay(delay).easing(easing).onComplete(resolve).start()
        })
    }


    rotateTo({
        rotation,
        duration = 1000,
        easing = Tween.Easing.Linear.None
    } = {}) {
        return new Promise((resolve, reject) => {
            new Tween.Tween(this.object.rotation).to(new Three.Vector3(...rotation), duration).easing(easing).onComplete(resolve).start()
        })
    }
    rotateBy({
        rotation,
        duration = 1000,
        easing = Tween.Easing.Linear.None
    } = {}) {
        return new Promise((resolve, reject) => {
            new Tween.Tween(this.object.rotation).to(new Three.Vector3(...rotation).add(this.object.rotation), duration).easing(easing).onComplete(resolve).start()
        })
    }

    getPosition() {
        return this.object.position
    }

    fall({
        height = 18,
        delay = 0
    } = {}) {
        return this.moveBy({
            position: [0, -height, 0],
            duration: height / 0.018,
            easing: Tween.Easing.Bounce.Out,
            delay
        })
    }
}

class Cube extends Object3d {
    constructor({
        size = [10, 4, 10], // [width, height, depth]
        position = [0, 20, 0],
        direction = 'X',
        color
    } = {}) {

        color = color || COLOR.list[random(COLOR.list.length - 1)]
        super({
            Geometry: Three.BoxGeometry,
            Material: Three.MeshLambertMaterial
        }, {
            size,
            position,
            color
        })
        this.direction = direction
    }

    getSize() {
        const {
            width,
            height,
            depth
        } = this.object.geometry.parameters
        return {
            width,
            height,
            depth
        }
    }

    getBounding() {
        const pos = this.getPosition()
        const {
            width,
            height,
            depth
        } = this.getSize()
        return {
            x: {
                max: pos.x + 0.5 * width,
                min: pos.x - 0.5 * width,
            },
            y: {
                max: pos.y + 0.5 * height,
                min: pos.y - 0.5 * height,
            },
            z: {
                max: pos.z + 0.5 * depth,
                min: pos.z - 0.5 * depth,
            },
        }
    }

    contain(point) {
        // console.log('contain para', point)

        if (Object.prototype.toString.apply(point) === "[object Array]") {
            point = new Three.Vector3(...point)
        }
        const {x, y, z} = this.getBounding() 
        return (x.min <= point.x) && (point.x <= x.max) &&
        (y.min <= point.y) && (point.y <= y.max) &&
        (z.min <= point.z) && (point.z <= z.max)
    }
}

class Hero {
    constructor({
        headSize = [1, 32, 32],
        bodySize = [.4, 1, 4, 32],
        position = [0, 2, 0],
        color = COLOR.darkBlue
    } = {}) {
        const mesh = new Three.Object3D()
        const material = new Three.MeshLambertMaterial({
            color
        })

        this.size = {
            head: headSize,
            body: bodySize
        }

        const head = new Three.Mesh(new Three.SphereGeometry(...headSize), material)
        const body = new Three.Mesh(new Three.CylinderGeometry(...bodySize), material)
        head.position.y = 2
        body.castShadow = head.castShadow = true

        mesh.add(head)
        mesh.add(body)

        mesh.position.set(...position)
        this.object = mesh

        Object.setPrototypeOf(Hero.prototype, Object3d.prototype);

        this.squatTimestamp = null
        this.squatTweens = []
    }

    getSize () {
        return this.size
    }

    rotateAloneZ(z, para) {
        console.log('z', z)
        const size = this.getSize()
        this.object.children.forEach(child => child.position.x -= z)
        this.object.children.forEach(child => child.position.y += size.body[2] * .5)

        this.object.position.x += z
        this.object.position.y -= size.body[2] * .5
        
        return this.rotateBy(para)
    }

    rotateAloneX(x, para) {
        console.log('x', x)
        const size = this.getSize()
        this.object.children.forEach(child => child.position.z -= x)
        this.object.children.forEach(child => child.position.y += size.body[2] * .5)

        this.object.position.z += x
        this.object.position.y -= size.body[2] * .5
        
        return this.rotateBy(para)
    }

    startSquat(maxDuration=1500) {
        if (this.squatTweens.length || this.squatTimestamp) {
            return
        }
        this.squatTimestamp = new Date()


        /**
         * head: 
         *  hero.object.children[0].position.y : 2 -> .5
         * 
         * body:
         *  hero.object.children[1].scale.y : 1 -> .5
         *  hero.object.children[1].position.y : 0 -> -1
         */

        function squatTween(target, delta, easing = Tween.Easing.Linear.None) {
            return {
                tween: new Tween.Tween(target).to(new Three.Vector3(...delta).add(target), maxDuration).easing(easing).start(),
                target,
                from: target.toArray()
            }
        }
        this.squatTweens = [
            squatTween(this.object.children[0].position, [0, -1.5, 0]),
            squatTween(this.object.children[1].scale, [0, -0.5, 0]),
            squatTween(this.object.children[1].position, [0, -1, 0]),
        ]

    }

    stopSquat() {
        function restoreTween(target, from, duration = 1000, easing = Tween.Easing.Linear.None) {
            return new Tween.Tween(target).to(new Three.Vector3(...from), duration).easing(easing).start()
        }

        const squatDuration = new Date() - this.squatTimestamp
        const squatRatio = Math.min(squatDuration / 1500, 1)
        this.squatTimestamp = null

        this.squatTweens.forEach(({
            tween,
            target,
            from
        }) => {
            restoreTween(target, from, squatRatio * 200)
            Tween.remove(tween)
        })
        this.squatTweens = []

        return squatRatio
        // return {
        //     promise: this.jump(ratio * 20, squatDuration > 200),
        //     squatDuration
        // }

        // console.log(squatDuration)
    }

    async hop(height, duration) {
        await this.moveBy({
            position: [0, height, 0],
            duration,
            easing: Tween.Easing.Quadratic.Out
        })
        await this.moveBy({
            position: [0, -height, 0],
            duration,
            easing: Tween.Easing.Quadratic.In
        })
    }
    async jump(height, duration, rotate = true, rotateXDirection = true) {

        // console.log(duration)
        rotate && this.rotateBy({
            rotation: [0, 0, (rotateXDirection ? -1 : 1) * Math.PI * 2],
            duration: duration * 2
        }).then(() => {
            this.object.rotation.set(0, 0, 0) // 转完 2 * Pi 之后旋转清零
        })
        await this.hop(height, duration)
        // for (let i = 0; i < 3; ++i) {
        //     console.log(duration, height)
        //     await this.hop(duration, height)
        //     duration /= 2
        //     height /= 4
        // }

    }
}

export {
    Cube,
    Hero
}