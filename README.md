# Clites | Web Development Agency

A static marketing site for **Clites**, a growing web development agency focused on modern, responsive and professional websites for businesses.

## 📁 Directory Structure

```
clites-site/
├── index.html               # Homepage (hero, process, services, about, founders, FAQ, CTA)
├── service.html             # Services carousel and contact CTA
├── portfolio.html           # Portfolio page (empty state, ready for case studies)
├── engineering.html         # Engineering knowledge library (41 concepts)
├── privacy-policy.html      # Privacy Policy
├── terms-and-conditions.html # Terms & Conditions
├── cookie-policy.html       # Cookie Policy
├── refund-policy.html       # Refund & Cancellation Policy
├── disclaimer.html          # Disclaimer
├── contact.html             # Contact and legal-contact information
├── legal.css                # Scoped styles for the legal pages
├── legal-footer.css         # Shared legal links, copyright and notice block
├── legal.js                 # Mobile navigation for the legal pages
├── engineering.css          # Scoped styles for the engineering page
├── engineering.js           # Search, filters and concept detail dialog
├── engineering-data.js      # Local structured concept data (no database)
├── clites_home.css          # Core design system, layout and animations
├── clites_home.js           # Navigation, reveals, counters and interactions
├── protect-lite.js          # Image protection and interaction script
├── inquiry-form.css         # Shared, scoped project-inquiry dialog styles
├── js/project-inquiry.js    # Supabase-backed inquiry form and validation
├── js/site-footer.js        # Updates copyright years from the visitor's current year
├── vendor/supabase-js.js    # Vendored Supabase JS client (no npm/build step)
├── supabase/
│   ├── migrations/          # project_inquiries table, RLS and grants
│   └── README.md            # Backend setup and security verification
├── scripts/
│   └── generate-supabase-config.mjs # Builds browser-safe supabase-config.json
├── .env.example             # Public URL/key placeholders (no real secrets)
├── supabase-config.example.json
├── img/                     # Logos, hero graphics and founder photo
├── portfolio-assets/        # Showcase images (currently unreferenced)
├── Logo Presentation/       # Logo and brand-identity source assets
├── src/
│   └── style.css            # Stylesheet placeholder
├── generate_brand_assets.py # Favicon helper (rebuilds from the current leaf mark)
└── README.md
```

## 🚀 How to Run & Preview

### Option 1: Direct File Preview
Open `index.html` in any web browser:
```bash
firefox index.html
```

### Option 2: Local HTTP Server (Recommended)
```bash
cd /path/to/clites-site
python3 -m http.server 8080
```
Then visit [http://localhost:8080](http://localhost:8080).

> This is a local preview server only. It can serve dotfiles and source files, so never keep a real `.env` or any server secret inside the project root. The browser config `supabase-config.json` is intentionally public and contains only the publishable key. For production, use a static host or web server that blocks dotfiles and source paths.

> The inquiry form loads its browser-safe Supabase config from `supabase-config.json`. Run the configuration step below before testing submissions. The page itself works without it; the form shows an honest “not configured” message.

## 📤 Publishing to GitHub

This is a static site with no build step. The repository is already initialized with an initial commit on `main`.

```bash
# Create an empty repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/clites.git
git push -u origin main
```

To host it with GitHub Pages, enable Pages for the `main` branch (root folder). Regenerate `supabase-config.json` on the deployed copy; it is gitignored and must not be committed.

## 🗄️ Backend / Project Inquiries

The site remains static. **Start a Project** and **Hire Us** actions open one shared, accessible inquiry dialog across the site. Submissions go directly to Supabase using the **publishable** key; the database grants anonymous `INSERT` only and blocks reads, updates and deletes with RLS and column-level privileges.

### One-time setup

1. Apply [`supabase/migrations/20261023193000_create_project_inquiries.sql`](supabase/migrations/20261023193000_create_project_inquiries.sql) in the Supabase SQL Editor (or via the Supabase CLI).
2. Create the browser config from an env file kept **outside the web root**:

```bash
# Example: ../clites.env is outside the project directory
cp .env.example ../clites.env
# Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to ../clites.env
ENV_FILE=../clites.env node scripts/generate-supabase-config.mjs
```

3. Serve the site over HTTP and open the inquiry dialog.

`supabase-config.json` is public by design and contains only the publishable key. It is gitignored so each deployment can generate it. Never put a service-role key in the browser config or anywhere under the web root.

### Current backend status

- The frontend client, form validation, loading state, error handling and responsive dialog are implemented and browser-tested.
- The migration is **not yet applied** to the live Supabase project in this workspace, so a real successful insert has not been verified.
- There is no existing admin dashboard; inquiries should be reviewed in the Supabase Dashboard. See [`supabase/README.md`](supabase/README.md) for the security model, verification commands and optional future admin guidance.
- No package manager, build step or Express server was added. The Supabase client is vendored at `vendor/supabase-js.js` (v2.118.0) and loaded only when the dialog opens.
- See [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md) for the latest security review and remaining risks.

## ✨ Features
- **Hero:** responsive headline, primary and secondary calls to action.
- **How We Work:** interactive 3D stacked-card process section.
- **Services:** web development, graphic design and digital experiences.
- **About:** agency introduction with an animated 01–04 process strip.
- **Founders:** founder profile and agency positioning.
- **FAQ:** accessible accordion.
- **Contact CTA + Footer:** accessible project-inquiry dialog backed by Supabase, plus email/WhatsApp fallbacks and social profiles.
- **Services Page:** responsive service carousel with RemixIcon and FontAwesome icons.
- **Portfolio Page:** clean empty state while case studies are prepared.
- **Engineering Page:** 41 backend and system-design concepts with search, category filters and an accessible detail dialog.
- **Legal Pages:** Privacy, terms, cookies, refunds, disclaimer and contact pages with a shared responsive legal footer.
- **Responsive Design:** tested across mobile, tablet and desktop viewports.

## Legal Pages

The legal section is static HTML and uses the same typography and green accent as the rest of the site:

- [`privacy-policy.html`](privacy-policy.html)
- [`terms-and-conditions.html`](terms-and-conditions.html)
- [`cookie-policy.html`](cookie-policy.html)
- [`refund-policy.html`](refund-policy.html)
- [`disclaimer.html`](disclaimer.html)
- [`contact.html`](contact.html)

The pages live at their `.html` URLs. If a host supports clean URLs (for example `/privacy-policy`), configure the rewrite there; no router or build step is used in this repository.

### Editing the legal content

- Each page is self-contained static HTML. Update its heading, body sections and “Last updated” date directly in the file.
- The shared legal footer links, copyright line and intellectual-property notice live in each page footer. The stylesheet is [`legal-footer.css`](legal-footer.css), and [`js/site-footer.js`](js/site-footer.js) fills the current year at runtime.
- [`legal.css`](legal.css) controls the legal-page hero, table of contents and body typography.
- [`legal.js`](legal.js) controls the mobile navigation on legal pages.

### Before publishing

- The site publishes `contact@clites.in`; the legal pages use the same address rather than inventing a separate privacy address.
- Add a physical business address if one is required for legal correspondence. The current contact page states that no address is published.
- Confirm the business-specific payment, cancellation and refund terms in each written project agreement. The refund page deliberately does not invent a percentage, fee or non-refundable deposit.
- Review the governing-law wording and all policies with a qualified professional for the business’s actual legal structure and jurisdiction.
- The cookie policy reflects the current site: no first-party analytics or advertising cookies, no tracking pixels and no consent banner. Re-check the policy if analytics, advertising or other tracking is added later.

## 🧠 Engineering Knowledge Page

Open [`engineering.html`](engineering.html) (or link to it as `/engineering` if your host supports clean URLs). The page is static and uses no database, authentication or build step.

- Concepts live in [`engineering-data.js`](engineering-data.js). Each object has `name`, `category`, `difficulty`, `summary`, `why` and `example`.
- To add a concept, add an object to `window.ENGINEERING_CONCEPTS` with a unique `id` and an existing category ID. The page count, cards, search and filters update automatically.
- To add a category, add it to `window.ENGINEERING_CATEGORIES` and use its `id` in concept objects.
- Each concept has a shareable hash, for example `engineering.html#concept-rate-limiting`. The detail dialog includes a link back to all concepts.
- Search matches concept names and a small set of common short forms in `window.ENGINEERING_SEARCH_ALIASES`.

## 🎨 Brand Notes
- Public brand name and wordmark: **Clites**.
- Accent palette: muted sage greens (`#367236`, `#3B7D3B`, soft `#A8D5A2` / `#7FB77E`).
- Neutral surfaces and typography are unchanged from the original design.
- The three-leaf logo mark is retained from the existing identity and paired with a new DM Sans wordmark. Assets live in `img/`: `clites-logo-white.png`, `clites-logo-black.png` and `clites-leaf.png` (favicon).
- No trademark registration or company registration is claimed.

### Rebrand follow-ups
- No canonical domain, sitemap, robots file, social profile URLs or PWA manifest is configured in this project. None were invented.
- The internal working directory may still use the old template name `theshawon-clone`; it is not part of the public website. Rename the deployed folder separately if desired.
- Existing `href="#"` social and service links remain placeholders and need real destinations.

## ⚠️ Known Assets / Links
- The "Pricing" links scroll to the existing Contact section (`#contact`, or `#contact-details` on the Contact page). The site has no pricing cards or dedicated pricing section.
- Footer legal links point to the privacy, terms, cookie, refund, disclaimer and contact pages.
- Some existing social and service links use `href="#"` placeholders. They were already present and are unrelated to the legal pages; replace them when the real destinations are confirmed.
- The legal pages link to the email and phone numbers already published on the site. Confirm those details and any dedicated legal/privacy address before publishing.
