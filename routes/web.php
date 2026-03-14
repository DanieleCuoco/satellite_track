<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;

Route::get('/', function () {
    return view('welcome');
});

// --- API ENDPOINT PER I SATELLITI (LOGICA CORRETTA E GLOBALE) ---
Route::get('/api/satellites/gps', function () {
    // Recupera la chiave API dal file .env
    $apiKey = env('N2YO_API_KEY');
    if (!$apiKey) {
        return response()->json(['error' => 'API Key non trovata.'], 500);
    }

    try {
        // --- FASE 1: Ottenere la lista dei satelliti di un gruppo ---
        // Useremo il gruppo "GPS Operational" (ID 20)
        $gpsCategoryId = 20;
        $responseList = Http::get("https://api.n2yo.com/rest/v1/satellite/above/0/0/0/90/{$gpsCategoryId}", [
            'apiKey' => $apiKey
        ]);

        if ($responseList->failed() || !isset($responseList->json()['above'])) {
            // In caso di fallimento della prima chiamata, restituiamo una risposta sicura.
            return response()->json(['info' => ['satcount' => 0], 'above' => []]);
        }

        $satellites = $responseList->json()['above'];
        $satellitePositions = [];

        // --- FASE 2: Ottenere la posizione esatta di ogni satellite ---
        foreach ($satellites as $satellite) {
            $satId = $satellite['satid'];

            // Chiamata all'endpoint "positions" per avere lat/lon globali
            $posResponse = Http::get("https://api.n2yo.com/rest/v1/satellite/positions/{$satId}/0/0/0/1", [
                'apiKey' => $apiKey
            ]);

            // CONTROLLO DI ROBUSTEZZA: Se la chiamata per la singola posizione fallisce, la saltiamo e andiamo avanti
            if ($posResponse->failed()) {
                continue; // Salta al prossimo satellite nel ciclo
            }

            if ($posResponse->successful() && isset($posResponse->json()['positions'][0])) {
                $positionData = $posResponse->json()['positions'][0];
                $satellitePositions[] = [
                    'satid' => $satellite['satid'],
                    'satname' => $satellite['satname'],
                    'satlat' => $positionData['satlatitude'], // CORREZIONE FINALE
                    'satlng' => $positionData['satlongitude'], // CORREZIONE FINALE
                ];
            }
        }

        // Restituisce i dati nel formato che il frontend si aspetta
        return response()->json(['info' => $responseList->json()['info'], 'above' => $satellitePositions]);
    } catch (\Exception $e) {
        // In caso di qualsiasi eccezione (es. timeout, rate limit), restituisci una risposta sicura.
        return response()->json(['info' => ['satcount' => 0], 'above' => []]);
    }
});
