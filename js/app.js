// Add this function to your app.js file

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
    
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => zoomImage(1.2));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => zoomImage(0.8));
    if (zoomFitBtn) zoomFitBtn.addEventListener('click', resetZoom);
    if (resetImageBtn) resetImageBtn.addEventListener('click', resetImage);
    
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
                
                // Show reset button
                document.getElementById('reset-image').classList.remove('hidden');
                
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
}

// Select a tool
function selectTool(tool) {
    currentTool = tool;
    
    // Update UI
    document.querySelectorAll('.image-tool-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-100', 'dark:bg-gray-600');
    });
    
    document.getElementById(`${tool}-tool`).classList.add('bg-indigo-100', 'dark:bg-gray-600');
    
    // Show tool-specific controls
    showToolControls(tool);
}

// Show tool-specific controls
function showToolControls(tool) {
    const controlsContainer = document.getElementById('tool-controls');
    controlsContainer.innerHTML = '';
    
    switch(tool) {
        case 'resize':
            showResizeControls(controlsContainer);
            break;
        case 'compress':
            showCompressControls(controlsContainer);
            break;
        case 'convert':
            showConvertControls(controlsContainer);
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
        // Add other tool controls as needed
        default:
            controlsContainer.innerHTML = '<p class="text-gray-500">Select an image and adjust the settings for this tool.</p>';
    }
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
            <button id="apply-resize" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                Apply Resize
            </button>
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
            <button id="apply-compress" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                Apply Compression
            </button>
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
            <button id="apply-watermark" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                Apply Watermark
            </button>
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
            <div class="mt-4">
                <button id="remove-metadata" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                    Remove Metadata
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('remove-metadata').addEventListener('click', function() {
        if (currentImageData) {
            removeMetadata();
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
        }, currentImageData.type);
    };
    
    img.src = currentImageData.url;
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
        }, currentImageData.type);
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
            }, currentImageData.type);
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
        }, currentImageData.type);
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
        }, currentImageData.type);
    };
    
    img.src = currentImageData.url;
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
            renderRecentFiles();
        } catch (e) {
            recentFiles = [];
        }
    }
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
            
            // Show reset button
            document.getElementById('reset-image').classList.remove('hidden');
            
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
            imageUpload.files = files;
            handleImageUpload({ target: { files: files } });
        }
    }
}
