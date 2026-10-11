<?php

use App\Downloads;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('bilby:downloads', function () {
    $days = Downloads::perDay();
    $this->table(['Day', 'Downloads'], collect($days)->map(fn ($count, $day) => [$day, $count])->values());
    $this->line('Total: '.array_sum($days));
})->purpose('Show how many times Bilby was downloaded from the website, per day');
