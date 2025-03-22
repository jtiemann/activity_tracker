// Debug logging wrapper for fetch API
(function() {
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override fetch with logging
  window.fetch = async function(url, options = {}) {
    const method = options.method || 'GET';
    
    console.group(`API Request: ${method} ${url}`);
    console.log('Request options:', options);
    
    if (options.body) {
      try {
        console.log('Request body:', JSON.parse(options.body));
      } catch (e) {
        console.log('Request body:', options.body);
      }
    }
    
    try {
      const response = await originalFetch(url, options);
      
      // Clone the response to log it without consuming it
      const clonedResponse = response.clone();
      
      try {
        const responseData = await clonedResponse.json();
        console.log('Response status:', response.status);
        console.log('Response data:', responseData);
      } catch (e) {
        console.log('Response status:', response.status);
        console.log('Response could not be parsed as JSON');
      }
      
      console.groupEnd();
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      console.groupEnd();
      throw error;
    }
  };
  
  console.log('Fetch API debugging enabled');
})();
