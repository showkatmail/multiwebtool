// Global variables
let currentImageData = null;
let originalImageData = null;
let selectedMergeImages = [];
let mergedImageData = null;
let currentTool = null;
let imageHistory = [];
let historyIndex = -1;
let zoomLevel = 1;
let recentFiles = [];
let batchImages = [];
let activeFilters = [];
let currentTheme = 'light';
let cropper = null; // Add cropper variable

// Notepad-specific global variables
let notes = [];
let currentNoteId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeTabs();
    initializeEditor();
    initializeImageTools();
    initializeSettings();
    loadRecentFiles();
    initializeKeyboardShortcuts();
    updateStorageInfo();
});

// Theme Management
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    themeToggle.addEventListener('click', toggleTheme);
    darkModeToggle.addEventListener('change', toggleTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    
    const html = document.documentElement;
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    if (theme === 'dark') {
        html.classList.add('dark');
        if (darkModeToggle) darkModeToggle.checked = true;
    } else {
        html.classList.remove('dark');
        if (darkModeToggle) darkModeToggle.checked = false;
    }
}

function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        setTheme('light');
    } else {
        setTheme('dark');
    }
}

// Keyboard Shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleHelpModal();
            return;
        }
        
        if (e.ctrlKey || e.metaKey) {
            const activeTabPanel = document.querySelector('.tab-panel:not(.hidden)');
            if (!activeTabPanel) return;
            
            switch(e.key) {
                case 'd':
                    e.preventDefault();
                    toggleTheme();
                    break;
                case 's':
                    e.preventDefault();
                    saveCurrentWork();
                    break;
                case '+':
                case '=':
                    if (activeTabPanel.id === 'image-tools-tab') {
                        e.preventDefault();
                        if (currentImageData) zoomImage(1.2);
                    }
                    break;
                case '-':
                     if (activeTabPanel.id === 'image-tools-tab') {
                        e.preventDefault();
                        if (currentImageData) zoomImage(0.8);
                    }
                    break;
                case '0':
                     if (activeTabPanel.id === 'image-tools-tab') {
                        e.preventDefault();
                        if (currentImageData) resetZoom();
                    }
                    break;
                case 'r':
                     if (activeTabPanel.id === 'image-tools-tab') {
                        e.preventDefault();
                        if (currentImageData) resetImage();
                    }
                    break;
            }
        }
    });
}

function toggleHelpModal() {
    const helpModal = document.getElementById('help-modal');
    if(helpModal) helpModal.classList.toggle('hidden');
}

function saveCurrentWork() {
    const activeTab = document.querySelector('.tab-btn.border-indigo-600, .tab-btn.dark\\:border-indigo-400');
    if (!activeTab) return;
    
    const tabName = activeTab.getAttribute('data-tab');
    
    if (tabName === 'notepad') {
        saveNotesToLocal();
        showNotification('All notes have been saved.', 'success');
    } else if (tabName === 'image-tools' && currentImageData) {
        addToRecentFiles(currentImageData);
        showNotification('Image saved to recent files', 'success');
    } else if (tabName === 'qr-generator') {
        // QR codes are generated on-demand, no need to save
        showNotification('QR codes are generated on-demand', 'info');
    }
}

// Tab Management
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    // First, hide all panels
    tabPanels.forEach(panel => {
        panel.classList.add('hidden');
    });
    
    // Set all tabs to inactive state
    tabButtons.forEach(btn => {
        btn.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'border-b-2', 'border-indigo-600', 'dark:border-indigo-400');
        btn.classList.add('text-gray-600', 'dark:text-gray-400');
    });
    
    // Now specifically activate the Image Tools tab
    const imageToolsTab = document.querySelector('.tab-btn[data-tab="image-tools"]');
    const imageToolsPanel = document.getElementById('image-tools-tab');
    
    if (imageToolsTab && imageToolsPanel) {
        // Activate the tab button
        imageToolsTab.classList.remove('text-gray-600', 'dark:text-gray-400');
        imageToolsTab.classList.add('text-indigo-600', 'dark:text-indigo-400', 'border-b-2', 'border-indigo-600', 'dark:border-indigo-400');
        
        // Show the panel
        imageToolsPanel.classList.remove('hidden');
    }
    
    // Add click event listeners to all tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Update button styles
            tabButtons.forEach(btn => {
                btn.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'border-b-2', 'border-indigo-600', 'dark:border-indigo-400');
                btn.classList.add('text-gray-600', 'dark:text-gray-400');
            });
            
            // Activate clicked button
            button.classList.remove('text-gray-600', 'dark:text-gray-400');
            button.classList.add('text-indigo-600', 'dark:text-indigo-400', 'border-b-2', 'border-indigo-600', 'dark:border-indigo-400');
            
            // Update panel visibility
            tabPanels.forEach(panel => {
                panel.classList.add('hidden');
            });
            
            const targetPanel = document.getElementById(`${targetTab}-tab`);
            if (targetPanel) {
                targetPanel.classList.remove('hidden');
                
                // Initialize QR generator if QR tab is selected
                if (targetTab === 'qr-generator') {
                    initializeQRCodeGenerator();
                }
            }
        });
    });
}

// --- Notepad Functions ---

function initializeEditor() {
    const editor = document.getElementById('editor');
    
    // Note Management
    loadNotesFromLocal();
    renderNoteSelector();
    
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
            editor.innerHTML = '';
            updateCurrentNoteContent(); // Save the cleared content
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

    // Auto-save on input
    editor.addEventListener('input', updateCurrentNoteContent);
}

function loadNotesFromLocal() {
    const savedNotes = localStorage.getItem('multi-tool-notes');
    if (savedNotes) {
        try {
            notes = JSON.parse(savedNotes);
        } catch (e) {
            notes = [];
        }
    }

    if (!notes || notes.length === 0) {
        const firstNote = {
            id: Date.now(),
            name: 'My First Note',
            content: 'Welcome to your new notepad! Create more notes using the "New" button.'
        };
        notes = [firstNote];
        saveNotesToLocal();
    }
    
    const lastActiveNoteId = parseInt(localStorage.getItem('last-active-note-id'));
    const lastActiveNote = notes.find(note => note.id === lastActiveNoteId);

    if (lastActiveNote) {
        currentNoteId = lastActiveNote.id;
    } else if (notes.length > 0) {
        currentNoteId = notes[0].id;
    }

    const currentNote = notes.find(note => note.id === currentNoteId);
    if (currentNote) {
        document.getElementById('editor').innerHTML = currentNote.content;
    }
}

function saveNotesToLocal() {
    localStorage.setItem('multi-tool-notes', JSON.stringify(notes));
    updateStorageInfo();
}

function updateCurrentNoteContent() {
    const currentNote = notes.find(note => note.id === currentNoteId);
    if (currentNote) {
        currentNote.content = document.getElementById('editor').innerHTML;
        saveNotesToLocal();
    }
}

function renderNoteSelector() {
    const noteSelector = document.getElementById('note-selector');
    noteSelector.innerHTML = '';
    notes.forEach(note => {
        const option = document.createElement('option');
        option.value = note.id;
        option.textContent = note.name;
        if (note.id === currentNoteId) {
            option.selected = true;
        }
        noteSelector.appendChild(option);
    });
}

function switchNote() {
    const selectedId = parseInt(document.getElementById('note-selector').value);
    const newNote = notes.find(note => note.id === selectedId);
    if (newNote) {
        currentNoteId = selectedId;
        document.getElementById('editor').innerHTML = newNote.content;
        localStorage.setItem('last-active-note-id', currentNoteId);
    }
}

function createNewNote() {
    const noteName = prompt('Enter a name for your new note:', `Note ${notes.length + 1}`);
    if (noteName && noteName.trim() !== '') {
        const newNote = {
            id: Date.now(),
            name: noteName.trim(),
            content: ''
        };
        notes.push(newNote);
        currentNoteId = newNote.id;
        localStorage.setItem('last-active-note-id', currentNoteId);
        document.getElementById('editor').innerHTML = '';
        renderNoteSelector();
        saveNotesToLocal();
    }
}

function deleteCurrentNote() {
    if (notes.length <= 1) {
        showNotification('Cannot delete the last note.', 'error');
        return;
    }

    const currentNote = notes.find(note => note.id === currentNoteId);
    if (confirm(`Are you sure you want to delete "${currentNote.name}"? This action cannot be undone.`)) {
        notes = notes.filter(note => note.id !== currentNoteId);
        currentNoteId = notes[0].id; // Switch to the first note
        localStorage.setItem('last-active-note-id', currentNoteId);
        switchNote();
        renderNoteSelector();
        saveNotesToLocal();
        showNotification('Note deleted successfully', 'info');
    }
}

function updateWordCount() {
    const text = document.getElementById('editor').innerText;
    const words = text.trim() ? text.trim().split(/\s+/) : [];
    const characters = text.length;
    const charactersNoSpace = text.replace(/\s/g, '').length;
    const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).filter(p => p.length > 0) : [];
    
    document.getElementById('word-count-value').textContent = words.length;
    document.getElementById('char-count-value').textContent = characters;
    document.getElementById('char-no-space-count-value').textContent = charactersNoSpace;
    document.getElementById('paragraph-count-value').textContent = paragraphs.length;
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none'; // Hide the link
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// --- Image Tool Functions ---

// Image Tools Initialization
function initializeImageTools() {
    // Image upload
    const imageUpload = document.getElementById('image-upload');
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
    
    // Tool buttons
    const toolButtons = document.querySelectorAll('.image-tool-btn');
    toolButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tool = button.id.replace('-tool', '');
            selectTool(tool);
        });
    });
    
    // Zoom controls
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomFitBtn = document.getElementById('zoom-fit');
    const resetImageBtn = document.getElementById('reset-image');
    const clearScreenBtn = document.getElementById('clear-screen');
    
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => zoomImage(1.2));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => zoomImage(0.8));
    if (zoomFitBtn) zoomFitBtn.addEventListener('click', resetZoom);
    if (resetImageBtn) resetImageBtn.addEventListener('click', resetImage);
    if (clearScreenBtn) clearScreenBtn.addEventListener('click', clearScreen);
    
    // Drag and drop
    setupDragAndDrop();
}

// Handle image upload
function handleImageUpload(e) {
    const files = e.target.files;
    if (files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                currentImageData = {
                    url: event.target.result,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    width: img.width,
                    height: img.height
                };
                
                originalImageData = {...currentImageData};
                displayImage(currentImageData.url);
                addToRecentFiles(currentImageData);
                resetImageHistory();
                
                // Show both buttons when image is loaded
                document.getElementById('reset-image').classList.remove('hidden');
                const clearScreenBtn = document.getElementById('clear-screen');
                if (clearScreenBtn) {
                    clearScreenBtn.classList.remove('hidden');
                }
                
                // Update upload prompt
                document.getElementById('upload-prompt').textContent = file.name;
            };
            img.src = event.target.result;
        };
        
        reader.readAsDataURL(file);
    }
}

// Display image in preview
function displayImage(imageUrl) {
    const container = document.getElementById('image-preview-container');
    container.innerHTML = '';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.id = 'preview-image';
    img.className = 'max-w-full max-h-full';
    img.style.transform = `scale(${zoomLevel})`;
    
    container.appendChild(img);
    
    // If crop tool is active, initialize cropper
    if (currentTool === 'crop') {
        setTimeout(() => {
            initializeCropper();
        }, 100);
    }
}

// Select a tool
function selectTool(tool) {
    currentTool = tool;
    
    // Update UI
    document.querySelectorAll('.image-tool-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-100', 'dark:bg-gray-600');
    });
    
    document.getElementById(`${tool}-tool`).classList.add('bg-indigo-100', 'dark:bg-gray-600');
    
    // Destroy cropper if it exists and we're switching away from crop tool
    if (tool !== 'crop' && cropper) {
        cropper.destroy();
        cropper = null;
    }
    
    // Show tool-specific controls
    showToolControls(tool);
}

// Show tool-specific controls
function showToolControls(tool) {
    const controlsContainer = document.getElementById('tool-controls');
    controlsContainer.innerHTML = '';
    
    switch(tool) {
        case 'thumbnail':
            showThumbnailControls(controlsContainer);
            break;
        case 'resize':
            showResizeControls(controlsContainer);
            break;
        case 'compress':
            showCompressControls(controlsContainer);
            break;
        case 'convert':
            showConvertControls(controlsContainer);
            break;
        case 'crop':
            showCropControls(controlsContainer);
            break;
        case 'watermark':
            showWatermarkControls(controlsContainer);
            break;
        case 'filter':
            showFilterControls(controlsContainer);
            break;
        case 'metadata':
            showMetadataControls(controlsContainer);
            break;
        case 'merge':
            showMergeControls(controlsContainer);
            break;
        case 'batch':
            showBatchControls(controlsContainer);
            break;
        // Add other tool controls as needed
        default:
            controlsContainer.innerHTML = '<p class="text-gray-500">Select an image and adjust settings for this tool.</p>';
    }
}

// Show crop controls
function showCropControls(container) {
    container.innerHTML = `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-medium mb-4">Crop Image</h3>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Aspect Ratio</label>
                <select id="crop-aspect-ratio" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800">
                    <option value="free">Free</option>
                    <option value="1.77">16:9</option>
                    <option value="1.33">4:3</option>
                    <option value="1">1:1</option>
                    <option value="0.75">3:4</option>
                    <option value="0.56">9:16</option>
                </select>
            </div>
            <div class="mb-4">
                <label class="flex items-center">
                    <input type="checkbox" id="crop-guide" class="mr-2" checked>
                    <span>Show Guides</span>
                </label>
            </div>
            <div class="flex space-x-2">
                <button id="cancel-crop" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                    Cancel
                </button>
                <button id="download-cropped" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                    Crop & Download
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('crop-aspect-ratio').addEventListener('change', updateCropAspectRatio);
    document.getElementById('crop-guide').addEventListener('change', toggleCropGuides);
    document.getElementById('cancel-crop').addEventListener('click', cancelCrop);
    document.getElementById('download-cropped').addEventListener('click', downloadCroppedImage);
    
    // Initialize cropper
    initializeCropper();
}

// Initialize cropper
function initializeCropper() {
    if (!currentImageData) return;
    
    const image = document.getElementById('preview-image');
    if (!image) return;
    
    // Destroy existing cropper if it exists
    if (cropper) {
        cropper.destroy();
    }
    
    // Create new cropper
    cropper = new Cropper(image, {
        aspectRatio: NaN,
        viewMode: 1,
        guides: true,
        center: true,
        highlight: true,
        background: true,
        autoCrop: true,
        autoCropArea: 0.8,
        movable: true,
        rotatable: false,
        scalable: false,
        zoomable: true,
        zoomOnTouch: true,
        zoomOnWheel: true,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
    });
}

// Update crop aspect ratio
function updateCropAspectRatio() {
    if (!cropper) return;
    
    const aspectRatio = document.getElementById('crop-aspect-ratio').value;
    cropper.setAspectRatio(aspectRatio === 'free' ? NaN : parseFloat(aspectRatio));
}

// Toggle crop guides
function toggleCropGuides() {
    if (!cropper) return;
    
    const showGuides = document.getElementById('crop-guide').checked;
    cropper.setOption('guides', showGuides);
    cropper.setOption('center', showGuides);
    cropper.setOption('highlight', showGuides);
}

// Cancel crop
function cancelCrop() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    
    // Reset to original image
    if (originalImageData) {
        currentImageData = {...originalImageData};
        displayImage(originalImageData.url);
    }
}

// Download cropped image
function downloadCroppedImage() {
    if (!cropper) return;
    
    // Get cropped canvas
    const canvas = cropper.getCroppedCanvas({
        maxWidth: 4096,
        maxHeight: 4096,
        fillColor: '#fff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });
    
    if (!canvas) {
        showNotification('Failed to crop image', 'error');
        return;
    }
    
    // Convert canvas to blob
    canvas.toBlob(function(blob) {
        if (!blob) {
            showNotification('Failed to process cropped image', 'error');
            return;
        }
        
        // Download the cropped image
        const originalName = currentImageData ? currentImageData.name : 'image';
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
        downloadBlob(blob, `cropped_${nameWithoutExt}.jpeg`);
        
        showNotification('Cropped image downloaded successfully', 'success');
    }, 'image/jpeg', 0.9);
}

// Show thumbnail generator controls
function showThumbnailControls(container) {
    container.innerHTML = `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-medium mb-4">Thumbnail Generator</h3>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Width (px)</label>
                    <input type="number" id="thumb-width" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800" value="150">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Height (px)</label>
                    <input type="number" id="thumb-height" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800" value="150">
                </div>
            </div>
            <div class="mb-4">
                <label class="flex items-center">
                    <input type="checkbox" id="maintain-thumb-aspect" class="mr-2" checked>
                    <span>Maintain aspect ratio</span>
                </label>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Quality (1-100)</label>
                <input type="range" id="thumb-quality" min="1" max="100" value="80" class="w-full">
                <div class="flex justify-between text-xs text-gray-500">
                    <span>Low Quality</span>
                    <span id="thumb-quality-value">80</span>
                    <span>High Quality</span>
                </div>
            </div>
            <div class="flex space-x-2">
                <button id="generate-thumbnail" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                    Generate Thumbnail
                </button>
                <button id="download-thumbnail" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                    Download
                </button>
            </div>
        </div>
    `;
    
    // Update quality value display
    document.getElementById('thumb-quality').addEventListener('input', function() {
        document.getElementById('thumb-quality-value').textContent = this.value;
    });
    
    // Add event listeners
    document.getElementById('maintain-thumb-aspect').addEventListener('change', function() {
        const widthInput = document.getElementById('thumb-width');
        const heightInput = document.getElementById('thumb-height');
        
        if (this.checked && currentImageData) {
            const aspectRatio = currentImageData.width / currentImageData.height;
            
            widthInput.addEventListener('input', function() {
                heightInput.value = Math.round(this.value / aspectRatio);
            });
            
            heightInput.addEventListener('input', function() {
                widthInput.value = Math.round(this.value * aspectRatio);
            });
        }
    });
    
    document.getElementById('generate-thumbnail').addEventListener('click', function() {
        const width = parseInt(document.getElementById('thumb-width').value);
        const height = parseInt(document.getElementById('thumb-height').value);
        const quality = parseInt(document.getElementById('thumb-quality').value) / 100;
        
        if (width && height && currentImageData) {
            generateThumbnail(width, height, quality);
        }
    });
    
    document.getElementById('download-thumbnail').addEventListener('click', function() {
        if (currentImageData) {
            // Re-generate thumbnail to get the blob
            const width = parseInt(document.getElementById('thumb-width').value);
            const height = parseInt(document.getElementById('thumb-height').value);
            const quality = parseInt(document.getElementById('thumb-quality').value) / 100;
            
            if (width && height && currentImageData) {
                generateThumbnailForDownload(width, height, quality);
            }
        }
    });
}

// Generate thumbnail
function generateThumbnail(width, height, quality) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = width;
        canvas.height = height;
        
        // Calculate dimensions to maintain aspect ratio
        let drawWidth = width;
        let drawHeight = height;
        const aspectRatio = img.width / img.height;
        
        if (aspectRatio > width / height) {
            drawHeight = width / aspectRatio;
        } else {
            drawWidth = height * aspectRatio;
        }
        
        // Center the image
        const x = (width - drawWidth) / 2;
        const y = (height - drawHeight) / 2;
        
        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // Draw image
        ctx.drawImage(img, x, y, drawWidth, drawHeight);
        
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            currentImageData = {
                ...currentImageData,
                url: url,
                width: width,
                height: height,
                size: blob.size
            };
            
            displayImage(url);
            addToImageHistory();
            showNotification('Thumbnail generated successfully', 'success');
        }, 'image/jpeg', quality);
    };
    
    img.src = currentImageData.url;
}

// Generate thumbnail for download (FIXED)
function generateThumbnailForDownload(width, height, quality) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = width;
        canvas.height = height;
        
        // Calculate dimensions to maintain aspect ratio
        let drawWidth = width;
        let drawHeight = height;
        const aspectRatio = img.width / img.height;
        
        if (aspectRatio > width / height) {
            drawHeight = width / aspectRatio;
        } else {
            drawWidth = height * aspectRatio;
        }
        
        // Center the image
        const x = (width - drawWidth) / 2;
        const y = (height - drawHeight) / 2;
        
        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // Draw image
        ctx.drawImage(img, x, y, drawWidth, drawHeight);
        
        canvas.toBlob(function(blob) {
            const originalName = currentImageData ? currentImageData.name : 'image';
            const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
            downloadBlob(blob, `thumbnail_${nameWithoutExt}.jpeg`);
            showNotification('Thumbnail downloaded successfully', 'success');
        }, 'image/jpeg', quality);
    };
    
    img.src = currentImageData.url;
}

// Show resize controls
function showResizeControls(container) {
    container.innerHTML = `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-medium mb-4">Resize Image</h3>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Width (px)</label>
                    <input type="number" id="resize-width" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800" value="${currentImageData ? currentImageData.width : ''}">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Height (px)</label>
                    <input type="number" id="resize-height" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800" value="${currentImageData ? currentImageData.height : ''}">
                </div>
            </div>
            <div class="mb-4">
                <label class="flex items-center">
                    <input type="checkbox" id="maintain-aspect" class="mr-2" checked>
                    <span>Maintain aspect ratio</span>
                </label>
            </div>
            <div class="flex space-x-2">
                <button id="apply-resize" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                    Apply Resize
                </button>
                <button id="download-resized" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                    Download
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('maintain-aspect').addEventListener('change', function() {
        const widthInput = document.getElementById('resize-width');
        const heightInput = document.getElementById('resize-height');
        
        if (this.checked && currentImageData) {
            const aspectRatio = currentImageData.width / currentImageData.height;
            
            widthInput.addEventListener('input', function() {
                heightInput.value = Math.round(this.value / aspectRatio);
            });
            
            heightInput.addEventListener('input', function() {
                widthInput.value = Math.round(this.value * aspectRatio);
            });
        }
    });
    
    document.getElementById('apply-resize').addEventListener('click', function() {
        const width = parseInt(document.getElementById('resize-width').value);
        const height = parseInt(document.getElementById('resize-height').value);
        
        if (width && height && currentImageData) {
            resizeImage(width, height);
        }
    });
    
    document.getElementById('download-resized').addEventListener('click', function() {
        if (currentImageData) {
            // Re-generate resized image to get the blob
            const width = parseInt(document.getElementById('resize-width').value);
            const height = parseInt(document.getElementById('resize-height').value);
            
            if (width && height && currentImageData) {
                resizeImageForDownload(width, height);
            }
        }
    });
}

// Image manipulation functions
function resizeImage(width, height) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            currentImageData = {
                ...currentImageData,
                url: url,
                width: width,
                height: height,
                size: blob.size
            };
            
            displayImage(url);
            addToImageHistory();
            showNotification('Image resized successfully', 'success');
        }, 'image/jpeg', 0.9);
    };
    
    img.src = currentImageData.url;
}

// Resize image for download
function resizeImageForDownload(width, height) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(function(blob) {
            const originalName = currentImageData ? currentImageData.name : 'image';
            const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
            downloadBlob(blob, `resized_${nameWithoutExt}.jpeg`);
            showNotification('Resized image downloaded successfully', 'success');
        }, 'image/jpeg', 0.9);
    };
    
    img.src = currentImageData.url;
}

// Show compress controls
function showCompressControls(container) {
    container.innerHTML = `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-medium mb-4">Compress Image</h3>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Quality (1-100)</label>
                <input type="range" id="compress-quality" min="1" max="100" value="80" class="w-full">
                <div class="flex justify-between text-xs text-gray-500">
                    <span>Low Quality</span>
                    <span id="quality-value">80</span>
                    <span>High Quality</span>
                </div>
            </div>
            <div class="mb-4">
                <p>Original Size: ${currentImageData ? formatFileSize(currentImageData.size) : 'N/A'}</p>
                <p>Estimated New Size: <span id="estimated-size">Calculating...</span></p>
            </div>
            <div class="flex space-x-2">
                <button id="apply-compress" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                    Apply Compression
                </button>
                <button id="download-compressed" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                    Download
                </button>
            </div>
        </div>
    `;
    
    // Update quality value display
    document.getElementById('compress-quality').addEventListener('input', function() {
        document.getElementById('quality-value').textContent = this.value;
        // Estimate new size (this is a rough estimation)
        if (currentImageData) {
            const estimatedSize = Math.round(currentImageData.size * (this.value / 100));
            document.getElementById('estimated-size').textContent = formatFileSize(estimatedSize);
        }
    });
    
    document.getElementById('apply-compress').addEventListener('click', function() {
        const quality = parseInt(document.getElementById('compress-quality').value) / 100;
        compressImage(quality);
    });
    
    document.getElementById('download-compressed').addEventListener('click', function() {
        if (currentImageData) {
            // Re-generate compressed image to get the blob
            const quality = parseInt(document.getElementById('compress-quality').value) / 100;
            compressImageForDownload(quality);
        }
    });
}

function compressImage(quality) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            currentImageData = {
                ...currentImageData,
                url: url,
                size: blob.size
            };
            
            displayImage(url);
            addToImageHistory();
            showNotification(`Image compressed to ${formatFileSize(blob.size)}`, 'success');
        }, 'image/jpeg', quality);
    };
    
    img.src = currentImageData.url;
}

// Compress image for download (FIXED)
function compressImageForDownload(quality) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(function(blob) {
            const originalName = currentImageData ? currentImageData.name : 'image';
            const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
            downloadBlob(blob, `compressed_${nameWithoutExt}.jpeg`);
            showNotification('Compressed image downloaded successfully', 'success');
        }, 'image/jpeg', quality);
    };
    
    img.src = currentImageData.url;
}

// Show convert controls
function showConvertControls(container) {
    container.innerHTML = `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-medium mb-4">Convert Image Format</h3>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Output Format</label>
                <select id="convert-format" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800">
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                    <option value="bmp">BMP</option>
                </select>
            </div>
            <button id="apply-convert" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                Convert & Download
            </button>
        </div>
    `;
    
    document.getElementById('apply-convert').addEventListener('click', function() {
        const format = document.getElementById('convert-format').value;
        convertImage(format);
    });
}

// Show watermark controls
function showWatermarkControls(container) {
    container.innerHTML = `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-medium mb-4">Add Watermark</h3>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Watermark Type</label>
                <div class="flex space-x-4">
                    <label class="flex items-center">
                        <input type="radio" name="watermark-type" value="text" checked class="mr-2">
                        <span>Text</span>
                    </label>
                    <label class="flex items-center">
                        <input type="radio" name="watermark-type" value="image" class="mr-2">
                        <span>Image</span>
                    </label>
                </div>
            </div>
            <div id="text-watermark-options" class="mb-4">
                <div class="mb-2">
                    <label class="block text-sm font-medium mb-1">Text</label>
                    <input type="text" id="watermark-text" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800" placeholder="Enter watermark text">
                </div>
                <div class="grid grid-cols-2 gap-4 mb-2">
                    <div>
                        <label class="block text-sm font-medium mb-1">Font Size</label>
                        <input type="number" id="watermark-font-size" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800" value="20">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Color</label>
                        <input type="color" id="watermark-color" class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800" value="#ffffff">
                    </div>
                </div>
                <div class="mb-2">
                    <label class="block text-sm font-medium mb-1">Position</label>
                    <select id="watermark-position" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800">
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right" selected>Bottom Right</option>
                        <option value="center">Center</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Opacity</label>
                    <input type="range" id="watermark-opacity" min="0" max="1" step="0.1" value="0.5" class="w-full">
                </div>
            </div>
            <div id="image-watermark-options" class="mb-4 hidden">
                <div class="mb-2">
                    <label class="block text-sm font-medium mb-1">Select Watermark Image</label>
                    <input type="file" id="watermark-image" accept="image/*" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800">
                </div>
                <div class="mb-2">
                    <label class="block text-sm font-medium mb-1">Position</label>
                    <select id="watermark-image-position" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800">
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right" selected>Bottom Right</option>
                        <option value="center">Center</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Opacity</label>
                    <input type="range" id="watermark-image-opacity" min="0" max="1" step="0.1" value="0.5" class="w-full">
                </div>
            </div>
            <div class="flex space-x-2">
                <button id="apply-watermark" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                    Apply Watermark
                </button>
                <button id="download-watermarked" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                    Download
                </button>
            </div>
        </div>
    `;
    
    // Toggle watermark type options
    document.querySelectorAll('input[name="watermark-type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'text') {
                document.getElementById('text-watermark-options').classList.remove('hidden');
                document.getElementById('image-watermark-options').classList.add('hidden');
            } else {
                document.getElementById('text-watermark-options').classList.add('hidden');
                document.getElementById('image-watermark-options').classList.remove('hidden');
            }
        });
    });
    
    document.getElementById('apply-watermark').addEventListener('click', function() {
        const watermarkType = document.querySelector('input[name="watermark-type"]:checked').value;
        
        if (watermarkType === 'text') {
            const text = document.getElementById('watermark-text').value;
            const fontSize = document.getElementById('watermark-font-size').value;
            const color = document.getElementById('watermark-color').value;
            const position = document.getElementById('watermark-position').value;
            const opacity = document.getElementById('watermark-opacity').value;
            
            if (text) {
                addTextWatermark(text, fontSize, color, position, opacity);
            }
        } else {
            const watermarkImage = document.getElementById('watermark-image').files[0];
            const position = document.getElementById('watermark-image-position').value;
            const opacity = document.getElementById('watermark-image-opacity').value;
            
            if (watermarkImage) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    addImageWatermark(e.target.result, position, opacity);
                };
                reader.readAsDataURL(watermarkImage);
            }
        }
    });
    
    document.getElementById('download-watermarked').addEventListener('click', function() {
        if (currentImageData) {
            // Re-generate watermarked image to get the blob
            const watermarkType = document.querySelector('input[name="watermark-type"]:checked').value;
            
            if (watermarkType === 'text') {
                const text = document.getElementById('watermark-text').value;
                const fontSize = document.getElementById('watermark-font-size').value;
                const color = document.getElementById('watermark-color').value;
                const position = document.getElementById('watermark-position').value;
                const opacity = document.getElementById('watermark-opacity').value;
                
                if (text) {
                    addTextWatermarkForDownload(text, fontSize, color, position, opacity);
                }
            } else {
                const watermarkImage = document.getElementById('watermark-image').files[0];
                const position = document.getElementById('watermark-image-position').value;
                const opacity = document.getElementById('watermark-image-opacity').value;
                
                if (watermarkImage) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        addImageWatermarkForDownload(e.target.result, position, opacity);
                    };
                    reader.readAsDataURL(watermarkImage);
                }
            }
        }
    });
}

// Show filter controls
function showFilterControls(container) {
    container.innerHTML = `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-medium mb-4">Filters & Effects</h3>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <button class="filter-btn p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" data-filter="grayscale">
                    <i class="fas fa-adjust mb-2"></i>
                    <p>Grayscale</p>
                </button>
                <button class="filter-btn p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" data-filter="sepia">
                    <i class="fas fa-coffee mb-2"></i>
                    <p>Sepia</p>
                </button>
                <button class="filter-btn p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" data-filter="invert">
                    <i class="fas fa-exchange-alt mb-2"></i>
                    <p>Invert</p>
                </button>
                <button class="filter-btn p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" data-filter="blur">
                    <i class="fas fa-water mb-2"></i>
                    <p>Blur</p>
                </button>
                <button class="filter-btn p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" data-filter="brightness">
                    <i class="fas fa-sun mb-2"></i>
                    <p>Brightness</p>
                </button>
                <button class="filter-btn p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" data-filter="contrast">
                    <i class="fas fa-circle-half-stroke mb-2"></i>
                    <p>Contrast</p>
                </button>
            </div>
            <div id="filter-controls" class="mb-4 hidden">
                <label class="block text-sm font-medium mb-1">Intensity</label>
                <input type="range" id="filter-intensity" min="0" max="100" value="50" class="w-full">
            </div>
            <div class="flex space-x-2">
                <button id="apply-filter" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                    Apply Filter
                </button>
                <button id="reset-filters" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                    Reset Filters
                </button>
                <button id="download-filtered" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                    Download
                </button>
            </div>
        </div>
    `;
    
    // Filter button clicks
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('ring-2', 'ring-indigo-500');
            });
            this.classList.add('ring-2', 'ring-indigo-500');
            
            // Show intensity control for certain filters
            if (['blur', 'brightness', 'contrast'].includes(filter)) {
                document.getElementById('filter-controls').classList.remove('hidden');
            } else {
                document.getElementById('filter-controls').classList.add('hidden');
            }
            
            // Store selected filter
            activeFilters = [filter];
        });
    });
    
    document.getElementById('apply-filter').addEventListener('click', function() {
        if (activeFilters.length > 0 && currentImageData) {
            const filter = activeFilters[0];
            const intensity = document.getElementById('filter-intensity').value / 100;
            applyFilter(filter, intensity);
        }
    });
    
    document.getElementById('reset-filters').addEventListener('click', function() {
        if (originalImageData) {
            displayImage(originalImageData.url);
            currentImageData = {...originalImageData};
            activeFilters = [];
        }
    });
    
    document.getElementById('download-filtered').addEventListener('click', function() {
        if (currentImageData) {
            // Re-generate filtered image to get the blob
            if (activeFilters.length > 0) {
                const filter = activeFilters[0];
                const intensity = document.getElementById('filter-intensity').value / 100;
                applyFilterForDownload(filter, intensity);
            }
        }
    });
}

// Show metadata controls
function showMetadataControls(container) {
    container.innerHTML = `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-medium mb-4">Image Metadata</h3>
            <div id="metadata-content">
                ${currentImageData ? `
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="font-medium">Name:</span>
                            <span>${currentImageData.name}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Size:</span>
                            <span>${formatFileSize(currentImageData.size)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Type:</span>
                            <span>${currentImageData.type}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Dimensions:</span>
                            <span>${currentImageData.width} × ${currentImageData.height} px</span>
                        </div>
                    </div>
                ` : '<p>No image selected</p>'}
            </div>
            <div class="flex space-x-2 mt-4">
                <button id="remove-metadata" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                    Remove Metadata
                </button>
                <button id="download-current" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                    Download
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('remove-metadata').addEventListener('click', function() {
        if (currentImageData) {
            removeMetadata();
        }
    });
    
    document.getElementById('download-current').addEventListener('click', function() {
        if (currentImageData) {
            // Re-generate image without metadata to get the blob
            removeMetadataForDownload();
        }
    });
}

// Show merge controls
function showMergeControls(container) {
    container.innerHTML = `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-medium mb-4">Image Merger</h3>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Select Images to Merge</label>
                <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4">
                    <input type="file" id="merge-image-upload" accept="image/*" multiple class="hidden">
                    <button id="merge-upload-btn" class="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                        Add Images
                    </button>
                </div>
                <div id="merge-images-container" class="grid grid-cols-3 gap-2 mb-4 max-h-60 overflow-y-auto">
                    <!-- Selected images will be displayed here -->
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1">Layout</label>
                    <select id="merge-layout" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800">
                        <option value="grid">Grid</option>
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Vertical</option>
                    </select>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1">Background Color</label>
                    <input type="color" id="merge-bg-color" class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800" value="#ffffff">
                </div>
                <div class="flex space-x-2">
                    <button id="merge-images" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                        Merge Images
                    </button>
                    <button id="download-merged" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                        Download
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('merge-upload-btn').addEventListener('click', () => {
        document.getElementById('merge-image-upload').click();
    });
    
    document.getElementById('merge-image-upload').addEventListener('change', handleMergeImageUpload);
    document.getElementById('merge-images').addEventListener('click', mergeSelectedImages);
    document.getElementById('download-merged').addEventListener('click', downloadMergedImage);
    
    // Display any previously selected images
    updateMergeImagesDisplay();
}

// Handle merge image upload
function handleMergeImageUpload(e) {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const imageData = {
                    id: Date.now() + Math.random(),
                    url: event.target.result,
                    name: file.name,
                    width: img.width,
                    height: img.height
                };
                
                selectedMergeImages.push(imageData);
                updateMergeImagesDisplay();
            };
            img.src = event.target.result;
        };
        
        reader.readAsDataURL(file);
    });
}

// Update the display of selected merge images
function updateMergeImagesDisplay() {
    const container = document.getElementById('merge-images-container');
    container.innerHTML = '';
    
    selectedMergeImages.forEach((image, index) => {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'relative group';
        imageContainer.innerHTML = `
            <img src="${image.url}" alt="${image.name}" class="w-full h-24 object-cover rounded">
            <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                <button class="delete-merge-image bg-red-500 hover:bg-red-600 text-white p-1 rounded mr-1" data-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </button>
                <button class="swap-left-merge-image bg-blue-500 hover:bg-blue-600 text-white p-1 rounded mr-1" data-index="${index}" ${index === 0 ? 'disabled' : ''}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                </button>
                <button class="swap-right-merge-image bg-blue-500 hover:bg-blue-600 text-white p-1 rounded" data-index="${index}" ${index === selectedMergeImages.length - 1 ? 'disabled' : ''}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        `;
        
        container.appendChild(imageContainer);
    });
    
    // Add event listeners for delete and swap buttons
    document.querySelectorAll('.delete-merge-image').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            selectedMergeImages.splice(index, 1);
            updateMergeImagesDisplay();
        });
    });
    
    document.querySelectorAll('.swap-left-merge-image').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            if (index > 0) {
                [selectedMergeImages[index], selectedMergeImages[index - 1]] = [selectedMergeImages[index - 1], selectedMergeImages[index]];
                updateMergeImagesDisplay();
            }
        });
    });
    
    document.querySelectorAll('.swap-right-merge-image').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            if (index < selectedMergeImages.length - 1) {
                [selectedMergeImages[index], selectedMergeImages[index + 1]] = [selectedMergeImages[index + 1], selectedMergeImages[index]];
                updateMergeImagesDisplay();
            }
        });
    });
}

// Merge selected images
function mergeSelectedImages() {
    if (selectedMergeImages.length < 2) {
        showNotification('Please select at least 2 images to merge', 'error');
        return;
    }
    
    const layout = document.getElementById('merge-layout').value;
    const bgColor = document.getElementById('merge-bg-color').value;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Calculate dimensions based on layout
    if (layout === 'grid') {
        // Calculate grid dimensions
        const cols = Math.ceil(Math.sqrt(selectedMergeImages.length));
        const rows = Math.ceil(selectedMergeImages.length / cols);
        
        // Find the smallest aspect ratio among all images
        let minAspectRatio = Infinity;
        selectedMergeImages.forEach(image => {
            const aspectRatio = image.width / image.height;
            if (aspectRatio < minAspectRatio) {
                minAspectRatio = aspectRatio;
            }
        });
        
        // Set canvas dimensions (assuming each cell is 300px wide)
        const cellWidth = 300;
        const cellHeight = cellWidth / minAspectRatio;
        canvas.width = cols * cellWidth;
        canvas.height = rows * cellHeight;
        
        // Fill background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw images in grid
        let loadedImages = 0;
        selectedMergeImages.forEach((imageData, index) => {
            const img = new Image();
            img.onload = function() {
                const col = index % cols;
                const row = Math.floor(index / cols);
                const x = col * cellWidth;
                const y = row * cellHeight;
                
                // Calculate dimensions to maintain aspect ratio
                let drawWidth = cellWidth;
                let drawHeight = cellHeight;
                const aspectRatio = img.width / img.height;
                
                if (aspectRatio > minAspectRatio) {
                    drawHeight = cellWidth / aspectRatio;
                } else {
                    drawWidth = cellHeight * aspectRatio;
                }
                
                // Center the image in the cell
                const offsetX = (cellWidth - drawWidth) / 2;
                const offsetY = (cellHeight - drawHeight) / 2;
                
                ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
                
                loadedImages++;
                if (loadedImages === selectedMergeImages.length) {
                    // All images loaded, create blob and display
                    canvas.toBlob(function(blob) {
                        const url = URL.createObjectURL(blob);
                        mergedImageData = {
                            url: url,
                            width: canvas.width,
                            height: canvas.height,
                            size: blob.size
                        };
                        displayImage(url);
                        addToImageHistory();
                        showNotification('Images merged successfully', 'success');
                    }, 'image/jpeg', 0.9);
                }
            };
            img.src = imageData.url;
        });
    } else if (layout === 'horizontal') {
        // Find the smallest height among all images
        let minHeight = Infinity;
        selectedMergeImages.forEach(image => {
            if (image.height < minHeight) {
                minHeight = image.height;
            }
        });
        
        // Calculate total width
        let totalWidth = 0;
        selectedMergeImages.forEach(image => {
            const aspectRatio = image.width / image.height;
            totalWidth += minHeight * aspectRatio;
        });
        
        canvas.width = totalWidth;
        canvas.height = minHeight;
        
        // Fill background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw images horizontally
        let loadedImages = 0;
        let currentX = 0;
        
        selectedMergeImages.forEach(imageData => {
            const img = new Image();
            img.onload = function() {
                const aspectRatio = img.width / img.height;
                const drawWidth = minHeight * aspectRatio;
                
                ctx.drawImage(img, currentX, 0, drawWidth, minHeight);
                currentX += drawWidth;
                
                loadedImages++;
                if (loadedImages === selectedMergeImages.length) {
                    // All images loaded, create blob and display
                    canvas.toBlob(function(blob) {
                        const url = URL.createObjectURL(blob);
                        mergedImageData = {
                            url: url,
                            width: canvas.width,
                            height: canvas.height,
                            size: blob.size
                        };
                        displayImage(url);
                        addToImageHistory();
                        showNotification('Images merged successfully', 'success');
                    }, 'image/jpeg', 0.9);
                }
            };
            img.src = imageData.url;
        });
    } else if (layout === 'vertical') {
        // Find the smallest width among all images
        let minWidth = Infinity;
        selectedMergeImages.forEach(image => {
            if (image.width < minWidth) {
                minWidth = image.width;
            }
        });
        
        // Calculate total height
        let totalHeight = 0;
        selectedMergeImages.forEach(image => {
            const aspectRatio = image.height / image.width;
            totalHeight += minWidth * aspectRatio;
        });
        
        canvas.width = minWidth;
        canvas.height = totalHeight;
        
        // Fill background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw images vertically
        let loadedImages = 0;
        let currentY = 0;
        
        selectedMergeImages.forEach(imageData => {
            const img = new Image();
            img.onload = function() {
                const aspectRatio = img.height / img.width;
                const drawHeight = minWidth * aspectRatio;
                
                ctx.drawImage(img, 0, currentY, minWidth, drawHeight);
                currentY += drawHeight;
                
                loadedImages++;
                if (loadedImages === selectedMergeImages.length) {
                    // All images loaded, create blob and display
                    canvas.toBlob(function(blob) {
                        const url = URL.createObjectURL(blob);
                        mergedImageData = {
                            url: url,
                            width: canvas.width,
                            height: canvas.height,
                            size: blob.size
                        };
                        displayImage(url);
                        addToImageHistory();
                        showNotification('Images merged successfully', 'success');
                    }, 'image/jpeg', 0.9);
                }
            };
            img.src = imageData.url;
        });
    }
}

// Download merged image
function downloadMergedImage() {
    if (!mergedImageData) {
        showNotification('No merged image to download', 'error');
        return;
    }
    
    const link = document.createElement('a');
    link.href = mergedImageData.url;
    link.download = 'merged-image.jpeg';
    link.click();
    
    showNotification('Merged image downloaded successfully', 'success');
}

// Show batch process controls
function showBatchControls(container) {
    container.innerHTML = `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-medium mb-4">Batch Process</h3>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Select Images</label>
                <input type="file" id="batch-images" accept="image/*" multiple class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Operation</label>
                <select id="batch-operation" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800">
                    <option value="resize">Resize</option>
                    <option value="compress">Compress</option>
                    <option value="convert">Convert Format</option>
                    <option value="watermark">Add Watermark</option>
                </select>
            </div>
            <div id="batch-options" class="mb-4">
                <!-- Options will be populated based on operation -->
            </div>
            <div id="batch-preview" class="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg min-h-[100px]">
                <p class="text-gray-500">Select images to preview</p>
            </div>
            <button id="process-batch" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors" disabled>
                Process Images
            </button>
            <div id="batch-progress" class="mt-4 hidden">
                <div class="flex justify-between text-sm mb-1">
                    <span>Processing...</span>
                    <span id="batch-progress-text">0/0</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div id="batch-progress-bar" class="bg-indigo-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('batch-images').addEventListener('change', handleBatchImageSelection);
    document.getElementById('batch-operation').addEventListener('change', updateBatchOptions);
    document.getElementById('process-batch').addEventListener('click', processBatchImages);
}

// Handle batch image selection
function handleBatchImageSelection(e) {
    const files = e.target.files;
    if (files.length === 0) return;
    
    batchImages = [];
    const previewContainer = document.getElementById('batch-preview');
    previewContainer.innerHTML = '';
    
    let loadedCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                batchImages.push({
                    url: event.target.result,
                    width: img.width,
                    height: img.height,
                    name: file.name,
                    type: file.type,
                    size: file.size
                });
                
                // Add thumbnail to preview
                const thumb = document.createElement('img');
                thumb.src = event.target.result;
                thumb.className = 'w-16 h-16 object-cover rounded m-1';
                previewContainer.appendChild(thumb);
                
                loadedCount++;
                if (loadedCount === files.length) {
                    document.getElementById('process-batch').disabled = false;
                    updateBatchOptions();
                }
            };
            img.src = event.target.result;
        };
        
        reader.readAsDataURL(file);
    }
}

// Update batch options based on operation
function updateBatchOptions() {
    const operation = document.getElementById('batch-operation').value;
    const optionsContainer = document.getElementById('batch-options');
    
    switch(operation) {
        case 'resize':
            optionsContainer.innerHTML = `
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Width (px)</label>
                        <input type="number" id="batch-width" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800" value="800">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Height (px)</label>
                        <input type="number" id="batch-height" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800" value="600">
                    </div>
                </div>
                <div class="mt-2">
                    <label class="flex items-center">
                        <input type="checkbox" id="batch-maintain-aspect" class="mr-2" checked>
                        <span>Maintain aspect ratio</span>
                    </label>
                </div>
            `;
            break;
            
        case 'compress':
            optionsContainer.innerHTML = `
                <div>
                    <label class="block text-sm font-medium mb-1">Quality (1-100)</label>
                    <input type="range" id="batch-quality" min="1" max="100" value="80" class="w-full">
                    <div class="flex justify-between text-xs text-gray-500">
                        <span>Low Quality</span>
                        <span id="batch-quality-value">80</span>
                        <span>High Quality</span>
                    </div>
                </div>
            `;
            document.getElementById('batch-quality').addEventListener('input', function() {
                document.getElementById('batch-quality-value').textContent = this.value;
            });
            break;
            
        case 'convert':
            optionsContainer.innerHTML = `
                <div>
                    <label class="block text-sm font-medium mb-1">Output Format</label>
                    <select id="batch-format" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800">
                        <option value="jpeg">JPEG</option>
                        <option value="png">PNG</option>
                        <option value="webp">WebP</option>
                    </select>
                </div>
            `;
            break;
            
        case 'watermark':
            optionsContainer.innerHTML = `
                <div>
                    <label class="block text-sm font-medium mb-1">Watermark Text</label>
                    <input type="text" id="batch-watermark-text" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800" placeholder="Enter watermark text">
                </div>
                <div class="grid grid-cols-2 gap-4 mt-2">
                    <div>
                        <label class="block text-sm font-medium mb-1">Position</label>
                        <select id="batch-watermark-position" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800">
                            <option value="bottom-right">Bottom Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="top-right">Top Right</option>
                            <option value="top-left">Top Left</option>
                            <option value="center">Center</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Opacity</label>
                        <input type="range" id="batch-watermark-opacity" min="0" max="1" step="0.1" value="0.5" class="w-full">
                    </div>
                </div>
            `;
            break;
    }
}

// Process batch images
function processBatchImages() {
    if (batchImages.length === 0) {
        showNotification('Please select images to process', 'error');
        return;
    }
    
    const operation = document.getElementById('batch-operation').value;
    const progressContainer = document.getElementById('batch-progress');
    const progressBar = document.getElementById('batch-progress-bar');
    const progressText = document.getElementById('batch-progress-text');
    
    progressContainer.classList.remove('hidden');
    document.getElementById('process-batch').disabled = true;
    
    let processedCount = 0;
    const totalCount = batchImages.length;
    
    batchImages.forEach((imageData, index) => {
        setTimeout(() => {
            // Update progress
            processedCount++;
            const percentage = (processedCount / totalCount) * 100;
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${processedCount}/${totalCount}`;
            
            // Process image based on operation
            switch(operation) {
                case 'resize':
                    processBatchResize(imageData, index);
                    break;
                case 'compress':
                    processBatchCompress(imageData, index);
                    break;
                case 'convert':
                    processBatchConvert(imageData, index);
                    break;
                case 'watermark':
                    processBatchWatermark(imageData, index);
                    break;
            }
            
            // Check if all images are processed
            if (processedCount === totalCount) {
                setTimeout(() => {
                    progressContainer.classList.add('hidden');
                    document.getElementById('process-batch').disabled = false;
                    showNotification(`Successfully processed ${totalCount} images`, 'success');
                }, 500);
            }
        }, index * 100); // Small delay between processing
    });
}

// Process batch resize
function processBatchResize(imageData, index) {
    const width = parseInt(document.getElementById('batch-width').value);
    const height = parseInt(document.getElementById('batch-height').value);
    const maintainAspect = document.getElementById('batch-maintain-aspect').checked;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        let finalWidth = width;
        let finalHeight = height;
        
        if (maintainAspect) {
            const aspectRatio = img.width / img.height;
            if (aspectRatio > width / height) {
                finalHeight = width / aspectRatio;
            } else {
                finalWidth = height * aspectRatio;
            }
        }
        
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
        
        canvas.toBlob(function(blob) {
            downloadBlob(blob, `resized_${imageData.name}`);
        }, 'image/jpeg', 0.9);
    };
    
    img.src = imageData.url;
}

// Process batch compress
function processBatchCompress(imageData, index) {
    const quality = parseInt(document.getElementById('batch-quality').value) / 100;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(function(blob) {
            downloadBlob(blob, `compressed_${imageData.name}`);
        }, 'image/jpeg', quality);
    };
    
    img.src = imageData.url;
}

// Process batch convert
function processBatchConvert(imageData, index) {
    const format = document.getElementById('batch-format').value;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(function(blob) {
            const nameWithoutExt = imageData.name.replace(/\.[^/.]+$/, '');
            downloadBlob(blob, `${nameWithoutExt}.${format}`);
        }, `image/${format}`);
    };
    
    img.src = imageData.url;
}

// Process batch watermark
function processBatchWatermark(imageData, index) {
    const text = document.getElementById('batch-watermark-text').value;
    const position = document.getElementById('batch-watermark-position').value;
    const opacity = parseFloat(document.getElementById('batch-watermark-opacity').value);
    
    if (!text) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Add watermark
        ctx.font = '20px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = opacity;
        
        let x, y;
        const padding = 20;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        
        switch(position) {
            case 'top-left':
                x = padding;
                y = padding + 20;
                break;
            case 'top-right':
                x = canvas.width - textWidth - padding;
                y = padding + 20;
                break;
            case 'bottom-left':
                x = padding;
                y = canvas.height - padding;
                break;
            case 'bottom-right':
                x = canvas.width - textWidth - padding;
                y = canvas.height - padding;
                break;
            case 'center':
                x = (canvas.width - textWidth) / 2;
                y = canvas.height / 2;
                break;
        }
        
        ctx.fillText(text, x, y);
        
        canvas.toBlob(function(blob) {
            downloadBlob(blob, `watermarked_${imageData.name}`);
        }, 'image/jpeg', 0.9);
    };
    
    img.src = imageData.url;
}

// Image manipulation functions
function convertImage(format) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            downloadBlob(blob, `converted-image.${format}`);
            showNotification(`Image converted to ${format.toUpperCase()}`, 'success');
        }, `image/${format}`);
    };
    
    img.src = currentImageData.url;
}

function addTextWatermark(text, fontSize, color, position, opacity) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Set watermark properties
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        
        // Calculate position
        let x, y;
        const padding = 20;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        
        switch(position) {
            case 'top-left':
                x = padding;
                y = padding + parseInt(fontSize);
                break;
            case 'top-right':
                x = canvas.width - textWidth - padding;
                y = padding + parseInt(fontSize);
                break;
            case 'bottom-left':
                x = padding;
                y = canvas.height - padding;
                break;
            case 'bottom-right':
                x = canvas.width - textWidth - padding;
                y = canvas.height - padding;
                break;
            case 'center':
                x = (canvas.width - textWidth) / 2;
                y = canvas.height / 2;
                break;
        }
        
        // Draw watermark
        ctx.fillText(text, x, y);
        
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            currentImageData = {
                ...currentImageData,
                url: url,
                size: blob.size
            };
            
            displayImage(url);
            addToImageHistory();
            showNotification('Watermark added successfully', 'success');
        }, 'image/jpeg', 0.9);
    };
    
    img.src = currentImageData.url;
}

// Add text watermark for download (FIXED)
function addTextWatermarkForDownload(text, fontSize, color, position, opacity) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Set watermark properties
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        
        // Calculate position
        let x, y;
        const padding = 20;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        
        switch(position) {
            case 'top-left':
                x = padding;
                y = padding + parseInt(fontSize);
                break;
            case 'top-right':
                x = canvas.width - textWidth - padding;
                y = padding + parseInt(fontSize);
                break;
            case 'bottom-left':
                x = padding;
                y = canvas.height - padding;
                break;
            case 'bottom-right':
                x = canvas.width - textWidth - padding;
                y = canvas.height - padding;
                break;
            case 'center':
                x = (canvas.width - textWidth) / 2;
                y = canvas.height / 2;
                break;
        }
        
        // Draw watermark
        ctx.fillText(text, x, y);
        
        canvas.toBlob(function(blob) {
            const originalName = currentImageData ? currentImageData.name : 'image';
            const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
            downloadBlob(blob, `watermarked_${nameWithoutExt}.jpeg`);
            showNotification('Watermarked image downloaded successfully', 'success');
        }, 'image/jpeg', 0.9);
    };
    
    img.src = currentImageData.url;
}

function addImageWatermark(watermarkUrl, position, opacity) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const watermark = new Image();
    
    let loadedImages = 0;
    
    function checkImagesLoaded() {
        loadedImages++;
        if (loadedImages === 2) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Set watermark opacity
            ctx.globalAlpha = opacity;
            
            // Calculate position
            let x, y;
            const padding = 20;
            const watermarkWidth = watermark.width;
            const watermarkHeight = watermark.height;
            
            switch(position) {
                case 'top-left':
                    x = padding;
                    y = padding;
                    break;
                case 'top-right':
                    x = canvas.width - watermarkWidth - padding;
                    y = padding;
                    break;
                case 'bottom-left':
                    x = padding;
                    y = canvas.height - watermarkHeight - padding;
                    break;
                case 'bottom-right':
                    x = canvas.width - watermarkWidth - padding;
                    y = canvas.height - watermarkHeight - padding;
                    break;
                case 'center':
                    x = (canvas.width - watermarkWidth) / 2;
                    y = (canvas.height - watermarkHeight) / 2;
                    break;
            }
            
            // Draw watermark
            ctx.drawImage(watermark, x, y, watermarkWidth, watermarkHeight);
            
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                currentImageData = {
                    ...currentImageData,
                    url: url,
                    size: blob.size
                };
                
                displayImage(url);
                addToImageHistory();
                showNotification('Watermark added successfully', 'success');
            }, 'image/jpeg', 0.9);
        }
    }
    
    img.onload = checkImagesLoaded;
    watermark.onload = checkImagesLoaded;
    
    img.src = currentImageData.url;
    watermark.src = watermarkUrl;
}

// Add image watermark for download (FIXED)
function addImageWatermarkForDownload(watermarkUrl, position, opacity) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const watermark = new Image();
    
    let loadedImages = 0;
    
    function checkImagesLoaded() {
        loadedImages++;
        if (loadedImages === 2) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Set watermark opacity
            ctx.globalAlpha = opacity;
            
            // Calculate position
            let x, y;
            const padding = 20;
            const watermarkWidth = watermark.width;
            const watermarkHeight = watermark.height;
            
            switch(position) {
                case 'top-left':
                    x = padding;
                    y = padding;
                    break;
                case 'top-right':
                    x = canvas.width - watermarkWidth - padding;
                    y = padding;
                    break;
                case 'bottom-left':
                    x = padding;
                    y = canvas.height - watermarkHeight - padding;
                    break;
                case 'bottom-right':
                    x = canvas.width - watermarkWidth - padding;
                    y = canvas.height - watermarkHeight - padding;
                    break;
                case 'center':
                    x = (canvas.width - watermarkWidth) / 2;
                    y = (canvas.height - watermarkHeight) / 2;
                    break;
            }
            
            // Draw watermark
            ctx.drawImage(watermark, x, y, watermarkWidth, watermarkHeight);
            
            canvas.toBlob(function(blob) {
                const originalName = currentImageData ? currentImageData.name : 'image';
                const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
                downloadBlob(blob, `watermarked_${nameWithoutExt}.jpeg`);
                showNotification('Watermarked image downloaded successfully', 'success');
            }, 'image/jpeg', 0.9);
        }
    }
    
    img.onload = checkImagesLoaded;
    watermark.onload = checkImagesLoaded;
    
    img.src = currentImageData.url;
    watermark.src = watermarkUrl;
}

function applyFilter(filter, intensity) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Apply filter
        switch(filter) {
            case 'grayscale':
                for (let i = 0; i < data.length; i += 4) {
                    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    data[i] = gray;
                    data[i + 1] = gray;
                    data[i + 2] = gray;
                }
                break;
            case 'sepia':
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                }
                break;
            case 'invert':
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i];
                    data[i + 1] = 255 - data[i + 1];
                    data[i + 2] = 255 - data[i + 2];
                }
                break;
            case 'blur':
                // Simple box blur
                const blurRadius = Math.round(intensity * 10);
                const tempData = new Uint8ClampedArray(data);
                
                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        let r = 0, g = 0, b = 0, a = 0;
                        let count = 0;
                        
                        for (let dy = -blurRadius; dy <= blurRadius; dy++) {
                            for (let dx = -blurRadius; dx <= blurRadius; dx++) {
                                const ny = y + dy;
                                const nx = x + dx;
                                
                                if (ny >= 0 && ny < canvas.height && nx >= 0 && nx < canvas.width) {
                                    const idx = (ny * canvas.width + nx) * 4;
                                    r += tempData[idx];
                                    g += tempData[idx + 1];
                                    b += tempData[idx + 2];
                                    a += tempData[idx + 3];
                                    count++;
                                }
                            }
                        }
                        
                        const idx = (y * canvas.width + x) * 4;
                        data[idx] = r / count;
                        data[idx + 1] = g / count;
                        data[idx + 2] = b / count;
                        data[idx + 3] = a / count;
                    }
                }
                break;
            case 'brightness':
                const brightnessFactor = intensity * 2;
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] * brightnessFactor);
                    data[i + 1] = Math.min(255, data[i + 1] * brightnessFactor);
                    data[i + 2] = Math.min(255, data[i + 2] * brightnessFactor);
                }
                break;
            case 'contrast':
                const contrastFactor = intensity * 2;
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrastFactor + 128));
                    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrastFactor + 128));
                    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrastFactor + 128));
                }
                break;
        }
        
        // Put the modified image data back
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            currentImageData = {
                ...currentImageData,
                url: url,
                size: blob.size
            };
            
            displayImage(url);
            addToImageHistory();
            showNotification(`${filter.charAt(0).toUpperCase() + filter.slice(1)} filter applied`, 'success');
        }, 'image/jpeg', 0.9);
    };
    
    img.src = currentImageData.url;
}

// Apply filter for download (FIXED)
function applyFilterForDownload(filter, intensity) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Apply filter
        switch(filter) {
            case 'grayscale':
                for (let i = 0; i < data.length; i += 4) {
                    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    data[i] = gray;
                    data[i + 1] = gray;
                    data[i + 2] = gray;
                }
                break;
            case 'sepia':
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                }
                break;
            case 'invert':
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i];
                    data[i + 1] = 255 - data[i + 1];
                    data[i + 2] = 255 - data[i + 2];
                }
                break;
            case 'blur':
                // Simple box blur
                const blurRadius = Math.round(intensity * 10);
                const tempData = new Uint8ClampedArray(data);
                
                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        let r = 0, g = 0, b = 0, a = 0;
                        let count = 0;
                        
                        for (let dy = -blurRadius; dy <= blurRadius; dy++) {
                            for (let dx = -blurRadius; dx <= blurRadius; dx++) {
                                const ny = y + dy;
                                const nx = x + dx;
                                
                                if (ny >= 0 && ny < canvas.height && nx >= 0 && nx < canvas.width) {
                                    const idx = (ny * canvas.width + nx) * 4;
                                    r += tempData[idx];
                                    g += tempData[idx + 1];
                                    b += tempData[idx + 2];
                                    a += tempData[idx + 3];
                                    count++;
                                }
                            }
                        }
                        
                        const idx = (y * canvas.width + x) * 4;
                        data[idx] = r / count;
                        data[idx + 1] = g / count;
                        data[idx + 2] = b / count;
                        data[idx + 3] = a / count;
                    }
                }
                break;
            case 'brightness':
                const brightnessFactor = intensity * 2;
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] * brightnessFactor);
                    data[i + 1] = Math.min(255, data[i + 1] * brightnessFactor);
                    data[i + 2] = Math.min(255, data[i + 2] * brightnessFactor);
                }
                break;
            case 'contrast':
                const contrastFactor = intensity * 2;
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrastFactor + 128));
                    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrastFactor + 128));
                    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrastFactor + 128));
                }
                break;
        }
        
        // Put the modified image data back
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob(function(blob) {
            const originalName = currentImageData ? currentImageData.name : 'image';
            const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
            downloadBlob(blob, `filtered_${nameWithoutExt}.jpeg`);
            showNotification('Filtered image downloaded successfully', 'success');
        }, 'image/jpeg', 0.9);
    };
    
    img.src = currentImageData.url;
}

function removeMetadata() {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            currentImageData = {
                ...currentImageData,
                url: url,
                size: blob.size
            };
            
            displayImage(url);
            addToImageHistory();
            showNotification('Metadata removed successfully', 'success');
        }, 'image/jpeg', 0.9);
    };
    
    img.src = currentImageData.url;
}

// Remove metadata for download (FIXED)
function removeMetadataForDownload() {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(function(blob) {
            const originalName = currentImageData ? currentImageData.name : 'image';
            const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
            downloadBlob(blob, `metadata_removed_${nameWithoutExt}.jpeg`);
            showNotification('Image without metadata downloaded successfully', 'success');
        }, 'image/jpeg', 0.9);
    };
    
    img.src = currentImageData.url;
}

// Clear screen function
function clearScreen() {
    const container = document.getElementById('image-preview-container');
    container.innerHTML = `
        <div class="flex items-center justify-center h-full">
            <div class="text-center">
                <i class="fas fa-image text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <p id="upload-prompt" class="text-gray-500 dark:text-gray-400">No image loaded</p>
            </div>
        </div>
    `;
    
    // Reset image data but keep original for potential reset
    currentImageData = null;
    
    // Hide reset button since no image is loaded
    document.getElementById('reset-image').classList.add('hidden');
    
    // Clear tool controls
    const controlsContainer = document.getElementById('tool-controls');
    if (controlsContainer) {
        controlsContainer.innerHTML = '<p class="text-gray-500">Select an image and adjust settings for this tool.</p>';
    }
    
    showNotification('Screen cleared', 'info');
}

// Zoom functions
function zoomImage(factor) {
    zoomLevel *= factor;
    zoomLevel = Math.max(0.1, Math.min(5, zoomLevel));
    
    const previewImage = document.getElementById('preview-image');
    if (previewImage) {
        previewImage.style.transform = `scale(${zoomLevel})`;
    }
}

function resetZoom() {
    zoomLevel = 1;
    const previewImage = document.getElementById('preview-image');
    if (previewImage) {
        previewImage.style.transform = `scale(${zoomLevel})`;
    }
}

// Reset image to original
function resetImage() {
    if (originalImageData) {
        currentImageData = {...originalImageData};
        displayImage(originalImageData.url);
        resetZoom();
        resetImageHistory();
        showNotification('Image reset to original', 'info');
        
        // Show both buttons when image is loaded
        document.getElementById('reset-image').classList.remove('hidden');
        const clearScreenBtn = document.getElementById('clear-screen');
        if (clearScreenBtn) {
            clearScreenBtn.classList.remove('hidden');
        }
    }
}

// Image history management
function addToImageHistory() {
    // Remove any states after the current index
    imageHistory = imageHistory.slice(0, historyIndex + 1);
    
    // Add the new state
    imageHistory.push({...currentImageData});
    historyIndex++;
    
    // Limit history to 10 states
    if (imageHistory.length > 10) {
        imageHistory.shift();
        historyIndex--;
    }
}

function resetImageHistory() {
    imageHistory = [{...currentImageData}];
    historyIndex = 0;
}

// Recent files management
function loadRecentFiles() {
    const savedFiles = localStorage.getItem('recent-image-files');
    if (savedFiles) {
        try {
            recentFiles = JSON.parse(savedFiles);
        } catch (e) {
            recentFiles = [];
        }
    }
    
    renderRecentFiles();
}

function addToRecentFiles(imageData) {
    // Check if already in recent files
    const existingIndex = recentFiles.findIndex(file => file.name === imageData.name);
    if (existingIndex !== -1) {
        recentFiles.splice(existingIndex, 1);
    }
    
    // Add to beginning
    recentFiles.unshift({
        name: imageData.name,
        url: imageData.url,
        size: imageData.size,
        type: imageData.type,
        width: imageData.width,
        height: imageData.height,
        timestamp: Date.now()
    });
    
    // Limit to 5 recent files
    if (recentFiles.length > 5) {
        recentFiles = recentFiles.slice(0, 5);
    }
    
    // Save to localStorage
    localStorage.setItem('recent-image-files', JSON.stringify(recentFiles));
    
    // Update UI
    renderRecentFiles();
}

function renderRecentFiles() {
    const container = document.getElementById('recent-files');
    container.innerHTML = '';
    
    if (recentFiles.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500">No recent files</p>';
        return;
    }
    
    recentFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer';
        
        const fileIcon = getFileIcon(file.type);
        const fileSize = formatFileSize(file.size);
        const fileDate = new Date(file.timestamp).toLocaleDateString();
        
        fileItem.innerHTML = `
            <i class="${fileIcon} text-gray-500"></i>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">${file.name}</p>
                <p class="text-xs text-gray-500">${fileSize} • ${fileDate}</p>
            </div>
        `;
        
        fileItem.addEventListener('click', () => {
            currentImageData = {...file};
            originalImageData = {...file};
            displayImage(file.url);
            resetZoom();
            resetImageHistory();
            
            // Show both buttons when image is loaded
            document.getElementById('reset-image').classList.remove('hidden');
            const clearScreenBtn = document.getElementById('clear-screen');
            if (clearScreenBtn) {
                clearScreenBtn.classList.remove('hidden');
            }
            
            // Update upload prompt
            document.getElementById('upload-prompt').textContent = file.name;
        });
        
        container.appendChild(fileItem);
    });
}

function getFileIcon(fileType) {
    if (fileType.includes('jpeg') || fileType.includes('jpg')) {
        return 'fas fa-file-image';
    } else if (fileType.includes('png')) {
        return 'fas fa-file-image';
    } else if (fileType.includes('gif')) {
        return 'fas fa-file-image';
    } else if (fileType.includes('webp')) {
        return 'fas fa-file-image';
    } else if (fileType.includes('bmp')) {
        return 'fas fa-file-image';
    } else {
        return 'fas fa-file';
    }
}

// Drag and drop setup
function setupDragAndDrop() {
    const dropZone = document.getElementById('image-preview-container');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    function highlight() {
        dropZone.classList.add('border-indigo-500');
    }
    
    function unhighlight() {
        dropZone.classList.remove('border-indigo-500');
    }
    
    dropZone.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const imageUpload = document.getElementById('image-upload');
            imageUpload.files = files;
            handleImageUpload({ target: { files: files } });
        }
    }
}

// --- Settings & Utility Functions ---

function initializeSettings() {
    document.getElementById('dark-mode-toggle').addEventListener('change', toggleTheme);
    document.getElementById('clear-storage').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear ALL local data? This action cannot be undone.')) {
            localStorage.clear();
            showNotification('All local data cleared', 'info');
            setTimeout(() => location.reload(), 1000);
        }
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateProgressBar(percentage) {
    const progressBar = document.getElementById('progress-bar');
    if(progressBar) progressBar.style.width = `${percentage}%`;
}

function updateStorageInfo() {
    let totalSize = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += (new Blob([localStorage[key]])).size;
        }
    }
    
    document.getElementById('storage-used').textContent = formatFileSize(totalSize);
    const maxStorage = 5 * 1024 * 1024;
    const percentage = Math.min(100, (totalSize / maxStorage) * 100);
    document.getElementById('storage-bar').style.width = `${percentage}%`;
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `mb-2 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 transform transition-all duration-300 translate-x-full`;

    const typeClasses = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white'
    };
    const iconClasses = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };

    notification.className += ` ${typeClasses[type] || typeClasses.info}`;
    notification.innerHTML = `<i class="${iconClasses[type] || iconClasses.info}"></i> <span>${message}</span>`;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
        notification.classList.add('translate-x-0');
    }, 10);
    
    setTimeout(() => {
        if (container.contains(notification)) {
            container.removeChild(notification);
        }
    }, 3000);
}

// Help modal
document.getElementById('help-toggle').addEventListener('click', toggleHelpModal);
document.getElementById('close-help').addEventListener('click', toggleHelpModal);

// Helper function to convert data URL to blob
function dataURLtoBlob(dataURL) {
    try {
        // Check if dataURL is valid
        if (!dataURL || typeof dataURL !== 'string') {
            console.error('Invalid data URL: not a string or empty');
            return new Blob([], { type: 'image/jpeg' });
        }
        
        // Check if it's a data URL
        if (!dataURL.startsWith('data:')) {
            console.error('Invalid data URL: does not start with "data:"');
            return new Blob([], { type: 'image/jpeg' });
        }
        
        const arr = dataURL.split(',');
        
        // Check if split was successful
        if (arr.length < 2) {
            console.error('Invalid data URL: could not split properly');
            return new Blob([], { type: 'image/jpeg' });
        }
        
        const match = arr[0].match(/:(.*?);/);
        
        // Check if match was successful
        if (!match || match.length < 2) {
            console.error('Invalid data URL format: could not extract MIME type');
            return new Blob([], { type: 'image/jpeg' });
        }
        
        const mime = match[1];
        
        // Check if we have the data part
        if (!arr[1]) {
            console.error('Invalid data URL: missing data part');
            return new Blob([], { type: mime });
        }
        
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new Blob([u8arr], { type: mime });
    } catch (error) {
        console.error('Error converting data URL to blob:', error);
        // Return a default blob or handle the error appropriately
        return new Blob([], { type: 'image/jpeg' });
    }
}
