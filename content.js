class ContentExtractor {
  static extractMainContent() {
    // Priority selectors for main content
    const prioritySelectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '.post',
      '.article',
      '.email-content',
      '.message-content',
      '.document-content'
    ];

    // Try priority selectors first
    for (const selector of prioritySelectors) {
      const element = document.querySelector(selector);
      if (element && this.isSubstantialContent(element)) {
        return this.cleanContent(element.textContent);
      }
    }

    // Fallback: find the largest text block
    return this.findLargestContentBlock();
  }

  static isSubstantialContent(element) {
    const text = element.textContent || '';
    return text.length > 200 && 
           text.split(/\s+/).length > 30 && // At least 30 words
           !this.isNavigation(element);
  }

  static isNavigation(element) {
    const navSelectors = ['nav', '.nav', '.navigation', '.menu', '.header', '.footer'];
    return navSelectors.some(selector => element.closest(selector));
  }

  static findLargestContentBlock() {
    const contentCandidates = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          const text = node.textContent.trim();
          if (text.length > 100 && node.parentElement) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      contentCandidates.push({
        text: node.textContent,
        element: node.parentElement
      });
    }

    // Sort by content length and return the largest
    contentCandidates.sort((a, b) => b.text.length - a.text.length);
    
    return contentCandidates.length > 0 ? 
           this.cleanContent(contentCandidates[0].text) : 
           this.cleanContent(document.body.textContent);
  }

  static cleanContent(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()
      .substring(0, 15000); // Limit size for performance
  }
}

// Message listener for popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractContent") {
    try {
      const content = ContentExtractor.extractMainContent();
      sendResponse({
        success: true,
        content: content,
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }
  return true; // Keep message channel open for async response
});
