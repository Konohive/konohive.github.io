---
layout: default
title: "Главная"
---

# 👋 Привет, я {{ site.author.name }}

Разработчик с фокусом на создание качественных решений.

## 🚀 Последние проекты

{% for project in site.projects limit:3 %}
### [{{ project.title }}]({{ project.url }})
{{ project.description }}

**Технологии:** {{ project.technologies | join: ", " }}

[Подробнее →]({{ project.url }})
{% endfor %}

## 📊 Мои навыки

### Backend
- Python (Django, FastAPI)
- Node.js, Express
- Базы данных: PostgreSQL, MongoDB

### Frontend
- HTML/CSS, JavaScript
- React, Vue.js
- TypeScript

### Инструменты
- Git, Docker
- CI/CD (GitHub Actions)
- Linux, Nginx