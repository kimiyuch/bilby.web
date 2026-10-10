# Bilby website

The site for bilby.kimiyu.ch (Laravel, Blade, Tailwind) and the browser version of the clock at `/play` (Vue in
`resources/js/play`). `resources/js/play/kit` is a port of BilbyKit from the bilby.app repo next to this one.

- The built assets in `public/build` are committed: run `npm run build` and commit the result with the source.
- Deploy with `./deploy.sh` from a clean, committed tree.
- Reviews check changes against `CODING_STANDARDS.md`.
