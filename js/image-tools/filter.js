// Filter Tool Functions
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
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('ring-2', 'ring-indigo-500');
            });
            this.classList.add('ring-2', 'ring-indigo-500');
            
            if (['blur', 'brightness', 'contrast'].includes(filter)) {
                document.getElementById('filter-controls').classList.remove('hidden');
            } else {
                document.getElementById('filter-controls').classList.add('hidden');
            }
            
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
            if (activeFilters.length > 0) {
                const filter = activeFilters[0];
                const intensity = document.getElementById('filter-intensity').value / 100;
                applyFilterForDownload(filter, intensity);
            }
        }
    });
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
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
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

function applyFilterForDownload(filter, intensity) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
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