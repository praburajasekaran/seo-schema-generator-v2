if (!process.env.VITE_GEMINI_API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY environment variable not set");
}

// Development-only logging utility
const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

const devError = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
};

// Function to process HTML content and extract text
const processHtmlContent = (html: string): string => {
    // Extract text content from HTML (basic implementation)
    // Remove script and style elements
    const cleanHtml = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
    
    // Extract text content
    const textContent = cleanHtml
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    devLog(`Extracted text content length: ${textContent.length} characters`);
    
    // Limit content to prevent token limits (keep first 8000 characters)
    const finalContent = textContent.substring(0, 8000);
    devLog(`Final content length: ${finalContent.length} characters`);
    
    return finalContent;
};

// Function to generate schema without scraping - uses URL-based analysis only
const generateSchemaFromUrl = async (url: string, signal?: AbortSignal): Promise<string> => {
    try {
        devLog(`Generating schema for URL: ${url}`);
        
        // Parse URL to extract basic information
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const pathname = urlObj.pathname;
        
        // Create a basic schema based on URL patterns and domain
        const basicSchema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": domain.replace('www.', ''),
            "url": url,
            "description": `Website content from ${domain}`,
            "publisher": {
                "@type": "Organization",
                "name": domain.replace('www.', ''),
                "url": `${urlObj.protocol}//${urlObj.hostname}`
            }
        };

        // Add additional schema types based on URL patterns
        const additionalSchemas = [];

        // Check for common page types based on URL structure
        if (pathname.includes('/blog/') || pathname.includes('/article/') || pathname.includes('/post/')) {
            additionalSchemas.push({
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": `Article from ${domain}`,
                "url": url,
                "publisher": {
                    "@type": "Organization",
                    "name": domain.replace('www.', ''),
                    "url": `${urlObj.protocol}//${urlObj.hostname}`
                }
            });
        }

        if (pathname.includes('/product/') || pathname.includes('/shop/') || pathname.includes('/item/')) {
            additionalSchemas.push({
                "@context": "https://schema.org",
                "@type": "Product",
                "name": `Product from ${domain}`,
                "url": url,
                "offers": {
                    "@type": "Offer",
                    "url": url,
                    "availability": "https://schema.org/InStock"
                }
            });
        }

        if (pathname.includes('/about') || pathname.includes('/contact')) {
            additionalSchemas.push({
                "@context": "https://schema.org",
                "@type": "AboutPage",
                "name": `About page from ${domain}`,
                "url": url
            });
        }

        // Combine all schemas and format them for the UI
        const allSchemas = [basicSchema, ...additionalSchemas];
        
        // Convert to the format expected by the UI: array of {type, schema} objects
        const formattedSchemas = allSchemas.map((schema, index) => ({
            type: schema["@type"] || `Schema${index + 1}`,
            schema: JSON.stringify(schema, null, 2)
        }));
        
        devLog(`Generated ${formattedSchemas.length} schema(s) for URL: ${url}`);
        return JSON.stringify(formattedSchemas);

    } catch (error) {
        devError('Error in generateSchemaFromUrl:', error);
        if (signal?.aborted) {
            throw new Error("Operation was cancelled");
        }
        throw new Error(`Failed to generate schema from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const generateSchemaForUrl = async (url: string, signal?: AbortSignal): Promise<string> => {
    devLog(`Starting schema generation for URL: ${url}`);

    // Generate schema based on URL analysis only (no scraping)
    try {
        return await generateSchemaFromUrl(url, signal);
    } catch (error) {
        devError('Error generating schema from URL:', error);
        if (signal?.aborted) {
            throw new Error("Operation was cancelled");
        }
        throw new Error(`Failed to generate schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};