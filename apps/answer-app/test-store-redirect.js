// Test store-redirect Edge Function
const storeCode = 'a5fb90ce';
const edgeFunctionUrl = `https://otfreskkeaenahqziriz.supabase.co/functions/v1/store-redirect?code=${storeCode}`;

console.log('Testing store-redirect with code:', storeCode);
console.log('URL:', edgeFunctionUrl);

fetch(edgeFunctionUrl, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZnJlc2trZWFlbmFocXppcml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDc5NTQsImV4cCI6MjA2NjMyMzk1NH0.hfctiBBsg56bfHKE2nKaWLcMz-Gn1P6qlCgZk0-xkO8',
    'Content-Type': 'application/json'
  }
})
  .then(async response => {
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('Error response:', data);
    }
  })
  .catch(error => {
    console.error('Fetch error:', error);
  });