'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Document Templates with placeholders
const TEMPLATES = {
  'Letter of Recommendation': `Dear {{Recipient_Name}},

I am writing to recommend {{Subject_Name}} for {{Position}}. Having worked with them for {{Duration}}, I can confidently attest to their exceptional skills and character.

{{Subject_Name}} has consistently demonstrated outstanding performance in {{Key_Area}}. Their ability to {{Skill_Description}} has been invaluable to our team.

I highly recommend {{Subject_Name}} without reservation. They would be an excellent addition to any organization.

Sincerely,
{{Signatory_Name}}
{{Signatory_Title}}`,
  
  'Employment Verification': `To Whom It May Concern,

This letter is to verify that {{Subject_Name}} has been employed with {{Company_Name}} from {{Start_Date}} to {{End_Date}} in the position of {{Position}}.

During their employment, {{Subject_Name}} performed their duties with professionalism and dedication. Their responsibilities included {{Responsibilities}}.

Should you require any additional information, please do not hesitate to contact our office.

Sincerely,
{{Signatory_Name}}
{{Signatory_Title}}`,
  
  'Business Proposal': `Dear {{Recipient_Name}},

We are pleased to submit this proposal for {{Project_Name}}. Our team at {{Company_Name}} specializes in {{Service_Area}} and has a proven track record of delivering exceptional results.

Project Scope:
{{Project_Description}}

Timeline: {{Timeline}}
Budget: {{Budget}}

We look forward to the opportunity to work with you on this exciting project.

Best regards,
{{Signatory_Name}}
{{Signatory_Title}}`,
  
  'Cover Letter': `Dear {{Recipient_Name}},

I am writing to express my strong interest in the {{Position}} position at {{Company_Name}}. With {{Years_Experience}} years of experience in {{Industry}}, I am confident in my ability to contribute to your team.

My background in {{Skills_Area}} has equipped me with the skills necessary to excel in this role. I am particularly drawn to {{Company_Name}} because of {{Reason}}.

I would welcome the opportunity to discuss how my experience and skills align with your needs.

Sincerely,
{{Signatory_Name}}`
};

// Letterhead configurations based on files in Letterheads folder
const LETTERHEADS = {
  TRT: {
    file: '/Letterheads/TRT Header Template.docx',
    name: 'TRT',
    displayName: 'TRT Header',
    color: 'from-blue-500 to-cyan-400'
  },
  HRT: {
    file: '/Letterheads/Fountain Letterhead HRT (1).docx',
    name: 'HRT',
    displayName: 'HRT Header',
    color: 'from-teal-500 to-emerald-400'
  }
};

// Document signers
const SIGNERS = {
  'Doron Stember': {
    name: 'Doron Stember',
    title: 'Chief Medical Officer'
  },
  'Tzvi Doron': {
    name: 'Tzvi Doron',
    title: 'Chief Clinical Officer'
  },
  'Lindsay Burden': {
    name: 'Lindsay Burden',
    title: 'Chief Clinical Operations Officer'
  }
};

// Available fonts
const FONTS = {
  "'Libre Baskerville', serif": 'Libre Baskerville',
  "'Times New Roman', serif": 'Times New Roman',
  "'Georgia', serif": 'Georgia',
  "'Garamond', serif": 'Garamond',
  "'Arial', sans-serif": 'Arial',
  "'Helvetica', sans-serif": 'Helvetica',
  "'Calibri', sans-serif": 'Calibri',
  "'Verdana', sans-serif": 'Verdana',
  "'Courier New', monospace": 'Courier New'
};

export default function DocumentGenerator() {
  // Theme
  const [darkMode, setDarkMode] = useState(true);
  
  // Document metadata
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('');
  
  // Letterhead
  const [letterhead, setLetterhead] = useState('');
  const [customLetterhead, setCustomLetterhead] = useState(null);
  const [letterheadImages, setLetterheadImages] = useState({});
  
  // Load letterhead content from .docx files
  useEffect(() => {
    const loadLetterheadContent = async () => {
      const content = {};
      for (const [key, config] of Object.entries(LETTERHEADS)) {
        if (config.file) {
          try {
            console.log(`Loading letterhead ${key} from: ${config.file}`);
            const response = await fetch(config.file);
            console.log(`Response status for ${key}:`, response.status, response.ok);
            
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              console.log(`ArrayBuffer size for ${key}:`, arrayBuffer.byteLength, 'bytes');
              
              try {
                const mammoth = await import('mammoth');
                console.log(`Mammoth loaded for ${key}`);
                
                // Convert to HTML with images
                const result = await mammoth.convertToHtml({ arrayBuffer }, {
                  convertImage: mammoth.images.imgElement((image) => {
                    return image.read('base64').then((imageBuffer) => {
                      return {
                        src: `data:${image.contentType};base64,${imageBuffer}`
                      };
                    });
                  })
                });
                
                console.log(`Mammoth conversion result for ${key}:`, {
                  htmlLength: result.value.length,
                  messages: result.messages
                });
                
                // Parse the HTML to extract images and content
                const parser = new DOMParser();
                const doc = parser.parseFromString(result.value, 'text/html');
                const imgElements = doc.querySelectorAll('img');
                const bodyContent = doc.body.innerHTML;
                
                console.log(`Parsed HTML for ${key}:`, {
                  imageCount: imgElements.length,
                  bodyContentLength: bodyContent ? bodyContent.length : 0,
                  bodyContentPreview: bodyContent ? bodyContent.substring(0, 200) : 'empty'
                });
                
                if (imgElements.length > 0) {
                  // Store images
                  const imageSources = Array.from(imgElements).map(img => img.src);
                  content[key] = {
                    type: 'images',
                    data: imageSources
                  };
                  console.log(`Stored ${imageSources.length} images for ${key}`);
                } else if (bodyContent && bodyContent.trim().length > 0) {
                  // Store the HTML content to render (even if no images)
                  content[key] = {
                    type: 'html',
                    data: bodyContent
                  };
                  console.log(`Stored HTML content for ${key} (${bodyContent.length} chars)`);
                } else {
                  console.warn(`No content extracted from ${key} - HTML body is empty`);
                }
                
                console.log(`Final content for ${key}:`, content[key] ? `${content[key].type} (${content[key].data?.length || 'N/A'} items)` : 'No content');
              } catch (mammothError) {
                console.error(`Error processing letterhead ${key} with mammoth:`, mammothError);
                console.error(`Error details:`, {
                  message: mammothError.message,
                  stack: mammothError.stack
                });
                
                // Try to find corresponding image files
                const imagePath = config.file.replace('.docx', '.png');
                console.log(`Trying fallback image path for ${key}:`, imagePath);
                try {
                  const imgResponse = await fetch(imagePath);
                  if (imgResponse.ok) {
                    content[key] = {
                      type: 'images',
                      data: [imagePath]
                    };
                    console.log(`Found fallback image for ${key}`);
                  } else {
                    console.warn(`Fallback image not found for ${key}: ${imgResponse.status}`);
                  }
                } catch (imgError) {
                  console.error(`Error fetching fallback image for ${key}:`, imgError);
                }
              }
            } else {
              console.error(`Failed to fetch letterhead ${key}: HTTP ${response.status} ${response.statusText}`);
              console.error(`File path attempted: ${config.file}`);
            }
          } catch (error) {
            console.error(`Error loading letterhead ${key}:`, error);
            console.error(`Error details:`, {
              message: error.message,
              stack: error.stack,
              file: config.file
            });
          }
        } else {
          console.warn(`No file specified for letterhead ${key}`);
        }
      }
      
      console.log(`Letterhead loading complete. Total loaded:`, Object.keys(content).length);
      console.log(`Loaded letterheads:`, Object.keys(content));
      setLetterheadImages(content);
    };
    loadLetterheadContent();
  }, []);
  
  // Recipient
  const [recipientName, setRecipientName] = useState('');
  const [recipientTitle, setRecipientTitle] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  
  // Document content
  const [documentBody, setDocumentBody] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Signatory
  const [selectedSigner, setSelectedSigner] = useState('');
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryTitle, setSignatoryTitle] = useState('');
  const [signatureType, setSignatureType] = useState('Decent Standlee');
  
  // Formatting
  const [fontSize, setFontSize] = useState(14);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [fontFamily, setFontFamily] = useState("'Libre Baskerville', serif");
  const [pageOrientation, setPageOrientation] = useState('portrait');
  const [pageMargins, setPageMargins] = useState({ top: 48, right: 48, bottom: 48, left: 48 });
  const [showPageNumbers, setShowPageNumbers] = useState(false);
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  
  // UI State
  const [showPreview, setShowPreview] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [insertedImages, setInsertedImages] = useState([]);
  
  // Refs
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);
  const letterheadInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('documentGenerator_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.documentName) setDocumentName(state.documentName);
        if (state.documentBody) setDocumentBody(state.documentBody);
        if (state.recipientName) setRecipientName(state.recipientName);
        if (state.signatoryName) setSignatoryName(state.signatoryName);
        if (state.signatoryTitle) setSignatoryTitle(state.signatoryTitle);
        if (state.fontSize) setFontSize(state.fontSize);
        if (state.fontFamily) setFontFamily(state.fontFamily);
      } catch (e) {
        console.error('Failed to load saved state:', e);
      }
    }
    
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const state = {
      documentName,
      documentBody,
      recipientName,
      signatoryName,
      signatoryTitle,
      fontSize,
      fontFamily
    };
    localStorage.setItem('documentGenerator_state', JSON.stringify(state));
  }, [documentName, documentBody, recipientName, signatoryName, signatoryTitle, fontSize, fontFamily]);

  // History management for undo/redo
  const addToHistory = (newBody) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBody);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setDocumentBody(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setDocumentBody(history[historyIndex + 1]);
    }
  };

  // Update document body when template changes
  useEffect(() => {
    if (documentType && TEMPLATES[documentType]) {
      const newBody = TEMPLATES[documentType];
      setDocumentBody(newBody);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newBody);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } else if (!documentType) {
      setDocumentBody('');
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push('');
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [documentType]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDocument();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (historyIndex > 0) {
          setHistoryIndex(historyIndex - 1);
          setDocumentBody(history[historyIndex - 1]);
        }
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          setHistoryIndex(historyIndex + 1);
          setDocumentBody(history[historyIndex + 1]);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateDocument();
      }
      if (e.key === 'F11') {
        e.preventDefault();
        setShowFullScreen(prev => !prev);
      }
      if (e.key === 'Escape' && showFullScreen) {
        setShowFullScreen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, showFullScreen]);

  // Helper functions
  const saveDocument = async (format = null) => {
    // If format is not specified, show selection dialog
    if (!format) {
      const userChoice = window.confirm(
        'Choose format:\n\nClick OK for PDF\nClick Cancel for DOCX'
      );
      format = userChoice ? 'pdf' : 'docx';
    }

    if (format === 'pdf') {
      await downloadPDF();
    } else if (format === 'docx') {
      downloadWord();
    }
  };

  const duplicateDocument = () => {
    setDocumentName(`${documentName || 'Document'} (Copy)`);
    // All other state is already in place, just update the name
  };


  const handleImageInsert = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgData = event.target.result;
        const imgId = `img_${Date.now()}`;
        setInsertedImages([...insertedImages, { id: imgId, data: imgData }]);
        const textarea = document.getElementById('documentBody');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = documentBody;
        const before = text.substring(0, start);
        const after = text.substring(end);
        const newText = before + `[IMAGE:${imgId}]` + after;
        setDocumentBody(newText);
        addToHistory(newText);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomLetterhead = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setCustomLetterhead({ type: 'image', data: event.target.result });
        };
        reader.readAsDataURL(file);
      } else if (file.name.endsWith('.pdf')) {
        setCustomLetterhead({ type: 'pdf', file: file });
      }
    }
  };

  // Replace placeholders in the document
  const getPreviewText = () => {
    let text = documentBody;
    // Replace standard placeholders
    text = text.replace(/\{\{Recipient_Name\}\}/g, recipientName || '{{Recipient_Name}}');
    text = text.replace(/\{\{Signatory_Name\}\}/g, signatoryName || '{{Signatory_Name}}');
    text = text.replace(/\{\{Signatory_Title\}\}/g, signatoryTitle || '{{Signatory_Title}}');
    text = text.replace(/\{\{Date\}\}/g, new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
    
    // Replace image placeholders with actual images
    insertedImages.forEach(img => {
      text = text.replace(`[IMAGE:${img.id}]`, `<img src="${img.data}" alt="Inserted image" style="max-width: 100%; height: auto;" />`);
    });
    
    return text;
  };

  // Calculate progress
  const progress = {
    documentTypeSelected: documentType !== '',
    signatorySelected: signatoryName !== '' && signatoryTitle !== '',
    documentFilled: documentBody.trim() !== '' && recipientName !== ''
  };

  const allComplete = Object.values(progress).every(v => v);
  const completionPercentage = (Object.values(progress).filter(v => v).length / 3) * 100;

  // Insert placeholder at cursor
  const insertPlaceholder = (placeholder) => {
    const textarea = document.getElementById('documentBody');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = documentBody;
    const before = text.substring(0, start);
    const after = text.substring(end);
    setDocumentBody(before + placeholder + after);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  };

  // Import document from file
  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.txt')) {
        // Handle plain text files
        const text = await file.text();
        setDocumentBody(text);
      } else if (file.name.endsWith('.docx')) {
        // Handle .docx files using mammoth
        try {
          const arrayBuffer = await file.arrayBuffer();
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ arrayBuffer });
          setDocumentBody(result.value);
        } catch (mammothError) {
          console.error('Mammoth import error:', mammothError);
          alert('To import .docx files, please install mammoth: npm install mammoth\n\nFor now, please convert your file to .txt format.');
        }
      } else if (file.name.endsWith('.doc')) {
        alert('Legacy .doc files are not supported. Please convert to .docx or .txt first.');
        return;
      } else {
        // Try to read as text for other file types
        const text = await file.text();
        setDocumentBody(text);
      }
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Error importing file. Please try a .txt file, or install mammoth for .docx support: npm install mammoth');
    }

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download PDF
  const downloadPDF = async () => {
    const element = previewRef.current;
    if (!element) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF(pageOrientation === 'landscape' ? 'l' : 'p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${documentName || documentType || 'document'}.pdf`.replace(/\s+/g, '_'));
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('PDF generation failed. Please try again.');
    }
  };

  // Download HTML
  const downloadHTML = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentName || 'Document'}</title>
  <style>
    body { font-family: ${fontFamily}; font-size: ${fontSize}px; line-height: ${lineSpacing}; padding: 48px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  ${previewRef.current ? previewRef.current.innerHTML : ''}
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentName || 'document'}.html`.replace(/\s+/g, '_');
    link.click();
  };

  // Download Plain Text
  const downloadText = () => {
    const text = getPreviewText().replace(/<[^>]*>/g, ''); // Strip HTML tags
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentName || 'document'}.txt`.replace(/\s+/g, '_');
    link.click();
  };

  // Print document
  const printDocument = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && previewRef.current) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${documentName || 'Document'}</title>
            <style>
              body { font-family: ${fontFamily}; font-size: ${fontSize}px; line-height: ${lineSpacing}; padding: 48px; }
              @media print { @page { margin: 1in; } }
            </style>
          </head>
          <body>${previewRef.current.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      window.print();
    }
  };

  // Download Word
  const downloadWord = () => {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${documentName || 'Document'}</title></head><body>`;
    const footer = '</body></html>';
    const content = previewRef.current.innerHTML;
    const html = header + content + footer;
    
    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentName || documentType || 'document'}.doc`.replace(/\s+/g, '_');
    link.click();
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#121212] text-gray-100' : 'bg-gray-50 text-gray-900'} p-4 md:p-8 transition-colors`}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1"></div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-coral-500 to-orange-400 bg-clip-text text-transparent">
            Document Generator
          </h1>
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
              title="Toggle theme"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Create professional documents with ease</p>
      </motion.div>

      {/* Document Name Field */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-6"
      >
        <div className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/80'} rounded-2xl p-4 border ${darkMode ? 'border-white/10' : 'border-gray-200'} shadow-xl`}>
          <input
            type="text"
            placeholder="Document Name (optional)"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            className={`w-full bg-transparent border-none outline-none text-lg font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} placeholder:${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
          />
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Controls */}
        <div className="space-y-6 h-fit">
          
          {/* Letterhead Selection */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/80'} rounded-2xl p-6 border ${darkMode ? 'border-white/10' : 'border-gray-200'} shadow-2xl`}
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🏢</span>
              LETTERHEAD
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {Object.keys(LETTERHEADS).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setLetterhead(type);
                    setCustomLetterhead(null);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    letterhead === type && !customLetterhead
                      ? 'border-coral-500 bg-coral-500/10' 
                      : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-xs font-medium">{LETTERHEADS[type].displayName || type}</div>
                  <div className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>.docx</div>
                </button>
              ))}
            </div>
            <label className={`block w-full p-3 rounded-lg border-2 border-dashed ${darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-300 hover:border-gray-400'} cursor-pointer transition-colors text-center text-sm`}>
              📤 Upload Custom Letterhead (Image/PDF)
              <input
                ref={letterheadInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleCustomLetterhead}
                className="hidden"
              />
            </label>
            {customLetterhead && (
              <div className="mt-3 p-2 bg-green-500/10 border border-green-500/50 rounded text-xs text-green-400">
                ✓ Custom letterhead loaded
                <button onClick={() => setCustomLetterhead(null)} className="ml-2 text-red-400 hover:text-red-300">Remove</button>
              </div>
            )}
          </motion.div>

          {/* Recipient Details */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 shadow-2xl"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">👤</span>
              RECIPIENT DETAILS
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className={`flex-1 ${darkMode ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-all`}
                />
                <input
                  type="text"
                  placeholder="Title"
                  value={recipientTitle}
                  onChange={(e) => setRecipientTitle(e.target.value)}
                  className={`flex-1 ${darkMode ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-all`}
                />
              </div>
              <input
                type="text"
                placeholder="Address (123 Example Ave, City, State 12345)"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className={`w-full ${darkMode ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-all`}
              />
              <input
                type="text"
                placeholder="Subject Line (optional)"
                value={subjectLine}
                onChange={(e) => setSubjectLine(e.target.value)}
                className={`w-full ${darkMode ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-all`}
              />
            </div>
          </motion.div>

          {/* Signatory */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 shadow-2xl"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">✍️</span>
              DOCUMENT SIGNATURE
            </h2>
            
            <div className="space-y-4">
              {/* Signature Type Radio Buttons */}
              <div className="space-y-2">
                {['Decent Standlee', 'Signing Officer', 'Custom Signature'].map((type) => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="signatureType"
                      value={type}
                      checked={signatureType === type}
                      onChange={(e) => setSignatureType(e.target.value)}
                      className="w-4 h-4 text-coral-500 border-gray-600 focus:ring-coral-500"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      {type}
                    </span>
                  </label>
                ))}
              </div>

              {/* Signer Selection */}
              <div className={`pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Select Signer</label>
                <select
                  value={selectedSigner}
                  onChange={(e) => {
                    const signer = e.target.value;
                    setSelectedSigner(signer);
                    if (signer && SIGNERS[signer]) {
                      setSignatoryName(SIGNERS[signer].name);
                      setSignatoryTitle(SIGNERS[signer].title);
                    } else {
                      setSignatoryName('');
                      setSignatoryTitle('');
                    }
                  }}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-all"
                >
                  <option value="">-- Select a signer --</option>
                  {Object.keys(SIGNERS).map((name) => (
                    <option key={name} value={name}>
                      {name} - {SIGNERS[name].title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Signatory Details */}
              <div className={`space-y-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                <input
                  type="text"
                  placeholder="Signatory Name"
                  value={signatoryName}
                  onChange={(e) => {
                    setSignatoryName(e.target.value);
                    setSelectedSigner('');
                  }}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-all"
                />
                <input
                  type="text"
                  placeholder="Signatory Title"
                  value={signatoryTitle}
                  onChange={(e) => {
                    setSignatoryTitle(e.target.value);
                    setSelectedSigner('');
                  }}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-all"
                />
              </div>
            </div>
          </motion.div>

          {/* Formatting Tools */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 shadow-2xl"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              FORMATTING TOOLS
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-all"
                >
                  {Object.entries(FONTS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Font Size: {fontSize}pt</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="20"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-coral-500"
                />
              </div>
              
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Line Spacing: {lineSpacing}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.1"
                  value={lineSpacing}
                  onChange={(e) => setLineSpacing(Number(e.target.value))}
                  className="w-full accent-coral-500"
                />
              </div>
            </div>
          </motion.div>

          {/* Document Body Editor */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/80'} rounded-2xl p-6 border ${darkMode ? 'border-white/10' : 'border-gray-200'} shadow-2xl`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                <span className="text-2xl">📝</span>
                DOCUMENT BODY
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className={`p-2 rounded ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  title="Undo (Ctrl+Z)"
                >
                  ↶
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className={`p-2 rounded ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  title="Redo (Ctrl+Y)"
                >
                  ↷
                </button>
              </div>
            </div>
            
            {/* Toolbar */}
            <div className={`flex flex-wrap gap-2 mb-3 p-3 ${darkMode ? 'bg-[#1a1a1a] border-gray-700' : 'bg-gray-100 border-gray-300'} rounded-lg border`}>
              <label className="px-3 py-1.5 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/50 rounded text-xs transition-colors cursor-pointer">
                📥 Import
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.docx,.doc"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
              <label className="px-3 py-1.5 bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/50 rounded text-xs transition-colors cursor-pointer">
                🖼️ Image
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageInsert}
                  className="hidden"
                />
              </label>
              <button 
                onClick={() => insertPlaceholder('{{Date}}')}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded text-xs transition-colors"
                title="Insert Date"
              >
                📅 Date
              </button>
              <button 
                onClick={() => insertPlaceholder('{{Signature}}')}
                className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded text-xs transition-colors"
                title="Insert Signature"
              >
                ✍️ Signature
              </button>
              <button 
                onClick={() => insertPlaceholder('{{Recipient_Name}}')}
                className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 rounded text-xs transition-colors"
                title="Insert Recipient Name"
              >
                👤 Name
              </button>
              <button 
                onClick={() => insertPlaceholder('{{Company_Name}}')}
                className="px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/50 rounded text-xs transition-colors"
                title="Insert Company"
              >
                🏢 Company
              </button>
            </div>

            <textarea
              id="documentBody"
              value={documentBody}
              onChange={(e) => {
                const newText = e.target.value;
                setDocumentBody(newText);
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(newText);
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
              }}
              spellCheck={true}
              className={`w-full h-64 ${darkMode ? 'bg-[#1a1a1a] border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-all font-mono text-sm resize-none`}
              placeholder="Enter your document text here, or click Import to upload a .txt or .docx file..."
            />
            
            <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              💡 Use placeholders like {`{{Recipient_Name}}`} for dynamic content, or import a .txt or .docx file
            </p>
          </motion.div>

          {/* Advanced Formatting */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/80'} rounded-2xl p-6 border ${darkMode ? 'border-white/10' : 'border-gray-200'} shadow-2xl`}
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">⚙️</span>
              ADVANCED FORMATTING
            </h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Page Orientation</label>
                <select
                  value={pageOrientation}
                  onChange={(e) => setPageOrientation(e.target.value)}
                  className={`w-full ${darkMode ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-all`}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Page Margins (px)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={pageMargins.top}
                    onChange={(e) => setPageMargins({...pageMargins, top: Number(e.target.value)})}
                    placeholder="Top"
                    className={`${darkMode ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'} border rounded px-2 py-1 text-sm`}
                  />
                  <input
                    type="number"
                    value={pageMargins.bottom}
                    onChange={(e) => setPageMargins({...pageMargins, bottom: Number(e.target.value)})}
                    placeholder="Bottom"
                    className={`${darkMode ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'} border rounded px-2 py-1 text-sm`}
                  />
                  <input
                    type="number"
                    value={pageMargins.left}
                    onChange={(e) => setPageMargins({...pageMargins, left: Number(e.target.value)})}
                    placeholder="Left"
                    className={`${darkMode ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'} border rounded px-2 py-1 text-sm`}
                  />
                  <input
                    type="number"
                    value={pageMargins.right}
                    onChange={(e) => setPageMargins({...pageMargins, right: Number(e.target.value)})}
                    placeholder="Right"
                    className={`${darkMode ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'} border rounded px-2 py-1 text-sm`}
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPageNumbers}
                    onChange={(e) => setShowPageNumbers(e.target.checked)}
                    className="w-4 h-4 text-coral-500"
                  />
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Show Page Numbers</span>
                </label>
              </div>
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Header Text (optional)</label>
                <input
                  type="text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder="Header text"
                  className={`w-full ${darkMode ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'} border rounded-lg px-3 py-2 text-sm`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Footer Text (optional)</label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="Footer text"
                  className={`w-full ${darkMode ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'} border rounded-lg px-3 py-2 text-sm`}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Preview (Desktop) */}
        <div className="hidden lg:block sticky top-8 h-fit">
          <DocumentPreview
            ref={previewRef}
            letterhead={customLetterhead ? customLetterhead : LETTERHEADS[letterhead]}
            recipientName={recipientName}
            recipientTitle={recipientTitle}
            recipientAddress={recipientAddress}
            subjectLine={subjectLine}
            documentType={documentType}
            previewText={getPreviewText()}
            fontSize={fontSize}
            lineSpacing={lineSpacing}
            fontFamily={fontFamily}
            signatoryName={signatoryName}
            signatoryTitle={signatoryTitle}
            pageOrientation={pageOrientation}
            pageMargins={pageMargins}
            showPageNumbers={showPageNumbers}
            headerText={headerText}
            footerText={footerText}
            customLetterhead={customLetterhead}
            letterheadImages={letterheadImages}
          />
        </div>
      </div>

      {/* Mobile Preview Button */}
      <div className="lg:hidden fixed bottom-24 right-4">
        <button
          onClick={() => setShowPreview(true)}
          className="bg-gradient-to-r from-coral-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-2xl hover:shadow-coral-500/50 transition-all"
        >
          👁️ Preview
        </button>
      </div>

      {/* Mobile Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/90 z-50 overflow-auto p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl mx-auto"
            >
              <button
                onClick={() => setShowPreview(false)}
                className={`mb-4 ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} px-4 py-2 rounded-lg`}
              >
                ← Back
              </button>
          <DocumentPreview
            ref={previewRef}
            letterhead={customLetterhead ? customLetterhead : LETTERHEADS[letterhead]}
            recipientName={recipientName}
            recipientTitle={recipientTitle}
            recipientAddress={recipientAddress}
            subjectLine={subjectLine}
            documentType={documentType}
            previewText={getPreviewText()}
            fontSize={fontSize}
            lineSpacing={lineSpacing}
            fontFamily={fontFamily}
            signatoryName={signatoryName}
            signatoryTitle={signatoryTitle}
            pageOrientation={pageOrientation}
            pageMargins={pageMargins}
            showPageNumbers={showPageNumbers}
            headerText={headerText}
            footerText={footerText}
            customLetterhead={customLetterhead}
            letterheadImages={letterheadImages}
          />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Preview Modal */}
      <AnimatePresence>
        {showFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 overflow-auto p-4"
            onClick={() => setShowFullScreen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Full Screen Preview</h2>
                <button
                  onClick={() => setShowFullScreen(false)}
                  className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-white"
                >
                  ✕ Close (ESC)
                </button>
              </div>
          <DocumentPreview
            ref={previewRef}
            letterhead={customLetterhead ? customLetterhead : LETTERHEADS[letterhead]}
            recipientName={recipientName}
            recipientTitle={recipientTitle}
            recipientAddress={recipientAddress}
            subjectLine={subjectLine}
            documentType={documentType}
            previewText={getPreviewText()}
            fontSize={fontSize}
            lineSpacing={lineSpacing}
            fontFamily={fontFamily}
            signatoryName={signatoryName}
            signatoryTitle={signatoryTitle}
            pageOrientation={pageOrientation}
            pageMargins={pageMargins}
            showPageNumbers={showPageNumbers}
            headerText={headerText}
            footerText={footerText}
            customLetterhead={customLetterhead}
            letterheadImages={letterheadImages}
          />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress & Actions Footer */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-300'} border-t p-4 backdrop-blur-xl bg-opacity-95`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Document Progress</span>
              <span className="text-sm font-medium text-coral-500">{Math.round(completionPercentage)}%</span>
            </div>
            <div className={`h-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded-full overflow-hidden`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                className="h-full bg-gradient-to-r from-coral-500 to-orange-500"
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                progress.documentTypeSelected ? 'bg-green-500' : 'bg-gray-700'
              }`}>
                {progress.documentTypeSelected && '✓'}
              </div>
              <span className={progress.documentTypeSelected ? 'text-green-400' : 'text-gray-500'}>
                Document type selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                progress.signatorySelected ? 'bg-green-500' : 'bg-gray-700'
              }`}>
                {progress.signatorySelected && '✓'}
              </div>
              <span className={progress.signatorySelected ? 'text-green-400' : 'text-gray-500'}>
                Signatory selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                progress.documentFilled ? 'bg-green-500' : 'bg-gray-700'
              }`}>
                {progress.documentFilled && '✓'}
              </div>
              <span className={progress.documentFilled ? 'text-green-400' : 'text-gray-500'}>
                Document filled
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* View Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowFullScreen(true)}
                className={`flex-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2`}
              >
                👁️ Preview Document
              </button>
              <button
                onClick={printDocument}
                className={`flex-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2`}
              >
                🖨️ Print
              </button>
            </div>
            
            {/* Download Action */}
            <div>
              <button
                onClick={downloadPDF}
                disabled={!allComplete}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  allComplete
                    ? 'bg-gradient-to-r from-coral-500 to-orange-500 hover:shadow-lg hover:shadow-coral-500/50 text-white'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}
              >
                📄 Download PDF
              </button>
            </div>
            
            {/* Primary Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
              <button
                onClick={() => saveDocument()}
                disabled={!allComplete}
                className={`flex-1 ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Save (Ctrl+S) - Choose PDF or DOCX"
              >
                💾 Save Document
              </button>
              <button
                onClick={() => {
                  // DocuSign integration - opens DocuSign in new window
                  const docuSignUrl = `https://app.docusign.com/home?redirectUrl=${encodeURIComponent(window.location.href)}`;
                  window.open(docuSignUrl, '_blank');
                }}
                className={`flex-1 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-white`}
                title="Send to DocuSign"
              >
                ✍️ Send to DocuSign
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Document Preview Component
const DocumentPreview = React.forwardRef(({ 
  letterhead, 
  recipientName, 
  recipientTitle, 
  recipientAddress,
  subjectLine,
  documentType,
  previewText,
  fontSize,
  lineSpacing,
  fontFamily,
  signatoryName,
  signatoryTitle,
  pageOrientation = 'portrait',
  pageMargins = { top: 48, right: 48, bottom: 48, left: 48 },
  showPageNumbers = false,
  headerText = '',
  footerText = '',
  customLetterhead = null,
  letterheadImages = {}
}, ref) => {
  const pageNumber = 1; // In a real implementation, this would track multiple pages
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 shadow-2xl"
    >
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">📋</span>
        LIVE PREVIEW
      </h2>

      {/* A4 Paper Simulation */}
      <div className="bg-white text-gray-900 rounded-lg shadow-2xl" style={{ overflow: 'hidden' }}>
        <div 
          ref={ref}
          className={`${pageOrientation === 'landscape' ? 'min-h-[21cm]' : 'min-h-[29.7cm]'} relative`}
          style={{
            fontFamily: fontFamily || "'Libre Baskerville', serif",
            paddingTop: `${pageMargins.top}px`,
            paddingRight: `${pageMargins.right}px`,
            paddingBottom: `${pageMargins.bottom}px`,
            paddingLeft: `${pageMargins.left}px`,
            marginTop: '0'
          }}
        >
          {/* Header */}
          {headerText && (
            <div className="text-center text-xs text-gray-500 border-b border-gray-200 pb-1 mb-4" style={{ paddingTop: `${pageMargins.top - 20}px` }}>
              {headerText}
            </div>
          )}

          {/* Letterhead Header */}
          {(letterhead || customLetterhead) && (
            <div 
              className="mb-0"
              style={{
                marginTop: headerText ? '0' : `${pageMargins.top}px`,
                marginLeft: `-${pageMargins.left}px`,
                marginRight: `-${pageMargins.right}px`,
                width: `calc(100% + ${pageMargins.left + pageMargins.right}px)`,
                position: 'relative',
                zIndex: 1
              }}
            >
              {customLetterhead && customLetterhead.type === 'image' ? (
                <img 
                  src={customLetterhead.data} 
                  alt="Custom Letterhead" 
                  className="w-full h-auto"
                  style={{ display: 'block' }}
                />
              ) : letterhead && (() => {
                // Find the letterhead key from the object
                const letterheadKey = Object.keys(LETTERHEADS).find(key => 
                  LETTERHEADS[key].file === letterhead.file || 
                  LETTERHEADS[key].name === letterhead.name
                );
                const letterheadContent = letterheadKey ? letterheadImages[letterheadKey] : null;
                
                console.log(`Rendering letterhead ${letterheadKey}:`, {
                  hasContent: !!letterheadContent,
                  type: letterheadContent?.type,
                  dataLength: letterheadContent?.data?.length || 0
                });
                
                if (letterheadContent) {
                  if (letterheadContent.type === 'images' && letterheadContent.data && letterheadContent.data.length > 0) {
                    return (
                      <div className="w-full">
                        {letterheadContent.data.map((imgSrc, idx) => (
                          <img 
                            key={idx} 
                            src={imgSrc} 
                            alt={`${letterhead.displayName || letterhead.name} Letterhead`} 
                            className="w-full h-auto"
                            style={{ display: 'block' }}
                            onError={(e) => {
                              console.error(`Failed to load letterhead image ${idx} for ${letterheadKey}:`, imgSrc);
                              e.target.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log(`Successfully loaded letterhead image ${idx} for ${letterheadKey}`);
                            }}
                          />
                        ))}
                      </div>
                    );
                  } else if (letterheadContent.type === 'html' && letterheadContent.data) {
                    // Clean up the HTML to remove dates and test text that might be in the letterhead
                    let cleanedHtml = letterheadContent.data;
                    // Remove common date patterns and test text
                    cleanedHtml = cleanedHtml.replace(/February\s+\d+,\s+\d{4}/gi, '');
                    cleanedHtml = cleanedHtml.replace(/test/gi, '');
                    cleanedHtml = cleanedHtml.replace(/<p[^>]*>test<\/p>/gi, '');
                    cleanedHtml = cleanedHtml.replace(/<p[^>]*>\s*<\/p>/g, '');
                    
                    return (
                      <div 
                        className="w-full letterhead-content"
                        style={{ 
                          background: 'white',
                          overflow: 'hidden'
                        }}
                        dangerouslySetInnerHTML={{ __html: cleanedHtml }}
                      />
                    );
                  }
                } else {
                  console.warn(`No letterhead content found for ${letterheadKey}. Available keys:`, Object.keys(letterheadImages));
                }
                
                // Fallback to text display (shouldn't happen if letterhead is properly loaded)
                return null;
              })()}
            </div>
          )}

          {/* Document Content - Appears in middle section below letterhead */}
          <div 
            className="relative"
            style={{
              marginTop: (letterhead || customLetterhead) ? '80px' : '0',
              paddingTop: (letterhead || customLetterhead) ? '40px' : '0'
            }}
          >
            {/* Recipient */}
            {recipientName && (
              <div className="mb-6 text-sm">
                <div className="font-semibold">{recipientName}</div>
                {recipientTitle && <div className="text-gray-600">{recipientTitle}</div>}
                {recipientAddress && <div className="text-gray-600">{recipientAddress}</div>}
              </div>
            )}

            {/* Subject Line */}
            {subjectLine && (
              <div className="mb-6 font-semibold">
                Re: {subjectLine}
              </div>
            )}

            {/* Document Body */}
            <div 
              className="whitespace-pre-wrap mb-8 flex-grow"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineSpacing,
                fontFamily: fontFamily || "'Libre Baskerville', serif"
              }}
              dangerouslySetInnerHTML={{ __html: previewText.replace(/\n/g, '<br />') }}
            />

            {/* Signature Section */}
            {(signatoryName || signatoryTitle) && (
              <div className="mt-8 pt-6">
                <div className="mb-4" style={{ fontSize: `${fontSize}px` }}>
                  Sincerely,
                </div>
                {signatoryName && (
                  <div className="font-semibold mb-1" style={{ fontSize: `${fontSize}px` }}>
                    {signatoryName}
                  </div>
                )}
                {signatoryTitle && (
                  <div className="text-gray-600" style={{ fontSize: `${Math.max(fontSize - 1, 12)}px` }}>
                    {signatoryTitle}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            {footerText && (
              <div className="mt-8 pt-4 text-center text-xs text-gray-500 border-t border-gray-200">
                {footerText}
              </div>
            )}

            {/* Page Numbers */}
            {showPageNumbers && (
              <div className="mt-8 text-right text-xs text-gray-500">
                1
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

DocumentPreview.displayName = 'DocumentPreview';

