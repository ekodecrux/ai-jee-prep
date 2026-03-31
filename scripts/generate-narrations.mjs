/**
 * Batch Narration Script Generator
 * Generates AI narration scripts for all JEE chapters missing them
 * and saves permanently to the database (knowledge base).
 * Run: node scripts/generate-narrations.mjs
 */

import mysql from "mysql2/promise";

const DB_URL = process.env.DATABASE_URL;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!DB_URL || !FORGE_API_KEY) {
  console.error("Missing DATABASE_URL or BUILT_IN_FORGE_API_KEY");
  process.exit(1);
}

function parseMysqlUrl(url) {
  const u = new URL(url);
  const sslParam = u.searchParams.get("ssl");
  return {
    host: u.hostname,
    port: parseInt(u.port || "3306"),
    user: u.username,
    password: u.password,
    database: u.pathname.replace("/", ""),
    ssl: sslParam ? JSON.parse(decodeURIComponent(sslParam)) : undefined,
  };
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function invokeLLM(messages) {
  const apiUrl = `${FORGE_API_URL.replace(/\/$/, "")}/v1/chat/completions`;
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      messages,
      max_tokens: 3000,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "narration_script",
          strict: true,
          schema: {
            type: "object",
            properties: {
              introduction: {
                type: "string",
                description: "100-120 word engaging introduction for a JEE student"
              },
              conceptualExplanation: {
                type: "string",
                description: "220-280 word clear conceptual explanation of all key topics"
              },
              formulasAndDerivations: {
                type: "string",
                description: "180-220 word section covering key formulas with brief derivations"
              },
              solvedExamples: {
                type: "string",
                description: "180-220 word walkthrough of 2 JEE-level solved examples"
              },
              advancedConcepts: {
                type: "string",
                description: "120-160 word section on advanced JEE Advanced level aspects"
              },
              examSpecificTips: {
                type: "string",
                description: "100-130 word JEE Main and Advanced exam strategy for this chapter"
              },
              commonMistakes: {
                type: "string",
                description: "100-130 word section on common student mistakes to avoid"
              },
              quickRevisionSummary: {
                type: "string",
                description: "80-100 word quick revision bullet summary"
              },
              mnemonics: {
                type: "string",
                description: "60-80 word memory tricks and mnemonics for key formulas"
              }
            },
            required: [
              "introduction","conceptualExplanation","formulasAndDerivations",
              "solvedExamples","advancedConcepts","examSpecificTips",
              "commonMistakes","quickRevisionSummary","mnemonics"
            ],
            additionalProperties: false
          }
        }
      }
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`LLM error ${res.status}: ${txt.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty LLM response");
  return JSON.parse(content);
}

async function generateForChapter(db, chapter) {
  const { chapterId, title, subjectId, keyTopics } = chapter;
  const subjectName = subjectId.charAt(0).toUpperCase() + subjectId.slice(1);
  const topicsStr = Array.isArray(keyTopics) ? keyTopics.join(", ") : (keyTopics || "");

  const script = await invokeLLM([
    {
      role: "system",
      content: `You are Priya, an expert JEE tutor with 15 years of experience. You write concise, exam-focused narration scripts for JEE aspirants. Be direct, precise, and motivating. Reference JEE Main/Advanced patterns. Write in clear English for Class 11-12 students.`
    },
    {
      role: "user",
      content: `Write a narration script for the JEE chapter: "${title}" (${subjectName}).
Key topics: ${topicsStr}
Keep each section concise and within the word limits specified. Total ~1200-1400 words.`
    }
  ]);

  const allText = Object.values(script).join(" ");
  const wordCount = allText.split(/\s+/).filter(Boolean).length;

  await db.execute(
    `INSERT INTO narration_scripts 
      (chapterId, introduction, conceptualExplanation, formulasAndDerivations, 
       solvedExamples, advancedConcepts, examSpecificTips, commonMistakes, 
       quickRevisionSummary, mnemonics, wordCount, language, generatedBy)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en', 'llm_batch')
     ON DUPLICATE KEY UPDATE
       introduction = VALUES(introduction),
       conceptualExplanation = VALUES(conceptualExplanation),
       formulasAndDerivations = VALUES(formulasAndDerivations),
       solvedExamples = VALUES(solvedExamples),
       advancedConcepts = VALUES(advancedConcepts),
       examSpecificTips = VALUES(examSpecificTips),
       commonMistakes = VALUES(commonMistakes),
       quickRevisionSummary = VALUES(quickRevisionSummary),
       mnemonics = VALUES(mnemonics),
       wordCount = VALUES(wordCount),
       generatedBy = 'llm_batch',
       updatedAt = CURRENT_TIMESTAMP`,
    [
      chapterId,
      script.introduction,
      script.conceptualExplanation,
      script.formulasAndDerivations,
      script.solvedExamples,
      script.advancedConcepts,
      script.examSpecificTips,
      script.commonMistakes,
      script.quickRevisionSummary,
      script.mnemonics,
      wordCount
    ]
  );

  console.log(`  ✓ [${subjectId}] ${title} — ${wordCount} words`);
  return { chapterId, title, wordCount };
}

async function generateWithRetry(db, chapter, maxRetries = 4) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateForChapter(db, chapter);
    } catch (err) {
      const isQuotaError = err.message.includes("usage exhausted");
      const isJsonError = err.message.includes("JSON") || err.message.includes("Unterminated");

      if (isQuotaError) {
        // Quota exhausted — wait longer before retry
        if (attempt < maxRetries) {
          console.log(`  ⏳ Quota limit hit for "${chapter.title}", waiting 30s before retry ${attempt}/${maxRetries-1}...`);
          await sleep(30000);
        } else {
          throw err;
        }
      } else if (isJsonError && attempt < maxRetries) {
        console.log(`  ↺ JSON parse error for "${chapter.title}", retrying (${attempt}/${maxRetries-1})...`);
        await sleep(2000 * attempt);
      } else if (attempt < maxRetries) {
        console.log(`  ↺ Error for "${chapter.title}": ${err.message.slice(0,80)}, retrying (${attempt}/${maxRetries-1})...`);
        await sleep(3000 * attempt);
      } else {
        throw err;
      }
    }
  }
}

async function main() {
  const dbConfig = parseMysqlUrl(DB_URL);
  const db = await mysql.createConnection(dbConfig);
  console.log("✓ Connected to database.\n");

  const [rows] = await db.execute(`
    SELECT c.chapterId, c.title, c.subjectId, c.chapterNo, c.keyTopics
    FROM chapters c
    LEFT JOIN narration_scripts ns ON ns.chapterId = c.chapterId
    WHERE ns.id IS NULL
    ORDER BY c.subjectId, c.chapterNo
  `);

  const chapters = rows.map(r => ({
    ...r,
    keyTopics: typeof r.keyTopics === "string" ? JSON.parse(r.keyTopics) : (r.keyTopics || [])
  }));

  console.log(`Found ${chapters.length} chapters missing narration scripts.\n`);

  if (chapters.length === 0) {
    console.log("🎉 All chapters already have narration scripts!");
    await db.end();
    return;
  }

  // Process sequentially with small parallelism (3 at a time) to avoid quota bursts
  const BATCH_SIZE = 3;
  const results = [];
  const errors = [];

  for (let i = 0; i < chapters.length; i += BATCH_SIZE) {
    const batch = chapters.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(chapters.length / BATCH_SIZE);
    console.log(`\nBatch ${batchNum}/${totalBatches} — ${batch.map(c => c.title).join(", ")}`);

    const batchResults = await Promise.allSettled(
      batch.map(ch => generateWithRetry(db, ch))
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        const msg = result.reason?.message || String(result.reason);
        console.error(`  ✗ Failed: ${msg.slice(0, 100)}`);
        errors.push(msg);
      }
    }

    // Pause between batches to respect rate limits
    if (i + BATCH_SIZE < chapters.length) {
      await sleep(3000);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`GENERATION COMPLETE`);
  console.log(`${"=".repeat(60)}`);
  console.log(`✓ Successfully generated: ${results.length} scripts`);
  if (errors.length > 0) {
    console.log(`✗ Errors: ${errors.length}`);
    errors.slice(0, 10).forEach(e => console.log(`  - ${e.slice(0, 120)}`));
  }

  const totalWords = results.reduce((sum, r) => sum + (r.wordCount || 0), 0);
  console.log(`Total words generated this run: ${totalWords.toLocaleString()}`);

  // Final DB summary
  const [summary] = await db.execute(`
    SELECT 
      c.subjectId,
      COUNT(DISTINCT c.id) as total,
      COUNT(DISTINCT ns.chapterId) as with_script,
      COALESCE(SUM(ns.wordCount), 0) as total_words
    FROM chapters c
    LEFT JOIN narration_scripts ns ON ns.chapterId = c.chapterId
    GROUP BY c.subjectId
    ORDER BY c.subjectId
  `);

  console.log("\n📊 Final Database State:");
  console.log("Subject       | Chapters | Scripts | Total Words");
  console.log("-".repeat(55));
  let grandTotal = 0;
  let grandScripts = 0;
  let grandChapters = 0;
  for (const row of summary) {
    console.log(`${row.subjectId.padEnd(14)}| ${String(row.total).padEnd(9)}| ${String(row.with_script).padEnd(8)}| ${Number(row.total_words).toLocaleString()}`);
    grandTotal += Number(row.total_words);
    grandScripts += Number(row.with_script);
    grandChapters += Number(row.total);
  }
  console.log("-".repeat(55));
  console.log(`${"TOTAL".padEnd(14)}| ${String(grandChapters).padEnd(9)}| ${String(grandScripts).padEnd(8)}| ${grandTotal.toLocaleString()}`);

  if (grandScripts < grandChapters) {
    console.log(`\n⚠️  ${grandChapters - grandScripts} chapters still missing scripts. Re-run this script to complete them.`);
  } else {
    console.log(`\n🎉 All ${grandChapters} chapters have narration scripts!`);
  }

  await db.end();
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
