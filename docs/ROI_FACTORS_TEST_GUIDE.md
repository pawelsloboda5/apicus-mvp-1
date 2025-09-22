# ROI Factors Testing Guide

## 🧪 How to Test the New Task-Specific ROI Factors

### Prerequisites
- Ensure Azure OpenAI environment variables are set
- Have a scenario with workflow nodes (triggers, actions)
- Open the ROI Settings Panel from StatsBar

### Testing Steps

#### 1. **Open ROI Settings Panel**
- Click the "ROI Settings" button in the StatsBar
- Panel should open at 50% screen width
- Verify the tiled layout for all metrics

#### 2. **Navigate to Task-Specific Factors Section**
- Scroll to "Task-Specific Optimization Factors" section
- You should see a placeholder with "Generate Factors" button
- Task type badge should match your selected task

#### 3. **Generate Factors**
- Click "Generate Factors" button
- Loading state should show with spinner
- Wait 2-3 seconds for AI generation
- Upon success, you should see:
  - **Value Drivers** accordion (6 positive factors)
  - **Cost & Risk Factors** accordion (4 negative factors)
  - Confidence score badge

#### 4. **Interact with Factors**
- Expand both accordions
- Each factor card shows:
  - Title and description
  - Slider and input controls
  - Current impact in $/month
  - Priority/severity badge
  - Help icon with formula details
- Try adjusting values:
  - Use slider for quick adjustments
  - Use input for precise values
  - Click "Reset" to return to AI suggestion
- Watch impact values update in real-time

#### 5. **View Aggregate Impact**
- In accordion headers, see total impact:
  - Positive factors show green +$X/mo
  - Negative factors show red $X/mo
- These update as you adjust factor values

#### 6. **Regenerate Factors**
- Click "Regenerate Factors" button
- New factors will be generated
- Previous values will be replaced

### What to Look For

#### ✅ Success Indicators
- Factors are specific to your task type
- Values seem reasonable for your workflow
- Sliders respond smoothly
- Impact calculations update instantly
- All UI elements are properly styled
- No console errors

#### ⚠️ Potential Issues
- If generation fails, check console for API errors
- If no nodes in workflow, generation may use defaults
- Factor values persist in database (check IndexedDB)

### Testing Different Task Types

Try changing task type and regenerating:
1. **General** - Basic automation factors
2. **Sales** - Deal velocity, lead quality focus
3. **Marketing** - Campaign performance, lead gen
4. **Customer Support** - Resolution rate, satisfaction
5. **Finance** - Accuracy, fraud detection
6. **Compliance** - Risk reduction, audit readiness

### Performance Testing

- Generate factors multiple times - should use cache after first call
- Check network tab - cached responses should be instant
- Adjust many factors rapidly - UI should remain responsive

### Edge Cases to Test

1. **No workflow nodes** - Should still generate generic factors
2. **Very low runs/month** - Should show warning about viability
3. **Extreme factor values** - Min/max boundaries should be enforced
4. **Network offline** - Should fallback to default factors
5. **Multiple regenerations** - Cache should work correctly

### Debugging

If factors don't appear:
```javascript
// Check browser console for:
// 1. API response
console.log('Check Network tab for /api/openai/generate-roi-fields');

// 2. Factor state in React DevTools
// Look for: positiveFactors, negativeFactors, factorValues

// 3. Database storage
// IndexedDB > ApicusDB > scenarios > taskSpecificFactors
```

### Expected API Response Time
- **First generation**: 2-4 seconds
- **Cached response**: < 100ms
- **Fallback to defaults**: Instant if API fails

### Success Metrics
- ✅ Factors generated within 5 seconds
- ✅ All factors have reasonable default values  
- ✅ Impact calculations are mathematically correct
- ✅ UI remains responsive during generation
- ✅ Values persist after panel close/reopen

## 🎉 Feature Complete!

The task-specific ROI factors system is now fully integrated and ready for testing. This completes the major enhancement to the ROI calculation system with intelligent, AI-powered optimization factors.
