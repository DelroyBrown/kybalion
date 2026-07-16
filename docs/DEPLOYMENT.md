# Deployment

## Shape

* **Frontend** — static build (`npm run build` → `frontend/dist/`) on Vercel,
  Netlify, Cloudflare Pages, or any static host/CDN.
* **Backend** — Django + Gunicorn on Render, Railway, Fly.io, or a container
  platform (a production-ready `backend/Dockerfile` is included).
* **Database** — managed PostgreSQL.

## Backend

### Environment variables (production)

```env
DJANGO_SECRET_KEY=<long random string — required>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=api.example.com
DATABASE_NAME=...
DATABASE_USER=...
DATABASE_PASSWORD=...
DATABASE_HOST=...
DATABASE_PORT=5432
CORS_ALLOWED_ORIGINS=https://app.example.com
```

With `DJANGO_DEBUG=False` the settings automatically enable SSL redirect,
secure cookies, HSTS, nosniff, and referrer policy. The app must therefore be
served over HTTPS (set `DJANGO_SECURE_SSL_REDIRECT=False` only if TLS is
terminated in a way that breaks the redirect and you know why).

### Release process

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput      # served by WhiteNoise
python manage.py seed_content                 # first deploy only, optional
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

Create an admin user once: `python manage.py createsuperuser`.

### Notes

* Static files are served by WhiteNoise with compressed manifest storage — no
  S3 needed until user media exists (there is none today).
* JWT: 30-minute access tokens, 14-day rotating refresh tokens with
  blacklisting. Logout blacklists the presented refresh token.
* Throttles are configured in `config/settings.py`
  (`DEFAULT_THROTTLE_RATES`) — tune for your traffic.

## Frontend

```bash
cd frontend
VITE_API_BASE_URL=https://api.example.com/api npm run build
# deploy frontend/dist/
```

Configure the host to rewrite all paths to `index.html` (SPA routing). Set
long-cache headers on `/assets/*` (hashed filenames) and no-cache on
`index.html`.

## Checklist

- [ ] `DJANGO_SECRET_KEY` set, ≥ 50 random characters
- [ ] `DJANGO_DEBUG=False`
- [ ] `DJANGO_ALLOWED_HOSTS` exact
- [ ] `CORS_ALLOWED_ORIGINS` = the frontend origin only
- [ ] PostgreSQL connected, `migrate` run
- [ ] `collectstatic` run
- [ ] HTTPS on both origins
- [ ] Admin superuser created; admin URL access reviewed
- [ ] Database backups scheduled
- [ ] Verified public-domain text loaded (docs/CONTENT.md) or placeholders
      knowingly kept
