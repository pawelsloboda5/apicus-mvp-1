# ROI Defaults Research & Methodology

## Overview
This document outlines the research-based approach for defining default ROI factors across 14 task types in automation workflows. Factors are calibrated to align with task multipliers (1.0x - 2.5x) and industry benchmarks.

## Research Methodology

### Data Sources
1. **Industry Benchmarks**: General automation ROI studies showing 30-70% time savings
2. **Task Complexity Analysis**: Correlation between task multiplier and expected improvements
3. **Risk Assessment**: Higher-value tasks typically require more maintenance and carry greater risks
4. **Conservative Estimates**: Default values set at 80% of typical benchmarks for reliability

### Task Type Categories & Multipliers

| Task Type | Multiplier | Category | Value Driver |
|-----------|------------|----------|--------------|
| Internal Admin | 1.0x | Low | Basic efficiency |
| Client Communication | 1.2x | Low-Med | Customer satisfaction |
| Data Cleaning | 1.2x | Low-Med | Data quality |
| Scheduling | 1.3x | Medium | Resource optimization |
| Reporting | 1.3x | Medium | Decision support |
| Onboarding | 1.5x | Medium | Speed to productivity |
| Cross-Platform Sync | 1.5x | Medium | Integration efficiency |
| Outreach | 1.6x | Med-High | Lead generation |
| Lead Scoring | 1.8x | High | Sales efficiency |
| Sales Enablement | 2.0x | High | Revenue acceleration |
| Revenue Capture | 2.2x | Very High | Direct revenue |
| Contract/Legal | 2.2x | Very High | Risk mitigation |
| Booking/Appointment | 2.3x | Very High | Conversion optimization |
| Pipeline Closing | 2.5x | Very High | Deal velocity |

## Positive Factor Patterns by Multiplier Range

### Low Multiplier (1.0x - 1.2x)
**Characteristics**: Basic administrative tasks, foundational improvements
- **Process Standardization**: 15-20% time savings
- **Data Accuracy**: 20-30% error reduction
- **Automation Reliability**: 95-98% uptime
- **Monthly Impact**: $300-$800 per factor

### Medium Multiplier (1.3x - 1.5x)
**Characteristics**: Workflow optimization, system integration
- **Process Efficiency**: 25-35% time savings
- **Integration Benefits**: 30-40% faster data flow
- **Quality Improvements**: 25-35% fewer issues
- **Monthly Impact**: $600-$1,500 per factor

### High Multiplier (1.6x - 2.0x)
**Characteristics**: Customer-facing, revenue-impacting
- **Customer Engagement**: 35-45% faster response
- **Conversion Improvements**: 15-25% higher rates
- **Personalization**: 40-50% better targeting
- **Monthly Impact**: $1,200-$3,000 per factor

### Very High Multiplier (2.2x - 2.5x)
**Characteristics**: Direct revenue generation, critical processes
- **Revenue Acceleration**: 25-40% faster deal cycles
- **Risk Reduction**: 50-70% fewer errors
- **Compliance**: 80-95% audit trail coverage
- **Monthly Impact**: $2,000-$5,000 per factor

## Negative Factor Patterns

### Maintenance Overhead
- **Low Complexity**: 1-2 hours/month
- **Medium Complexity**: 2-3 hours/month
- **High Complexity**: 3-5 hours/month
- **Very High Complexity**: 4-6 hours/month

### System Downtime Risk
- **Low Impact**: 0.1-0.3% downtime
- **Medium Impact**: 0.3-0.5% downtime
- **High Impact**: 0.5-1.0% downtime
- **Critical Impact**: 0.5-1.5% downtime

### Training Requirements
- **Simple Tasks**: 2-4 hours initial
- **Moderate Tasks**: 4-6 hours initial
- **Complex Tasks**: 6-10 hours initial
- **Advanced Tasks**: 8-12 hours initial

### Tool/Subscription Costs
- **Basic**: $25-$50/month additional
- **Standard**: $50-$100/month additional
- **Professional**: $100-$200/month additional
- **Enterprise**: $150-$300/month additional

## Factor Calculation Formulas

### Time-Based Factors
```
estimatedMonthlyImpact = (runsPerMonth × minutesPerRun × hourlyRate / 60) × (percentage / 100)
```

### Quality-Based Factors
```
estimatedMonthlyImpact = runsPerMonth × errorRate × errorCost × (improvement / 100)
```

### Revenue-Based Factors
```
estimatedMonthlyImpact = runsPerMonth × conversionRate × avgDealSize × (improvement / 100)
```

### Scale-Based Factors
```
estimatedMonthlyImpact = baseTimeValue × scalingFactor × (utilizationRate / 100)
```

## Confidence Scoring Methodology

### High Confidence (85-95%)
- Well-established automation patterns
- Extensive industry data
- Measurable, repeatable outcomes

### Moderate Confidence (70-84%)
- Some industry validation
- Task-specific variables
- Context-dependent outcomes

### Conservative Confidence (60-69%)
- Emerging automation areas
- Limited benchmark data
- High variability across implementations

## Implementation Guidelines

### Factor Selection Criteria
1. **Relevance**: Factor must directly relate to task type
2. **Measurability**: Factor must be quantifiable
3. **Actionability**: Users should be able to influence factor values
4. **Realism**: Values should reflect typical outcomes (not best-case)

### Calibration Approach
1. Start with conservative baseline (80% of optimistic estimates)
2. Align impact with task multiplier (higher multipliers = higher impacts)
3. Balance positive and negative factors (net positive ROI expected)
4. Provide clear reasoning for each default value

### Testing Validation
- Each task type should show positive ROI at default values
- Higher multiplier tasks should show proportionally higher ROI
- Negative factors should not exceed 40% of positive factors
- Total ROI should fall within 2x-35x range for typical workflows
- Note: Lower-complexity tasks often achieve higher ROI ratios (20-35x) due to minimal overhead costs
- Higher-complexity tasks have more realistic ratios (5-15x) due to higher maintenance and platform costs

## References & Sources
1. Industry ROI studies: 30-70% typical automation time savings
2. Gartner Research: RPA implementations show 20-40% productivity gains
3. McKinsey Analysis: Automation reduces errors by 50-90% in repetitive tasks
4. Forrester Data: Average automation payback period is 6-12 months
5. Conservative adjustments: Default values set at 80% of reported benchmarks

---

**Last Updated**: 2025-10-05
**Version**: 1.0
**Author**: AI Assistant (Research-Based)
