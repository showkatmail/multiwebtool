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
        default:
            controlsContainer.innerHTML = '<p class="text-gray-500">Select an image and adjust settings for this tool.</p>';
    }
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
    
    currentImageData = null;
    document.getElementById('reset-image').classList.add('hidden');
    
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
        
        document.getElementById('reset-image').classList.remove('hidden');
        const clearScreenBtn = document.getElementById('clear-screen');
        if (clearScreenBtn) {
            clearScreenBtn.classList.remove('hidden');
        }
    }
}

// Image history management
function addToImageHistory() {
    imageHistory = imageHistory.slice(0, historyIndex + 1);
    imageHistory.push({...currentImageData});
    historyIndex++;
    
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
    const existingIndex = recentFiles.findIndex(file => file.name === imageData.name);
    if (existingIndex !== -1) {
        recentFiles.splice(existingIndex, 1);
    }
    
    recentFiles.unshift({
        name: imageData.name,
        url: imageData.url,
        size: imageData.size,
        type: imageData.type,
        width: imageData.width,
        height: imageData.height,
        timestamp: Date.now()
    });
    
    if (recentFiles.length > 5) {
        recentFiles = recentFiles.slice(0, 5);
    }
    
    localStorage.setItem('recent-image-files', JSON.stringify(recentFiles));
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
            
            document.getElementById('reset-image').classList.remove('hidden');
            const clearScreenBtn = document.getElementById('clear-screen');
            if (clearScreenBtn) {
                clearScreenBtn.classList.remove('hidden');
            }
            
            document.getElementById('upload-prompt').textContent = file.name;
        });
        
        container.appendChild(fileItem);
    });
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
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
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