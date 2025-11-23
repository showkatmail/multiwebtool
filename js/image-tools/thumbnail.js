// Thumbnail Generator Functions
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
                <button id="generate-thumbnail" class="px -4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
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
        const width = parseInt(document.getElementById('thumb-width').value);
        const height = parseInt(document.getElementById('thumb-height').value);
        const quality = parseInt(document.getElementById('thumb-quality').value) / 100;
        
        if (width && height && currentImageData) {
            generateThumbnailForDownload(width, height, quality);
        }
    }
});
}
function generateThumbnail(width, height, quality) {
if (!currentImageData) return;
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const img = new Image();

img.onload = function() {
    canvas.width = width;
    canvas.height = height;
    
    let drawWidth = width;
    let drawHeight = height;
    const aspectRatio = img.width / img.height;
    
    if (aspectRatio > width / height) {
        drawHeight = width / aspectRatio;
    } else {
        drawWidth = height * aspectRatio;
    }
    
    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
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
function generateThumbnailForDownload(width, height, quality) {
if (!currentImageData) return;
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const img = new Image();

img.onload = function() {
    canvas.width = width;
    canvas.height = height;
    
    let drawWidth = width;
    let drawHeight = height;
    const aspectRatio = img.width / img.height;
    
    if (aspectRatio > width / height) {
        drawHeight = width / aspectRatio;
    } else {
        drawWidth = height * aspectRatio;
    }
    
    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
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