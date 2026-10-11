<?php

namespace App;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Counts clicks on the website's download links, per day. Nothing about the visitor is stored:
 * no IP address, no cookie, just a number per date.
 */
class Downloads
{
    private const FILE = 'downloads.json';

    // Link previews, crawlers and uptime checkers that would follow the link without anyone downloading.
    private const BOTS = '/bot|crawl|spider|slurp|preview|fetch|curl|wget|python|monitor|headless/i';

    public static function count(Request $request): void
    {
        $agent = (string) $request->userAgent();
        if ($request->isMethod('HEAD') || $agent === '' || preg_match(self::BOTS, $agent)) {
            return;
        }

        $path = Storage::disk('local')->path(self::FILE);
        $handle = fopen($path, 'c+');
        flock($handle, LOCK_EX);

        $days = json_decode(stream_get_contents($handle) ?: '{}', true) ?: [];
        $today = now()->toDateString();
        $days[$today] = ($days[$today] ?? 0) + 1;

        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($days, JSON_PRETTY_PRINT));
        flock($handle, LOCK_UN);
        fclose($handle);
    }

    /**
     * @return array<string, int> date => downloads, oldest first
     */
    public static function perDay(): array
    {
        $days = json_decode(Storage::disk('local')->get(self::FILE) ?? '{}', true) ?: [];
        ksort($days);

        return $days;
    }
}
