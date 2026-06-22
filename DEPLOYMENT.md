# Masterclass — Deployment (VPS)

Content is stored in a **SQLite database file** on the server (`prisma/masterclass.db`),
served via the Next.js app. It is permanent and shared by all visitors.

> VPS: `http://187.124.117.11:3001/`

---

## First-time setup on the VPS

```bash
cd /path/to/project          # wherever you cloned the repo on the VPS
git pull

# 1. Add the database URL to your environment file (NOT in git)
echo 'DATABASE_URL="file:./masterclass.db"' >> .env.local
# (your Supabase, NGenius, and Gmail vars should already be in .env.local)

# 2. Install dependencies  (also runs: prisma generate)
pnpm install

# 3. Create the SQLite database and tables
DATABASE_URL="file:./masterclass.db" npx prisma db push

# 4. Copy all existing data from Supabase → SQLite  (ONCE ONLY)
npx tsx scripts/migrate-from-supabase.ts

# 5. Build and start
pnpm build
pm2 restart all        # or: pm2 start "pnpm start" --name masterclass
pm2 save
```

After step 4 all your participants, sponsorships, settings, curriculum, etc.
are copied from Supabase into SQLite. The app now reads and writes only to SQLite.

---

## Updating the site later

```bash
cd /path/to/project
git pull
pnpm install
DATABASE_URL="file:./masterclass.db" npx prisma db push   # only if schema changed
pnpm build
pm2 restart all
```

`git pull` never touches your data — `prisma/masterclass.db` and `.env.local`
are gitignored.

---

## Backups (important!)

Your entire content — participants, payments, settings — is the single file
`prisma/masterclass.db`. Back it up regularly, for example a daily cron:

```bash
# Open crontab
crontab -e

# Add this line (backs up every day at 2 AM):
0 2 * * * cp /path/to/project/prisma/masterclass.db /var/backups/masterclass-$(date +\%F).db
```

To restore: stop the app, replace `prisma/masterclass.db` with the backup, restart.

```bash
pm2 stop all
cp /var/backups/masterclass-2026-06-22.db /path/to/project/prisma/masterclass.db
pm2 start all
```

---

## pm2 commands

```bash
pm2 list                  # see running processes
pm2 logs masterclass      # live logs
pm2 restart all           # restart after a code update
pm2 stop all              # stop the app
pm2 start "pnpm start" --name masterclass   # start fresh if needed
pm2 save                  # save process list so it survives reboot
pm2 startup               # configure auto-start on server reboot
```

---

## Environment variables (.env.local)

```
# SQLite
DATABASE_URL="file:./masterclass.db"

# Supabase (only needed for the one-time migration script)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# NGenius / NBC Payment
NGENIUS_OUTLET_REF=...
NGENIUS_REALM=...
NGENIUS_IDENTITY_URL=...
NGENIUS_API_URL=...
NGENIUS_API_KEY=...

# Gmail SMTP
GMAIL_USER=...
GMAIL_APP_PASSWORD=...

# Site URL (used in payment redirect URLs)
SITE_URL=http://187.124.117.11:3001
```

---

## If something goes wrong

**App won't start after update:**
```bash
pm2 logs masterclass --lines 50   # read the error
```

**Database missing / corrupted:**
```bash
# Recreate empty database (data will be lost — restore from backup instead)
DATABASE_URL="file:./masterclass.db" npx prisma db push
```

**Rollback to previous commit:**
```bash
git log --oneline -5              # find the commit hash
git reset --hard <commit-hash>
pnpm build
pm2 restart all
```
