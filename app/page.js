'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Letterhead configurations
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
  'lindsay': { name: 'Lindsay Burden', title: 'Chief Clinical Operations Officer' },
  'tzvi': { name: 'Tzvi Doron', title: 'Chief Clinical Officer' },
  'doron': { name: 'Doron Stember', title: 'Chief Medical Officer' }
};

// Font configurations
const FONTS = {
  'libre': { name: 'Libre Baskerville', family: "'Libre Baskerville', serif" },
  'georgia': { name: 'Georgia', family: "Georgia, 'Times New Roman', serif" },
  'arial': { name: 'Arial', family: "Arial, Helvetica, sans-serif" },
  'times': { name: 'Times New Roman', family: "'Times New Roman', Times, serif" }
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
  const [showHelp, setShowHelp] = useState(false);
  
  const previewRef = useRef(null);

  const getPreviewText = () => {
    let text = documentBody;
    text = text.replace(/\{\{Recipient_Name\}\}/g, recipientName || '{{Recipient_Name}}');
    text = text.replace(/\{\{Signatory_Name\}\}/g, signatoryName || '{{Signatory_Name}}');
    text = text.replace(/\{\{Signatory_Title\}\}/g, signatoryTitle || '{{Signatory_Title}}');
    text = text.replace(/\{\{Date\}\}/g, new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    }));
    return text;
  };

  const allComplete = signatoryName && signatoryTitle && documentBody.trim();

  // Helper functions for PDF generation
  const loadHeaderImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const cropHeight = Math.floor(img.height * 0.20);
        canvas.width = img.width;
        canvas.height = cropHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, cropHeight, 0, 0, img.width, cropHeight);
        resolve({ data: canvas.toDataURL('image/png'), aspectRatio: img.width / cropHeight });
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const loadFooterImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const cropHeight = Math.floor(img.height * 0.12);
        const startY = img.height - cropHeight;
        canvas.width = img.width;
        canvas.height = cropHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, startY, img.width, cropHeight, 0, 0, img.width, cropHeight);
        resolve({ data: canvas.toDataURL('image/png'), aspectRatio: img.width / cropHeight });
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const downloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const letterheadData = LETTERHEADS[letterhead];
      
      let headerHeight = 45;
      try {
        const { data: imgData, aspectRatio } = await loadHeaderImage(letterheadData.image);
        headerHeight = pageWidth / aspectRatio;
        pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, headerHeight);
      } catch {
        pdf.setFontSize(24);
        pdf.setTextColor(0, 128, 128);
        pdf.text(letterheadData.fullName, 20, 25);
        pdf.line(0, 35, pageWidth, 35);
        headerHeight = 45;
      }
      
      pdf.setTextColor(0, 0, 0);
      let yPosition = headerHeight + 15;
      
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
          pdf.text(recipientAddress, 20, yPosition);
          yPosition += 6;
        }
        pdf.setTextColor(0, 0, 0);
        yPosition += 8;
      }
      
      if (subjectLine) {
        pdf.setFont(undefined, 'bold');
        pdf.text(`Re: ${subjectLine}`, 20, yPosition);
        pdf.setFont(undefined, 'normal');
        yPosition += 12;
      }
      
      pdf.setFontSize(fontSize);
      const previewText = getPreviewText();
      const lines = pdf.splitTextToSize(previewText, pageWidth - 40);
      const lineHeight = fontSize * 0.5;
      
      for (let i = 0; i < lines.length; i++) {
        if (yPosition > 250) { pdf.addPage(); yPosition = 20; }
        pdf.text(lines[i], 20, yPosition);
        yPosition += lineHeight;
      }
      
      if (signatoryName && !previewText.includes(signatoryName)) {
        yPosition += 20;
        if (yPosition > 250) { pdf.addPage(); yPosition = 30; }
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
      
      try {
        const { data: footerData, aspectRatio: footerRatio } = await loadFooterImage(letterheadData.image);
        const footerHeight = pageWidth / footerRatio;
        pdf.addImage(footerData, 'PNG', 0, pageHeight - footerHeight, pageWidth, footerHeight);
      } catch {}
      
      pdf.save('Document.pdf');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('PDF generation failed. Please try the Word export.');
    }
  };

  const downloadWord = () => {
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Document</title></head><body>${previewRef.current.innerHTML}</body></html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Document.doc';
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center font-bold text-slate-900">
              F
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Fountain Document Generator</h1>
              <p className="text-xs text-slate-500">Create professional letterhead documents</p>
            </div>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            className="px-4 py-2 text-sm border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
          >
            How to Use
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left Column - Controls */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Letterhead */}
            <section className="bg-slate-900 rounded-xl p-5 border border-slate-800">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Letterhead</h2>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(LETTERHEADS).map(([key, lh]) => (
                  <button
                    key={key}
                    onClick={() => setLetterhead(key)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      letterhead === key 
                        ? 'border-teal-500 bg-teal-500/10' 
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span className={`text-sm font-semibold bg-gradient-to-r ${lh.color} bg-clip-text text-transparent`}>
                      {lh.name}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Recipient */}
            <section className="bg-slate-900 rounded-xl p-5 border border-slate-800">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Recipient (Optional)</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Title"
                    value={recipientTitle}
                    onChange={(e) => setRecipientTitle(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Address"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Subject line"
                  value={subjectLine}
                  onChange={(e) => setSubjectLine(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </section>

            {/* Signatory */}
            <section className="bg-slate-900 rounded-xl p-5 border border-slate-800">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Signatory</h2>
              <div className="space-y-2">
                {Object.entries(SIGNATORIES).map(([key, signer]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      !useCustomSignatory && selectedSignatory === key
                        ? 'bg-teal-500/10 border border-teal-500/50'
                        : 'hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <input
                      type="radio"
                      name="signatory"
                      checked={!useCustomSignatory && selectedSignatory === key}
                      onChange={() => {
                        setUseCustomSignatory(false);
                        setSelectedSignatory(key);
                        setSignatoryName(signer.name);
                        setSignatoryTitle(signer.title);
                      }}
                      className="w-4 h-4 text-teal-500 border-slate-600 focus:ring-teal-500 focus:ring-offset-slate-900"
                    />
                    <div>
                      <div className="text-sm font-medium text-white">{signer.name}</div>
                      <div className="text-xs text-slate-500">{signer.title}</div>
                    </div>
                  </label>
                ))}
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    useCustomSignatory
                      ? 'bg-teal-500/10 border border-teal-500/50'
                      : 'hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <input
                    type="radio"
                    name="signatory"
                    checked={useCustomSignatory}
                    onChange={() => {
                      setUseCustomSignatory(true);
                      setSignatoryName('');
                      setSignatoryTitle('');
                    }}
                    className="w-4 h-4 text-teal-500 border-slate-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-400">Custom signatory</span>
                </label>
                {useCustomSignatory && (
                  <div className="space-y-2 pt-2 ml-7">
                    <input
                      type="text"
                      placeholder="Name"
                      value={signatoryName}
                      onChange={(e) => setSignatoryName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                    />
                    <input
                      type="text"
                      placeholder="Title"
                      value={signatoryTitle}
                      onChange={(e) => setSignatoryTitle(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Formatting */}
            <section className="bg-slate-900 rounded-xl p-5 border border-slate-800">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Formatting</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 mb-2 block">Font</label>
                  <select
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                  >
                    {Object.entries(FONTS).map(([key, font]) => (
                      <option key={key} value={key}>{font.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-2 block">Font Size: {fontSize}pt</label>
                  <input
                    type="range"
                    min="10"
                    max="18"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-2 block">Line Spacing: {lineSpacing}</label>
                  <input
                    type="range"
                    min="1"
                    max="2"
                    step="0.1"
                    value={lineSpacing}
                    onChange={(e) => setLineSpacing(Number(e.target.value))}
                    className="w-full accent-teal-500"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Document Body & Preview */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Document Body */}
            <section className="bg-slate-900 rounded-xl p-5 border border-slate-800">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Document Body</h2>
              <textarea
                id="documentBody"
                value={documentBody}
                onChange={(e) => setDocumentBody(e.target.value)}
                className="w-full h-48 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-teal-500 resize-none"
                placeholder="Enter your document content here..."
                style={{ fontFamily: FONTS[selectedFont].family }}
              />
            </section>

            {/* Preview */}
            <section className="bg-slate-900 rounded-xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Preview</h2>
                <div className="flex gap-2">
                  <button
                    onClick={downloadPDF}
                    disabled={!allComplete}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                      allComplete
                        ? 'bg-teal-600 hover:bg-teal-500 text-white'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={downloadWord}
                    disabled={!allComplete}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                      allComplete
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    Download Word
                  </button>
                </div>
              </div>
              
              {/* A4 Preview */}
              <div className="bg-white text-gray-900 rounded-lg shadow-xl overflow-hidden" style={{ aspectRatio: '210/297' }}>
                <div 
                  ref={previewRef}
                  className="p-8 h-full flex flex-col text-xs"
                  style={{ fontFamily: FONTS[selectedFont].family }}
                >
                  {/* Letterhead */}
                  <div className="-mx-8 -mt-8 mb-4">
                    <div className="overflow-hidden" style={{ maxHeight: '80px' }}>
                      <img 
                        src={LETTERHEADS[letterhead].image} 
                        alt="Letterhead"
                        className="w-full h-auto"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  </div>

                  {recipientName && (
                    <div className="mb-3">
                      <div className="font-semibold">{recipientName}</div>
                      {recipientTitle && <div className="text-gray-600">{recipientTitle}</div>}
                      {recipientAddress && <div className="text-gray-600">{recipientAddress}</div>}
                    </div>
                  )}

                  {subjectLine && (
                    <div className="mb-3 font-semibold">Re: {subjectLine}</div>
                  )}

                  <div 
                    className="whitespace-pre-wrap flex-grow"
                    style={{ fontSize: `${fontSize * 0.6}px`, lineHeight: lineSpacing }}
                  >
                    {getPreviewText()}
                  </div>

                  {signatoryName && !getPreviewText().includes(signatoryName) && (
                    <div className="mt-4">
                      <div className="mb-2">Sincerely,</div>
                      <div className="font-semibold">{signatoryName}</div>
                      {signatoryTitle && <div className="text-gray-600">{signatoryTitle}</div>}
                    </div>
                  )}

                  <div className="flex-grow"></div>

                  {/* Footer */}
                  <div className="-mx-8 -mb-8 mt-auto">
                    <div className="overflow-hidden" style={{ maxHeight: '50px' }}>
                      <img 
                        src={LETTERHEADS[letterhead].image} 
                        alt="Footer"
                        className="w-full h-auto"
                        style={{ marginTop: '-87%', clipPath: 'inset(87% 0 0 0)' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-xl p-6 max-w-lg w-full border border-slate-800 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">How to Use</h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6 text-sm">
                <div>
                  <h3 className="font-semibold text-teal-400 mb-2">1. Select a Letterhead</h3>
                  <p className="text-slate-400">Choose between Fountain TRT (teal) or Fountain HRT (pink) letterhead templates.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-teal-400 mb-2">2. Add Recipient Details (Optional)</h3>
                  <p className="text-slate-400">Enter the recipient's name, title, address, and subject line if needed.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-teal-400 mb-2">3. Select a Signatory</h3>
                  <p className="text-slate-400">Choose from predefined signatories (Lindsay Burden, Tzvi Doron, or Doron Stember) or enter a custom signatory.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-teal-400 mb-2">4. Adjust Formatting</h3>
                  <p className="text-slate-400">Customize the font family, size, and line spacing to match your preferences.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-teal-400 mb-2">5. Write Your Document</h3>
                  <p className="text-slate-400">Enter your document content in the text area. The preview will update in real-time.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-teal-400 mb-2">6. Download</h3>
                  <p className="text-slate-400">Once you've filled in the required fields (signatory and document body), click "Download PDF" or "Download Word" to export your document.</p>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h3 className="font-semibold text-slate-300 mb-2">Tips</h3>
                  <ul className="text-slate-400 space-y-1 list-disc list-inside">
                    <li>The signatory will automatically appear at the end of your document</li>
                    <li>The letterhead header and footer are included in exports</li>
                    <li>Use the preview to check formatting before downloading</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <button
              onClick={() => setShowPreview(false)}
              className="mb-4 text-white"
            >
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
