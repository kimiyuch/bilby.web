@php
    $download = config('bilby.download_url');
    $repository = config('bilby.repository_url');

    $features = [
        ['icon' => 'clock', 'title' => 'Readable across the room', 'body' => 'The level, the blinds and the ante, a big countdown, what comes next and when the next break is. From the far end of the table, or the far end of the room.'],
        ['icon' => 'bell-alert', 'title' => 'Warns before the level ends', 'body' => 'A minute before the blinds go up, the clock turns amber and a soft chime plays. Breaks are teal, so nobody misses the end of one.'],
        ['icon' => 'speaker-wave', 'title' => 'Calls out the blinds', 'body' => 'If you like, Bilby says it out loud: “Level 6. Blinds 200, 400, ante 400.” No more shouting over the table.'],
        ['icon' => 'list-bullet', 'title' => 'Your blind structure', 'body' => 'Edit levels and breaks, add notes like “color up the 25s”, or start from a turbo, home game or deep stack preset. Share structures as JSON files.'],
        ['icon' => 'sparkles', 'title' => 'Builds a structure for you', 'body' => 'Tell Bilby your starting stack, the players, your chips and how long the game should last. It suggests sensible blinds that your chips can actually pay.'],
        ['icon' => 'banknotes', 'title' => 'Keeps the prize pool straight', 'body' => 'Buy-ins, rebuys and add-ons, players left, chips in play and the average stack. Payouts follow the number of entries, and you can change them.'],
        ['icon' => 'tv', 'title' => 'On the big screen', 'body' => 'Put the clock on a TV or projector while you keep the controls on your Mac. Space starts and pauses, the arrow keys skip levels.'],
        ['icon' => 'device-phone-mobile', 'title' => 'On your iPhone and iPad', 'body' => 'The clock full screen on an iPad at the table, and a countdown on the Lock Screen and in the Dynamic Island, with an alert for every level change.'],
        ['icon' => 'globe-alt', 'title' => 'Or right in your browser', 'body' => 'No Mac at hand? Open Bilby in any modern browser, on a laptop, a tablet or the TV. Same clock, same structures, works offline, and nothing leaves your device.'],
        ['icon' => 'moon', 'title' => 'Never loses time', 'body' => 'Bilbies are nocturnal, so a late game suits them. The clock stays right through sleep, quitting and relaunching, and keeps your Mac’s display awake.'],
    ];
@endphp

<x-layouts.app>
    <div class="absolute inset-x-0 top-0 -z-10 h-[44rem] bg-linear-to-b from-ochre-50 to-white"></div>

    <x-site-header />

    <main>
        {{-- Hero --}}
        <section class="relative pt-10 pb-24 sm:pt-16 sm:pb-32">
            <div class="mx-auto max-w-6xl px-6 text-center lg:px-8">
                <img src="{{ asset('images/bilby.webp?v=2') }}" width="384" height="384" fetchpriority="high" alt="The Bilby app icon: a bilby peeking over its hole cards, a pair of aces" class="mx-auto size-32 sm:size-40">
                <h1 class="mx-auto mt-8 max-w-[14ch] font-display text-5xl font-semibold tracking-tight text-balance text-chip-950 sm:text-7xl">
                    Keeps an eye on the big blind
                </h1>
                <p class="mx-auto mt-6 max-w-[50ch] text-lg/8 text-pretty text-neutral-600 sm:text-xl/8">
                    Bilby is a calm, native poker tournament clock for your Mac, iPad and iPhone. Set up the blinds, press space and shuffle up. Bilby counts down the levels, calls out the blinds and keeps the prize pool straight.
                </p>
                <div class="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
                    <a href="{{ $download }}" class="inline-flex items-center gap-x-2 rounded-full bg-chip-600 py-3 pr-5 pl-4 text-base/6 font-semibold text-white shadow-sm hover:bg-chip-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chip-600">
                        <x-heroicon-m-arrow-down-tray class="size-5 shrink-0 fill-white" />
                        Download for Mac
                    </a>
                    <a href="/play" class="inline-flex items-center gap-x-1.5 text-base/6 font-semibold text-chip-800 hover:text-chip-600">
                        Open in your browser
                        <x-heroicon-m-arrow-right class="size-5 shrink-0 fill-current" />
                    </a>
                </div>
                <p class="mt-6 text-base/7 text-neutral-500 sm:text-sm/6">Free · Apple Silicon · macOS 26 or later · or any modern browser, no install</p>

                <x-clock-face class="mx-auto mt-16 max-w-4xl text-left sm:mt-20" />
            </div>
        </section>

        {{-- Features --}}
        <section id="features" class="scroll-mt-8 border-t border-neutral-950/5 py-24 sm:py-32">
            <div class="mx-auto max-w-6xl px-6 lg:px-8">
                <p class="text-base/7 font-semibold text-ochre-600">Features</p>
                <h2 class="mt-2 max-w-[30ch] font-display text-4xl font-semibold tracking-tight text-balance text-chip-950 sm:text-5xl">
                    Run the tournament, then play in it
                </h2>
                <p class="mt-6 max-w-[48ch] text-lg/8 text-pretty text-neutral-600">
                    Bilby looks after the clock, so whoever runs the game gets to play too. It’s calm on purpose: no casino lights, just a clock everyone can read.
                </p>

                <dl class="mt-16 grid grid-cols-1 gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                    @foreach ($features as $feature)
                        <div>
                            <dt class="flex items-start gap-x-3 text-base/7 font-semibold text-chip-950">
                                <x-dynamic-component :component="'heroicon-m-'.$feature['icon']" class="size-5 h-lh shrink-0 fill-ochre-500" />
                                {{ $feature['title'] }}
                            </dt>
                            <dd class="mt-1 pl-8 text-base/7 text-pretty text-neutral-600">{{ $feature['body'] }}</dd>
                        </div>
                    @endforeach
                </dl>
            </div>
        </section>

        {{-- Under the hood --}}
        <section class="bg-ochre-50 py-24 sm:py-32">
            <div class="mx-auto grid max-w-6xl grid-cols-1 gap-x-12 gap-y-16 px-6 lg:grid-cols-2 lg:px-8">
                <div>
                    <p class="text-base/7 font-semibold text-ochre-600">Under the hood</p>
                    <h2 class="mt-2 max-w-[30ch] font-display text-4xl font-semibold tracking-tight text-balance text-chip-950 sm:text-5xl">
                        Small, native, and nothing to hide
                    </h2>
                    <p class="mt-6 max-w-[48ch] text-lg/8 text-pretty text-neutral-600">
                        Bilby is written in Swift and SwiftUI, so it looks and feels at home on the Mac, iPad and iPhone. Its sounds are made in code, there’s no server and no account, and everything stays on your device.
                    </p>
                </div>
                <dl class="divide-y divide-chip-950/10 self-center">
                    <div class="flex items-baseline justify-between gap-x-6 pb-6">
                        <dt class="text-base/7 text-neutral-600">Download size</dt>
                        <dd class="font-display text-2xl font-semibold tracking-tight text-chip-950 tabular-nums">2 MB</dd>
                    </div>
                    <div class="flex items-baseline justify-between gap-x-6 py-6">
                        <dt class="text-base/7 text-neutral-600">Ads, accounts and analytics</dt>
                        <dd class="font-display text-2xl font-semibold tracking-tight text-chip-950">None</dd>
                    </div>
                    <div class="flex items-baseline justify-between gap-x-6 py-6">
                        <dt class="text-base/7 text-neutral-600">Runs on</dt>
                        <dd class="font-display text-2xl font-semibold tracking-tight text-chip-950">Mac, iPad, iPhone, web</dd>
                    </div>
                    <div class="flex items-baseline justify-between gap-x-6 py-6">
                        <dt class="text-base/7 text-neutral-600">License</dt>
                        <dd class="font-display text-2xl font-semibold tracking-tight text-chip-950">MIT</dd>
                    </div>
                    <div class="flex items-baseline justify-between gap-x-6 pt-6">
                        <dt class="text-base/7 text-neutral-600">Source code</dt>
                        <dd class="font-display text-2xl font-semibold tracking-tight">
                            <a href="{{ $repository }}" class="text-chip-700 underline decoration-chip-300 underline-offset-4 hover:decoration-chip-600">GitHub</a>
                        </dd>
                    </div>
                </dl>
            </div>
        </section>

        {{-- Install --}}
        <section id="install" class="scroll-mt-8 py-24 sm:py-32">
            <div class="mx-auto max-w-6xl px-6 lg:px-8">
                <p class="text-base/7 font-semibold text-ochre-600">Install</p>
                <h2 class="mt-2 max-w-[30ch] font-display text-4xl font-semibold tracking-tight text-balance text-chip-950 sm:text-5xl">
                    Deal Bilby in
                </h2>
                <p class="mt-6 max-w-[48ch] text-lg/8 text-pretty text-neutral-600">
                    Bilby isn’t on the App Store and isn’t notarized by Apple, so macOS asks you to confirm it the first time. It takes about a minute, and you only do it once.
                </p>

                <ol role="list" class="mt-16 grid grid-cols-1 gap-x-12 gap-y-12 sm:grid-cols-3">
                    <li>
                        <div class="font-display text-base/7 font-semibold text-ochre-600 tabular-nums">01</div>
                        <h3 class="mt-2 text-base/7 font-semibold text-chip-950">Download</h3>
                        <p class="mt-1 text-base/7 text-pretty text-neutral-600">
                            Download <a href="{{ $download }}" class="font-semibold text-chip-700 underline decoration-chip-300 underline-offset-4 hover:decoration-chip-600">Bilby.dmg</a> and open it.
                        </p>
                    </li>
                    <li>
                        <div class="font-display text-base/7 font-semibold text-ochre-600 tabular-nums">02</div>
                        <h3 class="mt-2 text-base/7 font-semibold text-chip-950">Drag to Applications</h3>
                        <p class="mt-1 text-base/7 text-pretty text-neutral-600">Drag Bilby onto the Applications folder in the window that opens.</p>
                    </li>
                    <li>
                        <div class="font-display text-base/7 font-semibold text-ochre-600 tabular-nums">03</div>
                        <h3 class="mt-2 text-base/7 font-semibold text-chip-950">Open Anyway</h3>
                        <p class="mt-1 text-base/7 text-pretty text-neutral-600">
                            Open Bilby. When macOS says it can’t verify the developer, go to System Settings → Privacy &amp; Security, scroll down and click Open Anyway.
                        </p>
                    </li>
                </ol>

                <p class="mt-16 border-t border-neutral-950/5 pt-8 text-base/7 text-neutral-600 sm:text-sm/6">
                    Bilby needs a Mac with Apple Silicon (M1 or newer) and macOS 26 or later. After the first launch it updates itself.
                    On iPhone and iPad (iOS 26 or later) it isn’t in the App Store yet; you can <a href="{{ $repository }}#building-from-source" class="font-medium text-chip-700 underline decoration-chip-300 underline-offset-4 hover:decoration-chip-600">build it from source</a> with Xcode.
                </p>
            </div>
        </section>
    </main>

    <x-site-footer />
</x-layouts.app>
