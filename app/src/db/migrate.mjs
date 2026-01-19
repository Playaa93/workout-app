import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_EBZRvdhi6l2g@ep-cold-cherry-abb86rz2-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";

async function migrate() {
  console.log('Connecting to Neon...');
  const sql = postgres(DATABASE_URL, { ssl: 'require' });

  // Read schema file
  const schemaPath = join(__dirname, 'schema.sql');
  const schemaContent = readFileSync(schemaPath, 'utf-8');

  console.log('Executing schema...');

  try {
    // Execute using unsafe (allows raw SQL with multiple statements)
    await sql.unsafe(schemaContent);
    console.log('Schema executed successfully!');
  } catch (error) {
    console.error('Error:', error.message);

    // If it fails, try statement by statement
    console.log('\nTrying statement by statement...');

    // Split properly accounting for function bodies
    const statements = [];
    let current = '';
    let inDollarQuote = false;

    const lines = schemaContent.split('\n');
    for (const line of lines) {
      // Check for $$ delimiters
      const dollarMatches = line.match(/\$\$/g);
      if (dollarMatches) {
        inDollarQuote = dollarMatches.length % 2 === 1 ? !inDollarQuote : inDollarQuote;
      }

      current += line + '\n';

      // If we hit a semicolon and we're not in a function body
      if (line.trim().endsWith(';') && !inDollarQuote) {
        const stmt = current.trim();
        if (stmt && !stmt.startsWith('--')) {
          statements.push(stmt);
        }
        current = '';
      }
    }

    // Add any remaining content
    if (current.trim()) {
      statements.push(current.trim());
    }

    let success = 0;
    let skipped = 0;
    let errors = 0;

    for (const stmt of statements) {
      // Skip empty or comment-only statements
      const cleanStmt = stmt.replace(/--.*$/gm, '').trim();
      if (!cleanStmt || cleanStmt.length < 5) continue;

      try {
        await sql.unsafe(stmt);
        success++;
        process.stdout.write('.');
      } catch (e) {
        if (e.message.includes('already exists') || e.message.includes('duplicate')) {
          skipped++;
          process.stdout.write('s');
        } else {
          errors++;
          console.error('\nError:', e.message);
          console.error('Statement preview:', stmt.substring(0, 100).replace(/\n/g, ' ') + '...');
        }
      }
    }

    console.log(`\n\nDone! Success: ${success}, Skipped: ${skipped}, Errors: ${errors}`);
  }

  await sql.end();
  console.log('Connection closed.');
}

migrate().catch(console.error);
