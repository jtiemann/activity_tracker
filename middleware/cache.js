const NodeCache = require('node-cache');

// Initialize cache with standard TTL of 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

/**
 * Cache middleware
 * Caches responses for GET requests to improve performance
 * @param {number} duration - Cache duration in seconds (optional)
 */
function cacheMiddleware(duration) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create a unique key based on the request URL and user ID
    const userId = req.user ? req.user.id : 'anonymous';
    const key = `${userId}-${req.originalUrl}`;

    // Check if the response is in cache
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      // Return cached response
      return res.status(200).json(cachedResponse);
    }
    
    // Store original send function
    const originalSend = res.json;

    // Override send function
    res.json = function(body) {
      // Store the response in cache
      cache.set(key, body, duration);
      
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
  const userKeys = keys.filter(key => key.startsWith(`${userId}-`));
  
  userKeys.forEach(key => {
    cache.del(key);
  });
}

/**
 * Clear cache for a specific endpoint
 * @param {string} url - Endpoint URL
 */
function clearEndpointCache(url) {
  const keys = cache.keys();
  const endpointKeys = keys.filter(key => key.includes(url));
  
  endpointKeys.forEach(key => {
    cache.del(key);
  });
}

module.exports = {
  cacheMiddleware,
  clearUserCache,
  clearEndpointCache
};
