import * as THREE from "three";
import spline from "./spline.js";
//glow components
import { EffectComposer } from "jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "jsm/postprocessing/UnrealBloomPass.js";


// system variables
let w = window.innerWidth;
let h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
scene.add(camera);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(w, h);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
scene.fog = new THREE.FogExp2(0x000000, 0.3);   // Adding fog to the scene, first parameter is colour and second is the desnity



// post-processing
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 100);
bloomPass.threshold = 0.002;
bloomPass.strength = 3.5;
bloomPass.radius = 0;
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);





// Create a tube geo, which follows the line path
const tubeGeo = new THREE.TubeGeometry(spline,227,0.65,16,true);


//CCreate a wireframe edges for the tube, so that we dont show the diagonal lines
const edges = new THREE.EdgesGeometry(tubeGeo, 0.2);
const edgeMaterial = new THREE.LineBasicMaterial( {color:0x0099ff} );
const tubeEdges = new THREE.LineSegments(edges, edgeMaterial);
scene.add(tubeEdges);


//Create some boxes in space
const numBoxes = 55;
const boxSize = 0.075;
const boxGeo = new THREE.BoxGeometry(boxSize,boxSize,boxSize);

for (let i = 0; i < numBoxes; i += 1) {

  const boxMat = new THREE.MeshBasicMaterial ({
    color: 0xffffff, 
    wireframe: true});
  const box = new THREE.Mesh(boxGeo, boxMat);

  const pb = (i / numBoxes + Math.random() + 0.1) % 1;
  const pos = tubeGeo.parameters.path.getPointAt(pb);
  pos.x += Math.random() - 0.5;
  pos.z += Math.random() - 0.5;
  box.position.copy(pos);

  // Establish the box rotations, by setting a vector variable, contating random rotations for each segment
  const rote = new THREE.Vector3(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI,
  );
  
  //Create the new boxes, the new boxes only show the outside faces
  const edgeBox = new THREE.EdgesGeometry(boxGeo, 0.2)
  const color = new THREE.Color().setHSL(pb, 1, 0.5)
  const edgeBoxMaterial = new THREE.LineBasicMaterial({color});
  const finalBox = new THREE.LineSegments(edgeBox, edgeBoxMaterial);

  //Set the position of the final boxes
  finalBox.position.copy(pos);
  finalBox.rotation.set(rote.x, rote.y, rote.z);
  scene.add(finalBox);
}


let mousepos = new THREE.Vector2();
const crosshairs = new THREE.Group();
crosshairs.position.z = -1;
camera.add(crosshairs);
const crossMaterial = new THREE.LineBasicMaterial( {color: 0xffffff} );
const lineGeo = new THREE.BufferGeometry();
const lineVerts = [0, 0.05, 0, 0, 0.02, 0];
lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(lineVerts, 3));

for (let i=0; i < 4; i +=1) {
  const line = new THREE.Line(lineGeo, crossMaterial);
  line.rotation.z = i * 0.5 * Math.PI;
  crosshairs.add(line)
}






//Create the moving camera fucntion
function moveCamera(t){
  const time = t * 0.17;
  const looptime = 15 * 1000;
  const p = (time % looptime) / looptime;
  const pos = tubeGeo.parameters.path.getPointAt(p);
  const lookAt = tubeGeo.parameters.path.getPointAt((p + 0.02) % 1);
  camera.position.copy(pos);
  camera.lookAt(lookAt);
}




function animate(t = 0) {
  requestAnimationFrame(animate);
  moveCamera(t)
  crosshairs.position.set(mousepos.x, mousepos.y, -1);
  composer.render(scene, camera);  //From post-ops, we input composer instead of the renderer for the GLOW EFFECT
}
animate();

function onMouseMove(evt) {
  w = window.innerWidth;
  h = window.innerHeight;
  let aspect = w / h;
  let fudge = { x: aspect * 0.75, y: 0.75 };
  mousepos.x = ((evt.clientX / w) * 2 - 1) * fudge.x;
  mousepos.y = (-1 * (evt.clientY / h) * 2 + 1) * fudge.y;
}
window.addEventListener("mousemove", onMouseMove, false);

function handleWindowResize() {
  w = window.innerWidth;
  h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
}
window.addEventListener("resize", handleWindowResize, false);