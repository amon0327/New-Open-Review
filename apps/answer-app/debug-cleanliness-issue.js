// Debug script to understand the Cleanliness data flow issue

console.log('🔍 Analyzing Cleanliness Data Flow\n');

// The issue: Cleanliness (清潔さ・衛生) shows null values for q1-q10 in preset_cleanliness_question_answer table

console.log('1. Frontend Data Structure:');
console.log('   - Cleanliness matrix items use IDs: c1, c2, c3, ... c10');
console.log('   - Quality matrix items use IDs: q1, q2, q3, ... q10');
console.log('   - Service matrix items use IDs: s1, s2, s3, ... s10');
console.log('');

console.log('2. Frontend Answer Format (SentimentMatrixQuestion.js):');
console.log('   The answer is stored as JSON string with matrix item IDs as keys:');
console.log('   For Cleanliness: {"c1": "positive", "c2": "negative", "c3": "neutral", ...}');
console.log('   For Quality: {"q1": "positive", "q2": "negative", "q3": "neutral", ...}');
console.log('   For Service: {"s1": "positive", "s2": "negative", "s3": "neutral", ...}');
console.log('');

console.log('3. Edge Function Processing (lottery/index.ts):');
console.log('   - Line 495: const match = key.match(/[qsc](\\d+)/)');
console.log('   - This regex should match: q1, s1, c1 patterns');
console.log('   - Then it extracts the number and maps to q1, q2, ... q10 columns');
console.log('');

console.log('4. Database Table Structure:');
console.log('   All three tables use the same column names: q1, q2, ... q10');
console.log('   - preset_quality_question_answer');
console.log('   - preset_service_question_answer');
console.log('   - preset_cleanliness_question_answer');
console.log('');

console.log('5. Debugging the Issue:');
console.log('   The regex /[qsc](\\d+)/ should work for all patterns:');
console.log('   - "c1".match(/[qsc](\\d+)/) → ["c1", "1"]');
console.log('   - "q5".match(/[qsc](\\d+)/) → ["q5", "5"]');
console.log('   - "s10".match(/[qsc](\\d+)/) → ["s10", "10"]');
console.log('');

// Test the regex
const testKeys = ['q1', 'q5', 'q10', 's1', 's5', 's10', 'c1', 'c5', 'c10'];
console.log('6. Testing Regex:');
testKeys.forEach(key => {
  const match = key.match(/[qsc](\d+)/);
  if (match) {
    console.log(`   ${key} → matches, number: ${match[1]} → column: q${match[1]}`);
  } else {
    console.log(`   ${key} → NO MATCH ❌`);
  }
});

console.log('\n7. Possible Issues:');
console.log('   a) The answer data might not be parsed correctly');
console.log('   b) The matrix answers might be empty or in wrong format');
console.log('   c) The logging shows the data but it\'s not being saved');
console.log('');

console.log('8. What to Check in Edge Function Logs:');
console.log('   - Look for "=== MATRIX MAPPING DEBUG ===" section');
console.log('   - Check "Matrix answers keys:" - should show c1, c2, etc for Cleanliness');
console.log('   - Check "Matrix answers full content:" - should show the actual values');
console.log('   - Check "=== FINAL DETAIL RECORD ===" - should show q1-q10 with values');
console.log('');

console.log('9. Next Steps:');
console.log('   1. Check Edge Function logs for a Cleanliness submission');
console.log('   2. Verify the matrix answer format is correct');
console.log('   3. Check if the data is being logged but not saved');
console.log('   4. Test with a fresh Cleanliness submission');

console.log('\n✅ Analysis complete');