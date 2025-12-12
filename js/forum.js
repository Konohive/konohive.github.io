/**
 * Konohive Forum - JavaScript для работы с GitHub Issues
 */

// Конфигурация для вашего репозитория
const FORUM_CONFIG = {
    githubUser: 'Konohive',
    githubRepo: 'konohive.github.io',
    issuesPerPage: 15,
    cacheDuration: 60000, // 1 минута в миллисекундах
    apiBaseUrl: 'https://api.github.com',
    loadingStates: {
        LOADING: 'loading',
        SUCCESS: 'success',
        ERROR: 'error',
        EMPTY: 'empty'
    }
};

// Состояние форума
const ForumState = {
    currentPage: 1,
    currentFilter: 'all',
    currentSearch: '',
    totalPages: 1,
    totalIssues: 0,
    openIssues: 0,
    closedIssues: 0,
    allIssues: [],
    filteredIssues: [],
    isLoading: false,
    state: FORUM_CONFIG.loadingStates.LOADING,
    lastUpdate: null
};

// Элементы DOM
const DOM = {
    topicsContainer: null,
    loadingState: null,
    emptyState: null,
    errorState: null,
    topicsList: null,
    pagination: null,
    prevPageBtn: null,
    nextPageBtn: null,
    currentPageSpan: null,
    totalPagesSpan: null,
    topicsCountSpan: null,
    openCountSpan: null,
    closedCountSpan: null,
    searchInput: null,
    searchClearBtn: null,
    filterButtons: null,
    retryBtn: null
};

/**
 * Инициализирует форум
 */
function initForum() {
    console.log('Initializing Konohive Forum...');
    
    // Кэшируем элементы DOM
    cacheDOMElements();
    
    // Настраиваем обработчики событий
    setupEventListeners();
    
    // Загружаем темы
    loadForumTopics();
    
    // Настраиваем автообновление
    setupAutoRefresh();
    
    console.log('Forum initialized successfully');
}

/**
 * Кэширует элементы DOM
 */
function cacheDOMElements() {
    DOM.topicsContainer = document.getElementById('topics-container');
    DOM.loadingState = document.getElementById('loading-state');
    DOM.emptyState = document.getElementById('empty-state');
    DOM.errorState = document.getElementById('error-state');
    DOM.topicsList = document.querySelector('.topics-list');
    DOM.pagination = document.getElementById('pagination');
    DOM.prevPageBtn = document.getElementById('prevPage');
    DOM.nextPageBtn = document.getElementById('nextPage');
    DOM.currentPageSpan = document.getElementById('currentPage');
    DOM.totalPagesSpan = document.getElementById('totalPages');
    DOM.topicsCountSpan = document.getElementById('topics-count');
    DOM.openCountSpan = document.getElementById('open-count');
    DOM.closedCountSpan = document.getElementById('closed-count');
    DOM.searchInput = document.getElementById('topic-search');
    DOM.searchClearBtn = document.getElementById('searchClear');
    DOM.retryBtn = document.getElementById('retryBtn');
    
    // Фильтры
    DOM.filterButtons = document.querySelectorAll('.filter-btn');
}

/**
 * Настраивает обработчики событий
 */
function setupEventListeners() {
    // Фильтры
    DOM.filterButtons?.forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });
    
    // Поиск
    DOM.searchInput?.addEventListener('input', handleSearchInput);
    DOM.searchClearBtn?.addEventListener('click', handleSearchClear);
    
    // Пагинация
    DOM.prevPageBtn?.addEventListener('click', goToPrevPage);
    DOM.nextPageBtn?.addEventListener('click', goToNextPage);
    
    // Повторная попытка
    DOM.retryBtn?.addEventListener('click', handleRetry);
    
    // Обновление по клавише F5
    document.addEventListener('keydown', (event) => {
        if (event.key === 'F5') {
            event.preventDefault();
            loadForumTopics();
        }
    });
}

/**
 * Настраивает автообновление
 */
function setupAutoRefresh() {
    // Обновляем каждую минуту
    setInterval(() => {
        if (!ForumState.isLoading && document.visibilityState === 'visible') {
            loadForumTopics(false); // Без показа загрузки
        }
    }, 60000);
    
    // Обновляем при возвращении на вкладку
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const now = Date.now();
            if (!ForumState.lastUpdate || (now - ForumState.lastUpdate) > 30000) {
                loadForumTopics(false);
            }
        }
    });
}

/**
 * Загружает темы форума
 */
async function loadForumTopics(showLoading = true) {
    if (ForumState.isLoading) return;
    
    ForumState.isLoading = true;
    
    if (showLoading) {
        setForumState(FORUM_CONFIG.loadingStates.LOADING);
    }
    
    try {
        const { githubUser, githubRepo, issuesPerPage } = FORUM_CONFIG;
        const { currentPage, currentFilter } = ForumState;
        
        // Параметры запроса
        const stateParam = currentFilter === 'all' ? '' : `&state=${currentFilter}`;
        const url = `${FORUM_CONFIG.apiBaseUrl}/repos/${githubUser}/${githubRepo}/issues?per_page=${issuesPerPage}&page=${currentPage}${stateParam}&sort=created&direction=desc`;
        
        console.log(`Fetching issues from: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        const issues = await response.json();
        
        // Извлекаем информацию о пагинации из заголовков
        const linkHeader = response.headers.get('Link');
        updatePaginationInfo(linkHeader);
        
        // Фильтруем pull requests
        const filteredIssues = issues.filter(issue => !issue.pull_request);
        ForumState.allIssues = filteredIssues;
        
        // Обновляем статистику
        updateStatistics();
        
        // Применяем поиск если есть
        if (ForumState.currentSearch) {
            ForumState.filteredIssues = searchTopics(ForumState.currentSearch, filteredIssues);
        } else {
            ForumState.filteredIssues = filteredIssues;
        }
        
        // Отображаем темы
        displayTopics();
        
        // Обновляем время последнего обновления
        ForumState.lastUpdate = Date.now();
        
        // Устанавливаем состояние успеха
        setForumState(ForumState.filteredIssues.length > 0 ? 
            FORUM_CONFIG.loadingStates.SUCCESS : 
            FORUM_CONFIG.loadingStates.EMPTY);
        
    } catch (error) {
        console.error('Error loading forum topics:', error);
        setForumState(FORUM_CONFIG.loadingStates.ERROR, error.message);
    } finally {
        ForumState.isLoading = false;
    }
}

/**
 * Обновляет информацию о пагинации
 */
function updatePaginationInfo(linkHeader) {
    if (!linkHeader) {
        ForumState.totalPages = 1;
        return;
    }
    
    const links = linkHeader.split(',');
    let totalPages = ForumState.currentPage;
    
    links.forEach(link => {
        const match = link.match(/page=(\d+).*rel="last"/);
        if (match) {
            totalPages = parseInt(match[1]);
        }
    });
    
    ForumState.totalPages = totalPages || 1;
    updatePaginationUI();
}

/**
 * Обновляет статистику
 */
function updateStatistics() {
    const issues = ForumState.allIssues;
    
    ForumState.totalIssues = issues.length;
    ForumState.openIssues = issues.filter(issue => issue.state === 'open').length;
    ForumState.closedIssues = ForumState.totalIssues - ForumState.openIssues;
    
    updateStatisticsUI();
}

/**
 * Обновляет UI статистики
 */
function updateStatisticsUI() {
    if (DOM.topicsCountSpan) {
        DOM.topicsCountSpan.textContent = ForumState.totalIssues;
    }
    
    if (DOM.openCountSpan) {
        DOM.openCountSpan.textContent = ForumState.openIssues;
    }
    
    if (DOM.closedCountSpan) {
        DOM.closedCountSpan.textContent = ForumState.closedIssues;
    }
}

/**
 * Обновляет UI пагинации
 */
function updatePaginationUI() {
    if (!DOM.pagination || !DOM.currentPageSpan || !DOM.totalPagesSpan) return;
    
    const { currentPage, totalPages } = ForumState;
    
    DOM.currentPageSpan.textContent = currentPage;
    DOM.totalPagesSpan.textContent = totalPages;
    
    // Кнопки навигации
    if (DOM.prevPageBtn) {
        DOM.prevPageBtn.disabled = currentPage <= 1;
    }
    
    if (DOM.nextPageBtn) {
        DOM.nextPageBtn.disabled = currentPage >= totalPages;
    }
    
    // Показываем/скрываем пагинацию
    DOM.pagination.style.display = totalPages > 1 ? 'flex' : 'none';
}

/**
 * Устанавливает состояние форума
 */
function setForumState(state, errorMessage = '') {
    ForumState.state = state;
    
    // Скрываем все состояния
    [DOM.loadingState, DOM.emptyState, DOM.errorState, DOM.topicsContainer, DOM.pagination].forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    // Показываем соответствующее состояние
    switch (state) {
        case FORUM_CONFIG.loadingStates.LOADING:
            if (DOM.loadingState) DOM.loadingState.style.display = 'block';
            break;
            
        case FORUM_CONFIG.loadingStates.EMPTY:
            if (DOM.emptyState) DOM.emptyState.style.display = 'block';
            break;
            
        case FORUM_CONFIG.loadingStates.ERROR:
            if (DOM.errorState) {
                DOM.errorState.style.display = 'block';
                const errorMsgEl = document.getElementById('error-message');
                if (errorMsgEl) {
                    errorMsgEl.textContent = errorMessage || 'Неизвестная ошибка';
                }
            }
            break;
            
        case FORUM_CONFIG.loadingStates.SUCCESS:
            if (DOM.topicsContainer) DOM.topicsContainer.style.display = 'block';
            if (DOM.pagination) DOM.pagination.style.display = 'flex';
            break;
    }
}

/**
 * Отображает темы на странице
 */
function displayTopics() {
    if (!DOM.topicsContainer || !ForumState.filteredIssues.length) return;
    
    const issues = ForumState.filteredIssues;
    let html = '';
    
    issues.forEach(issue => {
        const isOpen = issue.state === 'open';
        const createdAt = formatDate(issue.created_at);
        const updatedAt = formatDate(issue.updated_at);
        const commentsCount = issue.comments || 0;
        
        // Ярлыки (labels)
        const labelsHtml = issue.labels.map(label => `
            <span class="topic-label" style="background:#${label.color}20;color:#${label.color}">
                ${escapeHtml(label.name)}
            </span>
        `).join('');
        
        // Краткое описание
        const bodyPreview = issue.body ? 
            truncateText(escapeHtml(issue.body), 150) : 
            'Нет описания';
        
        html += `
            <div class="topic-item ${isOpen ? 'open' : 'closed'}">
                <div class="topic-status-icon">
                    <i class="fas ${isOpen ? 'fa-circle' : 'fa-check-circle'}"></i>
                </div>
                
                <div class="topic-content">
                    <h3 class="topic-title">
                        <a href="${issue.html_url}" target="_blank" rel="noopener noreferrer">
                            ${escapeHtml(issue.title)}
                        </a>
                    </h3>
                    
                    <div class="topic-meta">
                        <span class="topic-author">
                            <i class="fas fa-user"></i> ${escapeHtml(issue.user.login)}
                        </span>
                        <span class="topic-date">
                            <i class="far fa-calendar"></i> ${createdAt}
                        </span>
                        <span class="topic-comments">
                            <i class="far fa-comment"></i> ${commentsCount}
                        </span>
                        ${labelsHtml ? `<span class="topic-labels">${labelsHtml}</span>` : ''}
                    </div>
                    
                    <p class="topic-preview">${bodyPreview}</p>
                    
                    ${updatedAt !== createdAt ? `
                        <div class="topic-updated">
                            <i class="fas fa-sync-alt"></i> Обновлено: ${updatedAt}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    DOM.topicsContainer.innerHTML = html;
}

/**
 * Поиск по темам
 */
function searchTopics(query, issues = ForumState.allIssues) {
    if (!query.trim()) return issues;
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return issues.filter(issue => {
        const searchText = `
            ${issue.title.toLowerCase()}
            ${issue.body?.toLowerCase() || ''}
            ${issue.user.login.toLowerCase()}
            ${issue.labels.map(label => label.name.toLowerCase()).join(' ')}
        `;
        
        return searchTerms.every(term => searchText.includes(term));
    });
}

/**
 * Обработчик клика по фильтру
 */
function handleFilterClick(event) {
    const button = event.currentTarget;
    const filter = button.dataset.filter;
    
    // Обновляем активный фильтр
    DOM.filterButtons?.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    // Обновляем состояние и загружаем темы
    ForumState.currentFilter = filter;
    ForumState.currentPage = 1;
    ForumState.currentSearch = '';
    
    if (DOM.searchInput) {
        DOM.searchInput.value = '';
    }
    
    loadForumTopics();
}

/**
 * Обработчик ввода поиска
 */
let searchTimeout;
function handleSearchInput(event) {
    clearTimeout(searchTimeout);
    
    const query = event.target.value.trim();
    ForumState.currentSearch = query;
    
    // Показываем/скрываем кнопку очистки
    if (DOM.searchClearBtn) {
        DOM.searchClearBtn.style.display = query ? 'block' : 'none';
    }
    
    // Задержка перед поиском
    searchTimeout = setTimeout(() => {
        if (query) {
            // Ищем среди уже загруженных тем
            ForumState.filteredIssues = searchTopics(query);
            displayTopics();
            
            // Обновляем состояние
            setForumState(ForumState.filteredIssues.length > 0 ? 
                FORUM_CONFIG.loadingStates.SUCCESS : 
                FORUM_CONFIG.loadingStates.EMPTY);
        } else {
            // Если поиск очищен, показываем все темы
            ForumState.filteredIssues = ForumState.allIssues;
            displayTopics();
            setForumState(FORUM_CONFIG.loadingStates.SUCCESS);
        }
    }, 500);
}

/**
 * Обработчик очистки поиска
 */
function handleSearchClear() {
    if (DOM.searchInput) {
        DOM.searchInput.value = '';
        DOM.searchInput.focus();
        handleSearchInput({ target: DOM.searchInput });
    }
}

/**
 * Переход на предыдущую страницу
 */
function goToPrevPage() {
    if (ForumState.currentPage > 1) {
        ForumState.currentPage--;
        loadForumTopics();
    }
}

/**
 * Переход на следующую страницу
 */
function goToNextPage() {
    if (ForumState.currentPage < ForumState.totalPages) {
        ForumState.currentPage++;
        loadForumTopics();
    }
}

/**
 * Обработчик повторной попытки
 */
function handleRetry() {
    loadForumTopics();
}

/**
 * Форматирует дату
 */
function formatDate(dateString) {
    if (!dateString) return 'Неизвестно';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // Форматируем в зависимости от давности
    if (diffMins < 1) {
        return 'только что';
    } else if (diffMins < 60) {
        return `${diffMins} ${pluralize(diffMins, ['минуту', 'минуты', 'минут'])} назад`;
    } else if (diffHours < 24) {
        return `${diffHours} ${pluralize(diffHours, ['час', 'часа', 'часов'])} назад`;
    } else if (diffDays < 7) {
        return `${diffDays} ${pluralize(diffDays, ['день', 'дня', 'дней'])} назад`;
    } else {
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

/**
 * Обрезает текст до указанной длины
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    
    // Обрезаем до последнего полного слова
    let truncated = text.substr(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > 0) {
        truncated = truncated.substr(0, lastSpace);
    }
    
    return truncated + '...';
}

/**
 * Экранирует HTML-сущности
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Склонение существительных с числительными
 */
function pluralize(number, forms) {
    const cases = [2, 0, 1, 1, 1, 2];
    return forms[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}

/**
 * Показывает уведомление
 */
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Добавляем стили если их ещё нет
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                background: var(--bg-color);
                border: 1px solid var(--border-color);
                border-radius: var(--radius);
                box-shadow: var(--shadow-strong);
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
                max-width: 400px;
            }
            
            .notification-success {
                border-left: 4px solid var(--primary-color);
            }
            
            .notification-error {
                border-left: 4px solid #f85149;
            }
            
            .notification-info {
                border-left: 4px solid var(--secondary-color);
            }
            
            .notification-close {
                background: none;
                border: none;
                color: var(--text-light);
                cursor: pointer;
                padding: 4px;
                margin-left: auto;
            }
            
            .notification-close:hover {
                color: var(--text-color);
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Добавляем уведомление на страницу
    document.body.appendChild(notification);
    
    // Закрытие по кнопке
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    // Автоматическое закрытие через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Инициализируем форум при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForum);
} else {
    initForum();
}

// Экспортируем публичные методы
window.Konohive = window.Konohive || {};
window.Konohive.Forum = {
    loadForumTopics,
    searchTopics,
    showNotification,
    formatDate
};

// Глобальные обработчики ошибок для форума
window.addEventListener('error', (event) => {
    console.error('Forum error:', event.error);
    showNotification('Произошла ошибка в работе форума', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection in forum:', event.reason);
    showNotification('Ошибка при работе с API', 'error');
});