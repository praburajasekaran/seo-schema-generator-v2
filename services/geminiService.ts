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

// Function to fetch webpage content using CORS proxy with multiple fallbacks
const fetchWebpageContent = async (url: string, signal?: AbortSignal): Promise<string> => {
    try {
        devLog(`Attempting to fetch content from: ${url}`);

        // Try direct fetch first (in case CORS allows it)
        try {
            const directResponse = await fetch(url, {
                signal,
                mode: 'cors',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                }
            });

            if (directResponse.ok) {
                devLog(`Direct fetch successful`);
                const html = await directResponse.text();
                return processHtmlContent(html);
            }
        } catch (directError) {
            devLog(`Direct fetch failed, trying CORS proxies: ${directError instanceof Error ? directError.message : 'Unknown error'}`);
        }

        // Multiple CORS proxy options with fallbacks (prioritized by reliability)
        const proxies = [
            `https://cors.eu.org/${url}`,
            `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
            `https://cors-anywhere.herokuapp.com/${url}`,
            `https://thingproxy.freeboard.io/fetch/${url}`
        ];

        for (let i = 0; i < proxies.length; i++) {
            const proxyUrl = proxies[i];
            try {
                devLog(`Trying proxy ${i + 1}/${proxies.length}: ${proxyUrl}`);

                // Create a timeout promise for this proxy attempt
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Proxy request timeout')), 10000);
                });

                const fetchPromise = fetch(proxyUrl, {
                    signal,
                    headers: {
                        'Accept': proxyUrl.includes('allorigins.win') ? 'application/json' : 'text/html',
                    }
                });

                const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

                devLog(`Proxy ${i + 1} response status: ${response.status} ${response.statusText}`);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                let html: string;

                // Handle different proxy response formats
                if (proxyUrl.includes('allorigins.win')) {
                    const proxyResponse = await response.json();
                    if (!proxyResponse.contents) {
                        throw new Error("No content received from allorigins proxy");
                    }
                    html = proxyResponse.contents;
                } else {
                    // For other proxies, assume they return HTML directly
                    html = await response.text();
                }

                if (!html || html.trim().length < 100) {
                    throw new Error("Received empty or very short content from proxy");
                }

                devLog(`Proxy ${i + 1} successful - fetched HTML length: ${html.length} characters`);
                return processHtmlContent(html);

            } catch (proxyError) {
                devLog(`Proxy ${i + 1} failed: ${proxyError instanceof Error ? proxyError.message : 'Unknown error'}`);
                if (i === proxies.length - 1) {
                    // Last proxy failed, throw error with more context
                    throw new Error(`All CORS proxies failed. Last error: ${proxyError instanceof Error ? proxyError.message : 'Unknown error'}`);
                }
                // Try next proxy
                continue;
            }
        }

        // If all proxies failed, try one more approach with a basic fetch
        // Some websites might allow requests from different origins
        try {
            devLog(`All proxies failed, trying direct fetch with no-cors mode...`);
            const finalResponse = await fetch(url, {
                signal,
                mode: 'no-cors',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                }
            });

            if (finalResponse.type === 'opaque') {
                // no-cors mode succeeded but we can't read the content
                // This is better than a complete failure
                throw new Error("Website blocks cross-origin requests completely. Try a different URL or use the example button.");
            }

            const html = await finalResponse.text();
            if (html && html.trim().length > 100) {
                devLog(`Direct no-cors fetch succeeded`);
                return processHtmlContent(html);
            }
        } catch (finalError) {
            devLog(`Final fallback also failed: ${finalError instanceof Error ? finalError.message : 'Unknown error'}`);
        }

        throw new Error("All CORS proxies and fallback methods failed. The website blocks cross-origin requests completely.");

    } catch (error) {
        devError('Error in fetchWebpageContent:', error);
        if (signal?.aborted) {
            throw new Error("Operation was cancelled");
        }
        throw new Error(`Failed to fetch webpage content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const generateSchemaForUrl = async (url: string, signal?: AbortSignal): Promise<string> => {
    devLog(`Starting schema generation for URL: ${url}`);
    
    // First, fetch the actual webpage content
    let webpageContent: string;
    try {
        webpageContent = await fetchWebpageContent(url, signal);
        
        // Check if we have meaningful content
        if (!webpageContent || webpageContent.trim().length < 100) {
            throw new Error("The webpage content is too short or empty to generate meaningful schemas");
        }
        
        devLog(`Successfully fetched content, proceeding with schema generation...`);
    } catch (error) {
        devError('Error fetching webpage content:', error);
        if (signal?.aborted) {
            throw new Error("Operation was cancelled");
        }
        throw new Error(`Failed to fetch webpage content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    const prompt = `
        You are an expert SEO specialist and web developer. Your task is to generate all possible, relevant, and valid JSON-LD schema markups based on the ACTUAL CONTENT from the webpage.

        URL: ${url}
        
        ACTUAL WEBPAGE CONTENT:
        ${webpageContent}

        Instructions:
        1.  IMPORTANT: Only use information that is explicitly present in the ACTUAL WEBPAGE CONTENT provided above. Do NOT make up, assume, or hallucinate any information that is not clearly visible in the content.
        2.  Thoroughly analyze the ACTUAL CONTENT provided above to identify all entities that can be described with schema.org vocabulary.
        3.  Generate UNIQUE, CONSOLIDATED schemas - each schema type should appear only ONCE in your response. Do NOT create multiple schemas of the same type.
        4.  For multiple items of the same type (like multiple reviews), consolidate them into a SINGLE schema with arrays. For example, if there are multiple reviews, create ONE Review schema with an array of review objects, or use AggregateRating if appropriate.
        5.  Use the comprehensive list of schema types provided below as a guide. Generate a separate, complete, and valid JSON-LD schema for EACH UNIQUE entity type that is relevant to the URL's content.
        6.  Prioritize creating schemas for the most prominent and relevant types on the page. For example, if it's a blog post, an 'Article' schema is essential. If it's a product page, 'Product' and 'Review' schemas are key.
        7.  The response MUST be a JSON array of objects. Each object in the array must have two keys: "type" (a string identifying the schema type, e.g., "Article") and "schema" (a string containing the full JSON-LD for that type).
        8.  If certain required properties are not available in the actual content, use generic placeholders like "Not specified" or omit the property entirely rather than making up information.
        9.  CRITICAL: Generate a maximum of 5-7 different schema types. Focus on quality over quantity. Each schema should be unique and serve a different purpose.
        
        CRITICAL: For each schema you generate, you MUST include ALL recommended properties to ensure maximum SEO benefit and validation compliance. Pay special attention to Organization schemas which MUST include a complete address object to pass validation:
        
        **Required Properties for ALL schemas:**
        - @context: "https://schema.org"
        - @type: The specific schema type
        - @id: A unique identifier (use the URL + #schema-type, e.g., "https://example.com#article")
        
        **Schema-Specific Recommended Properties:**
        
        **Article schemas MUST include:**
        - headline (required)
        - author (as Person object with name)
        - datePublished (ISO 8601 format)
        - dateModified (ISO 8601 format)
        - publisher (as Organization object)
        - description (50-160 characters)
        - image (array of ImageObject with url)
        - mainEntityOfPage (the URL)
        
        **Product schemas MUST include:**
        - name (required)
        - description (detailed product description)
        - image (array of ImageObject with url)
        - brand (as Brand object with name)
        - offers (as Offer object with price, priceCurrency, availability)
        - aggregateRating (if reviews exist)
        - review (if individual reviews exist)
        
        **Organization schemas MUST include:**
        - name (required)
        - url (organization website)
        - logo (as ImageObject with url)
        - description (organization description)
        - address (as PostalAddress object with streetAddress, addressLocality, addressRegion, postalCode, addressCountry - REQUIRED for validation)
        - contactPoint (as ContactPoint object with telephone, contactType)
        - sameAs (array of social media URLs)
        
        **Person schemas MUST include:**
        - name (required)
        - url (personal website or profile)
        - image (as ImageObject with url)
        - description (brief bio)
        - jobTitle (current position)
        - worksFor (as Organization object)
        - sameAs (array of social media URLs)
        
        **Event schemas MUST include:**
        - name (required)
        - startDate (ISO 8601 format, required)
        - endDate (ISO 8601 format)
        - location (as Place object with name and address)
        - description (event description)
        - organizer (as Organization or Person object)
        - offers (as Offer object with price, priceCurrency)
        
        **BreadcrumbList schemas MUST include:**
        - itemListElement (array of BreadcrumbList items, required)
        - numberOfItems (count of items)
        - Each item must have: @type: "ListItem", position (number), name, item (URL)
        
        **FAQPage schemas MUST include:**
        - mainEntity (array of Question objects, required)
        - name (page title)
        - description (page description)
        - Each FAQ must have: @type: "Question", name (question), acceptedAnswer with @type: "Answer" and text
        
        **HowTo schemas MUST include:**
        - name (required)
        - description (how-to description)
        - step (array of HowToStep objects, required)
        - image (array of ImageObject with url)
        - totalTime (duration in ISO 8601 format)
        - supply (array of HowToSupply objects)
        - tool (array of HowToTool objects)
        
        **Review schemas MUST include:**
        - reviewRating (as Rating object with ratingValue, bestRating, required)
        - author (as Person object with name, required)
        - itemReviewed (the item being reviewed)
        - reviewBody (the review text)
        - datePublished (ISO 8601 format)
        - IMPORTANT: If there are multiple reviews, create ONE Review schema with an array of review objects, or use AggregateRating instead
        
        **LocalBusiness schemas MUST include:**
        - name (required)
        - address (as PostalAddress object, required)
        - telephone (phone number)
        - url (business website)
        - openingHours (array of opening hours)
        - priceRange (price range indicator)
        - description (business description)
        - image (array of ImageObject with url)
        
        **WebSite schemas MUST include:**
        - name (required)
        - url (required)
        - description (website description)
        - potentialAction (as SearchAction object with target and query-input)
        
        **ImageObject properties:**
        - url (required)
        - width (in pixels)
        - height (in pixels)
        - caption (image description)
        
        **Data Quality Requirements:**
        - All URLs must be absolute (https://...)
        - All dates must be in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)
        - Descriptions should be 50-160 characters for optimal SEO
        - Names and headlines should be descriptive and unique
        - Images should be high-quality and relevant
        - All required properties must be present
        - All recommended properties should be included when applicable
        
        Example of expected output format (using ONLY information from the actual content):
        [
          {
            "type": "Article",
            "schema": "{ \\"@context\\": \\"https://schema.org\\", \\"@type\\": \\"Article\\", \\"@id\\": \\"${url}#article\\", \\"headline\\": \\"[Actual headline from content]\\", \\"author\\": { \\"@type\\": \\"Person\\", \\"name\\": \\"[Actual author name from content]\\" }, \\"datePublished\\": \\"[Actual date from content]\\", \\"publisher\\": { \\"@type\\": \\"Organization\\", \\"name\\": \\"[Actual publisher from content]\\" }, \\"description\\": \\"[Actual description from content]\\", \\"mainEntityOfPage\\": \\"${url}\\" }"
          }
        ]
        
        NOTE: Only include properties that are actually present in the webpage content. If information is missing, either omit the property or use "Not specified" as a placeholder.

        ---

        ### COMPREHENSIVE SCHEMA.ORG TYPE LIST FOR YOUR CONSIDERATION ###

        **Action Types:**
        AcceptAction, AchieveAction, Action, ActionAccessSpecification, ActivateAction, AddAction, AllocateAction, AppendAction, ApplyAction, AssessAction, AssignAction, AuthorizeAction

        **CreativeWork Types:**
        AboutPage, AmpStory, Article, AudioObject, Audiobook, Blog, Book, Chapter, Claim, Code, Conversation, Course, Drawing, Guide, HowTo, Manuscript, Map, MathSolver, Menu, MenuSection, Movie, MusicComposition, MusicRecording, Painting, Photograph, Play, Poster, PublicationVolume, Quotation, Sculpture, Season, SheetMusic, ShortStory, SoftwareSourceCode, SpecialAnnouncement, Statement, Thesis, TVSeason, TVSeries, WebSite

        **Event Types:**
        BusinessEvent, ChildrensEvent, ComedyEvent, CourseInstance, DanceEvent, DeliveryEvent, EducationEvent, ExhibitionEvent, Festival, FoodEvent, Hackathon, LiteraryEvent, MusicEvent, PublicationEvent, SaleEvent, ScreeningEvent, SocialEvent, SportsEvent, TheaterEvent, VisualArtsEvent

        **Intangible Types:**
        AggregateOffer, AggregateRating, AlignmentObject, Answer, Audience, BedDetails, Brand, BroadcastFrequencySpecification, Class, ComputerLanguage, DataFeedItem, Demand, DigitalDocumentPermission, EnergyConsumptionDetails, EntryPoint, ItemList, Offer, Schedule, ServiceChannel, SpeakableSpecification, StatisticalPopulation

        **Organization Types:**
        Airline, AnimalShelter, ArchiveOrganization, Consortium, Cooperative, Corporation, EducationalOrganization, GovernmentOrganization, LibrarySystem, LocalBusiness, MedicalOrganization, NGO, NewsMediaOrganization, NonprofitType, Organization, Project, SportsTeam

        **Person Types:**
        Person

        **Place Types:**
        AdministrativeArea, Airport, AmusementPark, Aquarium, ArtGallery, Beach, BoatTerminal, Bridge, BusStation, BusStop, Campground, Cemetery, Crematorium, EventVenue, FireStation, Hospital, LandmarksOrHistoricalBuildings, Museum, MusicVenue, Park, ParkingFacility, PerformingArtsTheater, Place, Playground, PoliceStation, PublicToilet, RVPark, StadiumOrArena, SubwayStation, TaxiStand, TouristAttraction, TrainStation, Zoo

        **Product Types:**
        Product, ProductModel, Service, Vehicle

        **Medical and Health Types:**
        Abdomen, AllergiesHealthAspect, AnatomicalStructure, AnatomicalSystem, Anesthesia, ApprovedIndication, Artery, MedicalCondition, MedicalEntity, MedicalProcedure, MedicalTest

        **Other Notable Types:**
        Apartment, ApartmentComplex, ArchiveComponent, AutoDealer, AutoPartsStore, CDCPMDRecord, ContactPoint, DatedMoneySpecification, DefinedRegion, Diet, EducationalOccupationalCredential, EngineSpecification, ExchangeRateSpecification, ExercisePlan, GeoCoordinates, HealthPlan, HowToDirection, HowToSection, HowToStep, HowToTip, InteractionCounter, JobPosting, MonetaryAmount, NutritionInformation, OpeningHoursSpecification, OwnershipInfo, PostalAddress, PostalCodeRangeSpecification, RepaymentSpecification, Review, ServicePeriod, ShippingDeliveryTime, ShippingRateSettings, ShippingService, TypeAndQuantityNode, VirtualLocation
    `;

    try {
        // Check if the operation was cancelled before making the API call
        if (signal?.aborted) {
            throw new Error("Operation was cancelled");
        }

        devLog("Generating schema markup...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.VITE_GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: "application/json",
                }
            }),
            signal
        });
        
        // Check if the operation was cancelled after the API call
        if (signal?.aborted) {
            throw new Error("Operation was cancelled");
        }
        
        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const apiResponse = await response.json();
        devLog("Successfully generated schema markup");
        const result = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Process and format the response as proper JSON strings
        try {
            const parsedResult = JSON.parse(result);
            if (Array.isArray(parsedResult)) {
                const uniqueSchemas = [];
                const seenTypes = new Set();

                for (const schema of parsedResult) {
                    if (schema.type && schema.schema && !seenTypes.has(schema.type)) {
                        seenTypes.add(schema.type);

                        // Ensure schema is properly formatted as a JSON string
                        let schemaString;
                        if (typeof schema.schema === 'string') {
                            // If it's already a string, try to parse and re-stringify for consistency
                            try {
                                const parsedSchema = JSON.parse(schema.schema);
                                schemaString = JSON.stringify(parsedSchema, null, 2);
                            } catch {
                                // If parsing fails, use the original string
                                schemaString = schema.schema;
                            }
                        } else {
                            // If it's an object, stringify it
                            schemaString = JSON.stringify(schema.schema, null, 2);
                        }

                        uniqueSchemas.push({
                            type: schema.type,
                            schema: schemaString
                        });
                    }
                }

                devLog(`Deduplication: Started with ${parsedResult.length} schemas, ended with ${uniqueSchemas.length} unique schemas`);
                return JSON.stringify(uniqueSchemas);
            }
        } catch (parseError) {
            devLog("Could not parse result for processing, returning original response");
        }
        
        return result;

    } catch (error) {
        // Handle cancellation gracefully
        if (signal?.aborted || (error instanceof Error && error.message === "Operation was cancelled")) {
            throw new Error("Operation was cancelled");
        }
        
        devError("Error generating schema:", error);
        throw new Error(`Failed to generate schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};