// Watermark Tool Functions
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

function addTextWatermark(text, fontSize, color, position, opacity) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        
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

function addTextWatermarkForDownload(text, fontSize, color, position, opacity) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        
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
            
            ctx.globalAlpha = opacity;
            
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
            
            ctx.globalAlpha = opacity;
            
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