const fs = require('fs');

const file = fs.readFileSync('src/utils/i18n.ts', 'utf-8');
const lines = file.split('\n');

const stack = [];
const seenKeys = [new Set()];

const result = [];
let removedCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  if (trimmed.endsWith('{') && !trimmed.includes(': \'') && !trimmed.includes(': "')) {
    stack.push(trimmed);
    seenKeys.push(new Set());
    result.push(line);
  } else if (trimmed === '}' || trimmed === '},') {
    stack.pop();
    seenKeys.pop();
    result.push(line);
  } else {
    // try to match a key-value pair
    const match = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
    if (match && stack.length > 0) {
      const key = match[1];
      const currentScopeKeys = seenKeys[seenKeys.length - 1];
      if (currentScopeKeys.has(key)) {
        // duplicate found! Skip it.
        removedCount++;
        console.log(`Removing duplicate key: ${key} at line ${i + 1}`);
        continue;
      } else {
        currentScopeKeys.add(key);
        result.push(line);
      }
    } else {
      result.push(line);
    }
  }
}

fs.writeFileSync('src/utils/i18n.ts', result.join('\n'));
console.log(`Removed ${removedCount} duplicate keys.`);
