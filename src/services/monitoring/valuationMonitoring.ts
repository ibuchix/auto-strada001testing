/**
 * Valuation Monitoring Service
 * Created: 2025-04-19
 * Tracks data quality metrics for vehicle valuations
 */

interface ValuationMetrics {
  timestamp: string;
  vin: string;
  hasPricingData: boolean;
  usedFallbackValues: boolean;
  dataQualityScore: number;
  executionTimeMs: number;
}

class ValuationMonitoring {
  private static readonly STORAGE_KEY = 'valuation_metrics';
  private static readonly MAX_STORED_METRICS = 100;

  static trackValuation(metrics: Omit<ValuationMetrics, 'timestamp'>): void {
    try {
      const metric: ValuationMetrics = {
        ...metrics,
        timestamp: new Date().toISOString()
      };

      const storedMetrics = this.getStoredMetrics();
      storedMetrics.unshift(metric);

      // Keep only the last N metrics
      const limitedMetrics = storedMetrics.slice(0, this.MAX_STORED_METRICS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedMetrics));

      // Log metrics for monitoring
      console.log('Valuation metrics:', {
        ...metric,
        historicalDataPoints: limitedMetrics.length
      });

      // Check for anomalies
      this.checkForAnomalies(limitedMetrics);
    } catch (error) {
      console.error('Failed to track valuation metrics:', error);
    }
  }

  private static getStoredMetrics(): ValuationMetrics[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  private static checkForAnomalies(metrics: ValuationMetrics[]): void {
    if (metrics.length < 5) return; // Need minimum data points

    // Calculate recent metrics
    const recent = metrics.slice(0, 5);
    const pricingDataSuccess = recent.filter(m => m.hasPricingData).length / recent.length;
    const fallbackRate = recent.filter(m => m.usedFallbackValues).length / recent.length;
    const avgQualityScore = recent.reduce((sum, m) => sum + m.dataQualityScore, 0) / recent.length;

    // Alert on concerning patterns
    if (pricingDataSuccess < 0.6) {
      console.warn('Alert: Low pricing data success rate:', {
        rate: pricingDataSuccess,
        timestamp: new Date().toISOString()
      });
    }

    if (fallbackRate > 0.4) {
      console.warn('Alert: High fallback value usage:', {
        rate: fallbackRate,
        timestamp: new Date().toISOString()
      });
    }

    if (avgQualityScore < 0.7) {
      console.warn('Alert: Low data quality score:', {
        score: avgQualityScore,
        timestamp: new Date().toISOString()
      });
    }
  }

  static getMetricsSummary(): {
    totalChecks: number;
    successRate: number;
    avgQualityScore: number;
    fallbackRate: number;
  } {
    const metrics = this.getStoredMetrics();
    
    if (metrics.length === 0) {
      return {
        totalChecks: 0,
        successRate: 1,
        avgQualityScore: 1,
        fallbackRate: 0
      };
    }

    return {
      totalChecks: metrics.length,
      successRate: metrics.filter(m => m.hasPricingData).length / metrics.length,
      avgQualityScore: metrics.reduce((sum, m) => sum + m.dataQualityScore, 0) / metrics.length,
      fallbackRate: metrics.filter(m => m.usedFallbackValues).length / metrics.length
    };
  }
}

export { ValuationMonitoring, type ValuationMetrics };
