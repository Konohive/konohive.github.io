// Компонент хедера
const Header = `
<header class="site-header">
    <div class="nav-container">
        <a href="index.html" class="logo">GitHub Explorer</a>
        
        <nav class="main-nav">
            <!-- Главная -->
            <a href="index.html" class="nav-link">Главная</a>
            
            <!-- Репозитории с выпадающим меню -->
            <div class="nav-item">
                <a href="repositories/index.html" class="nav-link">Репозитории</a>
                <div class="dropdown-menu">
                    <a href="repositories/popular.html">Популярные</a>
                    <a href="repositories/recent.html">Недавние</a>
                    <a href="repositories/forks.html">Форки</a>
                </div>
            </div>
            
            <!-- Звезды с выпадающим меню -->
            <div class="nav-item">
                <a href="stars/index.html" class="nav-link">Звезды</a>
                <div class="dropdown-menu">
                    <a href="stars/trending.html">Тренды</a>
                    <a href="stars/languages.html">По языкам</a>
                    <a href="stars/topics.html">По темам</a>
                </div>
            </div>
            
            <!-- Gists с выпадающим меню -->
            <div class="nav-item">
                <a href="gists/index.html" class="nav-link">Gists</a>
                <div class="dropdown-menu">
                    <a href="gists/public.html">Публичные</a>
                    <a href="gists/private.html">Приватные</a>
                    <a href="gists/starred.html">Отмеченные</a>
                </div>
            </div>
            
            <!-- Активность с выпадающим меню -->
            <div class="nav-item">
                <a href="activity/index.html" class="nav-link">Активность</a>
                <div class="dropdown-menu">
                    <a href="activity/commits.html">Коммиты</a>
                    <a href="activity/issues.html">Issues</a>
                    <a href="activity/pulls.html">Pull Requests</a>
                </div>
            </div>
        </nav>
    </div>
</header>
`;

// Компонент футера
const Footer = `
<footer class="site-footer">
    <div class="footer-content">
        <p>© 2024 GitHub Explorer. Исследуйте GitHub профили.</p>
        <div class="footer-links">
            <a href="index.html">Главная</a>
            <a href="repositories/index.html">Репозитории</a>
            <a href="stars/index.html">Звезды</a>
            <a href="gists/index.html">Gists</a>
            <a href="activity/index.html">Активность</a>
        </div>
    </div>
</footer>
`;

// Экспорт
window.GitHubComponents = { Header, Footer };