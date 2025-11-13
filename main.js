// =========================================================
// THREE.JS: ESCENA EN PRIMERA PERSONA (WASD)
// =========================================================

// Variables globales para la animación y la carga asíncrona
let hdrTexture = null;
let controls;
let prevTime = performance.now(); // Para calcular el tiempo de movimiento

// Variables de movimiento
const velocity = new THREE.Vector3();
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
const speed = 150.0; // Velocidad de movimiento

// === 1. PILARES FUNDAMENTALES: ESCENA, CÁMARA, RENDERIZADOR ===

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
// Colocamos la cámara un poco más alto, simulando la altura de los ojos
camera.position.y = 1.6; 

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// === 2. CONTROLES: LÓGICA DE ESCRITORIO ===

// A. Controles de Escritorio (PointerLockControls para el "mouse look")
controls = new THREE.PointerLockControls(camera, document.body);

// Elemento HTML que actúa como overlay para dar instrucciones
const instructions = document.createElement('div');
instructions.style.cssText = 'position: absolute; top: 50%; width: 100%; text-align: center; color: white; background-color: rgba(0,0,0,0.5); padding: 10px; cursor: pointer;';
instructions.innerHTML = 'Haz clic para comenzar (WASD para mover)';
document.body.appendChild(instructions);

// Evento para activar los controles con un clic
instructions.addEventListener('click', () => {
    controls.lock();
    instructions.style.display = 'none'; // Ocultar instrucciones al iniciar
});

// B. Controles de Móvil (Eliminados porque el script fallaba)
// La línea "const mobileControls = new THREE.DeviceOrientationControls(camera);" fue eliminada.


// === 3. MANEJO DE EVENTOS DE TECLADO (WASD) ===
// (Este código es idéntico y correcto)
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW':
            moveForward = true;
            break;
        case 'KeyA':
            moveLeft = true;
            break;
        case 'KeyS':
            moveBackward = true;
            break;
        case 'KeyD':
            moveRight = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW':
            moveForward = false;
            break;
        case 'KeyA':
            moveLeft = false;
            break;
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
    }
});


// === 4. OBJETO Y ENTORNO (HDR) ===

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.9,
    roughness: 0.2
});
const cube = new THREE.Mesh(geometry, material);
cube.position.set(0, 0.5, -5); // Movemos el cubo enfrente para verlo
scene.add(cube);

const loader = new THREE.RGBELoader();
loader.load('citrus_orchard_road_puresky_4k.hdr', (texture) => {
    hdrTexture = texture; 
    hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = hdrTexture;
    scene.background = hdrTexture;
    material.needsUpdate = true;
});


// === 5. BUCLE DE RENDERIZADO Y ANIMACIÓN ===

function animate() {
    requestAnimationFrame(animate);
    
    // Calcula el tiempo transcurrido (delta)
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    // Actualiza la rotación del móvil si está disponible
    // La línea "mobileControls.update();" fue eliminada.

    // Lógica de Movimiento (Solo si el puntero está bloqueado)
    if (controls.isLocked === true) {
        
        // Reiniciar velocidad
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        // Aplicar movimiento
        if (moveForward) velocity.z -= speed * delta;
        if (moveBackward) velocity.z += speed * delta;
        if (moveLeft) velocity.x -= speed * delta;
        if (moveRight) velocity.x += speed * delta;

        // Aplicar movimiento usando los métodos de PointerLockControls
        controls.moveForward(-velocity.z * delta);
        controls.moveRight(velocity.x * delta);

        // Animación de Nubes
        if (hdrTexture) {
            hdrTexture.offset.x += 0.0001;
        }
    }

    prevTime = time; // Guardar el tiempo actual para el próximo frame
    renderer.render(scene, camera);
}

animate();