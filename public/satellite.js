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
    // Il LoadingManager gestisce e tiene traccia delle risorse caricate.
    const manager = new THREE.LoadingManager();
    const loaderElement = document.getElementById('loader');

    manager.onLoad = function () {
        // Quando tutto è caricato, nascondi la schermata di caricamento con una dissolvenza.
        loaderElement.style.transition = 'opacity 0.5s';
        loaderElement.style.opacity = 0;
        setTimeout(() => { loaderElement.style.display = 'none'; }, 500); // Rimuove il loader dopo la transizione
    };

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
    const textureLoader = new THREE.TextureLoader(manager); // Passiamo il manager al loader!

    // Creiamo il materiale per la Terra. È un materiale che reagisce alla luce.
    const earthMaterial = new THREE.MeshPhongMaterial({
        map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'), // URL Corretto e Stabile
        specularMap: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'), // URL Corretto e Stabile
        specular: new THREE.Color('black'),
        shininess: 0 // Valore più basso per un riflesso meno "plasticoso"
    });
    const earth = new THREE.Mesh(geometry, earthMaterial); // Uniamo la forma (geometry) con l'aspetto (material) per creare l'oggetto Terra.
    scene.add(earth); // Aggiungiamo la Terra alla scena.

    // Creiamo le nuvole usando una sfera leggermente più grande.
    const cloudGeometry = new THREE.SphereGeometry(1, 64, 64);
    const cloudMaterial = new THREE.MeshPhongMaterial({
        map: textureLoader.load('https://threejs.org/examples/textures/planets/earth_clouds.png'), // URL Corretto e Stabile
        transparent: true,
        opacity: 0.1
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

    // --- 7. CARICAMENTO SATELLITI ---
    // La variabile 'satelliteGroup' è già dichiarata, questa sezione la popola.

    function fetchAndDrawSatellites() {
        fetch('/api/satellites/starlink')
            .then(response => response.json())
            .then(data => {
                console.log("Dati ricevuti dal backend:", data); // <-- RIGA DI DEBUG

                // Rimuove i satelliti vecchi prima di disegnarne di nuovi per l'aggiornamento
                while(satelliteGroup.children.length > 0){
                    satelliteGroup.remove(satelliteGroup.children[0]);
                }

                // TODO: Aggiungere qui la logica per creare i nuovi satelliti dai dati ricevuti

            }).catch(error => console.error('Errore nel fetch dei satelliti:', error));
    }

    // Per attivare, decommentare le seguenti righe:
    // fetchAndDrawSatellites();
    // setInterval(fetchAndDrawSatellites, 60000); // Aggiorna ogni minuto

    // --- 3. ILLUMINAZIONE ---
    // Aggiungiamo una luce ambientale fioca per illuminare leggermente tutto, anche le parti in ombra.
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);
    // Aggiungiamo una luce forte (il nostro "Sole") che avrà una posizione fissa.
    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(5, 0, 5); // Posizioniamo il nostro "Sole" a destra e un po' avanti
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

    // --- 6. INTERRUTTORE MODALITÀ LUCE ---
    window.addEventListener('keydown', (event) => {
        // Se l'utente preme il tasto 'l' (per "Luce")
        if (event.key === 'l' || event.key === 'L') {
            isFlashlightMode = !isFlashlightMode; // Inverte semplicemente il valore
            console.log(`Modalità torcia ${isFlashlightMode ? 'ATTIVATA' : 'DISATTIVATA'}.`);
        }
    });

    // --- 5. ANIMAZIONE ---
    let isFlashlightMode = false; // Inizia con la modalità "Sole fisso"

    // Questa funzione viene eseguita in un ciclo continuo, circa 60 volte al secondo.
    function animate() {
        requestAnimationFrame(animate); // Chiede al browser di eseguire di nuovo 'animate' al prossimo frame.

        // Ad ogni frame, aumentiamo leggermente la rotazione della Terra e delle nuvole (a velocità diverse).
        earth.rotation.y += 0.0004; // Rallentiamo la rotazione per osservare meglio
        clouds.rotation.y += 0.0007;

        // Gestisce la luce in base alla modalità selezionata
        if (isFlashlightMode) {
            // Modalità Torcia: la luce segue la camera
            pointLight.position.copy(camera.position);
        } else {
            // Modalità Sole: la luce è fissa in un punto
            pointLight.position.set(5, 0, 5);
        }

        controls.update(); // Aggiorna i controlli di trascinamento (necessario se enableDamping è true).
       renderer.render(scene, camera); // Disegna la scena vista dalla telecamera.
    }

    animate(); // Avvia il ciclo di animazione per la prima volta.

    // --- 7. CARICAMENTO SATELLITI ---
    const satelliteGroup = new THREE.Group(); // Creiamo un gruppo per contenere tutti i satelliti
    earth.add(satelliteGroup); // Aggiungiamo i satelliti come "figli" della Terra

    // Funzione per convertire coordinate geografiche (lat, lon) in coordinate 3D (x, y, z)
    function latLonToVector3(lat, lon, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);

        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = (radius * Math.sin(phi) * Math.sin(theta));
        const y = (radius * Math.cos(phi));

        return new THREE.Vector3(x, y, z);
    }

    // Funzione per recuperare i dati dei satelliti e disegnarli
    function fetchAndDrawSatellites() {
        console.log("--- Inizio fetch satelliti ---"); // LOG 1
        fetch('/api/satellites/gps')
            .then(response => {
                console.log("Risposta dal backend ricevuta, status:", response.status); // LOG 2
                if (!response.ok) {
                    throw new Error(`Errore HTTP! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Dati JSON ricevuti:", data); // LOG 3

                if (data && data.above && data.above.length > 0) {
                    console.log(`Trovati ${data.above.length} satelliti. Inizio a disegnarli.`); // LOG 4

                    // PULIZIA INTELLIGENTE: Rimuovi i vecchi satelliti solo se ne abbiamo di nuovi da disegnare.
                    while(satelliteGroup.children.length > 0){
                        satelliteGroup.remove(satelliteGroup.children[0]);
                    }

                    // Crea una geometria e un materiale da riutilizzare per tutti i satelliti (più efficiente)
                    const satGeometry = new THREE.SphereGeometry(0.015, 8, 8); // Sfera piccola
                    const satMaterial = new THREE.MeshStandardMaterial({ 
                        color: 0xffffff,       // Colore di base bianco
                        emissive: 0xffffff    // Emissività bianca, li fa brillare di luce propria
                    });

                    data.above.forEach(satellite => {
                        const satMesh = new THREE.Mesh(satGeometry, satMaterial);

                        // Calcola la posizione 3D basata su lat/lon. Usiamo un raggio un po' più grande per vederli fluttuare.
                        const position = latLonToVector3(satellite.satlat, satellite.satlng, 1.2);
                        satMesh.position.copy(position);

                        satelliteGroup.add(satMesh);
                    });
                    console.log("Disegno completato."); // LOG 5
                } else {
                    console.warn("I dati ricevuti non contengono satelliti (array 'above' vuoto o mancante). Non aggiorno la scena."); // LOG 6
                }
            })
            .catch(error => console.error('ERRORE GRAVE nel processo di fetch:', error)); // LOG 7
    }

    // Carica i satelliti all'inizio e poi aggiorna ogni 15 secondi
    fetchAndDrawSatellites();
    setInterval(fetchAndDrawSatellites, 15000);


    // --- 8. GESTIONE DEL CURSORE CON RAYCASTING ---
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

    // --- 9. GESTIONE RIDIMENSIONAMENTO FINESTRA ---
    // Aggiungiamo un "ascoltatore" che si attiva ogni volta che la finestra del browser viene ridimensionata.
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight; // Aggiorna le proporzioni della camera.
        camera.updateProjectionMatrix(); // Applica le nuove proporzioni.
        renderer.setSize(window.innerWidth, window.innerHeight); // Ridimensiona il canvas del renderer.
    });
});