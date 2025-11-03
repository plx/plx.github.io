#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Check if words argument is provided
if (process.argv.length < 3) {
    console.log('Usage: node learn-spelling.js <comma-separated-words>');
    process.exit(1);
}

// Parse input words
const newWords = process.argv[2]
    .split(',')
    .map(w => w.trim())
    .filter(w => w.length > 0);

if (newWords.length === 0) {
    console.log('No words provided');
    process.exit(1);
}

// Read cspell.json
const configPath = path.join(process.cwd(), 'cspell.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Get existing words
const existingWords = new Set(config.words || []);

// Add new words (skip duplicates)
let added = 0;
let skipped = 0;
newWords.forEach(word => {
    if (existingWords.has(word)) {
        console.log(`Skipping duplicate: ${word}`);
        skipped++;
    } else {
        existingWords.add(word);
        added++;
        console.log(`Adding: ${word}`);
    }
});

// Sort alphabetically (case-insensitive)
config.words = Array.from(existingWords).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
);

// Write back with pretty formatting
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');

console.log(`\nDone! Added ${added} word(s), skipped ${skipped} duplicate(s).`);
console.log(`Total words in dictionary: ${config.words.length}`);
