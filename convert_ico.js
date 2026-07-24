const fs = require('fs');
const pngToIco = require('png-to-ico');

pngToIco('build/icon.png')
  .then(buf => {
    fs.writeFileSync('build/icon.ico', buf);
    console.log('Successfully converted icon.png to true icon.ico');
  })
  .catch(console.error);
