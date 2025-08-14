#!/usr/bin/env node

import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, "..", "dist");
const IGNORED_PATTERNS = [
  /^#/, // Fragment-only links
  /^mailto:/, // Email links
  /^tel:/, // Phone links
  /^https?:\/\//, // External links (handle separately if needed)
  /^\/\//, // Protocol-relative URLs
];

class LinkValidator {
  constructor() {
    this.allLinks = new Map(); // link -> Set of pages containing it
    this.brokenLinks = new Map(); // link -> Set of pages containing it
    this.validPaths = new Set();
    this.htmlFiles = [];
  }

  async findHtmlFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await this.findHtmlFiles(fullPath);
      } else if (entry.name.endsWith(".html")) {
        this.htmlFiles.push(fullPath);
        // Add this HTML file as a valid path
        const relativePath = path.relative(DIST_DIR, fullPath);
        this.validPaths.add("/" + relativePath);
        this.validPaths.add("/" + relativePath.replace(/index\.html$/, ""));
        this.validPaths.add("/" + relativePath.replace(/\.html$/, ""));
      }
    }
  }

  extractLinks(html) {
    const links = new Set();
    
    // Match href attributes
    const hrefRegex = /href=["']([^"']+)["']/gi;
    let match;
    
    while ((match = hrefRegex.exec(html)) !== null) {
      const link = match[1];
      
      // Skip ignored patterns
      if (IGNORED_PATTERNS.some(pattern => pattern.test(link))) {
        continue;
      }
      
      // Only process internal links
      if (link.startsWith("/")) {
        links.add(link);
      }
    }
    
    // Match src attributes for images, scripts, etc.
    const srcRegex = /src=["']([^"']+)["']/gi;
    while ((match = srcRegex.exec(html)) !== null) {
      const link = match[1];
      
      if (IGNORED_PATTERNS.some(pattern => pattern.test(link))) {
        continue;
      }
      
      if (link.startsWith("/")) {
        links.add(link);
      }
    }
    
    return links;
  }

  async validateFile(filePath) {
    const content = await fs.readFile(filePath, "utf-8");
    const links = this.extractLinks(content);
    const relativePath = path.relative(DIST_DIR, filePath);
    
    for (const link of links) {
      // Remove fragment identifier for validation
      const linkWithoutFragment = link.split("#")[0];
      
      if (!this.allLinks.has(linkWithoutFragment)) {
        this.allLinks.set(linkWithoutFragment, new Set());
      }
      this.allLinks.get(linkWithoutFragment).add(relativePath);
      
      // Check if link is valid
      if (!this.isValidLink(linkWithoutFragment)) {
        if (!this.brokenLinks.has(linkWithoutFragment)) {
          this.brokenLinks.set(linkWithoutFragment, new Set());
        }
        this.brokenLinks.get(linkWithoutFragment).add(relativePath);
      }
    }
  }

  isValidLink(link) {
    // Check if the exact path exists
    if (this.validPaths.has(link)) {
      return true;
    }
    
    // Check if it's a directory that might have an index.html
    if (!link.endsWith("/") && this.validPaths.has(link + "/")) {
      return true;
    }
    
    // Check if adding .html makes it valid
    if (!link.endsWith(".html") && this.validPaths.has(link + ".html")) {
      return true;
    }
    
    // Check if adding /index.html makes it valid
    if (this.validPaths.has(link + "/index.html")) {
      return true;
    }
    
    // Check if it's a static asset
    const assetPath = path.join(DIST_DIR, link.slice(1)); // Remove leading /
    try {
      const stats = fsSync.statSync(assetPath);
      return stats.isFile() || stats.isDirectory();
    } catch {
      return false;
    }
  }

  async validate() {
    console.log("🔍 Starting link validation...\n");
    
    // Check if dist directory exists
    try {
      await fs.access(DIST_DIR);
    } catch {
      console.error("❌ Error: dist directory not found. Please run \"npm run build\" first.");
      process.exit(1);
    }
    
    // Find all HTML files
    await this.findHtmlFiles(DIST_DIR);
    console.log(`📁 Found ${this.htmlFiles.length} HTML files\n`);
    
    // Validate each file
    for (const file of this.htmlFiles) {
      await this.validateFile(file);
    }
    
    // Report results
    this.reportResults();
  }

  reportResults() {
    const totalLinks = this.allLinks.size;
    const brokenCount = this.brokenLinks.size;
    
    console.log(`📊 Link Validation Results`);
    console.log(`${"=".repeat(50)}`);
    console.log(`Total unique internal links: ${totalLinks}`);
    console.log(`Valid links: ${totalLinks - brokenCount}`);
    console.log(`Broken links: ${brokenCount}\n`);
    
    if (brokenCount > 0) {
      console.log("❌ Broken Links Found:\n");
      
      for (const [link, pages] of this.brokenLinks) {
        console.log(`  ${link}`);
        const pageList = Array.from(pages).slice(0, 3);
        for (const page of pageList) {
          console.log(`    → Found in: ${page}`);
        }
        if (pages.size > 3) {
          console.log(`    → And ${pages.size - 3} more files...`);
        }
        console.log();
      }
      
      process.exit(1);
    } else {
      console.log("✅ All internal links are valid!");
      process.exit(0);
    }
  }
}

// Run validation
const validator = new LinkValidator();
validator.validate().catch(error => {
  console.error("❌ Validation error:", error);
  process.exit(1);
});