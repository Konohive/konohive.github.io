// Определяет базовый путь для текущей страницы
function getBasePath() {
    const path = window.location.pathname;
    
    // Если мы в папке tabs/
    if (path.includes('/tabs/')) {
        return '../';
    }
    // Все остальные страницы (index.html, forum.html) - корень
    return './';
}

// Загружает компоненты на страницу
async function loadComponents() {
    const basePath = getBasePath();
    
    try {
        // Загружаем хедер
        const headerResponse = await fetch(basePath + 'header.html');
        if (!headerResponse.ok) throw new Error('Header not found');
        const headerHTML = await headerResponse.text();
        document.getElementById('header-container').innerHTML = headerHTML;
        
        // Загружаем футер
        const footerResponse = await fetch(basePath + 'footer.html');
        if (!footerResponse.ok) throw new Error('Footer not found');
        const footerHTML = await footerResponse.text();
        document.getElementById('footer-container').innerHTML = footerHTML;
        
        // Обновляем активные ссылки после загрузки
        updateActiveLinks();
        
    } catch (error) {
        console.error('Ошибка загрузки компонентов:', error);
        // Показываем заглушки если компоненты не загрузились
        document.getElementById('header-container').innerHTML = 
            '<div style="background:#f0f0f0; padding:20px; text-align:center">Навигация не загружена</div>';
        document.getElementById('footer-container').innerHTML = 
            '<div style="background:#f0f0f0; padding:20px; text-align:center">© 2025 Konohive</div>';
    }
}

// Обновляет активные ссылки в навигации
function updateActiveLinks() {
    const navLinks = document.querySelectorAll('.main-nav a');
    if (!navLinks.length) return;
    
    const currentPath = window.location.pathname;
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Определяем полный путь к странице
        let fullPath = href;
        if (href.startsWith('./')) fullPath = href.substring(2);
        
        // Проверяем, является ли текущая страница целевой
        const isActive = currentPath.endsWith(fullPath) || 
                        (currentPath === '/' && href === 'index.html');
        
        if (isActive) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем компоненты
    loadComponents();
    
    // Добавляем обработчик для изменения URL при переходе
    document.addEventListener('click', function(event) {
        const link = event.target.closest('a');
        if (link && link.href) {
            // Проверяем, что это внутренняя ссылка
            const isSameOrigin = link.hostname === window.location.hostname;
            const isAnchor = link.hash;
            
            if (isSameOrigin && !isAnchor) {
                // Позволяем браузеру обработать переход нормально
                // URL изменится автоматически
            }
        }
    });
});