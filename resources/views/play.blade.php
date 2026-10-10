{{--
    Bilby in the browser. The whole app is in resources/js/play and runs on the device: no server state, and
    everything is kept in the browser's local storage. /play?screen opens the clock on its own, for a TV.
--}}
<!DOCTYPE html>
<html lang="en" class="bg-white antialiased">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>Bilby</title>
    <meta name="description" content="Bilby, the calm poker tournament clock, in your browser. Blind structures, spoken announcements, a big screen for the TV and the prize pool kept straight. Free, no account.">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Bilby">
    <meta property="og:title" content="Bilby: a poker tournament clock in your browser">
    <meta property="og:description" content="A calm poker tournament clock. Bilby keeps an eye on the big blind, so you can keep yours on the cards.">
    <meta property="og:url" content="{{ url('/play') }}">
    <meta property="og:image" content="{{ asset('images/og.png?v=2') }}">
    <meta name="twitter:card" content="summary_large_image">

    <link rel="icon" type="image/png" href="{{ asset('images/favicon.png?v=2') }}">
    <link rel="apple-touch-icon" href="{{ asset('apple-touch-icon.png?v=2') }}">
    <link rel="manifest" href="{{ asset('play.webmanifest') }}">
    <meta name="theme-color" content="#fdf8ef">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="Bilby">

    @fonts

    @vite(['resources/css/play.css', 'resources/js/play/main.ts'])
</head>
<body class="font-sans text-neutral-950">
    <div id="app" class="isolate">
        <noscript>
            <p class="mx-auto max-w-xl px-6 py-24 text-center text-lg/8 text-neutral-600">
                Bilby runs in your browser and needs JavaScript. You can also <a href="/" class="font-semibold text-chip-700 underline">download it for your Mac</a>.
            </p>
        </noscript>
    </div>
</body>
</html>
