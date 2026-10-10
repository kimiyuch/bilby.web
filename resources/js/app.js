// Makes the clock mock on the home page tick: it counts down, turns amber in the last minute, moves on to the
// next level and takes turns with the stats in the middle of the footer, like the browser version does.

const levels = [
    { title: 'LEVEL 6', blinds: '150 / 300', ante: 'Big blind ante 300', next: '200 / 400 · 400', minutes: 20, bigBlind: 300 },
    { title: 'LEVEL 7', blinds: '200 / 400', ante: 'Big blind ante 400', next: 'Break · 15 min', minutes: 20, bigBlind: 400 },
    { title: 'BREAK', blinds: 'Color up the 25s', ante: '', next: '300 / 600 · 600', minutes: 15, bigBlind: 0 },
    { title: 'LEVEL 8', blinds: '300 / 600', ante: 'Big blind ante 600', next: '400 / 800 · 800', minutes: 20, bigBlind: 600 },
];

const averageStack = 14285;

/** [label, value], with money as [label, number, currency]: the currency goes first and smaller. */
const stats = (level) => [
    ['PLAYERS', '7 / 10'],
    ['AVERAGE STACK', '14.3k'],
    ...(level.bigBlind ? [['AVERAGE IN BB', `${Math.round(averageStack / level.bigBlind)} BB`]] : []),
    ['PRIZE POOL', '200', 'CHF'],
    ['FIRST PLACE', '100', 'CHF'],
];

/** The app keeps each stat for 12 seconds; the mock is quicker, so visitors see a few. */
const statSeconds = 5;

const format = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds / 60) % 60;
    const s = String(seconds % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
};

for (const clock of document.querySelectorAll('[data-clock]')) {
    const part = (name) => clock.querySelector(`[data-clock-${name}]`);
    let index = 0;
    let remaining = Number(clock.dataset.remaining);
    let tick = 0;
    let statIndex = 0;

    const untilBreak = () => {
        let total = remaining;
        for (let i = index + 1; i < levels.length && levels[i].title !== 'BREAK'; i++) total += levels[i].minutes * 60;
        return levels[index].title === 'BREAK' || index + 1 >= levels.length ? '–' : format(total);
    };

    const render = () => {
        const level = levels[index];
        const duration = level.minutes * 60;
        clock.dataset.state = level.title === 'BREAK' ? 'break' : remaining <= 60 ? 'ending' : 'play';
        part('title').textContent = level.title;
        part('time').textContent = format(remaining);
        part('blinds').textContent = level.blinds;
        part('ante').textContent = level.ante || ' ';
        part('next').textContent = level.next;
        part('break').textContent = untilBreak();
        part('progress').style.width = `${Math.max(2, (1 - remaining / duration) * 100)}%`;
    };

    const showStat = () => {
        const list = stats(levels[index]);
        const [label, value, currency] = list[statIndex % list.length];
        part('stat-label').textContent = label;
        const dd = part('stat-value');
        dd.textContent = '';
        if (currency) {
            const small = document.createElement('span');
            small.className = 'mr-[0.25em] text-[0.6em]';
            small.textContent = currency;
            dd.append(small);
        }
        dd.append(value);
    };

    const nextStat = () => {
        const stat = part('stat');
        stat.dataset.leaving = '';
        setTimeout(() => {
            statIndex += 1;
            showStat();
            delete stat.dataset.leaving;
        }, 400);
    };

    setInterval(() => {
        tick += 1;
        if (tick % statSeconds === 0) nextStat();
        remaining -= 1;
        if (remaining < 0) {
            index = (index + 1) % levels.length;
            remaining = levels[index].minutes * 60;
        }
        render();
    }, 1000);
}
