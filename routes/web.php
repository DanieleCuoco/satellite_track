<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;

Route::get('/', function () {
    return view('welcome');
});

// --- API ENDPOINT PER I SATELLITI ---
Route::get('/api/satellites/starlink', function () {
    // Dati dell'osservatore (useremo una posizione fissa per ora, es. equatore)
    $observerLat = 0;
    $observerLng = 0;
    $observerAlt = 0;

    // ID della categoria Starlink su N2YO
    $starlinkCategoryId = 52;

    // Raggio di ricerca in gradi (90 è l'intero cielo visibile da un punto)
    $radius = 90;

    // Recupera la chiave API dal file .env
    $apiKey = env('N2YO_API_KEY');

    // Se la chiave non è impostata, restituisce un errore
    if (!$apiKey) {
        return response()->json(['error' => 'API Key non trovata.'], 500);
    }

    // Esegue la chiamata all'API di N2YO usando il client HTTP di Laravel
    $response = Http::get("https://api.n2yo.com/rest/v1/satellite/above/{$observerLat}/{$observerLng}/{$observerAlt}/{$radius}/{$starlinkCategoryId}", [
        'apiKey' => $apiKey
    ]);

    // Controlla se la chiamata ha avuto successo
    if ($response->failed()) {
        return response()->json(['error' => 'Errore nella chiamata a N2YO API.'], 500);
    }

    // Restituisce i dati dei satelliti come risposta JSON
    return $response->json();
});
