<?php

use App\Downloads;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::view('/', 'home');
Route::view('/play', 'play');
Route::view('/changelog', 'changelog');

// The site's download links go through here, so we know how many people download Bilby from the website.
Route::get('/download', function (Request $request) {
    Downloads::count($request);

    return redirect()->away(config('bilby.download_url'));
});

// Source page for the Open Graph image; only reachable during local development.
if (app()->isLocal()) {
    Route::view('/og-image', 'og-image');
}
