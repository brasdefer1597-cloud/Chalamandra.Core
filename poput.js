class ChalamandraEngine {
  constructor() {
    this.analysisHistory = [];
    this.initEventListeners();
    this.updateStatus('ready', 'Ready to analyze');
  }

  initEventListeners() {
    document.getElementById('analyzeBtn').addEventListener('click', () => this.analyzeCurrentPage());
    document.getElementById('copyInsights').addEventListener('click', () => this.copyInsights());
    document.getElementById('exportAnalysis').addEventListener('click', () => this.exportAnalysis());
  }

  async analyzeCurrentPage() {
    this.updateStatus('processing', 'Extracting content...');
    
    try {
      const pageContent = await this.extractPageContent();
      if (!pageContent || pageContent.length < 100) {
        throw new Error('Not enough content to analyze');
      }

      this.updateStatus('processing', 'Analyzing with Chrome AI...');
      const analysis = await this.performAnalysis(pageContent);
      
      this.displayResults(analysis);
      this.updateStatus('success', 'Analysis complete');
      
    } catch (error) {
      this.updateStatus('error', `Analysis failed: ${error.message}`);
      this.showError(error.message);
    }
  }

  async extractPageContent() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: "extractContent" }, (response) => {
        if (response && response.content) {
          resolve(response.content);
        } else {
          resolve(null);
        }
      });
    });
  }

  async performAnalysis(content) {
    const analysisMode = document.querySelector('input[name="analysisMode"]:checked').value;
    
    // Using Chrome Built-in AI APIs
    const analysisPromises = [
      this.analyzeStrategicLayer(content),
      this.analyzeEmotionalLayer(content),
      this.analyzeRelationalLayer(content)
    ];

    const results = await Promise.allSettled(analysisPromises);
    
    return {
      timestamp: new Date().toISOString(),
      contentPreview: content.substring(0, 200) + '...',
      layers: {
        strategic: this.getResult(results[0]),
        emotional: this.getResult(results[1]),
        relational: this.getResult(results[2])
      },
      resonance: this.calculateResonance(results)
    };
  }

  async analyzeStrategicLayer(content) {
    const prompt = `Analyze this text for strategic elements:

    "${content.substring(0, 4000)}"

    Focus on:
    - Power dynamics and hierarchy
    - Hidden agendas or ulterior motives  
    - Negotiation leverage points
    - Strategic opportunities
    - Potential risks or threats

    Format response as JSON with: strategy_insights, opportunities, risks, confidence_score`;

    return await ai.prompt({
      text: prompt,
      context: "Strategic communication analysis",
      format: "structured_json"
    });
  }

  async analyzeEmotionalLayer(content) {
    return await ai.rewriter.rewrite({
      text: content,
      options: {
        tone: "analytical",
        perspective: "emotional_intelligence_analysis",
        focus: "emotional_subtext"
      }
    });
  }

  async analyzeRelationalLayer(content) {
    return await ai.summarizer.summarize({
      text: content,
      options: {
        format: "relational_dynamics",
        focus: "social_cues,trust_indicators,connection_points"
      }
    });
  }

  calculateResonance(results) {
    const validResults = results.filter(r => r.status === 'fulfilled').length;
    return validResults / results.length;
  }

  displayResults(analysis) {
    // Update resonance meter
    const resonanceFill = document.getElementById('resonanceFill');
    const resonanceValue = document.getElementById('resonanceValue');
    const resonanceLabel = document.getElementById('resonanceLabel');
    
    const resonancePercent = Math.round(analysis.resonance * 100);
    resonanceFill.style.width = `${resonancePercent}%`;
    resonanceValue.textContent = `${resonancePercent}%`;
    resonanceLabel.textContent = this.getResonanceLabel(analysis.resonance);

    // Display insights
    const insightsGrid = document.getElementById('insightsGrid');
    insightsGrid.innerHTML = '';

    Object.entries(analysis.layers).forEach(([layer, data], index) => {
      if (data && !data.error) {
        const insightCard = this.createInsightCard(layer, data, index);
        insightsGrid.appendChild(insightCard);
      }
    });

    if (insightsGrid.children.length === 0) {
      insightsGrid.innerHTML = '<div class="insight-card">No insights generated. Try analyzing a page with more content.</div>';
    }

    // Store in history
    this.analysisHistory.push(analysis);
  }

  createInsightCard(layer, data, index) {
    const card = document.createElement('div');
    card.className = `insight-card ${layer}`;
    card.style.animationDelay = `${index * 0.1}s`;

    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    
    card.innerHTML = `
      <div class="insight-header">
        <span class="insight-type">${layer.toUpperCase()}</span>
        <span class="insight-confidence">High</span>
      </div>
      <div class="insight-content">${this.formatInsightContent(content)}</div>
    `;

    return card;
  }

  formatInsightContent(content) {
    // Limit content length and format for display
    if (content.length > 200) {
      return content.substring(0, 200) + '...';
    }
    return content;
  }

  getResonanceLabel(resonance) {
    if (resonance >= 0.8) return 'Excellent Match';
    if (resonance >= 0.6) return 'Good Match';
    if (resonance >= 0.4) return 'Moderate Match';
    return 'Low Match';
  }

  updateStatus(status, message) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    statusText.textContent = message;
    
    // Update dot color based on status
    statusDot.style.background = {
      ready: '#10b981',
      processing: '#f59e0b', 
      success: '#10b981',
      error: '#ef4444'
    }[status];
  }

  showError(message) {
    const insightsGrid = document.getElementById('insightsGrid');
    insightsGrid.innerHTML = `
      <div class="insight-card" style="border-color: var(--error-red);">
        <div class="insight-header">
          <span class="insight-type">ERROR</span>
        </div>
        <div class="insight-content">${message}</div>
      </div>
    `;
  }

  async copyInsights() {
    const insights = this.analysisHistory[this.analysisHistory.length - 1];
    if (insights) {
      const text = JSON.stringify(insights, null, 2);
      await navigator.clipboard.writeText(text);
      this.showNotification('Insights copied to clipboard');
    }
  }

  exportAnalysis() {
    const insights = this.analysisHistory[this.analysisHistory.length - 1];
    if (insights) {
      const dataStr = JSON.stringify(insights, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `chalamandra-analysis-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      this.showNotification('Analysis exported');
    }
  }

  showNotification(message) {
    // Simple notification implementation
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: var(--success-green);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }

  getResult(promiseResult) {
    return promiseResult.status === 'fulfilled' ? promiseResult.value : { error: promiseResult.reason };
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.chalamandra = new ChalamandraEngine();
});
