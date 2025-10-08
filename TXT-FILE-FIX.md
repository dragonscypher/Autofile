# Text File Upload Fix

## Issue
TXT files were failing to upload with error:
```
Error: Incorrect parameters passed to textract
```

## Root Cause
The `extractText` function in `packages/utils/src/parsing.ts` was trying to use `textract` for ALL file types, including plain text files. Textract doesn't handle plain text well and was throwing errors.

## Fix Applied
Updated `extractText()` to handle plain text files directly:

```typescript
// Handle plain text files directly
if (mimeType.includes('text/plain') || mimeType.includes('text/')) {
    const text = buffer.toString('utf-8');
    console.log('[extractText] Plain text file, length:', text.length);
    return { text, meta: { mimeType } };
}
```

Now the function:
1. **Checks for text/plain** - Decodes buffer as UTF-8
2. **Checks for PDF** - Uses pdf-parse library  
3. **Falls back to textract** - For DOC/DOCX files

## What Changed
- `packages/utils/src/parsing.ts` - Added text/plain handling
- Rebuilt utils package with `pnpm build`
- Server restarted to pick up changes

## Test It
1. Upload a `.txt` file as job description
2. Upload `.txt` files as resumes
3. Check terminal logs - you should see `[extractText] Plain text file`
4. No more textract errors!

## Expected Behavior
- TXT files: Read directly ✅
- PDF files: Parsed with pdf-parse ✅
- DOC/DOCX files: Parsed with textract ✅

The error should be gone now and text file uploads will work smoothly!
