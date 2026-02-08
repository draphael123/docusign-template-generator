# Document Generator - Cursor Setup Guide

## Option 1: Quick Test (No Setup Required) ⚡

**Just open the HTML file in your browser:**

1. Download `document-generator.html`
2. Double-click to open in your browser
3. Done! The app will work immediately

This is the fastest way to test the application.

---

## Option 2: Cursor + Next.js Project (Production Ready) 🚀

### Step 1: Create New Project in Cursor

```bash
# In Cursor's terminal:
npx create-next-app@latest document-generator

# When prompted, choose:
✔ Would you like to use TypeScript? No
✔ Would you like to use ESLint? Yes
✔ Would you like to use Tailwind CSS? Yes
✔ Would you like to use `src/` directory? No
✔ Would you like to use App Router? Yes
✔ Would you like to customize the default import alias? No
```

### Step 2: Install Dependencies

```bash
cd document-generator
npm install framer-motion html2canvas jspdf
```

### Step 3: Paste This Code

Create `app/page.js` and paste the React component code from `document-generator.jsx`

**Important:** Add this at the top of the file:
```javascript
'use client';
```

### Step 4: Update Tailwind Config

Replace `tailwind.config.js` with:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          500: '#ff6b6b',
        },
      },
    },
  },
  plugins: [],
}
```

### Step 5: Add Google Font

In `app/layout.js`, import the font:

```javascript
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
```

Add this to `app/globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
```

### Step 6: Run the App

```bash
npm run dev
```

Visit: http://localhost:3000

---

## Option 3: Simple React Project (Vite) ⚡

### Step 1: Create Vite Project

```bash
npm create vite@latest document-generator -- --template react
cd document-generator
npm install
```

### Step 2: Install Dependencies

```bash
npm install framer-motion html2canvas jspdf tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 3: Configure Tailwind

Update `tailwind.config.js`:

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          500: '#ff6b6b',
        },
      },
    },
  },
  plugins: [],
}
```

Add to `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
```

### Step 4: Replace src/App.jsx

Paste the entire component code from `document-generator.jsx`

### Step 5: Run

```bash
npm run dev
```

---

## Cursor AI Tips 💡

### To Modify with Cursor AI:

1. **Add new templates:**
   - Select the `TEMPLATES` object
   - Ask: "Add a new template for [type]"

2. **Change colors:**
   - Select the color classes
   - Ask: "Change the theme to purple and gold"

3. **Add features:**
   - "Add a signature upload feature"
   - "Add export to Google Docs"
   - "Add template preview thumbnails"

4. **Fix bugs:**
   - Highlight the problematic section
   - Ask: "This isn't working correctly, can you fix it?"

---

## File Structure

```
document-generator/
├── app/ (Next.js) or src/ (Vite)
│   ├── page.js (or App.jsx)
│   └── globals.css
├── public/
├── package.json
└── tailwind.config.js
```

---

## Deployment Options

### Vercel (Recommended for Next.js)
```bash
npm i -g vercel
vercel
```

### Netlify
1. Push to GitHub
2. Connect repo to Netlify
3. Deploy automatically

---

## Common Issues & Fixes

**Issue:** Framer Motion animations not working
**Fix:** Make sure the component is marked as `'use client'` (Next.js App Router)

**Issue:** PDF download creates blank pages
**Fix:** Ensure the preview ref is properly attached to the DOM element

**Issue:** Tailwind classes not applying
**Fix:** Check that your content paths in `tailwind.config.js` match your file structure

---

## Quick Customization Prompts for Cursor

```
"Add a dark/light mode toggle"
"Create 5 more professional templates"
"Add drag-and-drop image upload for logos"
"Integrate with Anthropic API to auto-generate content"
"Add email integration to send documents directly"
"Create a template builder interface"
"Add multi-language support"
"Implement autosave with localStorage"
```

---

Need help? Just ask Cursor AI: "Help me set up the document generator"
