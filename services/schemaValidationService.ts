export interface ValidationError {
  type: 'error' | 'warning' | 'info';
  message: string;
  path?: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
  score: number; // 0-100 validation score
}

export interface ValidatedSchema {
  type: string;
  schema: string;
  validation: ValidationResult;
}

// Common Schema.org types and their required properties
const SCHEMA_REQUIREMENTS: Record<string, { required: string[]; recommended: string[] }> = {
  'Article': {
    required: ['@context', '@type', 'headline'],
    recommended: ['author', 'datePublished', 'dateModified', 'publisher', 'description', 'image']
  },
  'Product': {
    required: ['@context', '@type', 'name'],
    recommended: ['description', 'image', 'brand', 'offers', 'aggregateRating', 'review']
  },
  'Organization': {
    required: ['@context', '@type', 'name'],
    recommended: ['url', 'logo', 'description', 'address', 'contactPoint']
  },
  'Person': {
    required: ['@context', '@type', 'name'],
    recommended: ['url', 'image', 'description', 'jobTitle', 'worksFor']
  },
  'Event': {
    required: ['@context', '@type', 'name', 'startDate'],
    recommended: ['endDate', 'location', 'description', 'organizer', 'offers']
  },
  'BreadcrumbList': {
    required: ['@context', '@type', 'itemListElement'],
    recommended: ['numberOfItems']
  },
  'FAQPage': {
    required: ['@context', '@type', 'mainEntity'],
    recommended: ['name', 'description']
  },
  'HowTo': {
    required: ['@context', '@type', 'name', 'step'],
    recommended: ['description', 'image', 'totalTime', 'supply', 'tool']
  },
  'Review': {
    required: ['@context', '@type', 'reviewRating', 'author'],
    recommended: ['itemReviewed', 'reviewBody', 'datePublished']
  },
  'LocalBusiness': {
    required: ['@context', '@type', 'name', 'address'],
    recommended: ['telephone', 'url', 'openingHours', 'priceRange']
  },
  'WebSite': {
    required: ['@context', '@type', 'name', 'url'],
    recommended: ['description', 'potentialAction']
  }
};

// Common validation patterns
const VALIDATION_PATTERNS = {
  url: /^https?:\/\/.+/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  date: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/
};

export class SchemaValidationService {
  /**
   * Validates a single schema object
   */
  static validateSchema(schemaObj: { type: string; schema: string }): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    try {
      // Parse JSON-LD
      const parsedSchema = JSON.parse(schemaObj.schema);
      
      // Basic JSON-LD structure validation
      this.validateJsonLdStructure(parsedSchema, errors, warnings);
      
      // Schema.org specific validation
      this.validateSchemaOrgStructure(parsedSchema, schemaObj.type, errors, warnings, info);
      
      // Data type validation
      this.validateDataTypes(parsedSchema, errors, warnings);
      
      // Content quality validation
      this.validateContentQuality(parsedSchema, schemaObj.type, warnings, info);
      
    } catch (parseError) {
      errors.push({
        type: 'error',
        message: 'Invalid JSON syntax',
        suggestion: 'Check for missing commas, brackets, or quotes'
      });
    }

    // Calculate validation score
    const score = this.calculateValidationScore(errors, warnings, info);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
      score
    };
  }

  /**
   * Validates multiple schemas
   */
  static validateSchemas(schemas: { type: string; schema: string }[]): ValidatedSchema[] {
    return schemas.map(schema => ({
      ...schema,
      validation: this.validateSchema(schema)
    }));
  }

  /**
   * Validates basic JSON-LD structure
   */
  private static validateJsonLdStructure(schema: any, errors: ValidationError[], warnings: ValidationError[]): void {
    // Check for @context
    if (!schema['@context']) {
      errors.push({
        type: 'error',
        message: 'Missing @context property',
        suggestion: 'Add "@context": "https://schema.org" to your schema'
      });
    } else if (schema['@context'] !== 'https://schema.org') {
      warnings.push({
        type: 'warning',
        message: 'Non-standard @context value',
        suggestion: 'Consider using "https://schema.org" for better compatibility'
      });
    }

    // Check for @type
    if (!schema['@type']) {
      errors.push({
        type: 'error',
        message: 'Missing @type property',
        suggestion: 'Add "@type" property to specify the schema type'
      });
    }

    // Check for @id (optional but recommended)
    if (!schema['@id']) {
      warnings.push({
        type: 'warning',
        message: 'Missing @id property',
        suggestion: 'Consider adding "@id" for better entity identification'
      });
    }
  }

  /**
   * Validates Schema.org specific structure
   */
  private static validateSchemaOrgStructure(
    schema: any, 
    expectedType: string, 
    errors: ValidationError[], 
    warnings: ValidationError[], 
    info: ValidationError[]
  ): void {
    const schemaType = schema['@type'];
    
    // Check if @type matches expected type
    if (schemaType && schemaType !== expectedType) {
      warnings.push({
        type: 'warning',
        message: `Schema type mismatch: expected "${expectedType}", got "${schemaType}"`,
        suggestion: 'Ensure the @type matches the intended schema type'
      });
    }

    // Get requirements for this schema type
    const requirements = SCHEMA_REQUIREMENTS[schemaType] || SCHEMA_REQUIREMENTS[expectedType];
    
    if (requirements) {
      // Check required properties
      requirements.required.forEach(prop => {
        if (!schema[prop]) {
          errors.push({
            type: 'error',
            message: `Missing required property: ${prop}`,
            path: prop,
            suggestion: `Add "${prop}" property to your schema`
          });
        }
      });

      // Check recommended properties
      requirements.recommended.forEach(prop => {
        if (!schema[prop]) {
          warnings.push({
            type: 'warning',
            message: `Missing recommended property: ${prop}`,
            path: prop,
            suggestion: `Consider adding "${prop}" for better SEO`
          });
        }
      });
    }

    // Special validations for specific types
    this.validateSpecificTypes(schema, schemaType, errors, warnings, info);
  }

  /**
   * Validates specific schema types
   */
  private static validateSpecificTypes(
    schema: any, 
    schemaType: string, 
    errors: ValidationError[], 
    warnings: ValidationError[], 
    info: ValidationError[]
  ): void {
    switch (schemaType) {
      case 'Article':
        this.validateArticle(schema, errors, warnings, info);
        break;
      case 'Product':
        this.validateProduct(schema, errors, warnings, info);
        break;
      case 'Organization':
        this.validateOrganization(schema, errors, warnings, info);
        break;
      case 'Event':
        this.validateEvent(schema, errors, warnings, info);
        break;
      case 'BreadcrumbList':
        this.validateBreadcrumbList(schema, errors, warnings, info);
        break;
      case 'FAQPage':
        this.validateFAQPage(schema, errors, warnings, info);
        break;
      case 'HowTo':
        this.validateHowTo(schema, errors, warnings, info);
        break;
      case 'Review':
        this.validateReview(schema, errors, warnings, info);
        break;
      case 'LocalBusiness':
        this.validateLocalBusiness(schema, errors, warnings, info);
        break;
    }
  }

  /**
   * Validates Article schema
   */
  private static validateArticle(schema: any, errors: ValidationError[], warnings: ValidationError[], info: ValidationError[]): void {
    // Check headline length
    if (schema.headline && schema.headline.length > 110) {
      warnings.push({
        type: 'warning',
        message: 'Headline is too long',
        suggestion: 'Keep headlines under 110 characters for better SEO'
      });
    }

    // Check author structure
    if (schema.author) {
      if (typeof schema.author === 'string') {
        warnings.push({
          type: 'warning',
          message: 'Author should be an object with name property',
          suggestion: 'Use {"@type": "Person", "name": "Author Name"} format'
        });
      }
    }

    // Check date formats
    if (schema.datePublished && !VALIDATION_PATTERNS.date.test(schema.datePublished)) {
      errors.push({
        type: 'error',
        message: 'Invalid datePublished format',
        suggestion: 'Use ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ'
      });
    }
  }

  /**
   * Validates Product schema
   */
  private static validateProduct(schema: any, errors: ValidationError[], warnings: ValidationError[], info: ValidationError[]): void {
    // Check offers
    if (schema.offers) {
      if (!schema.offers.price) {
        warnings.push({
          type: 'warning',
          message: 'Product offers should include price',
          suggestion: 'Add "price" property to offers for better rich snippets'
        });
      }
    }

    // Check image
    if (schema.image && typeof schema.image === 'string') {
      if (!VALIDATION_PATTERNS.url.test(schema.image)) {
        errors.push({
          type: 'error',
          message: 'Invalid image URL format',
          suggestion: 'Use a valid HTTP/HTTPS URL for the image'
        });
      }
    }
  }

  /**
   * Validates Organization schema
   */
  private static validateOrganization(schema: any, errors: ValidationError[], warnings: ValidationError[], info: ValidationError[]): void {
    // Check logo
    if (schema.logo && typeof schema.logo === 'string') {
      if (!VALIDATION_PATTERNS.url.test(schema.logo)) {
        errors.push({
          type: 'error',
          message: 'Invalid logo URL format',
          suggestion: 'Use a valid HTTP/HTTPS URL for the logo'
        });
      }
    }

    // Check contact information
    if (schema.contactPoint) {
      if (schema.contactPoint.telephone && !VALIDATION_PATTERNS.phone.test(schema.contactPoint.telephone)) {
        warnings.push({
          type: 'warning',
          message: 'Invalid phone number format',
          suggestion: 'Use international format: +1234567890'
        });
      }
    }
  }

  /**
   * Validates Event schema
   */
  private static validateEvent(schema: any, errors: ValidationError[], warnings: ValidationError[], info: ValidationError[]): void {
    // Check date formats
    if (schema.startDate && !VALIDATION_PATTERNS.date.test(schema.startDate)) {
      errors.push({
        type: 'error',
        message: 'Invalid startDate format',
        suggestion: 'Use ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ'
      });
    }

    if (schema.endDate && !VALIDATION_PATTERNS.date.test(schema.endDate)) {
      errors.push({
        type: 'error',
        message: 'Invalid endDate format',
        suggestion: 'Use ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ'
      });
    }
  }

  /**
   * Validates BreadcrumbList schema
   */
  private static validateBreadcrumbList(schema: any, errors: ValidationError[], warnings: ValidationError[], info: ValidationError[]): void {
    if (schema.itemListElement && Array.isArray(schema.itemListElement)) {
      schema.itemListElement.forEach((item: any, index: number) => {
        if (!item.name) {
          errors.push({
            type: 'error',
            message: `Breadcrumb item ${index + 1} missing name`,
            path: `itemListElement[${index}].name`,
            suggestion: 'Add "name" property to each breadcrumb item'
          });
        }
      });
    }
  }

  /**
   * Validates FAQPage schema
   */
  private static validateFAQPage(schema: any, errors: ValidationError[], warnings: ValidationError[], info: ValidationError[]): void {
    if (schema.mainEntity && Array.isArray(schema.mainEntity)) {
      schema.mainEntity.forEach((faq: any, index: number) => {
        if (!faq.question) {
          errors.push({
            type: 'error',
            message: `FAQ ${index + 1} missing question`,
            path: `mainEntity[${index}].question`,
            suggestion: 'Add "question" property to each FAQ item'
          });
        }
        if (!faq.answer) {
          errors.push({
            type: 'error',
            message: `FAQ ${index + 1} missing answer`,
            path: `mainEntity[${index}].answer`,
            suggestion: 'Add "answer" property to each FAQ item'
          });
        }
      });
    }
  }

  /**
   * Validates HowTo schema
   */
  private static validateHowTo(schema: any, errors: ValidationError[], warnings: ValidationError[], info: ValidationError[]): void {
    if (schema.step && Array.isArray(schema.step)) {
      schema.step.forEach((step: any, index: number) => {
        if (!step.name) {
          errors.push({
            type: 'error',
            message: `HowTo step ${index + 1} missing name`,
            path: `step[${index}].name`,
            suggestion: 'Add "name" property to each step'
          });
        }
      });
    }
  }

  /**
   * Validates Review schema
   */
  private static validateReview(schema: any, errors: ValidationError[], warnings: ValidationError[], info: ValidationError[]): void {
    // Check review rating
    if (schema.reviewRating) {
      if (!schema.reviewRating.ratingValue || !schema.reviewRating.bestRating) {
        errors.push({
          type: 'error',
          message: 'Review rating missing required properties',
          suggestion: 'Add "ratingValue" and "bestRating" to reviewRating'
        });
      }
    }
  }

  /**
   * Validates LocalBusiness schema
   */
  private static validateLocalBusiness(schema: any, errors: ValidationError[], warnings: ValidationError[], info: ValidationError[]): void {
    // Check address
    if (schema.address) {
      if (!schema.address.streetAddress || !schema.address.addressLocality) {
        warnings.push({
          type: 'warning',
          message: 'Address missing recommended properties',
          suggestion: 'Add "streetAddress" and "addressLocality" to address'
        });
      }
    }
  }

  /**
   * Validates data types
   */
  private static validateDataTypes(schema: any, errors: ValidationError[], warnings: ValidationError[]): void {
    // Check URL properties
    const urlProperties = ['url', 'image', 'logo', 'sameAs'];
    urlProperties.forEach(prop => {
      if (schema[prop]) {
        if (typeof schema[prop] === 'string' && !VALIDATION_PATTERNS.url.test(schema[prop])) {
          errors.push({
            type: 'error',
            message: `Invalid URL format for ${prop}`,
            path: prop,
            suggestion: 'Use a valid HTTP/HTTPS URL'
          });
        }
      }
    });

    // Check email properties
    if (schema.email && !VALIDATION_PATTERNS.email.test(schema.email)) {
      errors.push({
        type: 'error',
        message: 'Invalid email format',
        path: 'email',
        suggestion: 'Use a valid email address format'
      });
    }
  }

  /**
   * Validates content quality
   */
  private static validateContentQuality(schema: any, schemaType: string, warnings: ValidationError[], info: ValidationError[]): void {
    // Check for empty strings
    Object.keys(schema).forEach(key => {
      if (typeof schema[key] === 'string' && schema[key].trim() === '') {
        warnings.push({
          type: 'warning',
          message: `Empty value for property: ${key}`,
          path: key,
          suggestion: 'Provide meaningful content for better SEO'
        });
      }
    });

    // Check description length
    if (schema.description) {
      if (schema.description.length < 50) {
        warnings.push({
          type: 'warning',
          message: 'Description is too short',
          suggestion: 'Write descriptions with at least 50 characters for better SEO'
        });
      } else if (schema.description.length > 160) {
        warnings.push({
          type: 'warning',
          message: 'Description is too long',
          suggestion: 'Keep descriptions under 160 characters for better display'
        });
      }
    }

    // Check for potential duplicate content
    if (schema.name && schema.headline && schema.name === schema.headline) {
      info.push({
        type: 'info',
        message: 'Name and headline are identical',
        suggestion: 'Consider using different values for name and headline'
      });
    }
  }

  /**
   * Calculates validation score
   */
  private static calculateValidationScore(errors: ValidationError[], warnings: ValidationError[], info: ValidationError[]): number {
    let score = 100;
    
    // Deduct points for errors (more severe)
    score -= errors.length * 20;
    
    // Deduct points for warnings (less severe)
    score -= warnings.length * 5;
    
    // Deduct points for info (minimal impact)
    score -= info.length * 1;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Gets validation summary for display
   */
  static getValidationSummary(validation: ValidationResult): string {
    if (validation.isValid && validation.warnings.length === 0) {
      return 'Perfect! All validations passed.';
    } else if (validation.isValid) {
      return `${validation.warnings.length} warning${validation.warnings.length !== 1 ? 's' : ''} found.`;
    } else {
      return `${validation.errors.length} error${validation.errors.length !== 1 ? 's' : ''} and ${validation.warnings.length} warning${validation.warnings.length !== 1 ? 's' : ''} found.`;
    }
  }

  /**
   * Gets validation status color
   */
  static getValidationStatusColor(validation: ValidationResult): string {
    if (validation.isValid && validation.warnings.length === 0) {
      return 'text-green-600';
    } else if (validation.isValid) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  }

  /**
   * Gets validation status icon
   */
  static getValidationStatusIcon(validation: ValidationResult): string {
    if (validation.isValid && validation.warnings.length === 0) {
      return '✅';
    } else if (validation.isValid) {
      return '⚠️';
    } else {
      return '❌';
    }
  }
}
