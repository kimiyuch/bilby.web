<?php

namespace Tests\Feature;

use Tests\TestCase;

class HomePageTest extends TestCase
{
    public function test_home_page_renders_with_download_link(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('Download for Mac')
            ->assertSee(config('bilby.download_url'), escape: false)
            ->assertSee('Keeps an eye on the big blind');
    }
}
