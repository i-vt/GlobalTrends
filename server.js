const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const app = express();
const port = 3002;

app.set('view engine', 'ejs');

// Full list of countries that support Google "Daily Search Trends" RSS
const COUNTRIES = {
    'AR': 'Argentina',
    'AU': 'Australia',
    'AT': 'Austria',
    'BE': 'Belgium',
    'BR': 'Brazil',
    'CA': 'Canada',
    'CL': 'Chile',
    'CO': 'Colombia',
    'CZ': 'Czechia',
    'DK': 'Denmark',
    'EG': 'Egypt',
    'FI': 'Finland',
    'FR': 'France',
    'DE': 'Germany',
    'GR': 'Greece',
    'HK': 'Hong Kong',
    'HU': 'Hungary',
    'IN': 'India',
    'ID': 'Indonesia',
    'IE': 'Ireland',
    'IL': 'Israel',
    'IT': 'Italy',
    'JP': 'Japan',
    'KE': 'Kenya',
    'MY': 'Malaysia',
    'MX': 'Mexico',
    'NL': 'Netherlands',
    'NZ': 'New Zealand',
    'NG': 'Nigeria',
    'NO': 'Norway',
    'PE': 'Peru',
    'PH': 'Philippines',
    'PL': 'Poland',
    'PT': 'Portugal',
    'RO': 'Romania',
    'RU': 'Russia',
    'SA': 'Saudi Arabia',
    'SG': 'Singapore',
    'ZA': 'South Africa',
    'KR': 'South Korea',
    'ES': 'Spain',
    'SE': 'Sweden',
    'CH': 'Switzerland',
    'TW': 'Taiwan',
    'TH': 'Thailand',
    'TR': 'Turkey',
    'UA': 'Ukraine',
    'GB': 'United Kingdom',
    'US': 'United States',
    'VN': 'Vietnam'
};

app.get('/', async (req, res) => {
    // Default to US if no geo provided
    const geo = req.query.geo ? req.query.geo.toUpperCase() : 'US';
    
    // Construct the dynamic URL
    const RSS_URL = `https://trends.google.com/trending/rss?geo=${geo}`;

    try {
        const response = await axios.get(RSS_URL);
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);

        // Safety check: sometimes the feed is empty
        const rawItems = (result.rss && result.rss.channel && result.rss.channel[0].item) 
            ? result.rss.channel[0].item 
            : [];

        const trends = rawItems.map(item => {
            const getVal = (key) => (item[key] && item[key][0]) ? item[key][0] : null;

            // Extract nested news items
            const newsItemsRaw = item['ht:news_item'] || [];
            const newsItems = newsItemsRaw.map(news => ({
                title: news['ht:news_item_title']?.[0] || 'No Title',
                url: news['ht:news_item_url']?.[0]?.trim() || '#',
                source: news['ht:news_item_source']?.[0] || 'Unknown Source',
                picture: news['ht:news_item_picture']?.[0] || null
            }));

            return {
                title: getVal('title'),
                traffic: getVal('ht:approx_traffic'),
                pubDate: getVal('pubDate'),
                mainPicture: getVal('ht:picture'),
                description: getVal('description'),
                news: newsItems
            };
        });

        res.render('index', { 
            trends, 
            currentGeo: geo, 
            countries: COUNTRIES 
        });

    } catch (error) {
        console.error(`Error fetching trends for ${geo}:`, error.message);
        
        // Pass empty trends but keep the country list so the user can switch away
        res.render('index', { 
            trends: [], 
            currentGeo: geo, 
            countries: COUNTRIES,
            error: `Could not load trends for ${COUNTRIES[geo] || geo}. (This region might not support Daily Trends RSS).` 
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
