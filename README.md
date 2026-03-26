# AI Resume Screener

End-to-end AI resume screener built with Next.js, Prisma, and NextAuth.

Users can:
- sign up/sign in securely (email/password + verification code),
- sign in with Google / Outlook(Microsoft) / Facebook (when configured),
- upload a resume + job description,
- view ATS match percentage,
- see missing and matched keywords,
- get an ATS-formatted rewritten resume,
- download ATS resume as PDF or DOCX,
- view previous resume analyses in their dashboard.

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- NextAuth (credentials + social providers)
- Prisma ORM + SQLite
- Mammoth + pdf-parse (resume parsing)
- docx + pdf-lib (export)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

Edit `.env` values as needed.

3. Generate Prisma client and sync DB:

```bash
DATABASE_URL="file:./prisma/dev.db" npm run prisma:generate
DATABASE_URL="file:./prisma/dev.db" npm run db:push
```

4. Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Auth Features

- Email/password sign-up with **confirm password**
- One-time **email verification code** before login
- Social login support:
  - Google
  - Microsoft (Outlook)
  - Facebook

> Social login buttons appear even without provider keys; login only works when provider keys are configured.

## Resume Screening Flow

1. Upload current resume (`.pdf`, `.docx`, `.txt`)
2. Paste full job description
3. System extracts resume text and computes:
   - match percentage,
   - matched keywords,
   - missing keywords
4. ATS-friendly resume is generated automatically
5. Download as:
   - `PDF`
   - `DOCX`
6. Analysis is saved in user dashboard history

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - TypeScript type-check
- `npm run prisma:generate` - generate Prisma client
- `npm run db:push` - push schema to DB

## Notes

- If SMTP is not configured, verification codes are logged to server console for local development.
- Current ATS generation uses deterministic keyword-based logic and can be extended with LLM APIs later.
