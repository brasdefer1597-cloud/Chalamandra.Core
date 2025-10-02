class PerformanceMetrics {
  static trackAnalysis(analysis) {
    const metrics = {
      timestamp: analysis.timestamp,
      contentLength: analysis.contentPreview.length,
      layersAnalyzed: Object.keys(analysis.layers).filter(k => !analysis.layers[k].error).length,
      resonanceScore: analysis.resonance,
      processingTime: Date.now() - analysis.startTime
    };

    this.saveMetrics(metrics);
    return metrics;
  }

  static saveMetrics(metrics) {
    chrome.storage.local.get(['analysisMetrics'], (result) => {
      const existingMetrics = result.analysisMetrics || [];
      existingMetrics.push(metrics);
      
      // Keep only last 100 analyses
      const trimmedMetrics = existingMetrics.slice(-100);
      
      chrome.storage.local.set({ analysisMetrics: trimmedMetrics });
    });
  }

  static getPerformanceReport() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['analysisMetrics'], (result) => {
        const metrics = result.analysisMetrics || [];
        
        const report = {
          totalAnalyses: metrics.length,
          averageResonance: this.calculateAverage(metrics.map(m => m.resonanceScore)),
          averageProcessingTime: this.calculateAverage(metrics.map(m => m.processingTime)),
          successRate: metrics.filter(m => m.resonanceScore > 0.5).length / metrics.length,
          mostFrequentDomains: this.getFrequentDomains()
        };

        resolve(report);
      });
    });
  }

  static calculateAverage(numbers) {
    return numbers.length > 0 ? 
           numbers.reduce((a, b) => a + b) / numbers.length : 0;
  }
}
