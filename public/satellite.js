// Attende che l'intero documento HTML sia stato caricato prima di eseguire lo script.
document.addEventListener('DOMContentLoaded', () => {
    // Cerca nel documento l'elemento con l'ID 'globe-container'. Sarà il nostro "palcoscenico".
    const container = document.getElementById('globe-container');
    if (!container) {
        // Se non lo trova, stampa un errore in console e si ferma.
        console.error('Contenitore per il globo non trovato!');
        return;
    }

    
    // --- 1. SETUP DELLA SCENA 3D ---
    // La scena è il contenitore principale di tutti gli oggetti, le luci e le telecamere.
    const scene = new THREE.Scene();

    // La camera è il nostro "occhio" virtuale. Definiamo il campo visivo (75), le proporzioni, e i limiti di visione.
    const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2; // Spostiamo la camera indietro per poter vedere il globo, che sarà al centro (0,0,0).

    // Il renderer è il "motore" che disegna la scena. Usiamo WebGL e attiviamo l'antialias per bordi più smussati.
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight); // Imposta la dimensione del canvas a tutta la finestra.
    renderer.setClearColor(0x000000, 0); // Rende lo sfondo del renderer trasparente per vedere lo starfield dietro.
    container.appendChild(renderer.domElement); // Aggiunge il canvas (renderer.domElement) alla nostra pagina HTML.

    // --- 2. CREAZIONE DEGLI OGGETTI ---
    // Definiamo la forma geometrica: una sfera. I numeri (1, 64, 64) indicano il raggio e la definizione (più alti sono, più è liscia).
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const textureLoader = new THREE.TextureLoader(); // Oggetto che serve per caricare le immagini (texture).

    // Creiamo il materiale per la Terra. È un materiale che reagisce alla luce.
    const earthMaterial = new THREE.MeshPhongMaterial({
        map: textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'),
        bumpMap: textureLoader.load('https://threejs.org/examples/textures/planets/earth_bump_2048.jpg'),
        bumpScale: 0.05, // Un buon valore per la profondità
        specularMap: textureLoader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg'),
        specular: new THREE.Color('grey'),
        shininess: 5 // Valore basso per un riflesso più morbido e diffuso
    });
    const earth = new THREE.Mesh(geometry, earthMaterial); // Uniamo la forma (geometry) con l'aspetto (material) per creare l'oggetto Terra.
    scene.add(earth); // Aggiungiamo la Terra alla scena.

    // Creiamo le nuvole usando una sfera leggermente più grande.
    const cloudGeometry = new THREE.SphereGeometry(1.02, 64, 64);
    const cloudMaterial = new THREE.MeshPhongMaterial({
        map: textureLoader.load('https://threejs.org/examples/textures/planets/earth_clouds_2048.png'),
        transparent: true,
        opacity: 0.4
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(clouds); // Aggiungiamo le nuvole alla scena.

    // Creiamo lo sfondo stellato con una sfera gigante.
    const starGeometry = new THREE.SphereGeometry(80, 54, 54); // Sfera molto grande
    const starMaterial = new THREE.MeshBasicMaterial({
        map: textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/starfield.png'),
        side: THREE.BackSide // Diciamo a Three.js di mostrare la texture all'interno della sfera.
    });
    const starfield = new THREE.Mesh(starGeometry, starMaterial);
    scene.add(starfield);

    // --- 3. ILLUMINAZIONE ---
    // Aggiungiamo una luce ambientale fioca per illuminare leggermente tutto, anche le parti in ombra.
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);
    // Aggiungiamo una luce forte (il nostro "Sole") che si muoverà con la telecamera.
    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    scene.add(pointLight);

    // --- 4. CONTROLLI UTENTE ---
    // Abilitiamo i controlli per trascinare il globo con il mouse.
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;      // Aggiunge un effetto di "inerzia" al trascinamento, rendendolo più fluido.
    controls.dampingFactor = 0.05;      // Intensità dell'inerzia.
    controls.enableZoom = false;        // Disabilita lo zoom con la rotellina del mouse.
    controls.enablePan = false;         // Disabilita lo spostamento laterale della scena.

    // Quando l'utente inizia a trascinare (mouse down), cambia il cursore in 'grabbing'
    controls.addEventListener('start', function(){
        document.body.style.cursor = 'grabbing';
    });

    // Quando l'utente finisce di trascinare (mouse up), ripristina il cursore a 'grab' o 'default' in base alla posizione
    controls.addEventListener('end', function(){
        // Simuliamo un movimento del mouse per forzare l'aggiornamento del cursore
        const event = new MouseEvent('mousemove', {
            clientX: window.innerWidth / 2, // Posizione fittizia
            clientY: window.innerHeight / 2
        });
        onMouseMove(event);
    });

    // --- 5. ANIMAZIONE ---
    // Questa funzione viene eseguita in un ciclo continuo, circa 60 volte al secondo.
    function animate() {
        requestAnimationFrame(animate); // Chiede al browser di eseguire di nuovo 'animate' al prossimo frame.

        // Ad ogni frame, aumentiamo leggermente la rotazione della Terra e delle nuvole (a velocità diverse).
        earth.rotation.y += 0.0005;
        clouds.rotation.y += 0.0007;

        // Copiamo la posizione della camera nella posizione della luce, per creare l'effetto "torcia".
        pointLight.position.copy(camera.position);

        controls.update(); // Aggiorna i controlli di trascinamento (necessario se enableDamping è true).
       renderer.render(scene, camera); // Disegna la scena vista dalla telecamera.
    }

    animate(); // Avvia il ciclo di animazione per la prima volta.

    // --- 7. GESTIONE DEL CURSORE CON RAYCASTING ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseMove(event) {
        // Calcola le coordinate del mouse normalizzate (da -1 a +1)
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

        // Aggiorna il raggio con la posizione della camera e del mouse
        raycaster.setFromCamera(mouse, camera);

        // Calcola gli oggetti intersecati dal raggio
        const intersects = raycaster.intersectObject(earth);

        // Se il raggio interseca la Terra, usa il cursore 'grab'. Altrimenti, usa il cursore di default.
        if (intersects.length > 0) {
            document.body.style.cursor = 'grab';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    window.addEventListener('mousemove', onMouseMove, false);

    // --- 8. GESTIONE RIDIMENSIONAMENTO FINESTRA ---
    // Aggiungiamo un "ascoltatore" che si attiva ogni volta che la finestra del browser viene ridimensionata.
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight; // Aggiorna le proporzioni della camera.
        camera.updateProjectionMatrix(); // Applica le nuove proporzioni.
        renderer.setSize(window.innerWidth, window.innerHeight); // Ridimensiona il canvas del renderer.
    });
});