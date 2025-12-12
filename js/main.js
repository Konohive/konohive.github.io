/**
 * Konohive - Основной JavaScript файл
 * Загружает хедер и футер на все страницы
 */

// Конфигурация путей
const CONFIG = {
    headerPath: 'header.html',
    footerPath: 'footer.html',
    loadingTimeout: 5000,
    retryAttempts: 3,
    retryDelay: 1000
};

// Состояние приложения
const AppState = {
    isHeaderLoaded: false,
    isFooterLoaded: false,
    retryCount: 0,
    basePath: null
};

/**
 * Определяет базовый путь в зависимости от текущего расположения
 */
function determineBasePath() {
    const path = window.location.pathname;
    
    // Удаляем ведущий и завершающий слэши
    const cleanPath = path.replace(/^\/|\/$/g, '');
    
    if (cleanPath.includes('forum/')) {
        return '../';
    } else if (cleanPath.includes('tabs/')) {
        return '../';
    }
    return './';
}

/**
 * Загружает HTML компонент по указанному пути
 */
async function loadComponent(url) {
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        
        // Проверяем, что ответ содержит HTML
        if (!text.includes('<')) {
            throw new Error('Invalid HTML response');
        }
        
        return text;
    } catch (error) {
        console.error(`Failed to load component from ${url}:`, error);
        throw error;
    }
}

/**
 * Показывает сообщение об ошибке
 */
function showError(message, containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка загрузки</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn-secondary">
                    <i class="fas fa-redo"></i> Перезагрузить страницу
                </button>
            </div>
        `;
    }
}

/**
 * Загружает хедер на страницу
 */
async function loadHeader() {
    const container = document.getElementById('header-container');
    if (!container) {
        console.warn('Header container not found');
        return;
    }
    
    const basePath = determineBasePath();
    const headerUrl = basePath + CONFIG.headerPath;
    
    // Показываем скелетон во время загрузки
    container.innerHTML = `
        <div class="header-skeleton">
            <div class="skeleton-logo"></div>
            <div class="skeleton-nav">
                <span></span><span></span><span></span><span></span><span></span>
            </div>
        </div>
    `;
    
    try {
        const headerHTML = await loadComponent(headerUrl);
        container.innerHTML = headerHTML;
        AppState.isHeaderLoaded = true;
        
        // Инициализируем функциональность хедера
        initHeaderFunctionality();
        
        // Подсвечиваем текущую страницу
        highlightCurrentPage();
        
        // Добавляем класс для анимации появления
        setTimeout(() => {
            container.classList.add('loaded');
        }, 100);
        
    } catch (error) {
        if (AppState.retryCount < CONFIG.retryAttempts) {
            AppState.retryCount++;
            console.log(`Retrying header load (attempt ${AppState.retryCount})...`);
            setTimeout(loadHeader, CONFIG.retryDelay);
        } else {
            showError('Не удалось загрузить навигацию. Проверьте подключение к интернету.', 'header-container');
        }
    }
}

/**
 * Загружает футер на страницу
 */
async function loadFooter() {
    const container = document.getElementById('footer-container');
    if (!container) {
        console.warn('Footer container not found');
        return;
    }
    
    const basePath = determineBasePath();
    const footerUrl = basePath + CONFIG.footerPath;
    
    try {
        const footerHTML = await loadComponent(footerUrl);
        container.innerHTML = footerHTML;
        AppState.isFooterLoaded = true;
        
        // Добавляем класс для анимации появления
        setTimeout(() => {
            container.classList.add('loaded');
        }, 100);
        
    } catch (error) {
        if (AppState.retryCount < CONFIG.retryAttempts) {
            AppState.retryCount++;
            setTimeout(loadFooter, CONFIG.retryDelay);
        } else {
            showError('Не удалось загрузить футер.', 'footer-container');
        }
    }
}

/**
 * Инициализирует функциональность хедера (мобильное меню и т.д.)
 */
function initHeaderFunctionality() {
    // Мобильное меню
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            const isActive = mobileMenu.classList.toggle('active');
            this.innerHTML = isActive 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
            
            // Предотвращаем прокрутку тела при открытом меню
            document.body.style.overflow = isActive ? 'hidden' : '';
        });
        
        // Закрытие меню при клике на ссылку
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                document.body.style.overflow = '';
            });
        });
        
        // Закрытие меню при клике вне его
        document.addEventListener('click', (event) => {
            if (!mobileMenu.contains(event.target) && 
                !mobileMenuBtn.contains(event.target) && 
                mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                document.body.style.overflow = '';
            }
        });
    }
    
    // Плавная прокрутка для якорных ссылок
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const targetElement = document.querySelector(href);
            if (targetElement) {
                e.preventDefault();
                
                // Закрываем мобильное меню если открыто
                if (mobileMenu && mobileMenu.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    if (mobileMenuBtn) {
                        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                    }
                    document.body.style.overflow = '';
                }
                
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Подсвечивает текущую страницу в навигации
 */
function highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.main-nav a');
    
    // Удаляем подсветку со всех ссылок
    navLinks.forEach(link => {
        link.parentElement.classList.remove('current');
    });
    
    // Находим и подсвечиваем текущую страницу
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const basePath = determineBasePath();
        const fullHref = basePath === './' ? href : basePath + href;
        
        // Нормализуем пути для сравнения
        const normalizePath = (path) => {
            return path.replace(/^\/|\/$/g, '').replace(/index\.html$/, '');
        };
        
        const currentNormalized = normalizePath(currentPath);
        const hrefNormalized = normalizePath(fullHref);
        
        if (currentNormalized === hrefNormalized || 
            (currentNormalized === '' && href === 'index.html')) {
            link.parentElement.classList.add('current');
        }
    });
    
    // Также подсвечиваем в мобильном меню
    const mobileLinks = document.querySelectorAll('.mobile-menu a');
    mobileLinks.forEach(link => {
        const href = link.getAttribute('href');
        const basePath = determineBasePath();
        const fullHref = basePath === './' ? href : basePath + href;
        
        const normalizePath = (path) => {
            return path.replace(/^\/|\/$/g, '').replace(/index\.html$/, '');
        };
        
        const currentNormalized = normalizePath(currentPath);
        const hrefNormalized = normalizePath(fullHref);
        
        if (currentNormalized === hrefNormalized || 
            (currentNormalized === '' && href === 'index.html')) {
            link.classList.add('current');
        } else {
            link.classList.remove('current');
        }
    });
}

/**
 * Добавляет стили для скелетонов загрузки
 */
function addSkeletonStyles() {
    if (!document.getElementById('skeleton-styles')) {
        const style = document.createElement('style');
        style.id = 'skeleton-styles';
        style.textContent = `
            .header-skeleton {
                padding: 1rem 0;
                background: var(--bg-color);
            }
            
            .skeleton-logo {
                width: 150px;
                height: 40px;
                background: linear-gradient(90deg, var(--bg-light) 25%, var(--border-color) 50%, var(--bg-light) 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
                border-radius: var(--radius-sm);
            }
            
            .skeleton-nav {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .skeleton-nav span {
                flex: 1;
                height: 40px;
                background: linear-gradient(90deg, var(--bg-light) 25%, var(--border-color) 50%, var(--bg-light) 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
                border-radius: var(--radius-sm);
            }
            
            @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Инициализирует приложение
 */
function initApp() {
    console.log('Initializing Konohive application...');
    
    // Добавляем стили для скелетонов
    addSkeletonStyles();
    
    // Загружаем компоненты
    loadHeader();
    loadFooter();
    
    // Обновляем подсветку текущей страницы при изменении истории
    window.addEventListener('popstate', highlightCurrentPage);
    
    // Добавляем обработчик для всех ссылок навигации
    document.addEventListener('click', (event) => {
        if (event.target.matches('.main-nav a') || event.target.closest('.main-nav a')) {
            // Небольшая задержка для подсветки после перехода
            setTimeout(highlightCurrentPage, 100);
        }
    });
    
    // Отмечаем загрузку приложения
    setTimeout(() => {
        document.body.classList.add('loaded');
        console.log('Konohive application initialized successfully');
    }, 100);
}

/**
 * Утилиты для работы с DOM
 */
const DOMUtils = {
    /**
     * Создаёт элемент с указанными свойствами
     */
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
        
        return element;
    },
    
    /**
     * Вставляет элемент после указанного
     */
    insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    },
    
    /**
     * Проверяет, является ли элемент видимым в viewport
     */
    isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
};

/**
 * Обработчики событий
 */
const EventHandlers = {
    /**
     * Обработчик для навигации
     */
    handleNavigation(event) {
        const link = event.target.closest('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        
        // Проверяем, является ли ссылка внутренней
        if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
            // Добавляем индикатор загрузки
            document.body.classList.add('loading');
            
            // Через небольшой таймаут убираем индикатор (на случай, если страница загрузится быстро)
            setTimeout(() => {
                document.body.classList.remove('loading');
            }, 3000);
        }
    }
};

// Инициализируем приложение при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Экспортируем публичные методы для использования в других скриптах
window.Konohive = window.Konohive || {};
window.Konohive.App = {
    loadHeader,
    loadFooter,
    highlightCurrentPage,
    DOMUtils,
    EventHandlers
};

// Глобальные обработчики ошибок
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});