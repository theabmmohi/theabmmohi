import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import * as three from "three"
import "@css/index.css"

const len = 25

const scene = new three.Scene()
const light = new three.DirectionalLight(0xffffff, 1)
const camera = new three.PerspectiveCamera(75, innerWidth / innerHeight, 0.25, 1000)
const renderer = new three.WebGLRenderer({ alpha: true, antialias: true })
renderer.setSize(innerWidth, innerHeight)
camera.position.set(0, 2, 10)
camera.add(light)
scene.add(camera)
document.getElementById("three").appendChild(renderer.domElement)

const axesHelper = new three.AxesHelper(len)
scene.add(axesHelper)
const axesHelperNeg = new three.AxesHelper(len)
axesHelperNeg.scale.set(-1, -1, -1)
scene.add(axesHelperNeg)
const gridZX = new three.GridHelper(2 * len, 2 * len)
scene.add(gridZX)
const gridYZ = new three.GridHelper(2 * len, 2 * len)
gridYZ.rotation.z = Math.PI / 2
scene.add(gridYZ)
const gridXY = new three.GridHelper(2 * len, 2 * len)
gridXY.rotation.x = Math.PI / 2
scene.add(gridXY)

for (let i = -len; i <= len; i++) {
  if (i === 0) continue
  const lx = makeLabel(String(i), "red")
  lx.position.set(i, 0.1, 0)
  scene.add(lx)
  const ly = makeLabel(String(i), "green")
  ly.position.set(0, i, 0)
  scene.add(ly)
  const lz = makeLabel(String(i), "blue")
  lz.position.set(0, 0.1, i)
  scene.add(lz)
}

const grids = { XY: gridXY, YZ: gridYZ, ZX: gridZX }
for (const grid in grids) grids[grid].visible = false
window.toggleGrid = function (plane) {
  const grid = grids[plane]
  if (!grid) return
  grid.visible = !grid.visible
}

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 0, 0)
controls.update()















const boxGeometry = new three.BoxGeometry(1, 1, 1)
const boxMaterial = new three.MeshStandardMaterial({ color: 0xaaaaaa })
const box = new three.Mesh(boxGeometry, boxMaterial)
box.position.set(0.5, 0.5, 0.5)
scene.add(box)

const sphereGeometry = new three.SphereGeometry(0.5, 32, 32)
const sphereMaterial = new three.MeshStandardMaterial({ color: 0xaaaaaa })
const sphere = new three.Mesh(sphereGeometry, sphereMaterial)
sphere.position.set(1.5, 0.5, 0.5)
scene.add(sphere)

const planeGeometry = new three.PlaneGeometry()
const planeMaterial = new three.MeshStandardMaterial({ color: 0xaaaaaa, side: three.DoubleSide })
const plane = new three.Mesh(planeGeometry, planeMaterial)
plane.position.set(1.5, 0, 0.5)
plane.rotation.x = -Math.PI / 2
scene.add(plane)
















let last = performance.now()
const fpsAcc = []

function animate() {
  requestAnimationFrame(animate)
  const now = performance.now()
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  fpsAcc.push(dt)
  if (fpsAcc.length > 40) fpsAcc.shift()
  let sum = 0
  for (const v of fpsAcc) sum += v
  const fps = fpsAcc.length / Math.max(sum, 1e-4)
  controls.update()
  const dir = new three.Vector3()
  camera.getWorldDirection(dir)
  document.getElementById("pos").textContent = `${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}`
  document.getElementById("fps").textContent = `${fps.toFixed(0)} fps`
  renderer.render(scene, camera)
}
animate()

function makeLabel(text, color) {
  const canvas = document.createElement("canvas")
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext("2d")
  ctx.font = "bold 40px monospace"
  ctx.fillStyle = color
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, 32, 32)
  const texture = new three.CanvasTexture(canvas)
  const sprite = new three.Sprite(new three.SpriteMaterial({ map: texture }))
  sprite.scale.set(0.4, 0.4, 1)
  return sprite
}