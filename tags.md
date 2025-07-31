---
layout: page
title: Tags
permalink: /tags/
---

{% comment %}
Collect all tags from posts
{% endcomment %}
{% assign tags = "" | split: "" %}
{% for post in site.posts %}
  {% assign tags = tags | concat: post.tags | uniq %}
{% endfor %}
{% assign tags = tags | sort %}

{% comment %}
Display posts grouped by tag
{% endcomment %}
{% for tag in tags %}
  <h2 id="{{ tag | slugify }}">{{ tag }}</h2>
  <ul class="tag-posts">
    {% for post in site.posts %}
      {% if post.tags contains tag %}
        <li>
          <span class="post-date">{{ post.date | date: "%Y-%m-%d" }}</span> &raquo;
          <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        </li>
      {% endif %}
    {% endfor %}
  </ul>
{% endfor %}