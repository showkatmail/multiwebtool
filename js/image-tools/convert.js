// Convert Tool Functions
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
                    <option value="pdf">PDF</option>
                </select>
            </div>
            <div id="pdf-options" class="mb-4 hidden">
                <label class="block text-sm font-medium mb-1">PDF Page Size</label>
                <select id="pdf-page-size" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800">
                    <option value="a4">A4</option>
                    <option value="letter">Letter</option>
                    <option value="legal">Legal</option>
                    <option value="fit">Fit to Image</option>
                </select>
                <div class="mt-2">
                    <label class="block text-sm font-medium mb-1">Orientation</label>
                    <select id="pdf-orientation" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800">
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                    </select>
                </div>
            </div>
            <button id="apply-convert" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                Convert & Download
            </button>
        </div>
    `;
    
    document.getElementById('convert-format').addEventListener('change', function() {
        const pdfOptions = document.getElementById('pdf-options');
        if (this.value === 'pdf') {
            pdfOptions.classList.remove('hidden');
        } else {
            pdfOptions.classList.add('hidden');
        }
    });
    
    document.getElementById('apply-convert').addEventListener('click', function() {
        const format = document.getElementById('convert-format').value;
        convertImage(format);
    });
}

function convertImage(format) {
    if (!currentImageData) {
        showNotification('No image loaded', 'error');
        return;
    }
    
    if (format === 'pdf') {
        convertImageToPDF();
        return;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(function(blob) {
            const originalName = currentImageData.name ? currentImageData.name.replace(/\.[^/.]+$/, '') : 'converted-image';
            downloadBlob(blob, `${originalName}.${format}`);
            showNotification(`Image converted to ${format.toUpperCase()}`, 'success');
        }, `image/${format}`);
    };
    
    img.src = currentImageData.url;
}

function convertImageToPDF() {
    if (!currentImageData) {
        showNotification('No image loaded', 'error');
        return;
    }
    
    const pageSize = document.getElementById('pdf-page-size').value;
    const orientation = document.getElementById('pdf-orientation').value;
    
    if (typeof window.jspdf === 'undefined') {
        showNotification('PDF library not loaded. Please refresh the page.', 'error');
        return;
    }
    
    const img = new Image();
    
    img.onload = function() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, img.width, img.height);
            
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const { jsPDF } = window.jspdf;
            let pdf;
            
            if (pageSize === 'fit') {
                const pxToMm = 25.4 / 96;
                const imgWidthMM = img.width * pxToMm;
                const imgHeightMM = img.height * pxToMm;
                const pdfOrientation = imgWidthMM > imgHeightMM ? 'landscape' : 'portrait';
                
                pdf = new jsPDF({
                    orientation: pdfOrientation,
                    unit: 'mm',
                    format: [imgWidthMM, imgHeightMM],
                    compress: true
                });
                
                pdf.addImage(imgData, 'JPEG', 0, 0, imgWidthMM, imgHeightMM, undefined, 'FAST');
            } else {
                pdf = new jsPDF({
                    orientation: orientation,
                    unit: 'mm',
                    format: pageSize,
                    compress: true
                });
                
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const margin = 10;
                const maxWidth = pageWidth - (margin * 2);
                const maxHeight = pageHeight - (margin * 2);
                const imgAspectRatio = img.width / img.height;
                const pageAspectRatio = maxWidth / maxHeight;
                
                let finalWidth, finalHeight, xPos, yPos;
                
                if (imgAspectRatio > pageAspectRatio) {
                    finalWidth = maxWidth;
                    finalHeight = maxWidth / imgAspectRatio;
                } else {
                    finalHeight = maxHeight;
                    finalWidth = maxHeight * imgAspectRatio;
                }
                
                xPos = (pageWidth - finalWidth) / 2;
                yPos = (pageHeight - finalHeight) / 2;
                
                pdf.addImage(imgData, 'JPEG', xPos, yPos, finalWidth, finalHeight, undefined, 'FAST');
            }
            
            const originalName = currentImageData.name ? currentImageData.name.replace(/\.[^/.]+$/, '') : 'converted-image';
            pdf.save(`${originalName}.pdf`);
            
            showNotification('PDF created and downloaded successfully!', 'success');
        } catch (error) {
            console.error('PDF Creation Error:', error);
            showNotification('Error creating PDF: ' + error.message, 'error');
        }
    };
    
    img.onerror = function() {
        showNotification('Failed to load image for PDF conversion', 'error');
    };
    
    if (!currentImageData.url.startsWith('data:')) {
        img.crossOrigin = 'Anonymous';
    }
    
    img.src = currentImageData.url;
}