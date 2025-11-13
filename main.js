// =========================================================
// THREE.JS: PRIMERA PERSONA CON JOYSTICK (NippleJS) Y WASD/ORBITCONTROLS
// =========================================================

// Variables globales y auxiliares
let hdrTexture = null;
let controls;
let prevTime = performance.now(); 

// Variables de movimiento para WASD/Teclado
let moveForwardKeyboard = false;
let moveBackwardKeyboard = false;
let moveLeftKeyboard = false;
let moveRightKeyboard = false;

// Variables de movimiento para Joystick (NippleJS)
let moveXJoystick = 0;
let moveZJoystick = 0;
const speed = 15.0; // Velocidad de movimiento

// Vectores auxiliares para el cálculo de la dirección (evitan crear nuevos vectores en cada frame)
const direction = new THREE.Vector3();
const velocity = new THREE.Vector3();
const sideDirection = new THREE.Vector3();


// === 1. PILARES FUNDAMENTALES ===

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 1.6; // Altura de los ojos

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// === 2. CONTROLES: ORBITCONTROLS PARA LOOK HÍBRIDO (PC/MÓVIL) ===

// OrbitControls: permite rotar la vista con el ratón o el dedo.
controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false; // Deshabilitar zoom para FPS
controls.enablePan = false;  // Deshabilitar paneo
controls.maxPolarAngle = Math.PI / 2; // Evita mirar debajo del horizonte (para FPS)

// Target inicial: un punto justo delante de la cámara
controls.target.set(camera.position.x, camera.position.y, camera.position.z - 0.1); 

// Mensaje de instrucciones
const instructions = document.createElement('div');
instructions.id = 'instructions';
instructions.innerHTML = 'Usa el ratón/tacto para mirar, WASD/Joystick para mover';
document.body.appendChild(instructions);

instructions.addEventListener('click', () => {
    instructions.style.display = 'none';
});


// === 3. JOYSTICK VIRTUAL (NippleJS) ===

// Verificamos que NippleJS haya cargado correctamente
if (typeof nipplejs !== 'undefined') {
    const joystick = nipplejs.create({
        zone: document.getElementById('joystick-zone'),
        mode: 'static',
        position: { left: '50%', bottom: '50%' },
        color: 'white',
        size: 100
    });

    joystick.on('move', (evt, data) => {
        if (data && data.vector) {
            // El vector X es el movimiento lateral, el vector Y es el movimiento adelante/atrás
            moveXJoystick = data.vector.x;
            moveZJoystick = data.vector.y; 
        }
    });

    joystick.on('end', () => {
        moveXJoystick = 0;
        moveZJoystick = 0;
    });
}


// === 4. MANEJO DE TECLADO (WASD) ===
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW': moveForwardKeyboard = true; break;
        case 'KeyA': moveLeftKeyboard = true; break;
        case 'KeyS': moveBackwardKeyboard = true; break;
        case 'KeyD': moveRightKeyboard = true; break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW': moveForwardKeyboard = false; break;
        case 'KeyA': moveLeftKeyboard = false; break;
        case 'KeyS': moveBackwardKeyboard = false; break;
        case 'KeyD': moveRightKeyboard = false; break;
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

    // A. LÓGICA DE MOVIMIENTO BASE (Combinar Joystick y Teclado)
    
    // 1. Inicializar el vector de velocidad para este frame
    velocity.set(0, 0, 0); 

    // 2. Priorizar la entrada de movimiento (WASD sobre Joystick)
    if (moveForwardKeyboard || moveBackwardKeyboard || moveLeftKeyboard || moveRightKeyboard) {
        if (moveForwardKeyboard) velocity.z -= 1;
        if (moveBackwardKeyboard) velocity.z += 1;
        if (moveLeftKeyboard) velocity.x -= 1;
        if (moveRightKeyboard) velocity.x += 1;
    } 
    // Si no hay teclado, usar joystick (NippleJS)
    else {
        // La dirección Y de NippleJS (adelante/atrás) mapea a Z de Three.js (adelante/atrás)
        velocity.x = moveXJoystick;
        velocity.z = -moveZJoystick; // Negativo en Z porque NippleJS Y positivo es hacia ARRIBA
    }

    // 3. Aplicar el movimiento si el vector de velocidad no es cero
    if (velocity.lengthSq() > 0) {
        // Normalizar velocidad y aplicar escala por tiempo y velocidad base
        velocity.normalize().multiplyScalar(speed * delta);

        // Obtener la dirección a la que apunta la cámara (horizontal)
        camera.getWorldDirection(direction); 
        direction.y = 0; // Evitar que la cámara vuele
        direction.normalize(); 

        // Obtener la dirección lateral (perpendicular al avance)
        sideDirection.copy(direction).cross(camera.up); 
        
        // Aplicar el movimiento a la posición de la cámara:
        // Avance/Retroceso
        camera.position.addScaledVector(direction, velocity.z);
        // Lateral
        camera.position.addScaledVector(sideDirection, velocity.x);
    }
    
    // B. LÓGICA DE ROTACIÓN (Look)
    
    // 1. Mover el target del OrbitControls con la cámara
    // Esto hace que la cámara gire sobre sí misma (FPS), no orbite.
    controls.target.copy(camera.position);
    controls.target.y += 0.001; 
    
    // 2. Actualizar controles. Esto procesa el movimiento del ratón/tacto.
    controls.update(); 
    
    // C. Animaciones
    cube.rotation.y += 0.005;
    if (hdrTexture) {
        hdrTexture.offset.x += 0.0001;
    }

    prevTime = time;
    renderer.render(scene, camera);
}

animate();