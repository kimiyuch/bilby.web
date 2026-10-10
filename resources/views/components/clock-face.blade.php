{{--
    A mock of the browser version's clock (resources/js/play/components/ClockScreen.vue): the face and its
    control strip in one card. It starts near the end of level 6, so visitors see the clock turn amber at one
    minute and move on to level 7; resources/js/app.js makes it tick. Sizes follow ClockFace.vue, where the face
    is 100 units wide and 62 high.
--}}
<div {{ $attributes->class('overflow-hidden rounded-2xl bg-ochre-50 shadow-2xl ring-1 ring-chip-950/10') }} aria-hidden="true">
    <div class="@container aspect-[100/62] bg-felt">
        <div data-clock data-remaining="75" data-state="play"
             class="group flex h-full flex-col gap-y-[1.6cqw] p-[3cqw] text-[#f5f5f5] tabular-nums transition-[background-color] duration-700 data-[state=ending]:bg-[#291b09] data-[state=break]:bg-[#092120]">
            <div class="flex items-center justify-between">
                <div data-clock-title class="text-[4.4cqw]/none font-semibold tracking-[0.07em] text-felt-accent transition-colors duration-700 group-data-[state=ending]:text-felt-warning group-data-[state=break]:text-felt-break">LEVEL 6</div>
                <x-heroicon-m-arrows-pointing-out class="size-[2.6cqw] fill-white/40" />
            </div>

            <div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-y-[1cqw]">
                <div data-clock-time class="mb-[2cqw] text-[19cqw]/none font-medium tracking-[-0.02em]">1:15</div>
                <div data-clock-blinds class="text-[8cqw]/[1.05] font-semibold whitespace-nowrap">150 / 300</div>
                <div data-clock-ante class="-mt-[0.5cqw] text-[3.4cqw]/[1.2] font-medium text-[#9e9e9e]">Big blind ante 300</div>
                <div class="mt-[1cqw] h-[1.1cqw] min-h-1 self-stretch overflow-hidden rounded-full bg-white/10">
                    <div data-clock-progress class="h-full rounded-full bg-felt-accent transition-[width,background-color] duration-700 group-data-[state=ending]:bg-felt-warning group-data-[state=break]:bg-felt-break" style="width: 94%"></div>
                </div>
            </div>

            <dl class="grid grid-cols-3 gap-x-[3cqw]">
                <div>
                    <dt class="text-[1.9cqw] font-semibold tracking-[0.1em] text-[#9e9e9e]">NEXT</dt>
                    <dd data-clock-next class="mt-[0.5cqw] text-[4.2cqw]/[1.2] font-medium whitespace-nowrap">200 / 400 · 400</dd>
                </div>
                <div data-clock-stat class="text-center transition-[opacity,translate] duration-400 data-[leaving]:-translate-y-[1cqw] data-[leaving]:opacity-0">
                    <dt data-clock-stat-label class="text-[1.9cqw] font-semibold tracking-[0.1em] text-[#9e9e9e]">PLAYERS</dt>
                    <dd data-clock-stat-value class="mt-[0.5cqw] text-[4.2cqw]/[1.2] font-medium whitespace-nowrap">7 / 10</dd>
                </div>
                <div class="text-right">
                    <dt class="text-[1.9cqw] font-semibold tracking-[0.1em] text-[#9e9e9e]">NEXT BREAK</dt>
                    <dd data-clock-break class="mt-[0.5cqw] text-[4.2cqw]/[1.2] font-medium">21:15</dd>
                </div>
            </dl>
        </div>
    </div>

    <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-x-4 p-3 sm:px-5">
        <div class="min-w-0 max-sm:invisible">
            <p class="text-xs/5 text-neutral-500">Playing</p>
            <p class="truncate text-sm/6 font-medium text-chip-800">Friday night game</p>
        </div>
        <div class="flex items-center justify-center gap-x-3">
            <span class="flex size-11 items-center justify-center rounded-full ring-1 ring-chip-400 ring-inset"><x-heroicon-m-backward class="size-5 fill-chip-900" /></span>
            <span class="flex size-16 items-center justify-center rounded-full bg-chip-600 shadow-sm"><x-heroicon-m-pause class="size-7 fill-white" /></span>
            <span class="flex size-11 items-center justify-center rounded-full ring-1 ring-chip-400 ring-inset"><x-heroicon-m-forward class="size-5 fill-chip-900" /></span>
        </div>
        <span class="flex size-11 items-center justify-center justify-self-end"><x-heroicon-m-ellipsis-horizontal class="size-5 fill-chip-900" /></span>
    </div>
</div>
