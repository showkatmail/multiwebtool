// Batch Processing Tool Functions
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
                    <option value="pdf">Convert to PDF</option>
                </select>
            </div>
            <div id="batch-options" class="mb-4"></div>
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
    
    document.getElementById('batch-images').addEventListener('change', handleBatchImageSelection);
    document.getElementById('batch-operation').addEventListener('change', updateBatchOptions);
    document.getElementById('process-batch').addEventListener('click', processBatchImages);
}

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
                    size: file.size,
                    id: Date.now() + Math.random() // Unique ID for tracking
                });
                
                loadedCount++;
                if (loadedCount === files.length) {
                    renderBatchPreview();
                    document.getElementById('process-batch').disabled = false;
                    updateBatchOptions();
                }
            };
            img.src = event.target.result;
        };
        
        reader.readAsDataURL(file);
    }
}

function renderBatchPreview() {
    const previewContainer = document.getElementById('batch-preview');
    previewContainer.innerHTML = '';
    
    // Check if PDF mode is selected
    const operation = document.getElementById('batch-operation').value;
    const isPdfMode = operation === 'pdf';
    
    if (isPdfMode) {
        // Add reorder instructions
        const instructionDiv = document.createElement('div');
        instructionDiv.className = 'bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg mb-3';
        instructionDiv.innerHTML = `
            <p class="text-xs text-blue-800 dark:text-blue-200 flex items-center">
                <i class="fas fa-info-circle mr-2"></i>
                <strong>Drag and drop to reorder images for PDF</strong>
            </p>
        `;
        previewContainer.appendChild(instructionDiv);
    }
    
    // Create container for thumbnails
    const thumbsContainer = document.createElement('div');
    thumbsContainer.id = 'batch-thumbs-container';
    thumbsContainer.className = 'flex flex-wrap gap-2';
    
    batchImages.forEach((imageData, index) => {
        const thumbContainer = document.createElement('div');
        thumbContainer.className = `relative inline-block cursor-move ${isPdfMode ? 'draggable-thumb' : ''}`;
        thumbContainer.setAttribute('data-index', index);
        thumbContainer.draggable = isPdfMode;
        
        thumbContainer.innerHTML = `
            <div class="relative group">
                <img src="${imageData.url}" class="w-20 h-20 object-cover rounded border-2 border-gray-300 dark:border-gray-600 transition-all">
                <div class="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center m-1">
                    ${index + 1}
                </div>
                <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 text-center truncate">
                    ${imageData.name.split('.').pop().toUpperCase()}
                </div>
                ${isPdfMode ? '<div class="absolute inset-0 bg-indigo-500 bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center"><i class="fas fa-arrows-alt text-white opacity-0 group-hover:opacity-100 text-2xl"></i></div>' : ''}
            </div>
        `;
        
        if (isPdfMode) {
            // Add drag and drop event listeners
            thumbContainer.addEventListener('dragstart', handleDragStart);
            thumbContainer.addEventListener('dragover', handleDragOver);
            thumbContainer.addEventListener('drop', handleDrop);
            thumbContainer.addEventListener('dragend', handleDragEnd);
        }
        
        thumbsContainer.appendChild(thumbContainer);
    });
    
    previewContainer.appendChild(thumbsContainer);
    
    // Add info text
    const infoText = document.createElement('p');
    infoText.className = 'text-sm text-gray-600 dark:text-gray-400 mt-3';
    infoText.textContent = `${batchImages.length} image(s) selected`;
    previewContainer.appendChild(infoText);
}

// Drag and Drop handlers
let draggedElement = null;
let draggedIndex = null;

function handleDragStart(e) {
    draggedElement = e.currentTarget;
    draggedIndex = parseInt(draggedElement.getAttribute('data-index'));
    draggedElement.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const targetElement = e.currentTarget;
    if (targetElement !== draggedElement && targetElement.classList.contains('draggable-thumb')) {
        targetElement.style.borderColor = '#4F46E5';
        targetElement.style.borderWidth = '3px';
    }
    
    return false;
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    
    const targetElement = e.currentTarget;
    const targetIndex = parseInt(targetElement.getAttribute('data-index'));
    
    if (draggedIndex !== targetIndex) {
        // Reorder the array
        const draggedItem = batchImages[draggedIndex];
        batchImages.splice(draggedIndex, 1);
        batchImages.splice(targetIndex, 0, draggedItem);
        
        // Re-render the preview
        renderBatchPreview();
        
        // Show notification
        showNotification(`Image moved from position ${draggedIndex + 1} to ${targetIndex + 1}`, 'success');
    }
    
    return false;
}

function handleDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    
    // Remove border highlights from all thumbnails
    const allThumbs = document.querySelectorAll('.draggable-thumb');
    allThumbs.forEach(thumb => {
        thumb.style.borderColor = '';
        thumb.style.borderWidth = '';
    });
}

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
            
        case 'pdf':
            optionsContainer.innerHTML = `
                <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3">
                    <p class="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Convert Images to PDF</strong><br>
                        Supports: JPEG, JPG, PNG, BMP, WebP
                    </p>
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">PDF Creation Mode</label>
                    <select id="batch-pdf-mode" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800">
                        <option value="separate">Separate PDFs (One PDF per image)</option>
                        <option value="combined">Combined PDF (All images in one PDF)</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Page Orientation</label>
                    <select id="batch-pdf-orientation" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800">
                        <option value="auto">Auto (Based on image)</option>
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Page Size</label>
                    <select id="batch-pdf-size" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800">
                        <option value="a4">A4</option>
                        <option value="letter">Letter</option>
                        <option value="legal">Legal</option>
                        <option value="fit">Fit to Image</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Image Quality</label>
                    <input type="range" id="batch-pdf-quality" min="1" max="100" value="85" class="w-full">
                    <div class="flex justify-between text-xs text-gray-500">
                        <span>Low Quality</span>
                        <span id="batch-pdf-quality-value">85</span>
                        <span>High Quality</span>
                    </div>
                </div>
            `;
            document.getElementById('batch-pdf-quality').addEventListener('input', function() {
                document.getElementById('batch-pdf-quality-value').textContent = this.value;
            });
            
            // Re-render preview to enable drag and drop
            if (batchImages.length > 0) {
                renderBatchPreview();
            }
            break;
    }
    
    // Re-render preview for non-PDF operations (to disable drag and drop)
    if (operation !== 'pdf' && batchImages.length > 0) {
        renderBatchPreview();
    }
}

async function processBatchImages() {
    if (batchImages.length === 0) {
        showNotification('Please select images to process', 'error');
        return;
    }
    
    const operation = document.getElementById('batch-operation').value;
    
    // Special handling for PDF conversion
    if (operation === 'pdf') {
        await processBatchToPdf();
        return;
    }
    
    const progressContainer = document.getElementById('batch-progress');
    const progressBar = document.getElementById('batch-progress-bar');
    const progressText = document.getElementById('batch-progress-text');
    
    progressContainer.classList.remove('hidden');
    document.getElementById('process-batch').disabled = true;
    
    let processedCount = 0;
    const totalCount = batchImages.length;
    
    batchImages.forEach((imageData, index) => {
        setTimeout(() => {
            processedCount++;
            const percentage = (processedCount / totalCount) * 100;
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${processedCount}/${totalCount}`;
            
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
            
            if (processedCount === totalCount) {
                setTimeout(() => {
                    progressContainer.classList.add('hidden');
                    document.getElementById('process-batch').disabled = false;
                    showNotification(`Successfully processed ${totalCount} images`, 'success');
                }, 500);
            }
        }, index * 100);
    });
}

async function processBatchToPdf() {
    if (batchImages.length === 0) {
        showNotification('Please select images to convert', 'error');
        return;
    }
    
    // Load jsPDF library if not already loaded
    if (typeof window.jspdf === 'undefined') {
        await loadJsPdfLibrary();
    }
    
    const mode = document.getElementById('batch-pdf-mode').value;
    const orientation = document.getElementById('batch-pdf-orientation').value;
    const pageSize = document.getElementById('batch-pdf-size').value;
    const quality = parseInt(document.getElementById('batch-pdf-quality').value) / 100;
    
    const progressContainer = document.getElementById('batch-progress');
    const progressBar = document.getElementById('batch-progress-bar');
    const progressText = document.getElementById('batch-progress-text');
    
    progressContainer.classList.remove('hidden');
    document.getElementById('process-batch').disabled = true;
    
    if (mode === 'separate') {
        // Create separate PDF for each image
        for (let i = 0; i < batchImages.length; i++) {
            const imageData = batchImages[i];
            await createSingleImagePdf(imageData, orientation, pageSize, quality);
            
            const percentage = ((i + 1) / batchImages.length) * 100;
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${i + 1}/${batchImages.length}`;
        }
        
        showNotification(`Successfully created ${batchImages.length} PDF(s)`, 'success');
    } else {
        // Create one combined PDF with all images in current order
        await createCombinedPdf(batchImages, orientation, pageSize, quality, progressBar, progressText);
        showNotification('Successfully created combined PDF with images in selected order', 'success');
    }
    
    setTimeout(() => {
        progressContainer.classList.add('hidden');
        document.getElementById('process-batch').disabled = false;
    }, 500);
}

async function createSingleImagePdf(imageData, orientation, pageSize, quality) {
    return new Promise((resolve) => {
        const { jsPDF } = window.jspdf;
        const img = new Image();
        
        img.onload = function() {
            // Determine orientation
            let pdfOrientation = orientation;
            if (orientation === 'auto') {
                pdfOrientation = img.width > img.height ? 'landscape' : 'portrait';
            }
            
            // Create PDF
            let pdf;
            if (pageSize === 'fit') {
                // Fit to image size (convert px to mm, assuming 96 DPI)
                const widthMm = (img.width * 25.4) / 96;
                const heightMm = (img.height * 25.4) / 96;
                pdf = new jsPDF({
                    orientation: pdfOrientation,
                    unit: 'mm',
                    format: [widthMm, heightMm]
                });
            } else {
                pdf = new jsPDF({
                    orientation: pdfOrientation,
                    unit: 'mm',
                    format: pageSize
                });
            }
            
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // Calculate image dimensions to fit page
            const imgRatio = img.width / img.height;
            const pageRatio = pageWidth / pageHeight;
            
            let imgWidth, imgHeight, x, y;
            
            if (imgRatio > pageRatio) {
                // Image is wider than page ratio
                imgWidth = pageWidth;
                imgHeight = pageWidth / imgRatio;
                x = 0;
                y = (pageHeight - imgHeight) / 2;
            } else {
                // Image is taller than page ratio
                imgHeight = pageHeight;
                imgWidth = pageHeight * imgRatio;
                x = (pageWidth - imgWidth) / 2;
                y = 0;
            }
            
            // Add image to PDF
            pdf.addImage(imageData.url, 'JPEG', x, y, imgWidth, imgHeight, undefined, 'FAST');
            
            // Download PDF
            const nameWithoutExt = imageData.name.replace(/\.[^/.]+$/, '');
            pdf.save(`${nameWithoutExt}.pdf`);
            
            resolve();
        };
        
        img.src = imageData.url;
    });
}

async function createCombinedPdf(images, orientation, pageSize, quality, progressBar, progressText) {
    return new Promise((resolve) => {
        const { jsPDF } = window.jspdf;
        let pdf = null;
        let processedCount = 0;
        
        const processNextImage = (index) => {
            if (index >= images.length) {
                // All images processed, save PDF
                pdf.save('combined_images.pdf');
                resolve();
                return;
            }
            
            const imageData = images[index];
            const img = new Image();
            
            img.onload = function() {
                // Determine orientation for this page
                let pdfOrientation = orientation;
                if (orientation === 'auto') {
                    pdfOrientation = img.width > img.height ? 'landscape' : 'portrait';
                }
                
                // Create PDF on first image
                if (pdf === null) {
                    if (pageSize === 'fit') {
                        const widthMm = (img.width * 25.4) / 96;
                        const heightMm = (img.height * 25.4) / 96;
                        pdf = new jsPDF({
                            orientation: pdfOrientation,
                            unit: 'mm',
                            format: [widthMm, heightMm]
                        });
                    } else {
                        pdf = new jsPDF({
                            orientation: pdfOrientation,
                            unit: 'mm',
                            format: pageSize
                        });
                    }
                } else {
                    // Add new page for subsequent images
                    if (pageSize === 'fit') {
                        const widthMm = (img.width * 25.4) / 96;
                        const heightMm = (img.height * 25.4) / 96;
                        pdf.addPage([widthMm, heightMm], pdfOrientation);
                    } else {
                        pdf.addPage(pageSize, pdfOrientation);
                    }
                }
                
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                
                // Calculate image dimensions to fit page
                const imgRatio = img.width / img.height;
                const pageRatio = pageWidth / pageHeight;
                
                let imgWidth, imgHeight, x, y;
                
                if (imgRatio > pageRatio) {
                    imgWidth = pageWidth;
                    imgHeight = pageWidth / imgRatio;
                    x = 0;
                    y = (pageHeight - imgHeight) / 2;
                } else {
                    imgHeight = pageHeight;
                    imgWidth = pageHeight * imgRatio;
                    x = (pageWidth - imgWidth) / 2;
                    y = 0;
                }
                
                // Add image to PDF
                pdf.addImage(imageData.url, 'JPEG', x, y, imgWidth, imgHeight, undefined, 'FAST');
                
                processedCount++;
                const percentage = (processedCount / images.length) * 100;
                progressBar.style.width = `${percentage}%`;
                progressText.textContent = `${processedCount}/${images.length}`;
                
                // Process next image
                processNextImage(index + 1);
            };
            
            img.src = imageData.url;
        };
        
        processNextImage(0);
    });
}

async function loadJsPdfLibrary() {
    return new Promise((resolve, reject) => {
        if (typeof window.jspdf !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

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
