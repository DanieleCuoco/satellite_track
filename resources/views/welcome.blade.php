<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Satellite Tracker</title>
    <link rel="stylesheet" href="/satellite.css">
    <!-- THREE.JS LIBRARY -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <!-- ORBIT CONTROLS FOR DRAGGING -->
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    <!-- LENSFLARE PER EFFETTI SOLE -->
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/objects/Lensflare.js"></script>
    <style>
        #loader {
            position: absolute;
            top: 0; left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #fff;
            font-family: monospace;
            font-size: 1.2em;
            z-index: 9999;
        }
    </style>
</head>
<body>
    <div id="loader">Caricamento del cosmo in corso...</div>
    <!-- Il canvas dove la scena 3D verrà renderizzata -->
    <div id="globe-container"></div>
    <script src="/satellite.js"></script>
</body>
</html>