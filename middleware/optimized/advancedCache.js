/**
 * Advanced caching middleware for API optimization
 * Provides more intelligent and flexible caching than the basic implementation
 */
const NodeCache = require('node-cache');

// Initialize cache with standard TTL of 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

/**
 * Generate a cache key based on request details
 * @param {Object} req - Express request object
 * @returns {string} Cache key
 */
function generateCacheKey(req) {
  // Include user ID in the key for user-specific data
  const userId = req.user ? req.user.id : 'anonymous';
  
  // Include URL and query parameters
  const url = req.originalUrl;
  
  // Include any query parameters
  const queryString = req.query ? 
    Object.entries(req.query)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}=${value}`)
      .join('&') 
    : '';
    
  return `${userId}:${url}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Cache middleware with advanced options
 * @param {Object} options - Caching options
 * @param {number} options.duration - Cache duration in seconds
 * @param {Function} options.keyGenerator - Custom key generator function
 * @param {Function} options.condition - Function to determine if request should be cached
 * @param {boolean} options.useEtag - Whether to use ETag for cache validation
 * @returns {Function} Express middleware
 */
function cacheMiddleware(options = {}) {
  const {
    duration = 300, // 5 minutes default
    keyGenerator = generateCacheKey,
    condition = () => true,
    useEtag = false
  } = options;
  
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Check if caching should be skipped for this request
    if (!condition(req)) {
      return next();
    }
    
    // Generate cache key
    const cacheKey = keyGenerator(req);
    
    // Check if response is in cache
    const cachedResponse = cache.get(cacheKey);
    
    if (cachedResponse) {
      // If using ETag, check if client sent matching If-None-Match header
      if (useEtag && req.headers['if-none-match'] === cachedResponse.etag) {
        return res.status(304).end(); // Not Modified
      }
      
      // Set ETag header if enabled
      if (useEtag) {
        res.setHeader('ETag', cachedResponse.etag);
      }
      
      // Add cache status header for debugging
      res.setHeader('X-Cache', 'HIT');
      
      // Return cached response
      return res.status(200).json(cachedResponse.body);
    }
    
    // Set cache status header for debugging
    res.setHeader('X-Cache', 'MISS');
    
    // Store original send function
    const originalSend = res.json;

    // Override send function
    res.json = function(body) {
      // Generate ETag if enabled
      const etag = useEtag
        ? `"${require('crypto')
            .createHash('md5')
            .update(JSON.stringify(body))
            .digest('hex')}"`
        : null;
      
      // Store the response in cache
      cache.set(cacheKey, { 
        body, 
        etag,
        timestamp: Date.now()
      }, duration);
      
      // Set ETag header if enabled
      if (useEtag) {
        res.setHeader('ETag', etag);
      }
      
      // Call the original send function
      originalSend.call(this, body);
    };

    next();
  };
}

/**
 * Clear cache for a specific user
 * @param {number} userId - User ID
 */
function clearUserCache(userId) {
  const keys = cache.keys();
  const userKeys = keys.filter(key => key.startsWith(`${userId}:`));
  
  userKeys.forEach(key => {
    cache.del(key);
  });
}

/**
 * Clear cache for a specific endpoint pattern
 * @param {string} urlPattern - URL pattern to match
 */
function clearEndpointCache(urlPattern) {
  const keys = cache.keys();
  const endpointKeys = keys.filter(key => key.includes(urlPattern));
  
  endpointKeys.forEach(key => {
    cache.del(key);
  });
}

/**
 * Clear entire cache
 */
function clearAllCache() {
  cache.flushAll();
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize
  };
}

module.exports = {
  cacheMiddleware,
  clearUserCache,
  clearEndpointCache,
  clearAllCache,
  getCacheStats
};
