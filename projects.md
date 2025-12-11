---
layout: default
title: "Мои проекты"
---

# 🚀 Мои проекты

{% for project in site.data.projects %}
<div class="project-card">
    <h2>{{ project.title }}</h2>
    
    <div class="project-meta">
        <span class="status status-{{ project.status | downcase | replace: ' ', '-' }}">
            {{ project.status }}
        </span>
        <span class="date">{{ project.date | date: "%d.%m.%Y" }}</span>
    </div>
    
    <p>{{ project.description }}</p>
    
    <div class="technologies">
        {% for tech in project.technologies %}
        <span class="tech-tag">{{ tech }}</span>
        {% endfor %}
    </div>
    
    <div class="project-links">
        {% if project.github %}
        <a href="{{ project.github }}" class="btn" target="_blank">
            <i class="fab fa-github"></i> Код
        </a>
        {% endif %}
        
        {% if project.demo %}
        <a href="{{ project.demo }}" class="btn btn-demo" target="_blank">
            <i class="fas fa-external-link-alt"></i> Демо
        </a>
        {% endif %}
    </div>
</div>
{% endfor %}