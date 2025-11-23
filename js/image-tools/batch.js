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
                    size: file.size
                });
                
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