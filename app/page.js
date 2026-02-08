'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';


// Letterhead configurations - images in public/headers/
const LETTERHEADS = {
  TRT: {
    name: 'Fountain TRT',
    fullName: 'Fountain - Teal',
    image: '/headers/trt-header.jpg',
    color: 'from-teal-500 to-cyan-400'
  },
  HRT: {
    name: 'Fountain HRT',
    fullName: 'Fountain - Pink',
    image: '/headers/hrt-header.png',
    color: 'from-pink-500 to-fuchsia-400'
  }
};

// Signatory configurations
const SIGNATORIES = {
  'lindsay': {
    name: 'Lindsay Burden',
    title: 'Chief Clinical Operations Officer'
  },
  'tzvi': {
    name: 'Tzvi Doron',
    title: 'Chief Clinical Officer'
  },
  'doron': {
    name: 'Doron Stember',
    title: 'Chief Medical Officer'
  }
};

// Font configurations
const FONTS = {
  'libre': {
    name: 'Libre Baskerville',
    family: "'Libre Baskerville', serif",
    style: 'Classic Serif'
  },
  'georgia': {
    name: 'Georgia',
    family: "Georgia, 'Times New Roman', serif",
    style: 'Traditional'
  },
  'arial': {
    name: 'Arial',
    family: "Arial, Helvetica, sans-serif",
    style: 'Clean Sans'
  },
  'times': {
    name: 'Times New Roman',
    family: "'Times New Roman', Times, serif",
    style: 'Formal'
  },
  'courier': {
    name: 'Courier New',
    family: "'Courier New', Courier, monospace",
    style: 'Typewriter'
  }
};

export default function DocumentGenerator() {
  const [letterhead, setLetterhead] = useState('TRT');
  const [recipientName, setRecipientName] = useState('');
  const [recipientTitle, setRecipientTitle] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const [documentBody, setDocumentBody] = useState('');
  const [selectedSignatory, setSelectedSignatory] = useState('lindsay');
  const [signatoryName, setSignatoryName] = useState(SIGNATORIES['lindsay'].name);
  const [signatoryTitle, setSignatoryTitle] = useState(SIGNATORIES['lindsay'].title);
  const [useCustomSignatory, setUseCustomSignatory] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [selectedFont, setSelectedFont] = useState('libre');
  const [showPreview, setShowPreview] = useState(false);
  
  const previewRef = useRef(null);


  // Replace placeholders in the document
  const getPreviewText = () => {
    let text = documentBody;
    text = text.replace(/\{\{Recipient_Name\}\}/g, recipientName || '{{Recipient_Name}}');
    text = text.replace(/\{\{Signatory_Name\}\}/g, signatoryName || '{{Signatory_Name}}');
    text = text.replace(/\{\{Signatory_Title\}\}/g, signatoryTitle || '{{Signatory_Title}}');
    text = text.replace(/\{\{Date\}\}/g, new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
    return text;
  };

  // Calculate progress
  const progress = {
    signatorySelected: signatoryName !== '' && signatoryTitle !== '',
    documentFilled: documentBody.trim() !== ''
  };

  const allComplete = Object.values(progress).every(v => v);
  const completionPercentage = (Object.values(progress).filter(v => v).length / 2) * 100;

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

  // Helper function to load and crop image header (top 20% of the image)
  const loadHeaderImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Crop to top 20% of the image (the header portion)
        const cropHeight = Math.floor(img.height * 0.20);
        canvas.width = img.width;
        canvas.height = cropHeight;
        const ctx = canvas.getContext('2d');
        // Draw only the top portion of the image
        ctx.drawImage(img, 0, 0, img.width, cropHeight, 0, 0, img.width, cropHeight);
        resolve({ 
          data: canvas.toDataURL('image/png'),
          aspectRatio: img.width / cropHeight
        });
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  // Helper function to load and crop image footer (bottom 12% of the image)
  const loadFooterImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Crop to bottom 12% of the image (the footer portion)
        const cropHeight = Math.floor(img.height * 0.12);
        const startY = img.height - cropHeight;
        canvas.width = img.width;
        canvas.height = cropHeight;
        const ctx = canvas.getContext('2d');
        // Draw only the bottom portion of the image
        ctx.drawImage(img, 0, startY, img.width, cropHeight, 0, 0, img.width, cropHeight);
        resolve({ 
          data: canvas.toDataURL('image/png'),
          aspectRatio: img.width / cropHeight
        });
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  // Download PDF
  const downloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm for A4
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm for A4
      
      const letterheadData = LETTERHEADS[letterhead];
      
      // Try to load and add letterhead image (cropped to header only)
      let headerHeight = 45;
      try {
        const { data: imgData, aspectRatio } = await loadHeaderImage(letterheadData.image);
        // Calculate height to maintain aspect ratio - full page width
        headerHeight = pageWidth / aspectRatio;
        // Add image spanning full page width, edge to edge
        pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, headerHeight);
      } catch (imgError) {
        // If image fails, add text header
        console.log('Image load failed, using text header');
        pdf.setFontSize(24);
        pdf.setTextColor(0, 128, 128);
        pdf.text(letterheadData.fullName, 20, 25);
        pdf.setDrawColor(0, 128, 128);
        pdf.line(0, 35, pageWidth, 35);
        headerHeight = 45;
      }
      
      // Reset text color to black
      pdf.setTextColor(0, 0, 0);
      
      let yPosition = headerHeight + 15;
      
      // Recipient info
      if (recipientName) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text(recipientName, 20, yPosition);
        yPosition += 6;
        
        if (recipientTitle) {
          pdf.setFont(undefined, 'normal');
          pdf.setTextColor(100, 100, 100);
          pdf.text(recipientTitle, 20, yPosition);
          yPosition += 6;
        }
        
        if (recipientAddress) {
          pdf.setFont(undefined, 'normal');
          pdf.setTextColor(100, 100, 100);
          pdf.text(recipientAddress, 20, yPosition);
          yPosition += 6;
        }
        
        pdf.setTextColor(0, 0, 0);
        yPosition += 8;
      }
      
      // Subject line
      if (subjectLine) {
        pdf.setFont(undefined, 'bold');
        pdf.text(`Re: ${subjectLine}`, 20, yPosition);
        pdf.setFont(undefined, 'normal');
        yPosition += 12;
      }
      
      // Document body
      pdf.setFontSize(fontSize);
      pdf.setFont(undefined, 'normal');
      const previewText = getPreviewText();
      const lines = pdf.splitTextToSize(previewText, pageWidth - 40);
      
      // Check if we need multiple pages
      const lineHeight = fontSize * 0.5;
      for (let i = 0; i < lines.length; i++) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(lines[i], 20, yPosition);
        yPosition += lineHeight;
      }
      
      // Add signatory at the end for "None" template or if not in text
      if (signatoryName && !previewText.includes(signatoryName)) {
        yPosition += 20; // Add spacing before signature
        
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
        
        pdf.setFont(undefined, 'normal');
        pdf.text('Sincerely,', 20, yPosition);
        yPosition += 15;
        
        pdf.setFont(undefined, 'bold');
        pdf.text(signatoryName, 20, yPosition);
        yPosition += 6;
        
        if (signatoryTitle) {
          pdf.setFont(undefined, 'normal');
          pdf.text(signatoryTitle, 20, yPosition);
        }
      }
      
      // Add footer image at the bottom of the page
      try {
        const { data: footerData, aspectRatio: footerRatio } = await loadFooterImage(letterheadData.image);
        const footerHeight = pageWidth / footerRatio;
        const footerY = pageHeight - footerHeight;
        pdf.addImage(footerData, 'PNG', 0, footerY, pageWidth, footerHeight);
      } catch (footerError) {
        console.log('Footer image load failed');
      }
      
      pdf.save('Document.pdf');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('PDF generation failed. Please try using the Word export instead.');
    }
  };

  // Download Word
  const downloadWord = () => {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Document</title></head><body>`;
    const footer = '</body></html>';
    const content = previewRef.current.innerHTML;
    const html = header + content + footer;
    
    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Document.doc';
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-100 p-4 md:p-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#ff6b6b] to-orange-400 bg-clip-text text-transparent mb-2">
          Document Generator
        </h1>
        <p className="text-gray-400">Create professional documents with ease</p>
      </motion.div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Controls */}
        <div className="space-y-6 h-fit">
          
          {/* Letterhead Selection */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 shadow-2xl"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🏢</span>
              LETTERHEAD
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(LETTERHEADS).map(type => (
                <button
                  key={type}
                  onClick={() => setLetterhead(type)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    letterhead === type 
                      ? 'border-[#ff6b6b] bg-[#ff6b6b]/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className={`text-lg font-bold bg-gradient-to-r ${LETTERHEADS[type].color} bg-clip-text text-transparent mb-1`}>
                    {LETTERHEADS[type].name}
                  </div>
                  <div className="text-xs text-gray-400">{LETTERHEADS[type].fullName}</div>
                </button>
              ))}
            </div>
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
                  className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] transition-all"
                />
                <input
                  type="text"
                  placeholder="Title"
                  value={recipientTitle}
                  onChange={(e) => setRecipientTitle(e.target.value)}
                  className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] transition-all"
                />
              </div>
              <input
                type="text"
                placeholder="Address (123 Example Ave, City, State 12345)"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] transition-all"
              />
              <input
                type="text"
                placeholder="Subject Line (optional)"
                value={subjectLine}
                onChange={(e) => setSubjectLine(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] transition-all"
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
              {/* Predefined Signatories */}
              <div className="space-y-2">
                {Object.entries(SIGNATORIES).map(([key, signer]) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="signatory"
                      value={key}
                      checked={!useCustomSignatory && selectedSignatory === key}
                      onChange={() => {
                        setUseCustomSignatory(false);
                        setSelectedSignatory(key);
                        setSignatoryName(signer.name);
                        setSignatoryTitle(signer.title);
                      }}
                      className="w-4 h-4 text-[#ff6b6b] border-gray-600 focus:ring-[#ff6b6b]"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-200 group-hover:text-white transition-colors font-medium">
                        {signer.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {signer.title}
                      </span>
                    </div>
                  </label>
                ))}
                
                {/* Custom Signature Option */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="signatory"
                    value="custom"
                    checked={useCustomSignatory}
                    onChange={() => {
                      setUseCustomSignatory(true);
                      setSignatoryName('');
                      setSignatoryTitle('');
                    }}
                    className="w-4 h-4 text-[#ff6b6b] border-gray-600 focus:ring-[#ff6b6b]"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    Custom Signature
                  </span>
                </label>
              </div>

              {/* Custom Signatory Details */}
              {useCustomSignatory && (
                <div className="space-y-3 pt-3 border-t border-gray-700">
                  <input
                    type="text"
                    placeholder="Signatory Name"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Signatory Title"
                    value={signatoryTitle}
                    onChange={(e) => setSignatoryTitle(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] transition-all"
                  />
                </div>
              )}
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
              {/* Font Selection */}
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Font Family</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(FONTS).map(([key, font]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedFont(key)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        selectedFont === key 
                          ? 'border-[#ff6b6b] bg-[#ff6b6b]/10' 
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-sm font-medium" style={{ fontFamily: font.family }}>
                        {font.name}
                      </div>
                      <div className="text-xs text-gray-500">{font.style}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Font Size: {fontSize}pt</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="20"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-[#ff6b6b]"
                />
              </div>
              
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Line Spacing: {lineSpacing}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.1"
                  value={lineSpacing}
                  onChange={(e) => setLineSpacing(Number(e.target.value))}
                  className="w-full accent-[#ff6b6b]"
                />
              </div>
            </div>
          </motion.div>

          {/* Document Body Editor */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 shadow-2xl"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              DOCUMENT BODY
            </h2>
            
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 mb-3 p-3 bg-[#1a1a1a] rounded-lg border border-gray-700">
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
              onChange={(e) => setDocumentBody(e.target.value)}
              className="w-full h-64 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] transition-all font-mono text-sm resize-none"
              placeholder="Enter your document text here..."
            />
            
            <p className="text-xs text-gray-500 mt-2">
              💡 Use placeholders like {`{{Recipient_Name}}`} for dynamic content
            </p>
          </motion.div>
        </div>

        {/* Right Column - Preview (Desktop) */}
        <div className="hidden lg:block sticky top-8 h-fit">
          <DocumentPreview
            ref={previewRef}
            letterhead={LETTERHEADS[letterhead]}
            recipientName={recipientName}
            recipientTitle={recipientTitle}
            recipientAddress={recipientAddress}
            subjectLine={subjectLine}
            previewText={getPreviewText()}
            fontSize={fontSize}
            lineSpacing={lineSpacing}
            fontFamily={FONTS[selectedFont].family}
            signatoryName={signatoryName}
            signatoryTitle={signatoryTitle}
          />
        </div>
      </div>

      {/* Mobile Preview Button */}
      <div className="lg:hidden fixed bottom-24 right-4">
        <button
          onClick={() => setShowPreview(true)}
          className="bg-gradient-to-r from-[#ff6b6b] to-orange-500 text-white px-6 py-3 rounded-full shadow-2xl hover:shadow-[#ff6b6b]/50 transition-all"
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
                className="mb-4 bg-gray-800 px-4 py-2 rounded-lg"
              >
                ← Back
              </button>
              <DocumentPreview
                ref={previewRef}
                letterhead={LETTERHEADS[letterhead]}
                recipientName={recipientName}
                recipientTitle={recipientTitle}
                recipientAddress={recipientAddress}
                subjectLine={subjectLine}
                previewText={getPreviewText()}
                fontSize={fontSize}
                lineSpacing={lineSpacing}
                fontFamily={FONTS[selectedFont].family}
                signatoryName={signatoryName}
                signatoryTitle={signatoryTitle}
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
        className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-800 p-4 backdrop-blur-xl bg-opacity-95"
      >
        <div className="max-w-7xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Document Progress</span>
              <span className="text-sm font-medium text-[#ff6b6b]">{Math.round(completionPercentage)}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                className="h-full bg-gradient-to-r from-[#ff6b6b] to-orange-500"
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
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
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="flex-1 min-w-[120px] bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              👁️ Preview
            </button>
            <button
              onClick={downloadPDF}
              disabled={!allComplete}
              className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                allComplete
                  ? 'bg-gradient-to-r from-[#ff6b6b] to-orange-500 hover:shadow-lg hover:shadow-[#ff6b6b]/50'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              📄 Download PDF
            </button>
            <button
              onClick={downloadWord}
              disabled={!allComplete}
              className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                allComplete
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              📝 Word
            </button>
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
  previewText,
  fontSize,
  lineSpacing,
  fontFamily,
  signatoryName,
  signatoryTitle
}, ref) => {
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
      <div className="bg-white text-gray-900 rounded-lg shadow-2xl overflow-hidden">
        <div 
          ref={ref}
          className="p-12 min-h-[29.7cm] flex flex-col"
          style={{
            fontFamily: fontFamily || "'Libre Baskerville', serif"
          }}
        >
          {/* Letterhead */}
          <div className="mb-6 -mx-12 -mt-12">
            <div className="overflow-hidden" style={{ maxHeight: '180px' }}>
              <img 
                src={letterhead.image} 
                alt={`${letterhead.fullName} Letterhead`}
                className="w-full h-auto"
                onError={(e) => {
                  e.target.parentElement.style.display = 'none';
                  e.target.parentElement.nextSibling.style.display = 'block';
                }}
              />
            </div>
            <div className="hidden px-12 pb-6 border-b-2 border-gray-300">
              <div className={`text-3xl font-bold bg-gradient-to-r ${letterhead.color} bg-clip-text text-transparent`}>
                {letterhead.fullName}
              </div>
            </div>
          </div>


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
            className="whitespace-pre-wrap"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineSpacing
            }}
          >
            {previewText}
          </div>

          {/* Signatory - show if not already in text */}
          {signatoryName && !previewText.includes(signatoryName) && (
            <div className="mt-8">
              <div className="mb-4">Sincerely,</div>
              <div className="font-semibold">{signatoryName}</div>
              {signatoryTitle && <div className="text-gray-600">{signatoryTitle}</div>}
            </div>
          )}

          {/* Spacer to push footer down */}
          <div className="flex-grow"></div>

          {/* Footer */}
          <div className="-mx-12 -mb-12 mt-auto">
            <div className="overflow-hidden" style={{ maxHeight: '100px' }}>
              <img 
                src={letterhead.image} 
                alt={`${letterhead.fullName} Footer`}
                className="w-full h-auto"
                style={{ 
                  marginTop: '-87%',
                  clipPath: 'inset(87% 0 0 0)'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

DocumentPreview.displayName = 'DocumentPreview';
