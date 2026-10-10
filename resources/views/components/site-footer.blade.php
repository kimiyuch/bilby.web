@php($repository = config('bilby.repository_url'))

<footer class="border-t border-neutral-950/5">
    <div class="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p class="text-sm/6 text-neutral-600">Bilby, made with <span aria-label="love">❤️</span> by <a href="https://kimiyu.ch" class="font-medium text-chip-800 hover:text-chip-600">kimiyu.ch</a></p>
        <nav class="flex gap-x-6">
            <a href="{{ $repository }}" class="text-sm/6 font-normal text-neutral-600 hover:text-chip-700">GitHub</a>
            <a href="/changelog" class="text-sm/6 font-normal text-neutral-600 hover:text-chip-700">Changelog</a>
            <a href="{{ $repository }}/releases" class="text-sm/6 font-normal text-neutral-600 hover:text-chip-700">Releases</a>
            <a href="{{ $repository }}/issues" class="text-sm/6 font-normal text-neutral-600 hover:text-chip-700">Report a problem</a>
        </nav>
    </div>
</footer>
