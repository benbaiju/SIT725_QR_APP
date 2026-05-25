const fs = require('fs');
const os = require('os');
const path = require('path');

const rootDir = __dirname;
const envPath = path.join(rootDir, '.env');
const examplePath = path.join(rootDir, '.env.example');

function isPrivateIPv4(address) {
  return (
    address.startsWith('10.') ||
    address.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(address)
  );
}

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  Object.entries(interfaces).forEach(([name, addresses = []]) => {
    addresses.forEach((address) => {
      if (address.family === 'IPv4' && !address.internal && isPrivateIPv4(address.address)) {
        candidates.push({ name, address: address.address });
      }
    });
  });

  const preferred = candidates.find(({ name }) => ['en0', 'en1', 'Wi-Fi'].includes(name));
  const selected = preferred || candidates[0];

  if (!selected) {
    throw new Error('Could not detect a local private IPv4 address');
  }

  return selected.address;
}

function ensureEnvFile() {
  if (!fs.existsSync(envPath)) {
    if (!fs.existsSync(examplePath)) {
      throw new Error('.env.example not found. Create .env manually before running Docker.');
    }
    fs.copyFileSync(examplePath, envPath);
    console.log('Created .env from .env.example');
  }
}

function updateBaseUrl(host) {
  const baseUrl = `http://${host}:8080`;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  let found = false;

  const updated = lines.map((line) => {
    if (line.startsWith('BASE_URL=')) {
      found = true;
      return `BASE_URL=${baseUrl}`;
    }
    return line;
  });

  if (!found) {
    updated.push(`BASE_URL=${baseUrl}`);
  }

  fs.writeFileSync(envPath, updated.join('\n'));
  console.log(`Updated .env with BASE_URL=${baseUrl}`);
}

const useLocalIp = process.argv.includes('--local-ip');
const host = process.env.BASE_HOST || (useLocalIp ? getLocalIp() : 'localhost');

ensureEnvFile();
updateBaseUrl(host);
