<?php

namespace Tests\Feature;

use Tests\TestCase;

class PlayPageTest extends TestCase
{
    public function test_play_page_loads_the_browser_app(): void
    {
        $this->get('/play')
            ->assertOk()
            ->assertSee('<div id="app"', escape: false)
            ->assertSee('play.webmanifest', escape: false);
    }

    public function test_home_page_links_to_the_browser_version(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('href="/play"', escape: false);
    }
}
