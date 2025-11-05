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

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeTabs();
    initializeEditor();
    initializeImageTools();
    initializeSettings();
    loadSavedContent();
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
        darkModeToggle.checked = true;
    } else {
        html.classList.remove('dark');
        darkModeToggle.checked = false;
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    if (html.classList.contains('dark')) {
        setTheme('light');
    } else {
        setTheme('dark');
    }
}

// Keyboard Shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Help modal
        if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
            toggleHelpModal();
            return;
        }
        
        // Ctrl/Cmd combinations
        if (e.ctrlKey || e.metaKey) {
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
                    e.preventDefault();
                    if (currentImageData) zoomImage(1.2);
                    break;
                case '-':
                    e.preventDefault();
                    if (currentImageData) zoomImage(0.8);
                    break;
                case '0':
                    e.preventDefault();
                    if (currentImageData) resetZoom();
                    break;
                case 'r':
                    e.preventDefault();
                    if (currentImageData) resetImage();
                    break;
            }
        }
    });
}

function toggleHelpModal() {
    const helpModal = document.getElementById('help-modal');
    helpModal.classList.toggle('hidden');
}

function saveCurrentWork() {
    const activeTab = document.querySelector('.tab-btn.text-indigo-600');
    if (!activeTab) {
        // Try alternative selector for dark mode
        const darkModeTab = document.querySelector('.tab-btn.dark\\:text-indigo-400');
        if (!darkModeTab) return;
        
        const tabName = darkModeTab.getAttribute('data-tab');
        
        if (tabName === 'notepad') {
            document.getElementById('save-local').click();
        } else if (tabName === 'image-tools' && currentImageData) {
            // Save current image to recent files
            addToRecentFiles(currentImageData);
            showNotification('Image saved to recent files', 'success');
        }
        return;
    }
    
    const tabName = activeTab.getAttribute('data-tab');
    
    if (tabName === 'notepad') {
        document.getElementById('save-local').click();
    } else if (tabName === 'image-tools' && currentImageData) {
        // Save current image to recent files
        addToRecentFiles(currentImageData);
        showNotification('Image saved to recent files', 'success');
    }
}

// Tab Management - FIXED VERSION
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Update button states
            tabButtons.forEach(btn => {
                btn.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'border-b-2', 'border-indigo-600', 'dark:border-indigo-400');
                btn.classList.add('text-gray-600', 'dark:text-gray-400');
            });
            
            button.classList.remove('text-gray-600', 'dark:text-gray-400');
            button.classList.add('text-indigo-600', 'dark:text-indigo-400', 'border-b-2', 'border-indigo-600', 'dark:border-indigo-400');
            
            // Update panel visibility
            tabPanels.forEach(panel => {
                panel.classList.add('hidden');
            });
            
            const targetPanel = document.getElementById(`${targetTab}-tab`);
            if (targetPanel) {
                targetPanel.classList.remove('hidden');
            }
        });
    });
}

// Rich Text Editor
function initializeEditor() {
    const editor = document.getElementById('editor');
    const editorButtons = document.querySelectorAll('.editor-btn');
    const fontSizeSelect = document.getElementById('font-size');
    const fontFamilySelect = document.getElementById('font-family');
    const textColorInput = document.getElementById('text-color');
    const bgColorInput = document.getElementById('bg-color');
    
    // Add event listeners to editor buttons
    editorButtons.forEach(button => {
        button.addEventListener('click', () => {
            const command = button.getAttribute('data-command');
            
            if (command === 'createLink') {
                const url = prompt('Enter URL:');
                if (url) document.execCommand(command, false, url);
            } else {
                document.execCommand(command, false, null);
            }
            
            editor.focus();
        });
    });
    
    // Font size change
    fontSizeSelect.addEventListener('change', () => {
        document.execCommand('fontSize', false, fontSizeSelect.value);
        editor.focus();
    });
    
    // Font family change
    fontFamilySelect.addEventListener('change', () => {
        document.execCommand('fontName', false, fontFamilySelect.value);
        editor.focus();
    });
    
    // Text color change
    textColorInput.addEventListener('change', () => {
        document.execCommand('foreColor', false, textColorInput.value);
        editor.focus();
    });
    
    // Background color change
    bgColorInput.addEventListener('change', () => {
        document.execCommand('hiliteColor', false, bgColorInput.value);
        editor.focus();
    });
    
    // Clear editor
    document.getElementById('clear-editor').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all content?')) {
            editor.innerHTML = '';
            showNotification('Editor cleared', 'info');
        }
    });
    
    // Word count
    document.getElementById('word-count').addEventListener('click', () => {
        updateWordCount();
        document.getElementById('word-count-modal').classList.remove('hidden');
    });
    
    document.getElementById('close-word-count').addEventListener('click', () => {
        document.getElementById('word-count-modal').classList.add('hidden');
    });
    
    // Export HTML
    document.getElementById('export-html').addEventListener('click', () => {
        const htmlContent = editor.innerHTML;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notepad-${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('HTML exported successfully', 'success');
    });
    
    // Save locally
    document.getElementById('save-local').addEventListener('click', () => {
        const content = editor.innerHTML;
        localStorage.setItem('notepad-content', content);
        showNotification('Content saved locally', 'success');
    });
    
    // Download as text file
    document.getElementById('download-text').addEventListener('click', () => {
        const content = editor.innerText;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notepad-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('File downloaded successfully', 'success');
    });
    
    // Auto-save
    editor.addEventListener('input', () => {
        localStorage.setItem('notepad-content', editor.innerHTML);
    });
}

function updateWordCount() {
    const editor = document.getElementById('editor');
    const text = editor.innerText;
    
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const characters = text.length;
    const charactersNoSpace = text.replace(/\s/g, '').length;
    const paragraphs = text.trim().split(/\n\n+/).filter(p => p.length > 0);
    
    document.getElementById('word-count-value').textContent = words.length;
    document.getElementById('char-count-value').textContent = characters;
    document.getElementById('char-no-space-count-value').textContent = charactersNoSpace;
    document.getElementById('paragraph-count-value').textContent = paragraphs.length;
}

// Image Tools
function initializeImageTools() {
    const imageToolButtons = document.querySelectorAll('.image-tool-btn');
    const imageUpload = document.getElementById('image-upload');
    
    // Tool selection
    imageToolButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tool = button.id.replace('-tool', '');
            selectImageTool(tool);
        });
    });
    
    // Image upload
    imageUpload.addEventListener('change', handleImageUpload);
    
    // Drag and drop
    const uploadLabel = imageUpload.previousElementSibling;
    uploadLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadLabel.classList.add('border-indigo-500', 'dark:border-indigo-400');
    });
    
    uploadLabel.addEventListener('dragleave', () => {
        uploadLabel.classList.remove('border-indigo-500', 'dark:border-indigo-400');
    });
    
    uploadLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadLabel.classList.remove('border-indigo-500', 'dark:border-indigo-400');
        
        const files = Array.from(e.dataTransfer.files);
        
        if (files.length > 0) {
            processImageFiles(files);
        }
    });
    
    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', () => {
        if (currentImageData) zoomImage(1.2);
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => {
        if (currentImageData) zoomImage(0.8);
    });
    
    document.getElementById('zoom-fit').addEventListener('click', () => {
        if (currentImageData) resetZoom();
    });
    
    // Reset image
    document.getElementById('reset-image').addEventListener('click', resetImage);
    
    // Compare toggle
    document.getElementById('compare-toggle').addEventListener('click', toggleComparison);
    
    // Initialize tool-specific event listeners
    initializeThumbnailTool();
    initializeResizeTool();
    initializeCompressTool();
    initializeConvertTool();
    initializeWatermarkTool();
    initializeFilterTool();
    initializeMetadataTool();
    initializeBatchTool();
}

function selectImageTool(tool) {
    // Store current tool
    currentTool = tool;
    
    // Hide all tool panels
    document.querySelectorAll('.image-tool-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
    
    // Reset merge images when switching away from merge tool
    if (tool !== 'merge' && selectedMergeImages) {
        selectedMergeImages = [];
        mergedImageData = null;
    }
    
    // Update active state in toolbar
    document.querySelectorAll('.image-tool-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white');
        btn.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
    });
    
    const activeButton = document.getElementById(`${tool}-tool`);
    if (activeButton) {
        activeButton.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
        activeButton.classList.add('bg-indigo-600', 'text-white');
    }
    
    // Clear preview container when switching tools
    const previewContainer = document.getElementById('image-preview-container');
    previewContainer.innerHTML = `
        <div class="text-center text-gray-500 dark:text-gray-400">
            <i class="fas fa-image text-4xl mb-2"></i>
            <p>No image selected</p>
        </div>
    `;
    
    // Show the appropriate control panel for the selected tool
    const controlPanel = document.getElementById(`${tool}-controls`);
    if (controlPanel) {
        controlPanel.classList.remove('hidden');
    }
    
    // Special handling for merge tool
    if (tool === 'merge') {
        // Initialize merge mode
        selectedMergeImages = [];
        mergedImageData = null;
        
        // Update upload prompt
        document.getElementById('upload-prompt').innerHTML = `
            Select Multiple Images to Merge
            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">or drag and drop</p>
        `;
        
        // Show merge controls panel immediately
        showMergeControls();
    } else {
        // Reset upload prompt for other tools
        // THIS IS THE CORRECTED PART
        document.getElementById('upload-prompt').innerHTML = 'Select an Image to ' + tool + '<p class="text-xs text-gray-500 dark:text-gray-500 mt-1">or drag and drop</p>';
    }
    
    // Show/hide relevant buttons
    if (currentImageData) {
        document.getElementById('reset-image').classList.remove('hidden');
        document.getElementById('compare-toggle').classList.remove('hidden');
    } else {
        document.getElementById('reset-image').classList.add('hidden');
        document.getElementById('compare-toggle').classList.add('hidden');
    }
}

function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
        processImageFiles(files);
    }
    
    // Reset the input value
    e.target.value = '';
}

function processImageFiles(files) {
    // For merge tool, handle multiple files
    if (currentTool === 'merge') {
        // Process each file
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    const imageData = {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        dataURL: event.target.result,
                        timestamp: Date.now()
                    };
                    
                    showImagePreview(imageData);
                };
                
                reader.readAsDataURL(file);
            } else {
                showNotification(`${file.name} is not a valid image file`, 'error');
            }
        });
    } else {
        // For other tools, only handle the first file
        const file = files[0];
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                const imageData = {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    dataURL: event.target.result,
                    timestamp: Date.now()
                };
                
                // Reset history
                imageHistory = [];
                historyIndex = -1;
                
                // Set current and original image data
                currentImageData = imageData;
                originalImageData = JSON.parse(JSON.stringify(imageData));
                
                // Add to history
                addToHistory(imageData);
                
                // Add to recent files
                addToRecentFiles(imageData);
                
                showImagePreview(imageData);
                
                // Update resize tool with image dimensions
                if (currentTool === 'resize') {
                    updateResizeDimensions(imageData);
                }
                
                // Show metadata if metadata tool is active
                if (currentTool === 'metadata') {
                    updateMetadata(imageData);
                }
            };
            
            reader.readAsDataURL(file);
        } else {
            showNotification(`${file.name} is not a valid image file`, 'error');
        }
    }
}

// Enhanced showImagePreview function to handle multiple images
function showImagePreview(imageData) {
    const previewContainer = document.getElementById('image-preview-container');
    
    // Check if we're in merge mode
    if (currentTool === 'merge') {
        // For merge mode, we need to handle multiple images
        if (!selectedMergeImages) {
            selectedMergeImages = [];
        }
        
        // Add the new image to our array
        selectedMergeImages.push(imageData);
        
        // Clear the container and rebuild with all selected images
        previewContainer.innerHTML = '';
        
        // Create a grid container for selected images
        const selectedImagesGrid = document.createElement('div');
        selectedImagesGrid.id = 'selected-images-grid';
        selectedImagesGrid.className = 'grid grid-cols-2 gap-2 mb-4';
        
        // Add each selected image to the grid
        selectedMergeImages.forEach((img, index) => {
            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'relative group';
            
            const imgElement = document.createElement('img');
            imgElement.src = img.dataURL;
            imgElement.className = 'w-full h-32 object-cover rounded border-2 border-indigo-500';
            
            // Add remove button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity';
            removeBtn.innerHTML = '&times;';
            removeBtn.onclick = () => removeMergeImage(index);
            
            imageWrapper.appendChild(imgElement);
            imageWrapper.appendChild(removeBtn);
            selectedImagesGrid.appendChild(imageWrapper);
        });
        
        previewContainer.appendChild(selectedImagesGrid);
        
        // Add merge result preview container (initially hidden)
        let mergeResultPreview = document.getElementById('merge-result-preview');
        if (!mergeResultPreview) {
            mergeResultPreview = document.createElement('div');
            mergeResultPreview.id = 'merge-result-preview';
            mergeResultPreview.className = 'hidden mt-4';
            previewContainer.appendChild(mergeResultPreview);
        }
        
        // Update merge controls state
        updateMergeControlsState();
    } else {
        // For non-merge modes, show single image with zoom controls
        previewContainer.innerHTML = '';
        
        const imageContainer = document.createElement('div');
        imageContainer.className = 'relative w-full h-full flex items-center justify-center';
        imageContainer.id = 'image-container';
        
        const imgElement = document.createElement('img');
        imgElement.src = imageData.dataURL;
        imgElement.alt = 'Preview';
        imgElement.className = 'max-w-full max-h-96 mx-auto rounded-lg shadow-lg transition-transform duration-200';
        imgElement.id = 'preview-image';
        imgElement.style.transform = `scale(${zoomLevel})`;
        
        imageContainer.appendChild(imgElement);
        previewContainer.appendChild(imageContainer);
        
        // Add image info
        const infoDiv = document.createElement('div');
        infoDiv.className = 'mt-2 text-sm text-gray-600 dark:text-gray-400 text-center';
        infoDiv.innerHTML = `
            ${imageData.name} (${formatFileSize(imageData.size)})
            <span class="ml-2 text-xs">Zoom: ${Math.round(zoomLevel * 100)}%</span>
        `;
        previewContainer.appendChild(infoDiv);
        
        // Show/hide relevant buttons
        document.getElementById('reset-image').classList.remove('hidden');
        document.getElementById('compare-toggle').classList.remove('hidden');
    }
}

// Zoom functionality
function zoomImage(factor) {
    zoomLevel = Math.max(0.1, Math.min(5, zoomLevel * factor));
    const imgElement = document.getElementById('preview-image');
    if (imgElement) {
        imgElement.style.transform = `scale(${zoomLevel})`;
        
        // Update zoom info
        const infoDiv = document.querySelector('#image-preview-container .text-center');
        if (infoDiv) {
            infoDiv.innerHTML = infoDiv.innerHTML.replace(/Zoom: \d+%/, `Zoom: ${Math.round(zoomLevel * 100)}%`);
        }
    }
}

function resetZoom() {
    zoomLevel = 1;
    const imgElement = document.getElementById('preview-image');
    if (imgElement) {
        imgElement.style.transform = `scale(${zoomLevel})`;
        
        // Update zoom info
        const infoDiv = document.querySelector('#image-preview-container .text-center');
        if (infoDiv) {
            infoDiv.innerHTML = infoDiv.innerHTML.replace(/Zoom: \d+%/, `Zoom: ${Math.round(zoomLevel * 100)}%`);
        }
    }
}

// Image history management
function addToHistory(imageData) {
    // Remove any states after current index
    imageHistory = imageHistory.slice(0, historyIndex + 1);
    
    // Add new state
    imageHistory.push(JSON.parse(JSON.stringify(imageData)));
    historyIndex++;
    
    // Limit history to 20 states
    if (imageHistory.length > 20) {
        imageHistory.shift();
        historyIndex--;
    }
}

function resetImage() {
    if (originalImageData) {
        currentImageData = JSON.parse(JSON.stringify(originalImageData));
        showImagePreview(currentImageData);
        addToHistory(currentImageData);
        showNotification('Image reset to original', 'info');
    }
}

// Comparison functionality
function toggleComparison() {
    const previewContainer = document.getElementById('image-preview-container');
    const imgElement = document.getElementById('preview-image');
    
    if (!imgElement || !originalImageData) return;
    
    // Check if comparison view already exists
    if (document.getElementById('comparison-container')) {
        // Remove comparison view
        showImagePreview(currentImageData);
        return;
    }
    
    // Create comparison container
    const comparisonContainer = document.createElement('div');
    comparisonContainer.id = 'comparison-container';
    comparisonContainer.className = 'comparison-slider w-full h-full relative';
    
    // Create before image (original)
    const beforeImg = document.createElement('img');
    beforeImg.src = originalImageData.dataURL;
    beforeImg.className = 'w-full h-full object-contain';
    
    // Create after image (current)
    const afterContainer = document.createElement('div');
    afterContainer.className = 'after';
    afterContainer.style.width = '50%';
    
    const afterImg = document.createElement('img');
    afterImg.src = currentImageData.dataURL;
    afterImg.className = 'w-full h-full object-contain';
    
    // Create divider
    const divider = document.createElement('div');
    divider.className = 'divider';
    
    // Assemble comparison
    afterContainer.appendChild(afterImg);
    comparisonContainer.appendChild(beforeImg);
    comparisonContainer.appendChild(afterContainer);
    comparisonContainer.appendChild(divider);
    
    // Clear preview and add comparison
    previewContainer.innerHTML = '';
    previewContainer.appendChild(comparisonContainer);
    
    // Add slider functionality
    let isDragging = false;
    
    const updateSliderPosition = (x) => {
        const rect = comparisonContainer.getBoundingClientRect();
        const position = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
        afterContainer.style.width = `${position * 100}%`;
    };
    
    divider.addEventListener('mousedown', () => {
        isDragging = true;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            updateSliderPosition(e.clientX);
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// Recent files management
function addToRecentFiles(imageData) {
    // Check if file already exists in recent files
    const existingIndex = recentFiles.findIndex(file => file.name === imageData.name);
    
    if (existingIndex !== -1) {
        // Update existing file
        recentFiles[existingIndex] = imageData;
    } else {
        // Add new file
        recentFiles.unshift(imageData);
    }
    
    // Limit to 10 recent files
    recentFiles = recentFiles.slice(0, 10);
    
    // Save to localStorage
    localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
    
    // Update UI
    updateRecentFilesUI();
}

function loadRecentFiles() {
    const saved = localStorage.getItem('recentFiles');
    if (saved) {
        try {
            recentFiles = JSON.parse(saved);
            updateRecentFilesUI();
        } catch (e) {
            console.error('Error loading recent files:', e);
            recentFiles = [];
        }
    }
}

function updateRecentFilesUI() {
    const container = document.getElementById('recent-files');
    container.innerHTML = '';
    
    if (recentFiles.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">No recent files</p>';
        return;
    }
    
    recentFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors';
        
        const thumbnail = document.createElement('img');
        thumbnail.src = file.dataURL;
        thumbnail.className = 'w-10 h-10 object-cover rounded';
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'flex-1 min-w-0';
        
        const fileName = document.createElement('p');
        fileName.className = 'text-sm font-medium truncate';
        fileName.textContent = file.name;
        
        const fileSize = document.createElement('p');
        fileSize.className = 'text-xs text-gray-500 dark:text-gray-400';
        fileSize.textContent = formatFileSize(file.size);
        
        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileSize);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            recentFiles.splice(index, 1);
            localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
            updateRecentFilesUI();
        };
        
        fileItem.appendChild(thumbnail);
        fileItem.appendChild(fileInfo);
        fileItem.appendChild(removeBtn);
        
        fileItem.onclick = () => {
            currentImageData = file;
            originalImageData = JSON.parse(JSON.stringify(file));
            imageHistory = [];
            historyIndex = -1;
            addToHistory(file);
            showImagePreview(file);
            
            // Update resize tool with image dimensions
            if (currentTool === 'resize') {
                updateResizeDimensions(file);
            }
            
            // Show metadata if metadata tool is active
            if (currentTool === 'metadata') {
                updateMetadata(file);
            }
        };
        
        container.appendChild(fileItem);
    });
}

// Helper function to remove an image from the merge selection
function removeMergeImage(index) {
    selectedMergeImages.splice(index, 1);
    
    // Re-render the preview
    if (selectedMergeImages.length > 0) {
        // Temporarily store the images and clear the array
        const tempImages = [...selectedMergeImages];
        selectedMergeImages = [];
        
        // Re-add each image to trigger the preview update
        tempImages.forEach(img => showImagePreview(img));
    } else {
        // No images left, clear the preview
        document.getElementById('image-preview-container').innerHTML = '';
        updateMergeControlsState();
    }
}

// Updated showMergeControls() function
function showMergeControls() {
    const mergeControls = document.getElementById('merge-controls');
    mergeControls.classList.remove('hidden');
    
    // Update the controls HTML with separate Apply and Download buttons
    mergeControls.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Merge Settings</h3>
            
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Direction</label>
                <select id="merge-direction" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white">
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                </select>
            </div>
            
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Spacing (px)</label>
                <input type="number" id="merge-spacing" min="0" max="50" value="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white">
            </div>
            
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background Color</label>
                <input type="color" id="merge-bg-color" value="#ffffff" class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700">
            </div>
            
            <div class="flex justify-end space-x-2">
                <button id="apply-merge" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                    Apply Merge
                </button>
                <button id="download-merge" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors hidden">
                    Download
                </button>
            </div>
            
            <div id="merge-loading" class="hidden mt-4 flex items-center justify-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                <span class="ml-2 text-gray-600 dark:text-gray-400">Processing images...</span>
            </div>
            
            <div id="merge-result-info" class="hidden mt-4 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-400">
                <!-- Result info will be displayed here -->
            </div>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('apply-merge').addEventListener('click', applyMerge);
    document.getElementById('download-merge').addEventListener('click', downloadMergedImage);
}

function updateMergeControlsState() {
    const applyButton = document.getElementById('apply-merge');
    if (applyButton) {
        if (selectedMergeImages.length >= 2) {
            applyButton.disabled = false;
        } else {
            applyButton.disabled = true;
        }
    }
}

// Apply merge function - creates the merged image and shows preview
function applyMerge() {
    if (!selectedMergeImages || selectedMergeImages.length < 2) {
        showNotification('Please select at least 2 images to merge', 'error');
        return;
    }
    
    // Show loading state
    document.getElementById('merge-loading').classList.remove('hidden');
    document.getElementById('apply-merge').disabled = true;
    updateProgressBar(30);
    
    // Get merge settings
    const direction = document.getElementById('merge-direction').value;
    const spacing = parseInt(document.getElementById('merge-spacing').value) || 0;
    const bgColor = document.getElementById('merge-bg-color').value;
    
    // Process images with a slight delay to show loading state
    setTimeout(() => {
        try {
            updateProgressBar(60);
            
            // Create a canvas for the merged image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate dimensions based on direction
            let totalWidth = 0;
            let totalHeight = 0;
            let maxWidth = 0;
            let maxHeight = 0;
            
            // Load all images
            const loadedImages = [];
            const promises = selectedMergeImages.map(imgData => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        loadedImages.push(img);
                        
                        if (direction === 'horizontal') {
                            totalWidth += img.width;
                            maxHeight = Math.max(maxHeight, img.height);
                        } else {
                            totalHeight += img.height;
                            maxWidth = Math.max(maxWidth, img.width);
                        }
                        
                        resolve();
                    };
                    img.src = imgData.dataURL;
                });
            });
            
            Promise.all(promises).then(() => {
                updateProgressBar(80);
                
                // Set canvas dimensions
                if (direction === 'horizontal') {
                    canvas.width = totalWidth + (spacing * (loadedImages.length - 1));
                    canvas.height = maxHeight;
                } else {
                    canvas.width = maxWidth;
                    canvas.height = totalHeight + (spacing * (loadedImages.length - 1));
                }
                
                // Fill background
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw images
                let currentX = 0;
                let currentY = 0;
                
                loadedImages.forEach(img => {
                    if (direction === 'horizontal') {
                        // Center vertically
                        const y = (canvas.height - img.height) / 2;
                        ctx.drawImage(img, currentX, y);
                        currentX += img.width + spacing;
                    } else {
                        // Center horizontally
                        const x = (canvas.width - img.width) / 2;
                        ctx.drawImage(img, x, currentY);
                        currentY += img.height + spacing;
                    }
                });
                
                updateProgressBar(90);
                
                // Store the merged image data
                mergedImageData = canvas.toDataURL('image/png');
                
                // Show the preview
                const previewContainer = document.getElementById('merge-result-preview');
                previewContainer.innerHTML = `
                    <h4 class="text-md font-semibold mb-2 text-gray-800 dark:text-white">Merged Image Preview</h4>
                    <img src="${mergedImageData}" alt="Merged Image" class="max-w-full max-h-64 mx-auto rounded-lg shadow-lg">
                `;
                previewContainer.classList.remove('hidden');
                
                // Show result info
                const fileSize = Math.round(mergedImageData.length * 0.75 / 1024); // Approximate size in KB
                document.getElementById('merge-result-info').innerHTML = `
                    <p>Dimensions: ${canvas.width} x ${canvas.height}px</p>
                    <p>File Size: ~${fileSize} KB</p>
                `;
                document.getElementById('merge-result-info').classList.remove('hidden');
                
                // Show download button
                document.getElementById('download-merge').classList.remove('hidden');
                
                // Hide loading state
                document.getElementById('merge-loading').classList.add('hidden');
                document.getElementById('apply-merge').disabled = false;
                
                updateProgressBar(100);
                setTimeout(() => updateProgressBar(0), 500);
                
                showNotification('Images merged successfully! You can now download the result.', 'success');
            });
        } catch (error) {
            console.error('Error merging images:', error);
            showNotification('Failed to merge images. Please try again.', 'error');
            
            // Hide loading state
            document.getElementById('merge-loading').classList.add('hidden');
            document.getElementById('apply-merge').disabled = false;
            updateProgressBar(0);
        }
    }, 500); // Small delay to show loading state
}

// Download merged image function
function downloadMergedImage() {
    if (!mergedImageData) {
        showNotification('No merged image to download. Please apply merge first.', 'error');
        return;
    }
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = mergedImageData;
    link.download = `merged-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Image downloaded successfully!', 'success');
}

// Update resize dimensions when image is loaded
function updateResizeDimensions(imageData) {
    const img = new Image();
    img.onload = function() {
        document.getElementById('resize-width').value = img.width;
        document.getElementById('resize-height').value = img.height;
    };
    img.src = imageData.dataURL;
}

// Thumbnail Tool
function initializeThumbnailTool() {
    document.getElementById('generate-thumbnail').addEventListener('click', () => {
        if (!currentImageData) {
            showNotification('Please select an image first', 'error');
            return;
        }
        
        const width = parseInt(document.getElementById('thumb-width').value);
        const height = parseInt(document.getElementById('thumb-height').value);
        const crop = document.getElementById('thumb-crop').checked;
        
        updateProgressBar(30);
        
        const img = new Image();
        img.onload = function() {
            updateProgressBar(60);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = width;
            canvas.height = height;
            
            if (crop) {
                // Calculate scaling and positioning to cover the entire canvas
                const scale = Math.max(width / img.width, height / img.height);
                const x = (width / 2) - (img.width / 2) * scale;
                const y = (height / 2) - (img.height / 2) * scale;
                
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            } else {
                // Fit image within canvas
                const scale = Math.min(width / img.width, height / img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const x = (width - scaledWidth) / 2;
                const y = (height - scaledHeight) / 2;
                
                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
            }
            
            updateProgressBar(90);
            
            const thumbnailDataURL = canvas.toDataURL();
            
            // Update preview
            const previewContainer = document.getElementById('image-preview-container');
            previewContainer.innerHTML = `
                <img src="${thumbnailDataURL}" alt="Thumbnail" class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg">
                <div class="mt-4 flex justify-center">
                    <button id="download-thumbnail" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                        Download Thumbnail
                    </button>
                </div>
            `;
            
            // Add download functionality
            document.getElementById('download-thumbnail').addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = thumbnailDataURL;
                link.download = `thumbnail-${Date.now()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showNotification('Thumbnail downloaded successfully', 'success');
            });
            
            updateProgressBar(100);
            setTimeout(() => updateProgressBar(0), 500);
        };
        img.src = currentImageData.dataURL;
    });
}

// Resize Tool
function initializeResizeTool() {
    const widthInput = document.getElementById('resize-width');
    const heightInput = document.getElementById('resize-height');
    const maintainAspectCheckbox = document.getElementById('maintain-aspect');
    
    // Maintain aspect ratio
    widthInput.addEventListener('input', () => {
        if (maintainAspectCheckbox.checked && currentImageData) {
            const img = new Image();
            img.onload = function() {
                const ratio = img.height / img.width;
                heightInput.value = Math.round(widthInput.value * ratio);
            };
            img.src = currentImageData.dataURL;
        }
    });
    
    heightInput.addEventListener('input', () => {
        if (maintainAspectCheckbox.checked && currentImageData) {
            const img = new Image();
            img.onload = function() {
                const ratio = img.width / img.height;
                widthInput.value = Math.round(heightInput.value * ratio);
            };
            img.src = currentImageData.dataURL;
        }
    });
    
    document.getElementById('apply-resize').addEventListener('click', () => {
        if (!currentImageData) {
            showNotification('Please select an image first', 'error');
            return;
        }
        
        const width = parseInt(widthInput.value);
        const height = parseInt(heightInput.value);
        
        updateProgressBar(30);
        
        const img = new Image();
        img.onload = function() {
            updateProgressBar(60);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            
            updateProgressBar(90);
            
            const resizedDataURL = canvas.toDataURL();
            
            // Update current image data
            currentImageData.dataURL = resizedDataURL;
            
            // Add to history
            addToHistory(currentImageData);
            
            // Update preview
            const previewContainer = document.getElementById('image-preview-container');
            previewContainer.innerHTML = `
                <img src="${resizedDataURL}" alt="Resized" class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg">
                <div class="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                    ${currentImageData.name} (${formatFileSize(currentImageData.size)}) - Resized to ${width}x${height}
                </div>
                <div class="mt-4 flex justify-center">
                    <button id="download-resized" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                        Download Resized Image
                    </button>
                </div>
            `;
            
            // Add download functionality
            document.getElementById('download-resized').addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = resizedDataURL;
                link.download = `resized-${Date.now()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showNotification('Resized image downloaded successfully', 'success');
            });
            
            updateProgressBar(100);
            setTimeout(() => updateProgressBar(0), 500);
        };
        img.src = currentImageData.dataURL;
    });
}

// Compress Tool
function initializeCompressTool() {
    const qualitySlider = document.getElementById('compress-quality');
    const qualityValue = document.getElementById('quality-value');
    
    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = qualitySlider.value;
    });
    
    document.getElementById('apply-compress').addEventListener('click', () => {
        if (!currentImageData) {
            showNotification('Please select an image first', 'error');
            return;
        }
        
        const quality = parseInt(qualitySlider.value) / 100;
        
        updateProgressBar(30);
        
        const img = new Image();
        img.onload = function() {
            updateProgressBar(60);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            ctx.drawImage(img, 0, 0);
            
            const compressedDataURL = canvas.toDataURL('image/jpeg', quality);
            
            updateProgressBar(90);
            
            // Calculate size reduction
            const originalSize = currentImageData.dataURL.length * 0.75;
            const compressedSize = compressedDataURL.length * 0.75;
            const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
            
            // Update preview
            const previewContainer = document.getElementById('image-preview-container');
            previewContainer.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="text-sm font-medium mb-2">Original</h4>
                        <img src="${currentImageData.dataURL}" alt="Original" class="w-full h-48 object-cover rounded-lg">
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${formatFileSize(originalSize)}</p>
                    </div>
                    <div>
                        <h4 class="text-sm font-medium mb-2">Compressed (${qualitySlider.value}%)</h4>
                        <img src="${compressedDataURL}" alt="Compressed" class="w-full h-48 object-cover rounded-lg">
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${formatFileSize(compressedSize)} (${reduction}% smaller)</p>
                    </div>
                </div>
                <div class="mt-4 flex justify-center">
                    <button id="download-compressed" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                        Download Compressed Image
                    </button>
                </div>
            `;
            
            // Add download functionality
            document.getElementById('download-compressed').addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = compressedDataURL;
                link.download = `compressed-${Date.now()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showNotification('Compressed image downloaded successfully', 'success');
            });
            
            updateProgressBar(100);
            setTimeout(() => updateProgressBar(0), 500);
        };
        img.src = currentImageData.dataURL;
    });
}

// Convert Tool
function initializeConvertTool() {
    document.getElementById('apply-convert').addEventListener('click', () => {
        if (!currentImageData) {
            showNotification('Please select an image first', 'error');
            return;
        }
        
        const format = document.getElementById('output-format').value;
        const mimeType = format === 'jpeg' ? 'image/jpeg' : `image/${format}`;
        
        updateProgressBar(30);
        
        const img = new Image();
        img.onload = function() {
            updateProgressBar(60);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            // For PNG/WebP, preserve transparency
            if (format !== 'jpeg') {
                ctx.drawImage(img, 0, 0);
            } else {
                // For JPEG, add white background
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            }
            
            updateProgressBar(90);
            
            const convertedDataURL = canvas.toDataURL(mimeType);
            
            // Update preview
            const previewContainer = document.getElementById('image-preview-container');
            previewContainer.innerHTML = `
                <img src="${convertedDataURL}" alt="Converted" class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg">
                <div class="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                    Converted to ${format.toUpperCase()}
                </div>
                <div class="mt-4 flex justify-center">
                    <button id="download-converted" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                        Download as ${format.toUpperCase()}
                    </button>
                </div>
            `;
            
            // Add download functionality
            document.getElementById('download-converted').addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = convertedDataURL;
                link.download = `converted-${Date.now()}.${format}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showNotification(`Image converted to ${format.toUpperCase()} successfully`, 'success');
            });
            
            updateProgressBar(100);
            setTimeout(() => updateProgressBar(0), 500);
        };
        img.src = currentImageData.dataURL;
    });
}

// Watermark Tool
function initializeWatermarkTool() {
    document.getElementById('apply-watermark').addEventListener('click', () => {
        if (!currentImageData) {
            showNotification('Please select an image first', 'error');
            return;
        }
        
        const text = document.getElementById('watermark-text').value;
        if (!text) {
            showNotification('Please enter watermark text', 'error');
            return;
        }
        
        const position = document.getElementById('watermark-position').value;
        const opacity = parseInt(document.getElementById('watermark-opacity').value) / 100;
        const fontSize = parseInt(document.getElementById('watermark-size').value);
        const color = document.getElementById('watermark-color').value;
        
        updateProgressBar(30);
        
        const img = new Image();
        img.onload = function() {
            updateProgressBar(60);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw the original image
            ctx.drawImage(img, 0, 0);
            
            // Configure watermark text
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = color;
            ctx.globalAlpha = opacity;
            
            // Calculate text position
            const textMetrics = ctx.measureText(text);
            const textWidth = textMetrics.width;
            const textHeight = fontSize;
            const padding = 20;
            
            let x, y;
            switch(position) {
                case 'top-left':
                    x = padding;
                    y = padding + textHeight;
                    break;
                case 'top-right':
                    x = canvas.width - textWidth - padding;
                    y = padding + textHeight;
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
                    y = (canvas.height + textHeight) / 2;
                    break;
            }
            
            // Draw watermark
            ctx.fillText(text, x, y);
            
            updateProgressBar(90);
            
            // Update preview
            const previewContainer = document.getElementById('image-preview-container');
            previewContainer.innerHTML = `
                <img src="${canvas.toDataURL()}" alt="Watermarked" class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg">
                <div class="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                    Watermark applied
                </div>
                <div class="mt-4 flex justify-center">
                    <button id="download-watermarked" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                        Download Watermarked Image
                    </button>
                </div>
            `;
            
            // Add download functionality
            document.getElementById('download-watermarked').addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = canvas.toDataURL();
                link.download = `watermarked-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showNotification('Watermarked image downloaded successfully', 'success');
            });
            
            updateProgressBar(100);
            setTimeout(() => updateProgressBar(0), 500);
        };
        img.src = currentImageData.dataURL;
    });
}

// Filter Tool
function initializeFilterTool() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            
            // Toggle active state
            if (activeFilters.includes(filter)) {
                activeFilters = activeFilters.filter(f => f !== filter);
                button.classList.remove('bg-indigo-200', 'dark:bg-indigo-800');
            } else {
                activeFilters.push(filter);
                button.classList.add('bg-indigo-200', 'dark:bg-indigo-800');
            }
        });
    });
    
    document.getElementById('reset-filters').addEventListener('click', () => {
        activeFilters = [];
        filterButtons.forEach(button => {
            button.classList.remove('bg-indigo-200', 'dark:bg-indigo-800');
        });
    });
    
    document.getElementById('apply-filters').addEventListener('click', () => {
        if (!currentImageData) {
            showNotification('Please select an image first', 'error');
            return;
        }
        
        if (activeFilters.length === 0) {
            showNotification('Please select at least one filter', 'error');
            return;
        }
        
        updateProgressBar(30);
        
        const img = new Image();
        img.onload = function() {
            updateProgressBar(60);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw original image
            ctx.drawImage(img, 0, 0);
            
            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Apply each filter
            activeFilters.forEach(filter => {
                applyFilter(data, filter, canvas.width, canvas.height);
            });
            
            // Put the modified image data back
            ctx.putImageData(imageData, 0, 0);
            
            updateProgressBar(90);
            
            // Update preview
            const previewContainer = document.getElementById('image-preview-container');
            previewContainer.innerHTML = `
                <img src="${canvas.toDataURL()}" alt="Filtered" class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg">
                <div class="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                    Filters applied: ${activeFilters.join(', ')}
                </div>
                <div class="mt-4 flex justify-center">
                    <button id="download-filtered" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                        Download Filtered Image
                    </button>
                </div>
            `;
            
            // Add download functionality
            document.getElementById('download-filtered').addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = canvas.toDataURL();
                link.download = `filtered-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showNotification('Filtered image downloaded successfully', 'success');
            });
            
            updateProgressBar(100);
            setTimeout(() => updateProgressBar(0), 500);
        };
        img.src = currentImageData.dataURL;
    });
}

function applyFilter(data, filter, width, height) {
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
        case 'brightness':
            const brightnessFactor = 1.2;
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * brightnessFactor);
                data[i + 1] = Math.min(255, data[i + 1] * brightnessFactor);
                data[i + 2] = Math.min(255, data[i + 2] * brightnessFactor);
            }
            break;
        case 'contrast':
            const contrastFactor = 1.5;
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrastFactor + 128));
                data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrastFactor + 128));
                data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrastFactor + 128));
            }
            break;
        case 'vintage':
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                data[i] = Math.min(255, (r * 0.5) + 50);
                data[i + 1] = Math.min(255, (g * 0.4) + 30);
                data[i + 2] = Math.min(255, (b * 0.2) + 10);
            }
            break;
        // Add more filters as needed
    }
}

// Metadata Tool
function initializeMetadataTool() {
    document.getElementById('export-metadata').addEventListener('click', () => {
        if (!currentImageData) {
            showNotification('No image to export metadata for', 'error');
            return;
        }
        
        // Create a simple metadata object
        const metadata = {
            name: currentImageData.name,
            size: currentImageData.size,
            type: currentImageData.type,
            timestamp: currentImageData.timestamp || new Date().toISOString()
        };
        
        // Convert to JSON and download
        const dataStr = JSON.stringify(metadata, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', `${currentImageData.name.split('.')[0]}_metadata.json`);
        link.click();
        
        showNotification('Metadata exported successfully', 'success');
    });
}

function updateMetadata(imageData) {
    const metadataContent = document.getElementById('metadata-content');
    
    // Create a simple metadata display
    const metadata = {
        'File Name': imageData.name,
        'File Size': formatFileSize(imageData.size),
        'File Type': imageData.type,
        'Timestamp': new Date(imageData.timestamp || Date.now()).toLocaleString()
    };
    
    let metadataHTML = '<div class="space-y-2">';
    for (const [key, value] of Object.entries(metadata)) {
        metadataHTML += `
            <div class="flex justify-between">
                <span class="font-medium">${key}:</span>
                <span>${value}</span>
            </div>
        `;
    }
    metadataHTML += '</div>';
    
    metadataContent.innerHTML = metadataHTML;
    document.getElementById('export-metadata').disabled = false;
}

// Batch Tool
function initializeBatchTool() {
    const batchImagesContainer = document.getElementById('batch-images');
    const batchUpload = document.getElementById('batch-upload');
    
    // Make the container clickable
    batchImagesContainer.addEventListener('click', () => {
        batchUpload.click();
    });
    
    batchUpload.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    const imageData = {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        dataURL: event.target.result
                    };
                    
                    batchImages.push(imageData);
                    updateBatchImagesUI();
                };
                
                reader.readAsDataURL(file);
            }
        });
        
        // Reset the input value
        e.target.value = '';
    });
    
    // Drag and drop for batch images
    batchImagesContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        batchImagesContainer.classList.add('border-indigo-500', 'dark:border-indigo-400');
    });
    
    batchImagesContainer.addEventListener('dragleave', () => {
        batchImagesContainer.classList.remove('border-indigo-500', 'dark:border-indigo-400');
    });
    
    batchImagesContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        batchImagesContainer.classList.remove('border-indigo-500', 'dark:border-indigo-400');
        
        const files = Array.from(e.dataTransfer.files);
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    const imageData = {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        dataURL: event.target.result
                    };
                    
                    batchImages.push(imageData);
                    updateBatchImagesUI();
                };
                
                reader.readAsDataURL(file);
            }
        });
    });
    
    document.getElementById('clear-batch').addEventListener('click', () => {
        batchImages = [];
        updateBatchImagesUI();
    });
    
    document.getElementById('process-batch').addEventListener('click', () => {
        if (batchImages.length === 0) {
            showNotification('Please select images for batch processing', 'error');
            return;
        }
        
        const operation = document.getElementById('batch-operation').value;
        
        // In a real implementation, you would apply the selected operation here
        // For this demo, we'll just simulate processing
        let processedCount = 0;
        const totalImages = batchImages.length;
        updateProgressBar(0);
        
        batchImages.forEach((imageData, index) => {
            setTimeout(() => {
                processedCount++;
                const progress = Math.round((processedCount / totalImages) * 100);
                updateProgressBar(progress);
                
                if (processedCount === totalImages) {
                    showNotification(`Batch ${operation} completed for ${totalImages} images`, 'success');
                    setTimeout(() => updateProgressBar(0), 500);
                }
            }, index * 100); // Process each image with a small delay
        });
    });
}

function updateBatchImagesUI() {
    const batchImagesContainer = document.getElementById('batch-images');
    const processButton = document.getElementById('process-batch');
    
    if (batchImages.length === 0) {
        batchImagesContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Drop images here or click to select</p>';
        processButton.disabled = true;
    } else {
        batchImagesContainer.innerHTML = `
            <div class="grid grid-cols-3 gap-2">
                ${batchImages.map((img, index) => `
                    <div class="relative group">
                        <img src="${img.dataURL}" alt="${img.name}" class="w-full h-20 object-cover rounded">
                        <button class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs" onclick="removeBatchImage(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">${batchImages.length} image(s) selected</p>
        `;
        processButton.disabled = false;
    }
}

function removeBatchImage(index) {
    batchImages.splice(index, 1);
    updateBatchImagesUI();
}

// Settings
function initializeSettings() {
    // Dark mode toggle in settings
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.addEventListener('change', toggleTheme);
    
    // Clear storage
    document.getElementById('clear-storage').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all local data? This action cannot be undone.')) {
            localStorage.clear();
            showNotification('All local data cleared', 'info');
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    });
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateProgressBar(percentage) {
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = `${percentage}%`;
}

function updateStorageInfo() {
    // Calculate storage usage
    let totalSize = 0;
    
    // Check localStorage
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += (localStorage[key].length * 2); // Multiply by 2 for UTF-16 characters
        }
    }
    
    // Update UI
    const storageUsed = document.getElementById('storage-used');
    const storageBar = document.getElementById('storage-bar');
    
    storageUsed.textContent = formatFileSize(totalSize);
    
    // Assuming 5MB max storage
    const maxStorage = 5 * 1024 * 1024;
    const percentage = Math.min(100, (totalSize / maxStorage) * 100);
    storageBar.style.width = `${percentage}%`;
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `mb-2 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 transform transition-all duration-300 translate-x-full`;
    
    // Set color based on type
    if (type === 'success') {
        notification.classList.add('bg-green-500', 'text-white');
    } else if (type === 'error') {
        notification.classList.add('bg-red-500', 'text-white');
    } else {
        notification.classList.add('bg-blue-500', 'text-white');
    }
    
    // Add icon based on type
    let icon = '';
    if (type === 'success') {
        icon = '<i class="fas fa-check-circle"></i>';
    } else if (type === 'error') {
        icon = '<i class="fas fa-exclamation-circle"></i>';
    } else {
        icon = '<i class="fas fa-info-circle"></i>';
    }
    
    notification.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
        notification.classList.add('translate-x-0');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (container.contains(notification)) {
                container.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function loadSavedContent() {
    // Load saved notepad content
    const savedContent = localStorage.getItem('notepad-content');
    if (savedContent) {
        document.getElementById('editor').innerHTML = savedContent;
    }
}

// Help modal
document.getElementById('help-toggle').addEventListener('click', toggleHelpModal);
document.getElementById('close-help').addEventListener('click', toggleHelpModal);
