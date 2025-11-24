// Compress Tool Functions
function showCompressControls(container) {
    container.innerHTML = `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-medium mb-4">Compress File</h3>
            
            <!-- File Type Selector -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Compression Type</label>
                <div class="flex space-x-2">
                    <button id="compress-image-tab" class="px-4 py-2 bg-indigo-600 text-white rounded-lg transition-colors">
                        Image
                    </button>
                    <button id="compress-pdf-tab" class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors">
                        PDF
                    </button>
                </div>
            </div>

            <!-- Image Compression Controls -->
            <div id="image-compress-section">
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

            <!-- PDF Compression Controls -->
            <div id="pdf-compress-section" style="display: none;">
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Upload PDF</label>
                    <input type="file" id="pdf-upload" accept=".pdf" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1">Quality (1-100)</label>
                    <input type="range" id="pdf-quality" min="1" max="100" value="70" class="w-full">
                    <div class="flex justify-between text-xs text-gray-500">
                        <span>Low Quality</span>
                        <span id="pdf-quality-value">70</span>
                        <span>High Quality</span>
                    </div>
                </div>
                <div class="mb-4" id="pdf-info" style="display: none;">
                    <p>Original Size: <span id="pdf-original-size">N/A</span></p>
                    <p>Pages: <span id="pdf-pages">N/A</span></p>
                    <p>Estimated New Size: <span id="pdf-estimated-size">Calculating...</span></p>
                </div>
                <div class="flex space-x-2">
                    <button id="apply-pdf-compress" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors" disabled>
                        Compress PDF
                    </button>
                    <button id="download-pdf-compressed" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors" style="display: none;">
                        Download
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Tab switching
    const imageTab = document.getElementById('compress-image-tab');
    const pdfTab = document.getElementById('compress-pdf-tab');
    const imageSection = document.getElementById('image-compress-section');
    const pdfSection = document.getElementById('pdf-compress-section');
    
    imageTab.addEventListener('click', function() {
        imageTab.classList.add('bg-indigo-600', 'text-white');
        imageTab.classList.remove('bg-gray-300', 'dark:bg-gray-600', 'text-gray-700', 'dark:text-gray-200');
        pdfTab.classList.remove('bg-indigo-600', 'text-white');
        pdfTab.classList.add('bg-gray-300', 'dark:bg-gray-600', 'text-gray-700', 'dark:text-gray-200');
        imageSection.style.display = 'block';
        pdfSection.style.display = 'none';
    });
    
    pdfTab.addEventListener('click', function() {
        pdfTab.classList.add('bg-indigo-600', 'text-white');
        pdfTab.classList.remove('bg-gray-300', 'dark:bg-gray-600', 'text-gray-700', 'dark:text-gray-200');
        imageTab.classList.remove('bg-indigo-600', 'text-white');
        imageTab.classList.add('bg-gray-300', 'dark:bg-gray-600', 'text-gray-700', 'dark:text-gray-200');
        imageSection.style.display = 'none';
        pdfSection.style.display = 'block';
    });
    
    // Image compression events
    document.getElementById('compress-quality').addEventListener('input', function() {
        document.getElementById('quality-value').textContent = this.value;
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
            const quality = parseInt(document.getElementById('compress-quality').value) / 100;
            compressImageForDownload(quality);
        }
    });
    
    // PDF compression events
    setupPdfCompression();
}

// PDF Compression Functions
let currentPdfData = null;
let compressedPdfData = null;

function setupPdfCompression() {
    const pdfUpload = document.getElementById('pdf-upload');
    const pdfQuality = document.getElementById('pdf-quality');
    const applyPdfCompress = document.getElementById('apply-pdf-compress');
    const downloadPdfCompressed = document.getElementById('download-pdf-compressed');
    
    // PDF Quality slider
    pdfQuality.addEventListener('input', function() {
        document.getElementById('pdf-quality-value').textContent = this.value;
        if (currentPdfData) {
            const estimatedSize = Math.round(currentPdfData.size * (this.value / 100));
            document.getElementById('pdf-estimated-size').textContent = formatFileSize(estimatedSize);
        }
    });
    
    pdfUpload.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            currentPdfData = {
                file: file,
                name: file.name,
                size: file.size
            };
            
            document.getElementById('pdf-original-size').textContent = formatFileSize(file.size);
            document.getElementById('pdf-info').style.display = 'block';
            applyPdfCompress.disabled = false;
            
            // Update estimated size based on current quality
            const quality = parseInt(pdfQuality.value);
            const estimatedSize = Math.round(file.size * (quality / 100));
            document.getElementById('pdf-estimated-size').textContent = formatFileSize(estimatedSize);
            
            // Get PDF page count and show preview
            await getPdfPageCount(file);
            await showPdfPreview(file);
            
            showNotification('PDF loaded successfully', 'success');
        } else {
            showNotification('Please select a valid PDF file', 'error');
        }
    });
    
    applyPdfCompress.addEventListener('click', function() {
        if (currentPdfData) {
            const quality = parseInt(document.getElementById('pdf-quality').value);
            compressPdf(currentPdfData.file, quality);
        }
    });
    
    downloadPdfCompressed.addEventListener('click', function() {
        if (compressedPdfData) {
            downloadBlob(compressedPdfData, `compressed_${currentPdfData.name}`);
            showNotification('Compressed PDF downloaded successfully', 'success');
        }
    });
}

async function showPdfPreview(file) {
    try {
        // Load PDF.js library if not already loaded
        if (typeof pdfjsLib === 'undefined') {
            await loadPdfJsLibrary();
        }
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        // Get the first page for preview
        const page = await pdf.getPage(1);
        const scale = 1.5;
        const viewport = page.getViewport({ scale: scale });
        
        // Create canvas for preview
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render PDF page to canvas
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
        
        // Convert canvas to data URL and display in preview area
        const imageDataUrl = canvas.toDataURL('image/png');
        displayPdfPreview(imageDataUrl, pdf.numPages);
        
    } catch (error) {
        console.error('Error generating PDF preview:', error);
        showNotification('Could not generate PDF preview', 'warning');
    }
}

function displayPdfPreview(imageUrl, pageCount) {
    // Get or create the preview container (assuming you have an image preview area)
    const previewContainer = document.getElementById('image-preview') || document.querySelector('.image-preview');
    
    if (previewContainer) {
        previewContainer.innerHTML = `
            <div class="relative">
                <img src="${imageUrl}" alt="PDF Preview" class="max-w-full h-auto rounded-lg shadow-lg">
                <div class="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm">
                    PDF - ${pageCount} page${pageCount > 1 ? 's' : ''}
                </div>
                <div class="absolute bottom-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm">
                    Preview: Page 1
                </div>
            </div>
        `;
    } else {
        // If no preview container exists, try displayImage function with PDF indicator
        if (typeof displayImage === 'function') {
            displayImage(imageUrl);
        }
    }
}

async function getPdfPageCount(file) {
    try {
        // Load PDF.js library if not already loaded
        if (typeof pdfjsLib === 'undefined') {
            await loadPdfJsLibrary();
        }
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageCount = pdf.numPages;
        
        document.getElementById('pdf-pages').textContent = pageCount;
        return pageCount;
    } catch (error) {
        console.error('Error getting PDF page count:', error);
        document.getElementById('pdf-pages').textContent = 'Unknown';
        return 0;
    }
}

async function compressPdf(file, quality) {
    showNotification('Compressing PDF... This may take a moment', 'info');
    
    try {
        // Load PDF.js library if not already loaded
        if (typeof pdfjsLib === 'undefined') {
            await loadPdfJsLibrary();
        }
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        // Convert quality (1-100) to compression settings
        const imageQuality = quality / 100;
        
        // Adjust scale based on quality for better compression
        let scale = 1.0;
        if (quality < 40) {
            scale = 0.7;
        } else if (quality < 70) {
            scale = 0.85;
        } else {
            scale = 1.0;
        }
        
        // Create a new jsPDF instance
        const { jsPDF } = window.jspdf;
        const pdfDoc = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4',
            compress: true
        });
        
        // Remove the default first page
        pdfDoc.deletePage(1);
        
        // Process each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: scale });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            
            const imgData = canvas.toDataURL('image/jpeg', imageQuality);
            
            // Add page with correct dimensions
            pdfDoc.addPage([viewport.width, viewport.height]);
            pdfDoc.addImage(imgData, 'JPEG', 0, 0, viewport.width, viewport.height);
            
            // Update progress notification
            if (pdf.numPages > 1) {
                showNotification(`Compressing PDF... Page ${pageNum} of ${pdf.numPages}`, 'info');
            }
        }
        
        // Get the compressed PDF as blob
        const pdfBlob = pdfDoc.output('blob');
        compressedPdfData = pdfBlob;
        
        // Show preview of compressed PDF
        await showCompressedPdfPreview(pdfBlob);
        
        const compressionRatio = ((1 - (pdfBlob.size / file.size)) * 100).toFixed(1);
        
        document.getElementById('download-pdf-compressed').style.display = 'inline-block';
        showNotification(
            `PDF compressed successfully! Size reduced by ${compressionRatio}% (${formatFileSize(file.size)} → ${formatFileSize(pdfBlob.size)})`,
            'success'
        );
        
    } catch (error) {
        console.error('PDF compression error:', error);
        showNotification('Error compressing PDF. Please try a different file or quality level.', 'error');
    }
}

async function showCompressedPdfPreview(pdfBlob) {
    try {
        if (typeof pdfjsLib === 'undefined') {
            return;
        }
        
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        // Get the first page for preview
        const page = await pdf.getPage(1);
        const scale = 1.5;
        const viewport = page.getViewport({ scale: scale });
        
        // Create canvas for preview
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render PDF page to canvas
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
        
        // Convert canvas to data URL and display in preview area
        const imageDataUrl = canvas.toDataURL('image/png');
        displayCompressedPdfPreview(imageDataUrl, pdf.numPages);
        
    } catch (error) {
        console.error('Error generating compressed PDF preview:', error);
    }
}

function displayCompressedPdfPreview(imageUrl, pageCount) {
    const previewContainer = document.getElementById('image-preview') || document.querySelector('.image-preview');
    
    if (previewContainer) {
        previewContainer.innerHTML = `
            <div class="relative">
                <img src="${imageUrl}" alt="Compressed PDF Preview" class="max-w-full h-auto rounded-lg shadow-lg">
                <div class="absolute top-2 right-2 bg-green-600 bg-opacity-90 text-white px-3 py-1 rounded-lg text-sm">
                    Compressed PDF - ${pageCount} page${pageCount > 1 ? 's' : ''}
                </div>
                <div class="absolute bottom-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm">
                    Preview: Page 1
                </div>
            </div>
        `;
    } else {
        if (typeof displayImage === 'function') {
            displayImage(imageUrl);
        }
    }
}

async function loadPdfJsLibrary() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (typeof pdfjsLib !== 'undefined' && typeof window.jspdf !== 'undefined') {
            resolve();
            return;
        }
        
        // Load PDF.js
        const script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script1.onload = () => {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            // Load jsPDF
            const script2 = document.createElement('script');
            script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script2.onload = resolve;
            script2.onerror = reject;
            document.head.appendChild(script2);
        };
        script1.onerror = reject;
        document.head.appendChild(script1);
    });
}

// Original Image Compression Functions
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
