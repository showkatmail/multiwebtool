// Theme Management
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    themeToggle.addEventListener('click', toggleTheme);
    darkModeToggle.addEventListener('change', toggleTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    
    const html = document.documentElement;
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    if (theme === 'dark') {
        html.classList.add('dark');
        if (darkModeToggle) darkModeToggle.checked = true;
    } else {
        html.classList.remove('dark');
        if (darkModeToggle) darkModeToggle.checked = false;
    }
}

function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        setTheme('light');
    } else {
        setTheme('dark');
    }
}