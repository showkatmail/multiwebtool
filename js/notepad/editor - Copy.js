// Notepad Editor Functions with Enhanced Features
function initializeEditor() {
    const editor = document.getElementById('editor');
    
    // Note Management
    loadNotesFromLocal();
    renderNoteSelector();
    
    // Initialize enhanced features
    initializeAutoSave();
    initializeVersionHistory();
    initializeTextStatistics();
    initializeSpellCheck();
    initializeExportOptions();
    initializeTemplates();
    initializeFindReplace();
    
    // Event Listeners
    document.getElementById('new-note-btn').addEventListener('click', createNewNote);
    document.getElementById('delete-note-btn').addEventListener('click', deleteCurrentNote);
    document.getElementById('note-selector').addEventListener('change', switchNote);

    // Editor Toolbar
    const editorButtons = document.querySelectorAll('.editor-btn');
    editorButtons.forEach(button => {
        button.addEventListener('mousedown', (e) => {
            e.preventDefault(); 
            const command = button.getAttribute('data-command');
            
            if (command === 'createLink') {
                const url = prompt('Enter URL:');
                if (url) {
                    document.execCommand(command, false, url);
                }
            } else if (command === 'insertImage') {
                const url = prompt('Enter image URL:');
                if (url) {
                    document.execCommand(command, false, url);
                }
            } else if (command === 'insertTable') {
                insertTable();
            } else {
                document.execCommand(command, false, null);
            }
        });
    });

    const fontSizeSelect = document.getElementById('font-size');
    const fontFamilySelect = document.getElementById('font-family');
    const textColorInput = document.getElementById('text-color');
    const bgColorInput = document.getElementById('bg-color');

    fontSizeSelect.addEventListener('change', () => {
        document.execCommand('fontSize', false, fontSizeSelect.value);
        editor.focus();
    });
    
    fontFamilySelect.addEventListener('change', () => {
        document.execCommand('fontName', false, fontFamilySelect.value);
        editor.focus();
    });

    textColorInput.addEventListener('input', () => {
        document.execCommand('foreColor', false, textColorInput.value);
    });

    bgColorInput.addEventListener('input', () => {
        document.execCommand('hiliteColor', false, bgColorInput.value);
    });

    // Editor Actions
    document.getElementById('clear-editor').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the content of this note?')) {
            saveToHistory(); // Save before clearing
            editor.innerHTML = '';
            updateCurrentNoteContent();
        }
    });

    document.getElementById('word-count').addEventListener('click', () => {
        updateWordCount();
        document.getElementById('word-count-modal').classList.remove('hidden');
    });

    document.getElementById('close-word-count').addEventListener('click', () => {
        document.getElementById('word-count-modal').classList.add('hidden');
    });
    
    document.getElementById('export-html').addEventListener('click', () => {
        const htmlContent = editor.innerHTML;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        downloadBlob(blob, `note-${currentNoteId}.html`);
        showNotification('HTML exported successfully', 'success');
    });
    
    document.getElementById('save-local').addEventListener('click', saveCurrentWork);

    document.getElementById('download-text').addEventListener('click', () => {
        const content = editor.innerText;
        const blob = new Blob([content], { type: 'text/plain' });
        downloadBlob(blob, `note-${currentNoteId}.txt`);
        showNotification('File downloaded successfully', 'success');
    });

    // Auto-save with debounce
    let autoSaveTimeout;
    editor.addEventListener('input', () => {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            updateCurrentNoteContent();
            updateLiveStatistics();
        }, 500);
    });

    // Keyboard shortcuts for editor
    editor.addEventListener('keydown', handleEditorShortcuts);
    
    // Paste handling - clean up pasted content
    editor.addEventListener('paste', handlePaste);
    
    // Initialize live statistics
    updateLiveStatistics();
}

// Enhanced Word Count with more statistics
function updateWordCount() {
    const text = document.getElementById('editor').innerText;
    const words = text.trim() ? text.trim().split(/\s+/) : [];
    const characters = text.length;
    const charactersNoSpace = text.replace(/\s/g, '').length;
    const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).filter(p => p.length > 0) : [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const lines = text.split('\n').length;
    
    // Calculate reading time (average 200 words per minute)
    const readingTime = Math.ceil(words.length / 200);
    
    // Calculate average word length
    const avgWordLength = words.length > 0 
        ? (words.reduce((sum, word) => sum + word.length, 0) / words.length).toFixed(1) 
        : 0;
    
    document.getElementById('word-count-value').textContent = words.length;
    document.getElementById('char-count-value').textContent = characters;
    document.getElementById('char-no-space-count-value').textContent = charactersNoSpace;
    document.getElementById('paragraph-count-value').textContent = paragraphs.length;
    document.getElementById('sentence-count-value').textContent = sentences.length;
    document.getElementById('line-count-value').textContent = lines;
    document.getElementById('reading-time-value').textContent = `${readingTime} min`;
    document.getElementById('avg-word-length-value').textContent = avgWordLength;
}

// Live statistics in status bar
function updateLiveStatistics() {
    const editor = document.getElementById('editor');
    const statusBar = document.getElementById('editor-status-bar');
    
    if (!statusBar) return;
    
    const text = editor.innerText;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    
    statusBar.textContent = `Words: ${words} | Characters: ${characters}`;
}

// Auto-save feature
function initializeAutoSave() {
    const autoSaveInterval = 30000; // 30 seconds
    
    setInterval(() => {
        if (currentNoteId) {
            const currentNote = notes.find(note => note.id === currentNoteId);
            if (currentNote) {
                const editor = document.getElementById('editor');
                if (editor.innerHTML !== currentNote.content) {
                    updateCurrentNoteContent();
                    showNotification('Auto-saved', 'info');
                }
            }
        }
    }, autoSaveInterval);
}

// Version History
let noteVersions = {};

function initializeVersionHistory() {
    const savedVersions = localStorage.getItem('note-versions');
    if (savedVersions) {
        try {
            noteVersions = JSON.parse(savedVersions);
        } catch (e) {
            noteVersions = {};
        }
    }
}

function saveToHistory() {
    if (!currentNoteId) return;
    
    const editor = document.getElementById('editor');
    const content = editor.innerHTML;
    
    if (!noteVersions[currentNoteId]) {
        noteVersions[currentNoteId] = [];
    }
    
    noteVersions[currentNoteId].push({
        content: content,
        timestamp: Date.now(),
        preview: editor.innerText.substring(0, 100)
    });
    
    // Keep only last 20 versions
    if (noteVersions[currentNoteId].length > 20) {
        noteVersions[currentNoteId].shift();
    }
    
    localStorage.setItem('note-versions', JSON.stringify(noteVersions));
}

function showVersionHistory() {
    if (!currentNoteId || !noteVersions[currentNoteId]) {
        showNotification('No version history available', 'info');
        return;
    }
    
    const versions = noteVersions[currentNoteId];
    const modal = document.getElementById('version-history-modal');
    const list = document.getElementById('version-list');
    
    list.innerHTML = '';
    
    versions.reverse().forEach((version, index) => {
        const item = document.createElement('div');
        item.className = 'p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer';
        
        const date = new Date(version.timestamp);
        item.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <p class="text-sm font-medium">${date.toLocaleString()}</p>
                    <p class="text-xs text-gray-500 mt-1">${version.preview}...</p>
                </div>
                <button class="ml-2 px-2 py-1 bg-indigo-600 text-white text-xs rounded" onclick="restoreVersion(${versions.length - 1 - index})">
                    Restore
                </button>
            </div>
        `;
        
        list.appendChild(item);
    });
    
    modal.classList.remove('hidden');
}

function restoreVersion(index) {
    if (!currentNoteId || !noteVersions[currentNoteId]) return;
    
    const version = noteVersions[currentNoteId][index];
    document.getElementById('editor').innerHTML = version.content;
    updateCurrentNoteContent();
    document.getElementById('version-history-modal').classList.add('hidden');
    showNotification('Version restored', 'success');
}

// Text Statistics
function initializeTextStatistics() {
    // Already implemented in updateWordCount
}

// Spell Check (Basic implementation)
function initializeSpellCheck() {
    const editor = document.getElementById('editor');
    editor.setAttribute('spellcheck', 'true');
}

// Enhanced Export Options
function initializeExportOptions() {
    // Export as PDF
    const exportPdfBtn = document.createElement('button');
    exportPdfBtn.id = 'export-pdf';
    exportPdfBtn.className = 'px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors';
    exportPdfBtn.innerHTML = '<i class="fas fa-file-pdf mr-2"></i>Export PDF';
    exportPdfBtn.addEventListener('click', exportAsPDF);
    
    // Export as Markdown
    const exportMdBtn = document.createElement('button');
    exportMdBtn.id = 'export-markdown';
    exportMdBtn.className = 'px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors';
    exportMdBtn.innerHTML = '<i class="fas fa-markdown mr-2"></i>Export MD';
    exportMdBtn.addEventListener('click', exportAsMarkdown);
}

function exportAsPDF() {
    const editor = document.getElementById('editor');
    const currentNote = notes.find(note => note.id === currentNoteId);
    
    if (typeof window.jspdf === 'undefined') {
        showNotification('PDF library not loaded', 'error');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    // Add title
    pdf.setFontSize(16);
    pdf.text(currentNote.name, 20, 20);
    
    // Add content
    pdf.setFontSize(12);
    const text = editor.innerText;
    const lines = pdf.splitTextToSize(text, 170);
    pdf.text(lines, 20, 35);
    
    pdf.save(`${currentNote.name}.pdf`);
    showNotification('PDF exported successfully', 'success');
}

function exportAsMarkdown() {
    const editor = document.getElementById('editor');
    const currentNote = notes.find(note => note.id === currentNoteId);
    
    // Basic HTML to Markdown conversion
    let markdown = editor.innerHTML;
    
    // Convert headers
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    
    // Convert bold and italic
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    
    // Convert links
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    
    // Convert line breaks
    markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
    markdown = markdown.replace(/<\/p>/gi, '\n\n');
    
    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]+>/g, '');
    
    // Decode HTML entities
    const temp = document.createElement('textarea');
    temp.innerHTML = markdown;
    markdown = temp.value;
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    downloadBlob(blob, `${currentNote.name}.md`);
    showNotification('Markdown exported successfully', 'success');
}

// Templates
const noteTemplates = {
    blank: '',
    meeting: `<h2>Meeting Notes</h2>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Attendees:</strong> </p>
<p><strong>Agenda:</strong></p>
<ul>
    <li></li>
</ul>
<p><strong>Discussion:</strong></p>
<p></p>
<p><strong>Action Items:</strong></p>
<ul>
    <li></li>
</ul>`,
    todo: `<h2>To-Do List</h2>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<ul>
    <li>☐ Task 1</li>
    <li>☐ Task 2</li>
    <li>☐ Task 3</li>
</ul>`,
    journal: `<h2>Journal Entry</h2>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Mood:</strong> </p>
<p><strong>Today's Thoughts:</strong></p>
<p></p>
<p><strong>Goals for Tomorrow:</strong></p>
<ul>
    <li></li>
</ul>`,
    article: `<h1>Article Title</h1>
<p><strong>Author:</strong> </p>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<hr>
<h2>Introduction</h2>
<p></p>
<h2>Main Content</h2>
<p></p>
<h2>Conclusion</h2>
<p></p>`
};

function initializeTemplates() {
    // Template functionality will be added to UI
}

function applyTemplate(templateName) {
    const editor = document.getElementById('editor');
    if (noteTemplates[templateName]) {
        editor.innerHTML = noteTemplates[templateName];
        updateCurrentNoteContent();
        showNotification('Template applied', 'success');
    }
}

// Find and Replace
function initializeFindReplace() {
    // Will be triggered by keyboard shortcut Ctrl+F
}

function showFindReplace() {
    const modal = document.getElementById('find-replace-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('find-input').focus();
    }
}

function findText() {
    const findInput = document.getElementById('find-input').value;
    if (!findInput) return;
    
    const editor = document.getElementById('editor');
    const content = editor.innerHTML;
    const regex = new RegExp(findInput, 'gi');
    
    const highlighted = content.replace(regex, match => 
        `<span style="background-color: yellow;">${match}</span>`
    );
    
    editor.innerHTML = highlighted;
}

function replaceText() {
    const findInput = document.getElementById('find-input').value;
    const replaceInput = document.getElementById('replace-input').value;
    
    if (!findInput) return;
    
    const editor = document.getElementById('editor');
    const content = editor.innerText;
    const regex = new RegExp(findInput, 'g');
    
    const replaced = content.replace(regex, replaceInput);
    editor.innerText = replaced;
    updateCurrentNoteContent();
    
    showNotification('Text replaced', 'success');
}

// Insert Table
function insertTable() {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    
    if (!rows || !cols) return;
    
    let table = '<table border="1" style="border-collapse: collapse; width: 100%;">';
    
    for (let i = 0; i < parseInt(rows); i++) {
        table += '<tr>';
        for (let j = 0; j < parseInt(cols); j++) {
            table += '<td style="padding: 8px; border: 1px solid #ddd;">Cell</td>';
        }
        table += '</tr>';
    }
    
    table += '</table><br>';
    
    document.execCommand('insertHTML', false, table);
}

// Handle keyboard shortcuts
function handleEditorShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
            case 'f':
                e.preventDefault();
                showFindReplace();
                break;
            case 'h':
                e.preventDefault();
                showVersionHistory();
                break;
            case 'p':
                e.preventDefault();
                exportAsPDF();
                break;
        }
    }
}

// Handle paste - clean formatting
function handlePaste(e) {
    e.preventDefault();
    
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
}

// Word suggestion (basic autocomplete)
const commonWords = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it'];

function showWordSuggestions(partial) {
    const suggestions = commonWords.filter(word => 
        word.startsWith(partial.toLowerCase())
    );
    
    // Display suggestions in a dropdown (implementation needed in UI)
    return suggestions;
}

// Text formatting presets
function applyTextStyle(style) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    
    switch(style) {
        case 'highlight':
            span.style.backgroundColor = '#ffeb3b';
            break;
        case 'code':
            span.style.fontFamily = 'monospace';
            span.style.backgroundColor = '#f5f5f5';
            span.style.padding = '2px 4px';
            break;
        case 'quote':
            span.style.borderLeft = '4px solid #ddd';
            span.style.paddingLeft = '10px';
            span.style.fontStyle = 'italic';
            break;
    }
    
    range.surroundContents(span);
}

// Character count warning
function checkCharacterLimit() {
    const editor = document.getElementById('editor');
    const charCount = editor.innerText.length;
    const limit = 50000; // 50k character limit
    
    if (charCount > limit * 0.9) {
        showNotification(`Warning: Approaching character limit (${charCount}/${limit})`, 'info');
    }
}