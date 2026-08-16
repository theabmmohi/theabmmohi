import * as three from "three"
import "@css/index.css"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const scene = new three.Scene()
scene.background = new three.Color(0x87ceeb)

const light = new three.DirectionalLight(0xffffff, 1)
const camera = new three.PerspectiveCamera(75, innerWidth / innerHeight, 0.25, 1000)
const renderer = new three.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
camera.position.set(0, 1.8, 5)
camera.add(light)
scene.add(camera)
document.getElementById("three").appendChild(renderer.domElement)

// OrbitControls handles rotation (drag) + zoom (pinch) natively
const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 1, 0)
controls.update()

const groundGeometry = new three.PlaneGeometry(50, 50)
const groundMaterial = new three.MeshStandardMaterial({ color: 0x228833 })
const ground = new three.Mesh(groundGeometry, groundMaterial)
ground.rotation.x = -Math.PI / 2
scene.add(ground)

const geometry = new three.BoxGeometry()
const material = new three.MeshStandardMaterial({ color: 0xaaaaaa })
const cube = new three.Mesh(geometry, material)
cube.position.set(0, 0, 0)
scene.add(cube)

// WASD-style on-screen buttons: hold = move, release = stop (like real key press/release)
const keys = { w: false, a: false, s: false, d: false }

function bindButton(id, key) {
  const btn = document.getElementById(id)
  btn.addEventListener('touchstart', (e) => { keys[key] = true; e.preventDefault() })
  btn.addEventListener('touchend', (e) => { keys[key] = false; e.preventDefault() })
  btn.addEventListener('touchcancel', () => keys[key] = false)
}
bindButton('btn-w', 'w')
bindButton('btn-a', 'a')
bindButton('btn-s', 's')
bindButton('btn-d', 'd')

const posEl = document.getElementById('pos')
const angleEl = document.getElementById('angle')
const speed = 0.05

function animate() {
  requestAnimationFrame(animate)

  // movement direction follows where OrbitControls is currently facing
  const forward = new three.Vector3()
  camera.getWorldDirection(forward)
  forward.y = 0
  forward.normalize()
  const right = new three.Vector3()
  right.crossVectors(forward, camera.up).normalize()

  const move = new three.Vector3()
  if (keys.w) move.add(forward)
  if (keys.s) move.sub(forward)
  if (keys.d) move.add(right)
  if (keys.a) move.sub(right)

  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(speed)
    camera.position.add(move)
    controls.target.add(move) // keep orbit point moving with the player
  }

  controls.update()

  const yaw = Math.atan2(forward.x, forward.z) * 180 / Math.PI
  posEl.textContent = `x:${camera.position.x.toFixed(1)} y:${camera.position.y.toFixed(1)} z:${camera.position.z.toFixed(1)}`
  angleEl.textContent = `yaw: ${yaw.toFixed(0)}°`

  renderer.render(scene, camera)
}
animate()
