// Конфигурация форума
const FORUM_CONFIG = {
    githubUser: 'Konohive',
    githubRepo: 'konohive.github.io',
    itemsPerPage: 20,
    updateInterval: 30000, // 30 секунд
    commentLimit: 20
};

// Состояние форума
let forumState = {
    currentFilter: 'all',
    currentSearch: '',
    currentPage: 1,
    totalPages: 1,
    isLoading: false,
    loadedComments: {} // Кэш загруженных комментариев
};

// DOM элементы
const DOM = {
    topicsContainer: null,
    loadingEl: null,
    noTopicsEl: null,
    searchInput: null,
    filterButtons: null
};

// Инициализация форума
function initForum() {
    console.log('Инициализация форума...');
    
    // Получаем DOM элементы
    DOM.topicsContainer = document.getElementById('topics');
    DOM.loadingEl = document.getElementById('loading');
    DOM.noTopicsEl = document.getElementById('no-topics');
    DOM.searchInput = document.getElementById('search');
    DOM.filterButtons = document.querySelectorAll('.filter');
    
    // Загружаем темы
    loadTopics();
    
    // Настраиваем обработчики событий
    setupEventListeners();
    
    // Автообновление
    setupAutoRefresh();
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Фильтры
    if (DOM.filterButtons) {
        DOM.filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Обновляем активный фильтр
                DOM.filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Обновляем состояние и загружаем
                forumState.currentFilter = this.dataset.filter;
                forumState.currentPage = 1;
                forumState.currentSearch = '';
                
                // Сбрасываем поиск
                if (DOM.searchInput) {
                    DOM.searchInput.value = '';
                }
                
                loadTopics();
            });
        });
    }
    
    // Поиск
    if (DOM.searchInput) {
        let searchTimeout;
        DOM.searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                forumState.currentSearch = this.value.trim();
                forumState.currentPage = 1;
                loadTopics();
            }, 500);
        });
    }
}

// Настройка автообновления
function setupAutoRefresh() {
    // Обновляем каждые 30 секунд
    setInterval(() => {
        if (!forumState.isLoading && document.visibilityState === 'visible') {
            loadTopics(false); // Без показа загрузки
        }
    }, FORUM_CONFIG.updateInterval);
    
    // Обновляем при возвращении на вкладку
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const now = Date.now();
            loadTopics(false);
        }
    });
}

// Загрузка тем
async function loadTopics(showLoading = true) {
    if (forumState.isLoading) return;
    
    forumState.isLoading = true;
    
    if (showLoading) {
        showElement(DOM.loadingEl, true);
        showElement(DOM.topicsContainer, false);
        showElement(DOM.noTopicsEl, false);
    }
    
    try {
        const { githubUser, githubRepo, itemsPerPage } = FORUM_CONFIG;
        const { currentFilter, currentSearch } = forumState;
        
        // Параметры запроса
        const stateParam = currentFilter === 'all' ? '' : `state=${currentFilter}&`;
        const url = `https://api.github.com/repos/${githubUser}/${githubRepo}/issues?${stateParam}per_page=${itemsPerPage}&page=${forumState.currentPage}&sort=created&direction=desc`;
        
        console.log('Загрузка тем:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const issues = await response.json();
        
        // Фильтруем pull requests
        const filteredIssues = issues.filter(issue => !issue.pull_request);
        
        // Применяем поиск если есть
        const searchedIssues = currentSearch ? 
            searchTopics(currentSearch, filteredIssues) : 
            filteredIssues;
        
        // Отображаем темы
        displayTopics(searchedIssues);
        
        // Обновляем пагинацию из заголовков
        updatePaginationInfo(response.headers);
        
    } catch (error) {
        console.error('Ошибка загрузки тем:', error);
        showError('Не удалось загрузить темы. Проверьте подключение к интернету.');
    } finally {
        forumState.isLoading = false;
        
        if (showLoading) {
            showElement(DOM.loadingEl, false);
        }
    }
}

// Поиск по темам
function searchTopics(query, issues) {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return issues.filter(issue => {
        const searchText = `
            ${issue.title.toLowerCase()}
            ${issue.body?.toLowerCase() || ''}
            ${issue.user.login.toLowerCase()}
            ${issue.labels?.map(label => label.name.toLowerCase()).join(' ') || ''}
        `;
        
        return searchTerms.every(term => searchText.includes(term));
    });
}

// Отображение тем
function displayTopics(issues) {
    if (!DOM.topicsContainer) return;
    
    if (issues.length === 0) {
        showElement(DOM.topicsContainer, false);
        showElement(DOM.noTopicsEl, true);
        DOM.noTopicsEl.innerHTML = forumState.currentSearch ? 
            'По запросу ничего не найдено' : 
            'Тем для обсуждения пока нет';
        return;
    }
    
    showElement(DOM.noTopicsEl, false);
    showElement(DOM.topicsContainer, true);
    
    let html = '';
    
    issues.forEach(issue => {
        const isOpen = issue.state === 'open';
        const createdAt = formatDate(issue.created_at);
        const updatedAt = formatDate(issue.updated_at);
        const commentsCount = issue.comments || 0;
        
        // Форматируем тело issue
        const bodyPreview = issue.body ? 
            truncateText(escapeHtml(issue.body), 150) : 
            'Без описания';
        
        // Ярлыки
        const labelsHtml = issue.labels?.map(label => 
            `<span class="topic-label" style="background:#${label.color}20;color:#${label.color};padding:2px 8px;border-radius:12px;font-size:12px;margin-right:5px;">
                ${escapeHtml(label.name)}
            </span>`
        ).join('') || '';
        
        html += `
            <div class="topic ${isOpen ? '' : 'closed'}" data-id="${issue.number}">
                <h3>
                    <a href="${issue.html_url}" target="_blank" rel="noopener noreferrer">
                        ${escapeHtml(issue.title)}
                    </a>
                    <span class="comments-count">${commentsCount}</span>
                </h3>
                
                <div class="topic-meta">
                    <span><strong>${escapeHtml(issue.user.login)}</strong></span>
                    <span>${createdAt}</span>
                    ${labelsHtml ? `<span>${labelsHtml}</span>` : ''}
                </div>
                
                ${bodyPreview !== 'Без описания' ? `
                    <p style="color:#666; margin:10px 0; font-size:14px;">
                        ${bodyPreview}
                    </p>
                ` : ''}
                
                <div class="topic-actions">
                    <button class="show-comments" data-id="${issue.number}" data-count="${commentsCount}">
                        ${commentsCount > 0 ? 
                            `Показать комментарии (${commentsCount})` : 
                            'Нет комментариев'}
                    </button>
                    <a href="${issue.html_url}" target="_blank" rel="noopener noreferrer" style="margin-left:10px;color:#0366d6;text-decoration:none;font-size:14px;">
                        Открыть на GitHub
                    </a>
                </div>
                
                <div class="comments-container" id="comments-${issue.number}" style="display:none;"></div>
            </div>
        `;
    });
    
    DOM.topicsContainer.innerHTML = html;
    
    // Добавляем обработчики для кнопок комментариев
    setupCommentButtons();
}

// Настройка кнопок комментариев
function setupCommentButtons() {
    const commentButtons = document.querySelectorAll('.show-comments');
    
    commentButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const issueId = this.dataset.id;
            const commentsContainer = document.getElementById(`comments-${issueId}`);
            
            if (!commentsContainer) return;
            
            // Переключаем видимость
            const isVisible = commentsContainer.style.display === 'block';
            
            if (!isVisible && !forumState.loadedComments[issueId]) {
                // Загружаем комментарии если еще не загружены
                await loadComments(issueId, commentsContainer);
                forumState.loadedComments[issueId] = true;
            }
            
            // Показываем/скрываем
            commentsContainer.style.display = isVisible ? 'none' : 'block';
            this.textContent = isVisible ? 
                `Показать комментарии (${this.dataset.count})` : 
                'Скрыть комментарии';
        });
    });
}

// Загрузка комментариев
async function loadComments(issueId, container) {
    try {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#666;">Загрузка комментариев...</div>';
        
        const { githubUser, githubRepo } = FORUM_CONFIG;
        const url = `https://api.github.com/repos/${githubUser}/${githubRepo}/issues/${issueId}/comments?per_page=${FORUM_CONFIG.commentLimit}&sort=created&direction=desc`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const comments = await response.json();
        
        if (comments.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:20px;color:#666;">Нет комментариев</div>';
            return;
        }
        
        let commentsHtml = '<div class="comments-list">';
        
        comments.forEach(comment => {
            const createdAt = formatDateTime(comment.created_at);
            const updatedAt = formatDateTime(comment.updated_at);
            const isEdited = comment.created_at !== comment.updated_at;
            
            commentsHtml += `
                <div class="comment">
                    <div class="comment-header">
                        <img src="${comment.user.avatar_url}" 
                             alt="${escapeHtml(comment.user.login)}"
                             style="width:32px;height:32px;border-radius:50%;">
                        <div style="flex:1;margin-left:10px;">
                            <strong>${escapeHtml(comment.user.login)}</strong>
                            <div style="color:#666;font-size:12px;">
                                ${createdAt}
                                ${isEdited ? ` (редактировано: ${updatedAt})` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="comment-body" style="margin:10px 0 15px 42px;padding:10px;background:#f8f9fa;border-radius:6px;">
                        ${formatCommentBody(comment.body)}
                    </div>
                    <div style="margin-left:42px;">
                        <a href="${comment.html_url}" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           style="color:#0366d6;text-decoration:none;font-size:13px;">
                           Ссылка на комментарий
                        </a>
                    </div>
                </div>
                <hr style="border:none;border-top:1px solid #e1e4e8;margin:15px 0;">
            `;
        });
        
        commentsHtml += '</div>';
        container.innerHTML = commentsHtml;
        
    } catch (error) {
        console.error('Ошибка загрузки комментариев:', error);
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#d73a49;">Ошибка загрузки комментариев</div>';
    }
}

// Форматирование текста комментария (Markdown → HTML)
function formatCommentBody(text) {
    if (!text) return '';
    
    return text
        // Экранирование HTML
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Заголовки
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Жирный текст
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Курсив
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Списки
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        // Код
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Ссылки
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        // Переносы строк
        .replace(/\n/g, '<br>');
}

// Обновление информации о пагинации
function updatePaginationInfo(headers) {
    const linkHeader = headers.get('Link');
    if (!linkHeader) {
        forumState.totalPages = 1;
        return;
    }
    
    const links = linkHeader.split(',');
    let totalPages = forumState.currentPage;
    
    links.forEach(link => {
        const match = link.match(/page=(\d+).*rel="last"/);
        if (match) {
            totalPages = parseInt(match[1]);
        }
    });
    
    forumState.totalPages = totalPages || 1;
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'сегодня';
    } else if (diffDays === 1) {
        return 'вчера';
    } else if (diffDays < 7) {
        return `${diffDays} дней назад`;
    } else {
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Форматирование даты и времени
function formatDateTime(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Утилиты
function showElement(element, show) {
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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

function showError(message) {
    if (DOM.topicsContainer) {
        DOM.topicsContainer.innerHTML = `
            <div style="text-align:center;padding:40px;color:#d73a49;background:#ffebef;border-radius:8px;border:1px solid #fdaeb7;">
                <h3 style="margin-bottom:10px;">Ошибка</h3>
                <p>${message}</p>
                <button onclick="loadTopics()" style="margin-top:15px;padding:8px 16px;background:#2ea44f;color:white;border:none;border-radius:4px;cursor:pointer;">
                    Попробовать снова
                </button>
            </div>
        `;
        showElement(DOM.topicsContainer, true);
    }
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForum);
} else {
    initForum();
}

// Экспорт для отладки
window.Forum = {
    loadTopics,
    loadComments,
    formatDate,
    formatCommentBody
};