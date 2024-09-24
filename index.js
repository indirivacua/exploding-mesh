import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

const pointerPos = new THREE.Vector2(window.innerWidth, window.innerHeight);

//Scene
const scene = new THREE.Scene();

//Geometry
const sceneData = { geometry: null };

const manager = new THREE.LoadingManager();
manager.onLoad = () => initScene(sceneData);

const loader = new OBJLoader(manager);
loader.load("./model_0.obj", (obj) => {
  obj.traverse((child) => {
    if (child.isMesh) {
      sceneData.geometry = child.geometry;
    }
  });
});

//Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 0, 5);

//Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x683afe, 1);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

//Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enabled = false;
controls.enablePan = false;
controls.enableZoom = false;

function initScene(data) {
  //Geometry
  const { geometry } = data;
  geometry.center();

  const numFaces = geometry.attributes.position.count / 3;

  const color = new THREE.Color();

  const colors = new Float32Array(numFaces * 3 * 3);
  const displacement = new Float32Array(numFaces * 3 * 3);

  for (let f = 0; f < numFaces; f++) {
    const index = 9 * f;
    color.setHSL(300 / 360, 0.6, 0.5); //0xcc33cc
    let d = 10 * (0.5 - Math.random());

    for (let i = 0; i < 3; i++) {
      let { r, g, b } = color;
      colors[index + 3 * i + 0] = r;
      colors[index + 3 * i + 1] = g;
      colors[index + 3 * i + 2] = b;

      displacement[index + 3 * i + 0] = d;
      displacement[index + 3 * i + 1] = d;
      displacement[index + 3 * i + 2] = d;
    }
  }

  geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(colors, 3));

  geometry.setAttribute(
    "displacement",
    new THREE.BufferAttribute(displacement, 3),
  );

  const uniforms = {
    mousePosition: { value: new THREE.Vector2(0.0, 0.0) },
    lightPosition: { value: new THREE.Vector3(1, 1, 5) },
  };

  const shaderMaterialOuter = new THREE.ShaderMaterial({
    uniforms: uniforms,
    side: THREE.DoubleSide,
    vertexShader: document.getElementById("vertexshader").textContent,
    fragmentShader: document.getElementById("fragmentshader").textContent,
  });

  const meshOuter = new THREE.Mesh(geometry, shaderMaterialOuter);
  meshOuter.scale.setScalar(2);
  scene.add(meshOuter);

  const shaderMaterialInner = new THREE.MeshPhongMaterial({
    color: 0x0d003e,
  });

  const meshInner = new THREE.Mesh(geometry, shaderMaterialInner);
  meshInner.scale.setScalar(2);
  meshInner.position.z -= 0.1;
  scene.add(meshInner);

  //Light
  const dirLight = new THREE.DirectionalLight(0xffffff, 100);
  dirLight.position.set(0, 10, 10);
  scene.add(dirLight);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
  scene.add(hemiLight);

  //Background
  const backgroundGeometry = new THREE.PlaneGeometry(10, 10);
  const backgroundMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.DoubleSide,
  });
  const backgroundPlane = new THREE.Mesh(
    backgroundGeometry,
    backgroundMaterial,
  );
  backgroundPlane.position.z = -5;
  scene.add(backgroundPlane);

  // Animate displacement
  gsap.to(displacement, {
    duration: 1,
    repeat: -1,
    yoyo: true,
    onUpdate: () => {
      geometry.attributes.displacement.needsUpdate = true;

      for (let i = 0; i < displacement.length; i++) {
        displacement[i] += Math.sin(i * 0.1 + performance.now() * 0.001) * 0.1;
      }
    },
  });

  function animate() {
    requestAnimationFrame(animate);
    let { x, y } = pointerPos;
    shaderMaterialOuter.uniforms.mousePosition.value = { x, y };

    renderer.render(scene, camera);
    controls.update();
  }

  animate();
}

function handleMouseMove(evt) {
  pointerPos.set(
    (evt.clientX / window.innerWidth) * 2 - 1,
    -(evt.clientY / window.innerHeight) * 2 + 1,
  );
}
window.addEventListener("mousemove", handleMouseMove, false);

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", handleWindowResize, false);
