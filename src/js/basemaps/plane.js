function createPlane(scene) {
    const groundGeo = new THREE.BoxGeometry(200, 1, 200);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x3d963d });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.5;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(200, 100, 0x2e752e, 0x358535);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    return ground;
}

const canvas = document.getElementById("gameCanvas");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ec9f5);
scene.fog = new THREE.Fog(0x9ec9f5, 60, 220);

const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    500
);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.75);
dirLight.position.set(40, 80, 30);
scene.add(dirLight);

createPlane(scene);
const player = createPlayer(scene);
const cameraController = createCameraController(camera);
const multiplayer = createMultiplayer(scene, player);

function animate() {
    requestAnimationFrame(animate);
    player.update(cameraController.getYaw());
    cameraController.update(player.mesh.position);
    multiplayer.sync();
    renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
