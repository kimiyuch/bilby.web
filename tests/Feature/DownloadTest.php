<?php

namespace Tests\Feature;

use App\Downloads;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DownloadTest extends TestCase
{
    private const SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15';

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    public function test_download_redirects_to_the_latest_dmg_and_counts_it(): void
    {
        $this->withHeader('User-Agent', self::SAFARI)->get('/download')
            ->assertRedirect(config('bilby.download_url'));
        $this->withHeader('User-Agent', self::SAFARI)->get('/download');

        $this->assertSame([now()->toDateString() => 2], Downloads::perDay());
    }

    public function test_bots_are_redirected_but_not_counted(): void
    {
        $this->withHeader('User-Agent', 'Slackbot-LinkExpanding 1.0')->get('/download')
            ->assertRedirect(config('bilby.download_url'));
        $this->withHeader('User-Agent', '')->get('/download');

        $this->assertSame([], Downloads::perDay());
    }
}
