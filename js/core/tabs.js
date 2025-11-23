// Tab Management
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    // First, hide all panels
    tabPanels.forEach(panel => {
        panel.classList.add('hidden');
    });
    
    // Set all tabs to inactive state
    tabButtons.forEach(btn => {
        btn.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'border-b-2', 'border-indigo-600', 'dark:border-indigo-400');
        btn.classList.add('text-gray-600', 'dark:text-gray-400');
    });
    
    // Now specifically activate the Image Tools tab
    const imageToolsTab = document.querySelector('.tab-btn[data-tab="image-tools"]');
    const imageToolsPanel = document.getElementById('image-tools-tab');
    
    if (imageToolsTab && imageToolsPanel) {
        // Activate the tab button
        imageToolsTab.classList.remove('text-gray-600', 'dark:text-gray-400');
        imageToolsTab.classList.add('text-indigo-600', 'dark:text-indigo-400', 'border-b-2', 'border-indigo-600', 'dark:border-indigo-400');
        
        // Show the panel
        imageToolsPanel.classList.remove('hidden');
    }
    
    // Add click event listeners to all tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Update button styles
            tabButtons.forEach(btn => {
                btn.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'border-b-2', 'border-indigo-600', 'dark:border-indigo-400');
                btn.classList.add('text-gray-600', 'dark:text-gray-400');
            });
            
            // Activate clicked button
            button.classList.remove('text-gray-600', 'dark:text-gray-400');
            button.classList.add('text-indigo-600', 'dark:text-indigo-400', 'border-b-2', 'border-indigo-600', 'dark:border-indigo-400');
            
            // Update panel visibility
            tabPanels.forEach(panel => {
                panel.classList.add('hidden');
            });
            
            const targetPanel = document.getElementById(`${targetTab}-tab`);
            if (targetPanel) {
                targetPanel.classList.remove('hidden');
                
                // Initialize QR generator if QR tab is selected
                if (targetTab === 'qr-generator') {
                    initializeQRCodeGenerator();
                }
            }
        });
    });
}