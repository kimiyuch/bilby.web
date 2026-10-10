<!DOCTYPE html>
<html lang="en" class="bg-white antialiased motion-safe:scroll-smooth">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? 'Bilby: a poker tournament clock for Mac, iPad and iPhone' }}</title>
    <meta name="description" content="Bilby is a calm, native poker tournament clock for Mac, iPad and iPhone. Blind structures, a big screen for the TV, spoken announcements, and the prize pool kept straight.">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Bilby">
    <meta property="og:title" content="Bilby: a poker tournament clock for Mac, iPad and iPhone">
    <meta property="og:description" content="A calm, native poker tournament clock. Bilby keeps an eye on the big blind, so you can keep yours on the cards.">
    <meta property="og:url" content="{{ url('/') }}">
    <meta property="og:image" content="{{ asset('images/og.png?v=2') }}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="The Bilby app icon, a bilby peeking over a pair of aces, next to the words: Keeps an eye on the big blind.">
    <meta name="twitter:card" content="summary_large_image">

    <link rel="icon" type="image/png" href="{{ asset('images/favicon.png?v=2') }}">
    <link rel="apple-touch-icon" href="{{ asset('apple-touch-icon.png?v=2') }}">

    @fonts

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="font-sans text-neutral-950">
    <div class="isolate">
        {{ $slot }}
    </div>
</body>
</html>
