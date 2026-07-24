const q = 'test';
const API_KEY = 'AIzaSyCg19z6JcQGpRHAXkIv65pHKT5dZfwFX4U';
fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=30&q=${q}&type=video&key=${API_KEY}`)
  .then(r => r.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(console.error);
