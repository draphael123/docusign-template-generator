# Document Generator

A professional document generator application built with Next.js, React, and Tailwind CSS. Create and export professional documents with customizable letterheads, templates, and formatting options.

## Features

- 📄 Multiple document templates (Letter of Recommendation, Employment Verification, Business Proposal, Cover Letter)
- 🏢 Customizable letterheads with gradient designs
- 📥 Import documents from .txt or .docx files
- 📄 Export to PDF or Word format
- 🎨 Customizable font size and line spacing
- 📱 Responsive design for desktop and mobile
- ✍️ Dynamic placeholders for document personalization

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI globally:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to complete deployment.

### Option 2: Deploy via GitHub

1. Push your code to a GitHub repository:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.

3. Click "New Project" and import your repository.

4. Vercel will automatically detect Next.js and configure the build settings.

5. Click "Deploy" and your app will be live in minutes!

## Project Structure

```
.
├── app/
│   ├── layout.js      # Root layout component
│   ├── page.js         # Main document generator component
│   └── globals.css     # Global styles and Tailwind imports
├── public/             # Static assets
├── package.json        # Dependencies and scripts
├── next.config.js      # Next.js configuration
├── tailwind.config.js # Tailwind CSS configuration
└── postcss.config.js   # PostCSS configuration
```

## Technologies Used

- **Next.js 14** - React framework
- **React 18** - UI library
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **html2canvas** - PDF generation
- **jsPDF** - PDF creation
- **mammoth** - .docx file parsing

## License

MIT


