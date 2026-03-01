const cp = require('child_process');
const fs = require('fs');

try {
  console.log("Running ESLint...");
  cp.execSync('npx eslint . --format json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  console.log("No ESLint errors found.");
  fs.writeFileSync('eslint_errors_utf8.txt', 'No errors.', 'utf8');
} catch(e) {
  try {
    const data = JSON.parse(e.stdout);
    let output = '';
    data.forEach(file => {
        if (file.errorCount > 0 || file.warningCount > 0) {
            output += `\nFILE: ${file.filePath}\n`;
            file.messages.forEach(m => {
                const s = m.severity === 2 ? 'ERROR' : 'WARN';
                output += `[${s}] Line ${m.line}: ${m.message} (${m.ruleId})\n`;
            });
        }
    });
    fs.writeFileSync('eslint_errors_utf8.txt', output, 'utf8');
    console.log("ESLint errors written to eslint_errors_utf8.txt");
  } catch (parseErr) {
    fs.writeFileSync('eslint_errors_utf8.txt', "Failed to parse JSON: " + parseErr.message + "\n\n" + e.stdout, 'utf8');
  }
}
