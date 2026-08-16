import * as three from "three"
import "@css/index.css"

const container = document.getElementById("three")
const scene = new three.Scene()
const light = new three.DirectionalLight(0xffffff, 1)
const camera = new three.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.25, 1000)
const renderer = new three.WebGLRenderer({ alpha: true, antialias: true })
renderer.setSize(container.clientWidth, container.clientHeight)
camera.position.z = 5
camera.add(light)
scene.add(camera)
container.appendChild(renderer.domElement)

const geometry = new three.BoxGeometry()
const material = new three.MeshStandardMaterial({ color: 0xaaaaaa })
const cube = new three.Mesh(geometry, material)
scene.add(cube)

function animate() {
  requestAnimationFrame(animate)
  cube.rotation.x += .01
  cube.rotation.y += .01
  renderer.render(scene, camera)
}
animate()