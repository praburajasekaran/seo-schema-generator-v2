<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SEO Schema Generator

A powerful tool that uses AI to analyze websites and generate structured data (JSON-LD schema markup) for better SEO and rich snippets in search results.

## Features

- **AI-Powered Analysis**: Uses Gemini AI to analyze webpage content and identify appropriate schema types
- **Multiple Schema Types**: Generates various schema types (Organization, Article, Product, Event, etc.)
- **Built-in Validation**: Validates generated schemas for correctness and completeness
- **Copy-Paste Ready**: Provides formatted JSON-LD code ready for implementation
- **Implementation Guide**: Includes detailed instructions for adding schemas to your website

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   ```bash
   npm run dev
   ```

## How to Use

1. **Enter a URL**: Paste any website URL you want to analyze
2. **Generate Schemas**: The AI will analyze the content and generate appropriate JSON-LD schemas
3. **Review & Copy**: Each schema includes validation results and implementation instructions
4. **Implement**: Follow the step-by-step guide to add the schema to your website

## Implementation Guide

The generated schemas include comprehensive implementation instructions:

- **Quick Implementation**: Shows exactly how to add the JSON-LD script tag to your HTML
- **Step-by-Step Guide**: Detailed instructions for manual implementation
- **Platform-Specific Methods**: Instructions for WordPress, Shopify, Google Tag Manager, and more
- **Testing Tools**: Recommended tools for validating your schema implementation

## Supported Schema Types

The tool can generate various schema types including:
- Organization/LocalBusiness
- Article/NewsArticle/BlogPosting
- Product
- Event
- Person
- WebSite
- And many more based on content analysis

## Benefits

- **Better SEO Rankings**: Help search engines understand your content
- **Rich Snippets**: Enhanced search results with images, ratings, and structured information
- **Voice Search Ready**: Optimize for voice assistants and featured snippets
- **Instant Validation**: Built-in validation ensures your markup is correct
