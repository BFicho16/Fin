import { NextRequest, NextResponse } from 'next/server';
import cheerio from 'cheerio';

// Simple in-memory cache to avoid repeated fetches
const cache = new Map<string, any>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // Check cache first
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data);
  }

  try {
    // Validate URL
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreview/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Open Graph metadata
    const ogData = {
      title: $('meta[property="og:title"]').attr('content') || 
             $('title').text() || 
             'Untitled',
      description: $('meta[property="og:description"]').attr('content') || 
                  $('meta[name="description"]').attr('content') || 
                  '',
      image: $('meta[property="og:image"]').attr('content') || 
             $('meta[name="twitter:image"]').attr('content') || 
             '',
      url: $('meta[property="og:url"]').attr('content') || url,
      siteName: $('meta[property="og:site_name"]').attr('content') || 
                new URL(url).hostname,
    };

    // Clean up image URL (make it absolute if relative)
    if (ogData.image && !ogData.image.startsWith('http')) {
      const baseUrl = new URL(url).origin;
      ogData.image = ogData.image.startsWith('/') 
        ? baseUrl + ogData.image 
        : baseUrl + '/' + ogData.image;
    }

    const result = {
      ...ogData,
      domain: new URL(url).hostname,
    };

    // Cache the result
    cache.set(url, {
      data: result,
      timestamp: Date.now(),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching OG data:', error);
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}
