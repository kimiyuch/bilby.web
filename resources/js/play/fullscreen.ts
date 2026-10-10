// Full screen for an element, with a fallback for browsers that can't (Safari on the iPhone): the element is
// then pinned over the whole page instead.

import { onBeforeUnmount, onMounted, type Ref, ref } from 'vue';

export function useFullScreen(element: Readonly<Ref<HTMLElement | undefined>>) {
    const isFullScreen = ref(false);
    /** True while the fallback is in use. */
    const pinned = ref(false);

    const update = () => {
        isFullScreen.value = document.fullscreenElement === element.value || pinned.value;
    };

    const enter = async () => {
        const el = element.value;
        if (!el) return;
        if (document.fullscreenEnabled && el.requestFullscreen) {
            try {
                await el.requestFullscreen({ navigationUI: 'hide' });
                return;
            } catch {
                // Fall through to pinning.
            }
        }
        pinned.value = true;
        update();
    };

    const exit = async () => {
        if (pinned.value) {
            pinned.value = false;
            update();
        } else if (document.fullscreenElement) {
            await document.exitFullscreen().catch(() => {});
        }
    };

    const toggle = () => (isFullScreen.value ? exit() : enter());

    const escape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && pinned.value) exit();
    };

    onMounted(() => {
        document.addEventListener('fullscreenchange', update);
        window.addEventListener('keydown', escape);
    });
    onBeforeUnmount(() => {
        document.removeEventListener('fullscreenchange', update);
        window.removeEventListener('keydown', escape);
    });

    return { isFullScreen, pinned, toggle, enter, exit };
}
