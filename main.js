// =========================================================
// THREE.JS: ESCENA EN PRIMERA PERSONA (Híbrido PC/Móvil)
// =========================================================

let hdrTexture = null;
let controls;
let prevTime = performance.now(); 

// Variables de movimiento
const velocity = new THREE.Vector3();
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
const speed = 150.0; 


// === 1. PILARES FUNDAMENTALES ===

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 1.6; 

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// === 2. CONTROLES: POINTERLOCK (PC) ===

// PointerLockControls para la vista en PC (se activa al hacer clic)
controls = new THREE.PointerLockControls(camera, document.body);

const instructions = document.createElement('div');
instructions.style.cssText = 'position: absolute; top: 50%; width: 100%; text-align: center; color: white; background-color: rgba(0,0,0,0.5); padding: 10px; cursor: pointer;';
instructions.innerHTML = 'Haz clic para comenzar (WASD o Botones para mover)';
document.body.appendChild(instructions);

// Evento para activar los controles con un clic (solo PC)
instructions.addEventListener('click', () => {
    // Intentamos bloquear el puntero (funciona en PC)
    controls.lock();
    instructions.style.display = 'none';
});


// === 3. MANEJO DE TECLADO (WASD) ===

document.addEventListener('keydown', (event) => {
    if (controls.isLocked) { // Solo si el control está activo
        switch (event.code) {
            case 'KeyW': moveForward = true; break;
            case 'KeyA': moveLeft = true; break;
            case 'KeyS': moveBackward = true; break;
            case 'KeyD': moveRight = true; break;
        }
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyD': moveRight = false; break;
    }
});

// === 4. MANEJO TÁCTIL (BOTONES VIRTUALES) ===

// Función para mapear el ID del botón a la variable de movimiento
function mapButton(id, state) {
    switch (id) {
        case 'btn-forward': moveForward = state; break;
        case 'btn-left': moveLeft = state; break;
        case 'btn-backward': moveBackward = state; break;
        case 'btn-right': moveRight = state; break;
    }
}

// Configurar los eventos táctiles para cada botón
['btn-forward', 'btn-left', 'btn-backward', 'btn-right'].forEach(id => {
    const button = document.getElementById(id);
    if (button) {
        // Al tocar (activar movimiento)
        button.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Previene el zoom/scroll predeterminado
            mapButton(id, true);
        }, false);
        
        // Al soltar (detener movimiento)
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            mapButton(id, false);
        }, false);
    }
});


// === 5. OBJETO Y ENTORNO (HDR) ===

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.9,
    roughness: 0.2
});
const cube = new THREE.Mesh(geometry, material);
cube.position.set(0, 0.5, -5); 
scene.add(cube);

const loader = new THREE.RGBELoader();
loader.load('citrus_orchard_road_puresky_4k.hdr', (texture) => {
    hdrTexture = texture; 
    hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = hdrTexture;
    scene.background = hdrTexture;
    material.needsUpdate = true;
});


// === 6. BUCLE DE RENDERIZADO Y ANIMACIÓN ===

function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    // Lógica de Movimiento
    // La vista se controla con el ratón (PointerLock) en PC. 
    // En móvil, la rotación de la cámara es por el tacto simple de arrastrar la pantalla.
    
    // Reiniciar velocidad
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    // Aplicar movimiento (funciona con WASD o botones virtuales)
    if (moveForward) velocity.z -= speed * delta;
    if (moveBackward) velocity.z += speed * delta;
    if (moveLeft) velocity.x -= speed * delta;
    if (moveRight) velocity.x += speed * delta;

    // Aplicar movimiento usando los métodos de PointerLockControls
    // Estos métodos usan la dirección actual de la cámara
    controls.moveForward(-velocity.z * delta);
    controls.moveRight(velocity.x * delta);
    
    // Animación de Nubes
    if (hdrTexture) {
        hdrTexture.offset.x += 0.0001;
    }

    prevTime = time;
    renderer.render(scene, camera);
}

animate();