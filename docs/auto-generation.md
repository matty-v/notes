# Auto-Generation of Note Titles and Tags

## Overview

The Notes app now includes intelligent auto-generation of note titles and tags using Claude AI. When users create or update notes without providing a title or tags, the app automatically analyzes the note content and generates meaningful metadata.

## How It Works

### Trigger Behavior

Auto-generation occurs when:
1. A note is created or updated
2. The title field is empty (or contains only whitespace), OR
3. The tags field is empty (or contains only whitespace)

### Generation Process

1. **Content Analysis**: The note content is sent to Claude 3.5 Haiku
2. **Metadata Generation**: Claude analyzes the content and generates:
   - A concise, descriptive title (max 60 characters)
   - 2-5 relevant tags based on themes and key concepts
3. **Silent Application**: Generated values are applied automatically without user confirmation
4. **Graceful Degradation**: If generation fails, the save operation continues with empty values

### Empty Detection Rules

- **Title is empty when**: `!title || title.trim() === ''`
- **Tags are empty when**: `!tags || tags.trim() === ''`

## Configuration

### API Key Setup

Add your Anthropic API key to your environment:

```bash
# .env.local
VITE_ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

Get an API key from: https://console.anthropic.com/

### Optional Configuration

The auto-generation feature:
- Uses Claude 3.5 Haiku for fast, cost-effective generation
- Falls back gracefully if API key is not configured
- Doesn't block save operations if generation fails

## Usage Examples

### Creating a Note

```typescript
// User provides content only
await createNote({
  title: '',
  content: 'Meeting notes from the product planning session...',
  tags: ''
})

// Result:
// title: "Product Planning Session Notes"
// tags: "meeting, planning, product"
```

### Updating a Note

```typescript
// User clears the title
await updateNote({
  id: 'note-123',
  title: '',  // Will be auto-generated
  tags: 'existing-tag'  // Will be preserved
})
```

### Partial Generation

```typescript
// Auto-generate only tags
await createNote({
  title: 'My Custom Title',  // User provided
  content: 'Content about React hooks...',
  tags: ''  // Will be auto-generated
})

// Result:
// title: "My Custom Title" (preserved)
// tags: "react, hooks, javascript"
```

## Architecture

### Key Files

- **`src/services/claude/generateMetadata.ts`**: Claude API integration
  - `generateMetadata()`: Main generation function
  - `shouldGenerateTitle()`: Empty title detection
  - `shouldGenerateTags()`: Empty tags detection

- **`src/hooks/use-notes.ts`**: Integration point
  - Modified `createNote` mutation
  - Modified `updateNote` mutation
  - Calls generation before saving to IndexedDB

### API Request Format

```typescript
POST https://api.anthropic.com/v1/messages
Headers:
  Content-Type: application/json
  x-api-key: <ANTHROPIC_API_KEY>
  anthropic-version: 2023-06-01

Body:
{
  "model": "claude-3-5-haiku-20241022",
  "max_tokens": 256,
  "messages": [{
    "role": "user",
    "content": "Analyze the following note content..."
  }]
}
```

### Response Format

```json
{
  "title": "Generated Title",
  "tags": ["tag1", "tag2", "tag3"]
}
```

## Error Handling

The implementation handles errors gracefully:

1. **No API Key**: Logs warning, skips generation
2. **Empty Content**: Returns null, no API call made
3. **API Error**: Logs error, returns null, save continues
4. **Invalid Response**: Logs error, returns null, save continues
5. **Network Failure**: Logs error, returns null, save continues

In all error cases, the note save operation proceeds successfully with the original (empty) values.

## Testing

### Unit Tests

Run the generation service tests:
```bash
npx vitest run tests/unit/generateMetadata.test.ts
```

Run the integration tests:
```bash
npx vitest run tests/unit/use-notes-autogen.test.ts
```

### Test Coverage

The tests cover:
- Empty content detection
- API key validation
- Successful generation
- Error handling scenarios
- Integration with createNote/updateNote
- Partial generation (title only, tags only)

## Performance Considerations

### API Latency

- Claude 3.5 Haiku typically responds in 1-2 seconds
- Generation happens before save, so users experience a brief delay
- Consider implementing async generation if latency is an issue

### Cost Optimization

- Uses Haiku model (most cost-effective Claude model)
- Only generates when fields are truly empty
- Max 256 tokens per generation (minimal cost)
- No generation for empty content

### Rate Limiting

The current implementation doesn't include rate limiting. Consider adding:
- Client-side debouncing for rapid saves
- Cache recent generations to avoid duplicate requests
- Queue system for offline generation

## Future Enhancements

Potential improvements:
1. **Async Generation**: Apply generated values after save completes
2. **User Preferences**: Allow users to enable/disable auto-generation
3. **Manual Trigger**: Add UI button to regenerate title/tags
4. **Generation History**: Show alternative suggestions
5. **Custom Prompts**: Let users customize generation style
6. **Caching**: Cache generations to reduce API calls
7. **Batch Processing**: Generate for multiple notes at once
