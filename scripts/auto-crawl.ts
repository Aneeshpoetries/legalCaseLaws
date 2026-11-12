import 'dotenv/config';
import { supabase } from '../src/server/db.ts';
import { runSourceCollection } from '../src/server/collector.ts';
import { closeBrowser } from '../src/server/crawler.ts';

async function main() {
  console.log('[AUTO-CRAWL] Starting scheduled full-portal intelligence sweep...');
  const { data: sources, error } = await supabase
    .from('source_registry')
    .select('id, name, authorities(code)')
    .eq('is_active', true)
    .order('id', { ascending: true });

  if (error || !sources) {
    console.error('[AUTO-CRAWL] Failed to load active sources:', error?.message);
    process.exit(1);
  }

  let totalFound = 0;
  let totalIngested = 0;

  for (const src of sources) {
    const code = (src as any).authorities?.code || 'PORTAL';
    console.log(`[AUTO-CRAWL] -> Crawling ${code} (Source #${src.id}: ${src.name})...`);
    try {
      const res = await runSourceCollection(src.id);
      totalFound += res.docsFound;
      totalIngested += res.docsIngested;
      console.log(`[AUTO-CRAWL] <- ${code} completed: ${res.docsFound} found, ${res.docsIngested} newly ingested.`);
    } catch (err: any) {
      console.error(`[AUTO-CRAWL] Error crawling ${code}:`, err.message);
    }
  }

  await closeBrowser();
  console.log(`[AUTO-CRAWL] Sweep complete. Total found: ${totalFound}, Newly published: ${totalIngested}.`);
  process.exit(0);
}

main();
