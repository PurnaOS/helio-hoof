# Development Guide - Helio-Hoof

## Mock LLM Mode for Development

To avoid API costs during development, this project includes a mock LLM service that provides realistic sample responses without making actual API calls.

### Quick Setup

1. **Enable Mock Mode** (Recommended for development):
   ```bash
   # Copy the development environment template
   cp .env.development .env.local

   # Or create .env.local manually with:
   USE_MOCK_LLM=true
   ```

2. **Start Development Server**:
   ```bash
   bun run dev
   ```

The application will now use mock responses instead of making real API calls.

### Configuration Options

#### Mock Mode (No API costs)
```env
USE_MOCK_LLM=true
# ANTHROPIC_API_KEY not required
```

#### Real API Mode (Incurs costs)
```env
USE_MOCK_LLM=false
ANTHROPIC_API_KEY=your_actual_api_key_here
```

### Environment Files

- `.env.development` - Template with mock mode enabled
- `.env.local` - Your local configuration (not tracked by git)
- `.env.production` - Production settings (should never use mock mode)

### Mock Features

The mock service provides:

- **Realistic Responses**: Sample equestrian analysis data that matches the real API format
- **Variable Timing**: Simulates realistic API response delays (500-3000ms)
- **Multiple Scenarios**: Different sample responses to test various UI states
- **Proper JSON Structure**: Matches exactly what the real API returns

### Sample Mock Responses

#### Single Image Analysis
- Rider scores: 6-9/10
- Horse scores: 7-9/10
- Detailed feedback on position, technique, and areas for improvement
- Safety observations and partnership notes

#### Multi-Image Analysis
- Individual analysis for each uploaded image
- Comparative analysis across images
- Development patterns and consistency notes
- Priority focus areas

### Development Workflow

1. **Initial Development**: Use mock mode to develop UI and functionality
2. **API Testing**: Switch to real API mode for final testing
3. **Production**: Always uses real API (mock mode disabled)

### Debugging

The application logs the current configuration on server startup:

```
🔧 Development Configuration:
   Environment: development
   Mock LLM Mode: ✅ ENABLED
   Anthropic API Key: ❌ MISSING
💡 Using mock responses - no API costs incurred
```

### Adding New Mock Responses

To add new mock responses, edit `src/lib/mock-anthropic.ts`:

```typescript
// Add to SINGLE_IMAGE_RESPONSES or MULTI_IMAGE_RESPONSES arrays
const NEW_RESPONSE = {
  "rider_analysis": {
    // ... your mock data
  }
};
```

### Configuration Validation

The system automatically validates your configuration:

- **Development + No API Key + Mock Disabled**: ❌ Error
- **Production + Mock Enabled**: ❌ Error
- **Development + Mock Enabled**: ✅ Valid
- **Production + API Key + Mock Disabled**: ✅ Valid

### Cost Savings

Using mock mode during development can save significant API costs:

- **Real API**: ~$0.01-0.05 per image analysis
- **Mock Mode**: $0.00 per analysis
- **Typical Development**: 50-200 test analyses = $0.50-$10.00 saved

### Switching Modes

To switch from mock to real API:

```bash
# Edit .env.local
USE_MOCK_LLM=false
ANTHROPIC_API_KEY=your_actual_key

# Restart development server
bun run dev
```

### Production Deployment

Ensure your production environment has:

```env
USE_MOCK_LLM=false
ANTHROPIC_API_KEY=your_production_api_key
NODE_ENV=production
```

The application will automatically prevent mock mode in production and require a valid API key.