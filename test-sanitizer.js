// Quick test of the sanitization functions
const { sanitizeForJSON, validateJsonContent } = require('./frontend/src/utils/jsonSanitizer.ts');

// Test cases with problematic Unicode
const testCases = [
  "Normal text",
  "Text with emoji 😀",
  "High surrogate only: \uD800",
  "Low surrogate only: \uDC00", 
  "Proper emoji: 😀",
  "Mixed content: Hello 😀 World \uD800",
  '<p>HTML with emoji: 🎯</p>',
  JSON.stringify({content: "Content with emoji 📊 and surrogate \uD800"}),
];

console.log('Testing JSON sanitization...\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.substring(0, 50)}...`);
  console.log(`  Original valid: ${validateJsonContent(testCase)}`);
  
  try {
    const sanitized = sanitizeForJSON(testCase);
    console.log(`  Sanitized valid: ${validateJsonContent(sanitized)}`);
    console.log(`  Can stringify: ${JSON.stringify(sanitized) !== null}`);
  } catch (error) {
    console.log(`  Error: ${error.message}`);
  }
  console.log('');
});

console.log('All tests completed!');