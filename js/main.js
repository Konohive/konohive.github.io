// Загружаем компоненты
document.addEventListener('DOMContentLoaded', function() {
    // Вставляем хедер
    const headerElement = document.getElementById('header');
    if (headerElement && window.GitHubComponents) {
        headerElement.innerHTML = window.GitHubComponents.Header;
    }
    
    // Вставляем футер
    const footerElement = document.getElementById('footer');
    if (footerElement && window.GitHubComponents) {
        footerElement.innerHTML = window.GitHubComponents.Footer;
    }
    
    // Добавляем активный класс к текущей странице
    highlightCurrentPage();
});

// Подсветка текущей страницы в навигации
function highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (currentPath.includes(linkPath) && linkPath !== 'index.html') {
            link.style.backgroundColor = 'rgba(255,255,255,0.2)';
            link.style.fontWeight = 'bold';
        }
    });
}