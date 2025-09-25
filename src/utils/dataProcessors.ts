import { HistoricalDataEntry, FundingRateEntry } from "../app/types/dashboardClient";

export interface MarketSentimentData {
  totalMarkets: number;
  positiveFunding: number;
  negativeFunding: number;
  neutralFunding: number;
  weightedSentiment: number;
  sentimentLabel: string;
  sentimentColor: string;
  extremePositive: number;
  extremeNegative: number;
  totalOI: number;
  positiveFundingPercentage: number;
  negativeFundingPercentage: number;
  neutralFundingPercentage: number;
}

export interface ConcentrationData {
  market: string;
  longOI: number;
  shortOI: number;
  totalOI: number;
  concentration: number;
  dominantSide: "long" | "short";
  ratio: number;
  fundingRate: number;
  fundingAligned: boolean;
  riskScore: number;
}

export interface SqueezePotentialData {
  market: string;
  longOI: number;
  shortOI: number;
  oiRatio: number;
  dominantSide: "long" | "short";
  imbalance: number;
  fundingRate: number;
  shortSqueezeScore: number;
  longSqueezeScore: number;
  maxScore: number;
  type: "short" | "long";
}

export interface RiskDashboardData {
  overallRisk: number;
  totalLongOI: number;
  totalShortOI: number;
  extremeFundingCount: number;
  imbalancedMarkets: number;
  volatilityScore: number;
  oiImbalance: number;
  longOIPercent: number;
  shortOIPercent: number;
  riskLevel: {
    label: string;
    color: string;
    textColor: string;
  };
  marketRisks: Array<{
    market: string;
    risk: number;
    totalOI: number;
  }>;
}

export function processMarketSentiment(currentRates: HistoricalDataEntry): MarketSentimentData {
  const markets = Object.entries(currentRates.data);
  const totalMarkets = markets.length;

  // Count positive vs negative funding
  const positiveFunding = markets.filter(([_, rate]) => rate.fundingRate > 0).length;
  const negativeFunding = markets.filter(([_, rate]) => rate.fundingRate < 0).length;
  const neutralFunding = markets.filter(([_, rate]) => rate.fundingRate === 0).length;

  // Calculate OI-weighted sentiment
  let totalWeightedFunding = 0;
  let totalOI = 0;

  markets.forEach(([_, rate]) => {
    const marketOI = (parseFloat(rate.longOI) + parseFloat(rate.shortOI)) / 1e6;
    totalWeightedFunding += rate.fundingRate * marketOI;
    totalOI += marketOI;
  });

  const weightedSentiment = totalOI > 0 ? totalWeightedFunding / totalOI : 0;

  // Calculate extreme rates
  const extremePositive = markets.filter(([_, rate]) => rate.fundingRate > 100).length;
  const extremeNegative = markets.filter(([_, rate]) => rate.fundingRate < -100).length;

  // Determine overall market sentiment
  const getSentimentLabel = () => {
    if (weightedSentiment > 50)
      return { label: "Extremely Bullish", color: "text-green-500" };
    if (weightedSentiment > 20)
      return { label: "Bullish", color: "text-green-500" };
    if (weightedSentiment > 5)
      return { label: "Slightly Bullish", color: "text-green-400" };
    if (weightedSentiment < -50)
      return { label: "Extremely Bearish", color: "text-red-500" };
    if (weightedSentiment < -20)
      return { label: "Bearish", color: "text-red-500" };
    if (weightedSentiment < -5)
      return { label: "Slightly Bearish", color: "text-red-400" };
    return { label: "Neutral", color: "text-gray-600" };
  };

  const sentiment = getSentimentLabel();

  return {
    totalMarkets,
    positiveFunding,
    negativeFunding,
    neutralFunding,
    weightedSentiment,
    sentimentLabel: sentiment.label,
    sentimentColor: sentiment.color,
    extremePositive,
    extremeNegative,
    totalOI,
    positiveFundingPercentage: (positiveFunding / totalMarkets) * 100,
    negativeFundingPercentage: (negativeFunding / totalMarkets) * 100,
    neutralFundingPercentage: (neutralFunding / totalMarkets) * 100,
  };
}

export function processOIConcentration(currentRates: HistoricalDataEntry): ConcentrationData[] {
  const calculateConcentration = (market: string, rate: FundingRateEntry): ConcentrationData | null => {
    const longOI = parseFloat(rate.longOI) / 1e6;
    const shortOI = parseFloat(rate.shortOI) / 1e6;
    const totalOI = longOI + shortOI;

    if (totalOI === 0) return null;

    const longPercent = (longOI / totalOI) * 100;
    const shortPercent = (shortOI / totalOI) * 100;
    const concentration = Math.max(longPercent, shortPercent);
    const dominantSide = longPercent > shortPercent ? "long" : "short";
    const ratio = longOI > shortOI ? longOI / (shortOI || 0.001) : shortOI / (longOI || 0.001);

    // Risk score based on concentration and funding alignment
    let riskScore = 0;
    if (concentration > 90) riskScore = 100;
    else if (concentration > 80) riskScore = 80;
    else if (concentration > 70) riskScore = 60;
    else if (concentration > 60) riskScore = 40;
    else riskScore = 20;

    // Adjust risk based on funding direction
    const fundingAligned =
      (dominantSide === "long" && rate.fundingRate > 0) ||
      (dominantSide === "short" && rate.fundingRate < 0);

    if (!fundingAligned) {
      riskScore *= 1.5; // Higher risk when funding opposes concentration
    }

    return {
      market,
      longOI,
      shortOI,
      totalOI,
      concentration,
      dominantSide,
      ratio,
      fundingRate: rate.fundingRate,
      fundingAligned,
      riskScore: Math.min(100, riskScore),
    };
  };

  return Object.entries(currentRates.data)
    .map(([market, rate]) => calculateConcentration(market, rate))
    .filter((data): data is ConcentrationData => data !== null && data.totalOI > 0)
    .sort((a, b) => b.concentration - a.concentration)
    .slice(0, 15);
}

// Utility functions for UI styling
export function getSqueezeScoreColor(score: number): string {
  if (score > 80) return "text-red-600 font-bold";
  if (score > 60) return "text-orange-600 font-semibold";
  if (score > 40) return "text-yellow-600 font-medium";
  return "text-gray-600";
}

export function getSqueezeLabel(score: number): string {
  if (score > 80) return "🔥 Extreme";
  if (score > 60) return "⚠️ High";
  if (score > 40) return "📊 Moderate";
  if (score > 20) return "📈 Low";
  return "➖ Minimal";
}

export function getRiskColor(score: number): string {
  if (score >= 80) return "bg-red-500";
  if (score >= 60) return "bg-orange-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-green-500";
}

export function getRiskLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Critical", color: "text-red-600" };
  if (score >= 60) return { label: "High", color: "text-orange-600" };
  if (score >= 40) return { label: "Medium", color: "text-yellow-600" };
  return { label: "Low", color: "text-green-600" };
}

export function getRiskLevelWithBg(score: number): { label: string; color: string; textColor: string } {
  if (score >= 75)
    return {
      label: "Critical",
      color: "bg-red-500",
      textColor: "text-red-500",
    };
  if (score >= 50)
    return {
      label: "High",
      color: "bg-orange-500",
      textColor: "text-orange-500",
    };
  if (score >= 25)
    return {
      label: "Medium",
      color: "bg-yellow-500",
      textColor: "text-yellow-500",
    };
  return { label: "Low", color: "bg-green-500", textColor: "text-green-500" };
}

export function processSqueezePotential(currentRates: HistoricalDataEntry): SqueezePotentialData[] {
  const calculateSqueezePotential = (market: string, rate: FundingRateEntry): SqueezePotentialData | null => {
    const longOI = parseFloat(rate.longOI) / 1e6;
    const shortOI = parseFloat(rate.shortOI) / 1e6;
    const totalOI = longOI + shortOI;

    if (totalOI === 0) return null;

    const oiRatio = longOI > shortOI ? longOI / (shortOI || 1) : shortOI / (longOI || 1);
    const dominantSide = longOI > shortOI ? "long" : "short";
    const imbalance = Math.abs(longOI - shortOI) / totalOI;

    // Short squeeze: High short OI with positive funding
    const shortSqueezeScore =
      dominantSide === "short" && rate.fundingRate > 0
        ? imbalance * 100 + Math.abs(rate.fundingRate) / 10
        : 0;

    // Long squeeze: High long OI with expensive funding
    const longSqueezeScore =
      dominantSide === "long" && rate.fundingRate > 100
        ? imbalance * 50 + rate.fundingRate / 20
        : 0;

    return {
      market,
      longOI,
      shortOI,
      oiRatio,
      dominantSide,
      imbalance: imbalance * 100,
      fundingRate: rate.fundingRate,
      shortSqueezeScore,
      longSqueezeScore,
      maxScore: Math.max(shortSqueezeScore, longSqueezeScore),
      type: shortSqueezeScore > longSqueezeScore ? "short" : "long",
    };
  };

  return Object.entries(currentRates.data)
    .map(([market, rate]) => calculateSqueezePotential(market, rate))
    .filter((data): data is SqueezePotentialData => data !== null && data.maxScore > 0)
    .sort((a, b) => b.maxScore - a.maxScore)
    .slice(0, 10);
}

export function processRiskDashboard(currentRates: HistoricalDataEntry, historicalData: HistoricalDataEntry[]): RiskDashboardData {
  const markets = Object.entries(currentRates.data);

  // Overall market metrics
  let totalLongOI = 0;
  let totalShortOI = 0;
  let extremeFundingCount = 0;
  let imbalancedMarkets = 0;
  let volatilityScore = 0;

  markets.forEach(([_, rate]) => {
    const longOI = parseFloat(rate.longOI) / 1e6;
    const shortOI = parseFloat(rate.shortOI) / 1e6;

    totalLongOI += longOI;
    totalShortOI += shortOI;

    // Count extreme funding
    if (Math.abs(rate.fundingRate) > 100) extremeFundingCount++;

    // Count imbalanced markets
    const ratio = longOI > shortOI ? longOI / (shortOI || 1) : shortOI / (longOI || 1);
    if (ratio > 5) imbalancedMarkets++;
  });

  // Calculate funding rate volatility
  if (historicalData.length > 1) {
    const recentData = historicalData.slice(-10);
    const fundingChanges = recentData.slice(1).map((entry, idx) => {
      const prevEntry = recentData[idx];
      let totalChange = 0;
      let count = 0;

      Object.keys(entry.data).forEach((market) => {
        if (prevEntry.data[market]) {
          const change = Math.abs(
            entry.data[market].fundingRate - prevEntry.data[market].fundingRate
          );
          totalChange += change;
          count++;
        }
      });

      return count > 0 ? totalChange / count : 0;
    });

    volatilityScore = fundingChanges.reduce((a, b) => a + b, 0) / fundingChanges.length;
  }

  // Calculate overall risk score (0-100)
  let overallRisk = 0;

  // Factor 1: OI Imbalance (0-25 points)
  const oiImbalance = Math.abs(totalLongOI - totalShortOI) / (totalLongOI + totalShortOI);
  overallRisk += oiImbalance * 25;

  // Factor 2: Extreme funding markets (0-25 points)
  const extremeRatio = extremeFundingCount / markets.length;
  overallRisk += extremeRatio * 25;

  // Factor 3: Market concentration (0-25 points)
  const concentrationRatio = imbalancedMarkets / markets.length;
  overallRisk += concentrationRatio * 25;

  // Factor 4: Volatility (0-25 points)
  overallRisk += Math.min(volatilityScore, 25);

  const finalOverallRisk = Math.min(100, overallRisk);
  const riskLevel = getRiskLevelWithBg(finalOverallRisk);

  // Find highest risk markets
  const marketRisks = Object.entries(currentRates.data)
    .map(([market, rate]) => {
      const longOI = parseFloat(rate.longOI) / 1e6;
      const shortOI = parseFloat(rate.shortOI) / 1e6;
      const totalOI = longOI + shortOI;

      if (totalOI === 0) return null;

      const ratio = longOI > shortOI ? longOI / (shortOI || 1) : shortOI / (longOI || 1);
      const fundingExtreme = Math.abs(rate.fundingRate);

      // Market-specific risk score
      let risk = 0;
      if (ratio > 10) risk += 40;
      else if (ratio > 5) risk += 25;
      else if (ratio > 3) risk += 15;

      if (fundingExtreme > 200) risk += 40;
      else if (fundingExtreme > 100) risk += 25;
      else if (fundingExtreme > 50) risk += 15;

      // Misalignment bonus
      if (
        (longOI > shortOI && rate.fundingRate < 0) ||
        (shortOI > longOI && rate.fundingRate > 0)
      ) {
        risk += 20;
      }

      return { market, risk: Math.min(100, risk), totalOI };
    })
    .filter((d): d is { market: string; risk: number; totalOI: number } => d !== null && d.risk > 30)
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 5);

  const longOIPercent = (totalLongOI / (totalLongOI + totalShortOI)) * 100;
  const shortOIPercent = (totalShortOI / (totalLongOI + totalShortOI)) * 100;

  return {
    overallRisk: finalOverallRisk,
    totalLongOI,
    totalShortOI,
    extremeFundingCount,
    imbalancedMarkets,
    volatilityScore,
    oiImbalance: oiImbalance * 100,
    longOIPercent,
    shortOIPercent,
    riskLevel,
    marketRisks,
  };
}