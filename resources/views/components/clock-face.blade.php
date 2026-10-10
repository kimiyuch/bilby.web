{{--
    A mock of Bilby's big screen window. It starts near the end of level 6, so visitors see the clock turn
    amber at one minute and move on to level 7; resources/js/app.js makes it tick.
--}}
<div {{ $attributes->class('@container overflow-hidden rounded-xl bg-felt shadow-2xl ring-1 ring-chip-950/20') }} aria-hidden="true">
    <div class="flex gap-x-2 px-4 pt-3">
        <div class="size-3 rounded-full bg-[#ff5f57]"></div>
        <div class="size-3 rounded-full bg-[#febc2e]"></div>
        <div class="size-3 rounded-full bg-[#28c840]"></div>
    </div>

    <div data-clock data-remaining="75" data-state="play"
         class="group px-[5cqw] pt-[2cqw] pb-[4cqw] text-white transition-[background-color] duration-700 data-[state=ending]:bg-[#291b09] data-[state=break]:bg-[#092120]">
        <div class="flex items-baseline justify-between">
            <div data-clock-title class="text-[4.4cqw] font-semibold tracking-[0.06em] text-felt-accent transition-colors duration-700 group-data-[state=ending]:text-felt-warning group-data-[state=break]:text-felt-break">LEVEL 6</div>
            <div class="text-[max(2.2cqw,0.625rem)] font-medium text-white/60">Friday night game</div>
        </div>

        <div data-clock-time class="mt-[3cqw] text-center text-[26cqw]/none font-medium tracking-tight tabular-nums">1:15</div>
        <div data-clock-blinds class="mt-[2cqw] text-center text-[9.5cqw]/none font-semibold tabular-nums">150 / 300</div>
        <div data-clock-ante class="mt-[1.4cqw] text-center text-[3.8cqw] font-medium text-white/60 tabular-nums">Big blind ante 300</div>

        <div class="mt-[4cqw] h-[1cqw] min-h-1 overflow-hidden rounded-full bg-white/10">
            <div data-clock-progress class="h-full rounded-full bg-felt-accent transition-[width,background-color] duration-700 group-data-[state=ending]:bg-felt-warning group-data-[state=break]:bg-felt-break" style="width: 94%"></div>
        </div>

        <dl class="mt-[4cqw] grid grid-cols-3 gap-x-[3cqw] gap-y-[2.5cqw] text-left">
            @foreach ([
                ['NEXT', '200 / 400 · 400', 'data-clock-next'],
                ['NEXT BREAK', '21:15', 'data-clock-break'],
                ['ELAPSED', '1:58:45', 'data-clock-elapsed'],
                ['PLAYERS', '7 / 10', ''],
                ['AVERAGE STACK', '14,285', ''],
                ['PRIZE POOL', 'CHF 200', ''],
            ] as [$label, $value, $hook])
                <div>
                    <dt class="text-[max(1.8cqw,0.5rem)] font-semibold tracking-[0.08em] text-white/55">{{ $label }}</dt>
                    <dd {{ $hook }} class="mt-[0.4cqw] text-[3.6cqw] font-medium tabular-nums">{{ $value }}</dd>
                </div>
            @endforeach
        </dl>
    </div>
</div>
