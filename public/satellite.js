document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('globe-container');
    if (!container) {
        console.error('Contenitore per il globo non trovato!');
        return;
    }

    // 1. Creazione della Scena
    const scene = new THREE.Scene();

    // 2. Creazione della Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2;

    // 3. Creazione del Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Sfondo trasparente
    container.appendChild(renderer.domElement);

    // 4. Creazione del Globo (Sfera)
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    // Caricatore di Texture
    const textureLoader = new THREE.TextureLoader();

    // Materiale della Terra con texture realistiche
    const earthMaterial = new THREE.MeshPhongMaterial({
        map: textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'),
        bumpMap: textureLoader.load('https://threejs.org/examples/textures/planets/earth_bump_2048.jpg'),
        bumpScale: 0.05, // Un buon valore per la profondità
        specularMap: textureLoader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg'),
        specular: new THREE.Color('grey'),
        shininess: 5 // Valore basso per un riflesso più morbido e diffuso
    });
    const earth = new THREE.Mesh(geometry, earthMaterial);
    scene.add(earth);

    // 5. Creazione delle Nuvole
    const cloudGeometry = new THREE.SphereGeometry(1.02, 64, 64);
    const cloudMaterial = new THREE.MeshPhongMaterial({
        map: textureLoader.load('https://threejs.org/examples/textures/planets/earth_clouds_2048.png'),
        transparent: true,
        opacity: 0.4
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(clouds);

    // 6. Creazione dello Sfondo Galattico (Skybox)
    const starGeometry = new THREE.SphereGeometry(80, 54, 54); // Sfera molto grande
    const starMaterial = new THREE.MeshBasicMaterial({
        map: textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/starfield.png'),
        side: THREE.BackSide // Mostra la texture all'interno della sfera
    });
    const starfield = new THREE.Mesh(starGeometry, starMaterial);
    scene.add(starfield);

    // 7. Aggiunta di Luci
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1.5); // Aumentata intensità per sicurezza
    scene.add(pointLight); // La luce è di nuovo nella scena, non più nella camera

    // 7. Controlli per il Dragging
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false; // Disabilita lo zoom con la rotellina
    controls.enablePan = false; // Disabilita lo spostamento laterale

    // 8. Funzione di Animazione
    function animate() {
        requestAnimationFrame(animate);

        // Rotazione automatica
        earth.rotation.y += 0.0005;
        clouds.rotation.y += 0.0007;

        // Aggiorna la posizione della luce per farla coincidere con la camera
        // Questo crea l'effetto "torcia" in modo stabile
        pointLight.position.copy(camera.position);

        controls.update(); // Aggiorna i controlli di dragging
        renderer.render(scene, camera);
    }

    animate();

    // 9. Gestione del Ridimensionamento della Finestra
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});