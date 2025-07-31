---
layout: default
title: Home
---

# Recent Articles

<div class="posts">
  {% for post in site.posts %}
    <article class="post-preview">
      <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
      <p class="post-meta">{{ post.date | date: "%B %-d, %Y" }}</p>
      <p class="post-description">{{ post.description }}</p>
      {% if post.tags.size > 0 %}
        <div class="post-tags">
          {% for tag in post.tags %}
            {% include tag-link.html tag=tag %}{% unless forloop.last %}, {% endunless %}
          {% endfor %}
        </div>
      {% endif %}
    </article>
  {% endfor %}
</div>