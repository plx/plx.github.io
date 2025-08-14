#!/usr/bin/env node

import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, "..", "dist");
const IGNORED_PATTERNS = [
  /^mailto:/, // Email links
  /^tel:/, // Phone links
  /^https?:\/\//, // External links (handle separately if needed)
  /^\/\//, // Protocol-relative URLs
];

class LinkValidator {
  constructor() {
    this.allLinks = new Map(); // link -> Set of pages containing it
    this.brokenLinks = new Map(); // link -> Set of pages containing it
    this.fragmentLinks = new Map(); // fragment link -> Set of pages containing it
    this.brokenFragments = new Map(); // broken fragment -> Set of pages containing it
    this.validPaths = new Set();
    this.htmlFiles = [];
    this.pageIds = new Map(); // page path -> Set of IDs on that page
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
    const fragmentLinks = new Set();
    
    // Match href attributes
    const hrefRegex = /href=["']([^"']+)["']/gi;
    let match;
    
    while ((match = hrefRegex.exec(html)) !== null) {
      const link = match[1];
      
      // Handle fragment-only links separately
      if (link.startsWith("#")) {
        fragmentLinks.add(link);
        continue;
      }
      
      // Skip ignored patterns
      if (IGNORED_PATTERNS.some(pattern => pattern.test(link))) {
        continue;
      }
      
      // Process internal links (including those with fragments)
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
    
    return { links, fragmentLinks };
  }

  extractIds(html) {
    const ids = new Set();
    
    // Match id attributes in HTML elements (not in comments)
    // First, remove HTML comments to avoid false matches
    const htmlWithoutComments = html.replace(/<!--[\s\S]*?-->/g, "");
    
    // Match id attributes in any element
    const idRegex = /\sid=["']([^"']+)["']/gi;
    let match;
    
    while ((match = idRegex.exec(htmlWithoutComments)) !== null) {
      ids.add(match[1]);
    }
    
    return ids;
  }

  async validateFile(filePath) {
    const content = await fs.readFile(filePath, "utf-8");
    const { links, fragmentLinks } = this.extractLinks(content);
    const ids = this.extractIds(content);
    const relativePath = path.relative(DIST_DIR, filePath);
    
    // Store IDs for this page
    this.pageIds.set("/" + relativePath.replace(/index\.html$/, ""), ids);
    this.pageIds.set("/" + relativePath, ids);
    
    // Validate regular links
    for (const link of links) {
      // Split link and fragment
      const [linkPath, fragment] = link.split("#");
      
      if (!this.allLinks.has(linkPath)) {
        this.allLinks.set(linkPath, new Set());
      }
      this.allLinks.get(linkPath).add(relativePath);
      
      // Check if link path is valid
      if (!this.isValidLink(linkPath)) {
        if (!this.brokenLinks.has(linkPath)) {
          this.brokenLinks.set(linkPath, new Set());
        }
        this.brokenLinks.get(linkPath).add(relativePath);
      } else if (fragment) {
        // If the path is valid but has a fragment, validate the fragment later
        const fullLink = link;
        if (!this.fragmentLinks.has(fullLink)) {
          this.fragmentLinks.set(fullLink, new Set());
        }
        this.fragmentLinks.get(fullLink).add(relativePath);
      }
    }
    
    // Store fragment-only links for validation
    for (const fragmentLink of fragmentLinks) {
      if (!this.fragmentLinks.has(fragmentLink)) {
        this.fragmentLinks.set(fragmentLink, new Set());
      }
      this.fragmentLinks.get(fragmentLink).add(relativePath);
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

  validateFragments() {
    // Validate fragment links
    for (const [link, pages] of this.fragmentLinks) {
      if (link.startsWith("#")) {
        // Fragment-only link - check if ID exists on the same page
        const fragmentId = link.slice(1);
        for (const page of pages) {
          const pagePath = "/" + page.replace(/index\.html$/, "");
          const pageIdSet = this.pageIds.get(pagePath) || this.pageIds.get("/" + page);
          if (!pageIdSet || !pageIdSet.has(fragmentId)) {
            // Create a unique key for this fragment on this specific page
            const brokenKey = `${link} (on ${page})`;
            if (!this.brokenFragments.has(brokenKey)) {
              this.brokenFragments.set(brokenKey, new Set());
            }
            this.brokenFragments.get(brokenKey).add(page);
          }
        }
      } else {
        // Link with fragment - check if ID exists on the target page
        const [targetPath, fragmentId] = link.split("#");
        const targetPageIds = this.pageIds.get(targetPath) || 
                             this.pageIds.get(targetPath + "/") ||
                             this.pageIds.get(targetPath + "/index.html") ||
                             this.pageIds.get(targetPath + ".html");
        
        if (!targetPageIds || !targetPageIds.has(fragmentId)) {
          if (!this.brokenFragments.has(link)) {
            this.brokenFragments.set(link, new Set());
          }
          for (const page of pages) {
            this.brokenFragments.get(link).add(page);
          }
        }
      }
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
    
    // Validate fragments after all IDs have been collected
    this.validateFragments();
    
    // Report results
    this.reportResults();
  }

  reportResults() {
    const totalLinks = this.allLinks.size;
    const brokenCount = this.brokenLinks.size;
    const totalFragments = this.fragmentLinks.size;
    const brokenFragmentCount = this.brokenFragments.size;
    
    console.log(`📊 Link Validation Results`);
    console.log(`${"=".repeat(50)}`);
    console.log(`Total unique internal links: ${totalLinks}`);
    console.log(`Valid links: ${totalLinks - brokenCount}`);
    console.log(`Broken links: ${brokenCount}`);
    console.log(`\nTotal fragment links: ${totalFragments}`);
    console.log(`Valid fragments: ${totalFragments - brokenFragmentCount}`);
    console.log(`Broken fragments: ${brokenFragmentCount}\n`);
    
    let hasErrors = false;
    
    if (brokenCount > 0) {
      hasErrors = true;
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
    }
    
    if (brokenFragmentCount > 0) {
      hasErrors = true;
      console.log("❌ Broken Fragment Links Found:\n");
      
      for (const [link, pages] of this.brokenFragments) {
        // Extract the original link from the key (remove " (on page)" suffix if present)
        const displayLink = link.includes(" (on ") ? link.split(" (on ")[0] : link;
        console.log(`  ${displayLink}`);
        const pageList = Array.from(pages).slice(0, 3);
        for (const page of pageList) {
          console.log(`    → Found in: ${page}`);
        }
        if (pages.size > 3) {
          console.log(`    → And ${pages.size - 3} more files...`);
        }
        console.log();
      }
    }
    
    if (hasErrors) {
      process.exit(1);
    } else {
      console.log("✅ All internal links and fragments are valid!");
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