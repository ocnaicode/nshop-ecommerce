// =============================================================================
// AI Service - Provider-agnostic AI abstraction layer
// Features gracefully disabled when no provider configured
// =============================================================================

interface AIProvider {
  name: string;
  isConfigured: boolean;
  generateText(prompt: string, options?: AIOptions): Promise<AIResponse>;
  generateJSON(prompt: string, schema: string, options?: AIOptions): Promise<AIResponse>;
}

interface AIOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

interface AIResponse {
  success: boolean;
  text?: string;
  json?: Record<string, unknown>;
  usage?: { inputTokens: number; outputTokens: number };
  error?: string;
}

// No-op provider when AI is not configured
class NoOpAIProvider implements AIProvider {
  name = 'none';
  isConfigured = false;

  async generateText(): Promise<AIResponse> {
    return { success: false, error: 'AI provider not configured' };
  }

  async generateJSON(): Promise<AIResponse> {
    return { success: false, error: 'AI provider not configured' };
  }
}

// Generic HTTP-based AI provider (works with OpenAI-compatible APIs)
class GenericAIProvider implements AIProvider {
  name: string;
  isConfigured: boolean;
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(name: string, apiKey: string, baseUrl: string, model: string) {
    this.name = name;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
    this.isConfigured = !!apiKey;
  }

  async generateText(prompt: string, options?: AIOptions): Promise<AIResponse> {
    if (!this.isConfigured) {
      return { success: false, error: 'AI provider not configured' };
    }

    try {
      const messages = [
        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        { role: 'user', content: prompt },
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: options?.maxTokens || 2000,
          temperature: options?.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        return { success: false, error: `AI API error: ${response.status}` };
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';

      return {
        success: true,
        text,
        usage: {
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async generateJSON(prompt: string, schema: string, options?: AIOptions): Promise<AIResponse> {
    const jsonPrompt = `${prompt}\n\nRespond with valid JSON matching this schema:\n${schema}\n\nRespond ONLY with the JSON, no other text.`;
    const result = await this.generateText(jsonPrompt, { ...options, temperature: 0.3 });

    if (result.success && result.text) {
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result.json = JSON.parse(jsonMatch[0]);
        }
      } catch {
        result.success = false;
        result.error = 'Failed to parse JSON response';
      }
    }

    return result;
  }
}

// AI Service Manager
class AIService {
  private provider: AIProvider;

  constructor() {
    const providerName = process.env.AI_PROVIDER || '';
    const apiKey = process.env.AI_API_KEY || '';
    const model = process.env.AI_MODEL || 'gpt-3.5-turbo';
    const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';

    if (providerName && apiKey) {
      this.provider = new GenericAIProvider(providerName, apiKey, baseUrl, model);
    } else {
      this.provider = new NoOpAIProvider();
    }
  }

  isAvailable(): boolean {
    return this.provider.isConfigured;
  }

  getProviderName(): string {
    return this.provider.name;
  }

  // Product Assistant - Generate product details from rough input
  async generateProductDetails(input: {
    name: string;
    roughDescription?: string;
    category?: string;
  }): Promise<AIResponse> {
    return this.provider.generateJSON(
      `Generate product details for a local marketplace product.
Product name: ${input.name}
Rough description: ${input.roughDescription || 'Not provided'}
Category: ${input.category || 'General'}

Generate a professional product listing.`,
      `{
  "title": "optimized product title",
  "description": "detailed product description (2-3 paragraphs)",
  "features": ["feature 1", "feature 2", "feature 3"],
  "tags": ["tag1", "tag2", "tag3"],
  "seoTitle": "SEO optimized title (max 70 chars)",
  "seoDescription": "SEO meta description (max 160 chars)"
}`,
      { systemPrompt: 'You are a product listing expert for a Bangladesh local marketplace.' }
    );
  }

  // Customer Search Assistant - Natural language to filters
  async interpretSearch(query: string, location?: string): Promise<AIResponse> {
    return this.provider.generateJSON(
      `Customer search query: "${query}"
Location: ${location || 'Unknown'}

Convert this into product search filters.`,
      `{
  "searchTerm": "extracted product keywords",
  "category": "suggested category",
  "minPrice": 0,
  "maxPrice": 0,
  "sortBy": "relevance or price_asc or price_desc or rating",
  "intent": "brief description of what customer wants"
}`,
      { systemPrompt: 'You are a shopping assistant for a Bangladesh local marketplace.' }
    );
  }

  // Seller Analytics Insights
  async generateSellerInsights(data: {
    totalSales: number;
    totalOrders: number;
    topProducts: string[];
    lowStockProducts: string[];
    period: string;
  }): Promise<AIResponse> {
    return this.provider.generateText(
      `Analyze this seller's performance data and provide actionable insights:
Total Sales: ৳${data.totalSales}
Total Orders: ${data.totalOrders}
Top Products: ${data.topProducts.join(', ')}
Low Stock Products: ${data.lowStockProducts.join(', ')}
Period: ${data.period}

Provide 3-5 actionable business insights in bullet points.`,
      { systemPrompt: 'You are a business analytics advisor for local marketplace sellers in Bangladesh.' }
    );
  }

  // Review Analysis
  async analyzeReviews(reviews: { rating: number; text: string }[]): Promise<AIResponse> {
    const reviewText = reviews.slice(0, 20).map(r => `[${r.rating}★] ${r.text}`).join('\n');
    return this.provider.generateJSON(
      `Analyze these customer reviews:\n${reviewText}`,
      `{
  "positiveThemes": ["theme1", "theme2"],
  "negativeThemes": ["theme1", "theme2"],
  "summary": "brief overall summary",
  "recommendations": ["rec1", "rec2"],
  "averageSentiment": "positive/neutral/negative"
}`,
      { systemPrompt: 'You are a customer feedback analyst.' }
    );
  }
}

export const aiService = new AIService();
