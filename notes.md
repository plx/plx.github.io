---
layout: page
title: Notes
permalink: /notes/
---

# Notes

{% assign sorted_notes = site.notes | sort: 'title' %}
{% for note in sorted_notes %}
<article class="note-summary">
  <h2><a href="{{ note.url | relative_url }}">{{ note.title }}</a></h2>
  {% if note.description %}
  <p>{{ note.description }}</p>
  {% endif %}
</article>
{% endfor %}

{% if site.notes.size == 0 %}
<p>No notes yet.</p>
{% endif %}