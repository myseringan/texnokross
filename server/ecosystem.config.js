app@caribbean-kunzite17426:~/texnokross/server$ cat ecosystem.config.js
const fs = require('fs');
const path = require('path');

// Загрузка секретов из ~/secrets/texnokross.env
const envPath = path.join(process.env.HOME, 'secrets', 'texnokross.env');
const envConfig = {};

if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const idx = line.indexOf('=');
      if (idx > 0) {
        envConfig[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
    }
  });
}

module.exports = {
  apps: [{
    name: 'texnokross-api',
    script: 'index.js',
    env: envConfig
  }]
};
