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
  Fountain: {
    file: '/Letterheads/Fountain Letterhead HRT (1).docx',
    name: 'Fountain',
    displayName: 'Fountain Letterhead',
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
  const [documentType, setDocumentType] = useState('');
  const [letterhead, setLetterhead] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientTitle, setRecipientTitle] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const [documentBody, setDocumentBody] = useState('');
  const [selectedSigner, setSelectedSigner] = useState('');
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryTitle, setSignatoryTitle] = useState('');
  const [signatureType, setSignatureType] = useState('Decent Standlee');
  const [fontSize, setFontSize] = useState(14);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [fontFamily, setFontFamily] = useState("'Libre Baskerville', serif");
  const [showPreview, setShowPreview] = useState(false);
  
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);

  // Update document body when template changes
  useEffect(() => {
    if (documentType && TEMPLATES[documentType]) {
      setDocumentBody(TEMPLATES[documentType]);
    } else if (!documentType) {
      setDocumentBody('');
    }
  }, [documentType]);

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
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${documentType.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('PDF generation failed. Please try again.');
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
    link.download = `${documentType.replace(/\s+/g, '_')}.doc`;
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-coral-500 to-orange-400 bg-clip-text text-transparent mb-2">
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
                  className={`p-3 rounded-lg border-2 transition-all ${
                    letterhead === type 
                      ? 'border-coral-500 bg-coral-500/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-xs font-medium">{LETTERHEADS[type].displayName || type}</div>
                  <div className="text-[10px] text-gray-400 mt-1">.docx</div>
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
                  className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-all"
                />
                <input
                  type="text"
                  placeholder="Title"
                  value={recipientTitle}
                  onChange={(e) => setRecipientTitle(e.target.value)}
                  className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-all"
                />
              </div>
              <input
                type="text"
                placeholder="Address (123 Example Ave, City, State 12345)"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-all"
              />
              <input
                type="text"
                placeholder="Subject Line (optional)"
                value={subjectLine}
                onChange={(e) => setSubjectLine(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-all"
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
              <div className="pt-3 border-t border-gray-700">
                <label className="block text-sm text-gray-400 mb-2">Select Signer</label>
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
              <div className="space-y-3 pt-3 border-t border-gray-700">
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
                <label className="block text-sm text-gray-400 mb-2">Font Family</label>
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
                  <span className="text-sm text-gray-400">Font Size: {fontSize}pt</span>
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
                  <span className="text-sm text-gray-400">Line Spacing: {lineSpacing}</span>
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
            className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 shadow-2xl"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              DOCUMENT BODY
            </h2>
            
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 mb-3 p-3 bg-[#1a1a1a] rounded-lg border border-gray-700">
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
              className="w-full h-64 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-all font-mono text-sm resize-none"
              placeholder="Enter your document text here, or click Import to upload a .txt or .docx file..."
            />
            
            <p className="text-xs text-gray-500 mt-2">
              💡 Use placeholders like {`{{Recipient_Name}}`} for dynamic content, or import a .txt or .docx file
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
            documentType={documentType}
            previewText={getPreviewText()}
            fontSize={fontSize}
            lineSpacing={lineSpacing}
            fontFamily={fontFamily}
            signatoryName={signatoryName}
            signatoryTitle={signatoryTitle}
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
                documentType={documentType}
                previewText={getPreviewText()}
                fontSize={fontSize}
                lineSpacing={lineSpacing}
                fontFamily={fontFamily}
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
              <span className="text-sm font-medium text-coral-500">{Math.round(completionPercentage)}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
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
                  ? 'bg-gradient-to-r from-coral-500 to-orange-500 hover:shadow-lg hover:shadow-coral-500/50'
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
  documentType,
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
      <div className="bg-white text-gray-900 rounded-lg shadow-2xl" style={{ overflow: 'hidden' }}>
        <div 
          ref={ref}
          className="px-12 pt-20 pb-12 min-h-[29.7cm] relative"
          style={{
            fontFamily: fontFamily || "'Libre Baskerville', serif",
            paddingTop: '5rem',
            marginTop: '0'
          }}
        >
          {/* Letterhead */}
          {letterhead && (
            <div className="mb-8 pb-6 border-b-2 border-gray-300" style={{ minHeight: '120px', paddingTop: '1rem', marginTop: '0' }}>
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-1">
                  <h1 
                    className="text-4xl font-bold leading-tight mb-2"
                    style={{
                      background: letterhead.color === 'from-blue-500 to-cyan-400' 
                        ? 'linear-gradient(to right, #3b82f6, #22d3ee)'
                        : letterhead.color === 'from-teal-500 to-emerald-400'
                        ? 'linear-gradient(to right, #14b8a6, #34d399)'
                        : 'linear-gradient(to right, #6b7280, #9ca3af)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      color: letterhead.color === 'from-blue-500 to-cyan-400' 
                        ? '#3b82f6'
                        : letterhead.color === 'from-teal-500 to-emerald-400'
                        ? '#14b8a6'
                        : '#6b7280',
                      display: 'inline-block',
                      wordBreak: 'break-word',
                      lineHeight: '1.1'
                    }}
                  >
                    {letterhead.displayName || letterhead.name || 'Letterhead'}
                  </h1>
                  {letterhead.file && (
                    <div className="text-xs text-gray-500 mt-2">
                      Source: {letterhead.file.split('/').pop()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Date */}
          <div className="text-right mb-6 text-sm text-gray-600">
            {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
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
            className="whitespace-pre-wrap mb-8"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineSpacing
            }}
          >
            {previewText}
          </div>

          {/* Signature Section */}
          {(signatoryName || signatoryTitle) && (
            <div className="mt-8 pt-6 border-t border-gray-300">
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
        </div>
      </div>
    </motion.div>
  );
});

DocumentPreview.displayName = 'DocumentPreview';

