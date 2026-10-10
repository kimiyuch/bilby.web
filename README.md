# bilby.web

The website for [Bilby](https://github.com/kimiyuch/bilby.app), a poker tournament clock for Mac, iPad and iPhone. Live at [bilby.kimiyu.ch](https://bilby.kimiyu.ch).

A single-page Laravel 13 site styled with Tailwind CSS 4.

## Local development

The site runs in [Herd](https://herd.laravel.com) at `https://bilby.web.test`.

```sh
composer install
npm install
cp .env.example .env && php artisan key:generate
npm run dev       # or: npm run build
```

## Deploying

```sh
npm run build     # if you changed the design; commit public/build
./deploy.sh
```

`deploy.sh` runs the tests, exports the committed code, installs production dependencies and syncs it to Hostpoint over SSH with your own key. The server's `.env`, `public/.htaccess` (the PHP version is set there through the Hostpoint panel) and `storage/` are left alone. GitHub Actions only runs the tests.

## Where things are

| | |
|---|---|
| `resources/views/home.blade.php` | The landing page |
| `resources/views/components/clock-face.blade.php` | The clock mock in the hero (`resources/js/app.js` makes it tick) |
| `resources/views/changelog.blade.php` | The changelog |
| `resources/views/components/layouts/app.blade.php` | The HTML shell, fonts and meta tags |
| `resources/css/app.css` | Theme colors (`ochre` for the desert, `chip` for the poker chip, `felt` for the clock) and fonts |
| `config/bilby.php` | Repository and download links |
| `scripts/og-image.sh` | Renders `resources/views/og-image.blade.php` to `public/images/og.png` |

Downloads always point at the latest GitHub release (`releases/latest/download/Bilby.dmg`), so publishing a new version of the app doesn't require a change here.
