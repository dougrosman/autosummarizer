/**
 * AutoSummarize - Classic Extractive Summarization Engine
 * 
 * Based on Microsoft's AutoSummarize algorithm introduced in Word 97 / Office 97
 * and described in U.S. Patent 5,924,108 ("Document Summarizer for Word Processors")
 * and classic NLP literature:
 *   - H.P. Luhn (1958): "The Automatic Creation of Literature Abstracts" (Word Frequency & Clumping)
 *   - H.P. Edmundson (1969): "New Methods in Automatic Extracting" (Cue, Title, Location heuristics)
 */

// Standard English stop words filtered out during content-word analysis
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing',
  'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if',
  'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most',
  'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll',
  'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their',
  'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll',
  'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s',
  'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s',
  'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your',
  'yours', 'yourself', 'yourselves', 'also', 'just', 'like'
]);

// Edmundson Cue Words: Bonus phrases signaling summary-worthy statements
const BONUS_CUES = [
  'in summary', 'in conclusion', 'to summarize', 'to conclude', 'most importantly',
  'importantly', 'significant', 'significantly', 'essential', 'essentially',
  'in short', 'the result', 'results show', 'consequently', 'therefore',
  'fundamental', 'crucial', 'key finding', 'we conclude', 'our goal', 'primary',
  'we found', 'in particular', 'major'
];

// Edmundson Stigma / Penalty Words: Phrases signaling subordinate, hedge, or dependent clauses
const STIGMA_CUES = [
  'for example', 'for instance', 'e.g.', 'namely', 'that is',
  'on the other hand', 'hardly', 'barely', 'scarcely', 'minor',
  'incidentally', 'furthermore', 'moreover', 'besides'
];

// Problem phrases / anaphora markers (U.S. Patent 5,924,108):
// Sentences starting with these words rely heavily on context from the preceding sentence.
const ANAPHORA_STARTERS = [
  'this', 'these', 'those', 'they', 'he', 'she', 'it', 'such', 'his', 'her', 'their'
];

/**
 * Split text into paragraphs and sentences, tracking document hierarchy.
 */
function tokenizeSentences(text) {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const sentences = [];
  let globalIndex = 0;

  paragraphs.forEach((para, paraIndex) => {
    // Check if the paragraph looks like a heading (short, no terminal period, or starts with #)
    const isHeading = (para.trim().startsWith('#') || (para.trim().length < 80 && !/[.!?]$/.test(para.trim())));
    
    // Sentence segmentation regex handling common punctuation and abbreviations
    // Normalize newlines inside paragraph
    const cleanedPara = para.replace(/\n+/g, ' ').trim();
    
    // Naive split regex with lookbehind for sentence terminals, but handling initials/abbreviations
    const rawSentences = cleanedPara.match(/[^.!?]+(?:[.!?]+["']?|$)/g) || [cleanedPara];
    
    const validSentences = [];
    let buffer = '';
    
    for (let i = 0; i < rawSentences.length; i++) {
      let s = rawSentences[i].trim();
      if (!s) continue;
      
      // Check if sentence ended on an abbreviation (e.g. "Mr.", "U.S.", "Dr.", "e.g.", "i.e.", "vs.", months, states)
      if (/\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|e\.g|i\.e|U\.S|Gen|Gov|Inc|Corp|Ltd|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|Wash|Calif|Mass|N\.Y|D\.C)\.$/i.test(s) && i + 1 < rawSentences.length) {
        buffer += (buffer ? ' ' : '') + s;
        continue;
      }
      
      if (buffer) {
        s = buffer + ' ' + s;
        buffer = '';
      }
      
      validSentences.push(s);
    }
    if (buffer) validSentences.push(buffer);

    validSentences.forEach((sText, sIndex) => {
      sentences.push({
        id: globalIndex++,
        text: sText,
        paraIndex: paraIndex,
        sentenceInPara: sIndex,
        totalSentencesInPara: validSentences.length,
        isHeading: isHeading && validSentences.length === 1,
        isFirstSentenceOfDoc: (globalIndex === 1),
        isFirstSentenceOfPara: (sIndex === 0),
        isLastSentenceOfPara: (sIndex === validSentences.length - 1 && validSentences.length > 1)
      });
    });
  });

  return { paragraphs, sentences };
}

/**
 * Extract words and clean punctuation.
 */
function extractWords(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim().replace(/^['"-]+|['"-]+$/g, ''))
    .filter(w => w.length > 1);
}

/**
 * Stemming / Normalization (Simple Porter-like suffix stripper for English)
 */
function simpleStem(word) {
  if (word.length <= 3) return word;
  return word
    .replace(/(?:ing|edly|ingly|ed|ies|es|s|ment|tion|tional|ness|ity)$/, '')
    .toLowerCase();
}

/**
 * Identify multi-word expressions / collocations (Phrase Compression, Patent 5,924,108)
 */
function extractPhraseCompression(sentences) {
  const bigramCounts = new Map();
  
  sentences.forEach(s => {
    const words = extractWords(s.text);
    for (let i = 0; i < words.length - 1; i++) {
      const w1 = words[i];
      const w2 = words[i + 1];
      if (!STOP_WORDS.has(w1) && !STOP_WORDS.has(w2)) {
        const bigram = `${w1} ${w2}`;
        bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1);
      }
    }
  });

  // Keep bigrams that occur at least twice
  const frequentPhrases = new Set();
  bigramCounts.forEach((count, phrase) => {
    if (count >= 2) {
      frequentPhrases.add(phrase);
    }
  });

  return frequentPhrases;
}

/**
 * Calculate Word Frequency Table
 */
function buildFrequencyTable(sentences, frequentPhrases) {
  const freqTable = new Map();
  let totalContentWords = 0;

  sentences.forEach(s => {
    let lowerText = s.text.toLowerCase();
    
    // Check frequent phrases first
    frequentPhrases.forEach(phrase => {
      const matches = lowerText.split(phrase).length - 1;
      if (matches > 0) {
        freqTable.set(phrase, (freqTable.get(phrase) || 0) + matches * 2);
        totalContentWords += matches * 2;
        // replace to avoid double-counting component words
        lowerText = lowerText.replaceAll(phrase, ' ');
      }
    });

    const words = extractWords(lowerText);
    words.forEach(word => {
      if (!STOP_WORDS.has(word) && !/^\d+$/.test(word)) {
        const stem = simpleStem(word);
        freqTable.set(stem, (freqTable.get(stem) || 0) + 1);
        totalContentWords++;
      }
    });
  });

  return { freqTable, totalContentWords };
}

/**
 * Main AutoSummarize Evaluation Engine
 * Evaluates sentences using Luhn & Edmundson heuristics as per Word 97 & Patent 5,924,108
 */
function scoreDocument(rawText, options = {}) {
  const { paragraphs, sentences } = tokenizeSentences(rawText);
  if (sentences.length === 0) {
    return { sentences: [], keywords: [], stats: { totalWords: 0, totalSentences: 0 } };
  }

  // 1. Phrase compression detection
  const frequentPhrases = extractPhraseCompression(sentences);

  // 2. Frequency table
  const { freqTable, totalContentWords } = buildFrequencyTable(sentences, frequentPhrases);

  // Find document title / heading terms (Edmundson Title Method)
  const titleWords = new Set();
  const firstSentence = sentences[0];
  if (firstSentence && (firstSentence.isHeading || firstSentence.isFirstSentenceOfDoc)) {
    extractWords(firstSentence.text).forEach(w => {
      if (!STOP_WORDS.has(w)) titleWords.add(simpleStem(w));
    });
  }

  // Find max frequency for normalization
  let maxFreq = 1;
  freqTable.forEach(cnt => {
    if (cnt > maxFreq) maxFreq = cnt;
  });

  // 3. Score each sentence
  const scoredSentences = sentences.map(s => {
    const words = extractWords(s.text);
    const contentWords = [];
    let wordFreqSum = 0;

    words.forEach(w => {
      if (!STOP_WORDS.has(w) && !/^\d+$/.test(w)) {
        const stem = simpleStem(w);
        const freq = freqTable.get(stem) || 0;
        contentWords.push({ word: w, stem, freq });
        wordFreqSum += freq;
      }
    });

    // U.S. Patent 5,924,108: Average Content Word Frequency
    // "sum of the frequency counts of the content words divided by the total number of content words"
    const contentWordCount = contentWords.length;
    const avgWordFreq = contentWordCount > 0 ? (wordFreqSum / contentWordCount) : 0;
    
    // Normalized frequency score (0 to 10 scale)
    const frequencyScore = (avgWordFreq / maxFreq) * 10;

    // Edmundson Positional Heuristic (Location Method)
    let positionBonus = 0;
    if (s.isFirstSentenceOfDoc) {
      positionBonus += 3.5; // Lead document sentence
    } else if (s.isFirstSentenceOfPara) {
      positionBonus += 2.0; // Topic sentence of paragraph
    } else if (s.isLastSentenceOfPara) {
      positionBonus += 1.0; // Concluding sentence of paragraph
    }

    // Edmundson Title / Heading Overlap Method
    let titleOverlapCount = 0;
    contentWords.forEach(cw => {
      if (titleWords.has(cw.stem)) titleOverlapCount++;
    });
    const titleBonus = Math.min(titleOverlapCount * 1.5, 4.0);

    // Edmundson Cue Word Analysis (Bonus & Stigma) + Patent 5,924,108 Anaphora
    let cueScore = 0;
    const lowerText = s.text.toLowerCase();
    
    BONUS_CUES.forEach(cue => {
      if (lowerText.includes(cue)) cueScore += 2.0;
    });

    STIGMA_CUES.forEach(cue => {
      if (lowerText.includes(cue)) cueScore -= 1.5;
    });

    // Check for orphan anaphora at sentence start (e.g. "He said this...", "This means...")
    const firstWord = words[0];
    if (firstWord && ANAPHORA_STARTERS.includes(firstWord) && !s.isFirstSentenceOfDoc) {
      // Patent: Condition / penalize sentences starting with dangling pronouns
      cueScore -= 2.0;
    }

    // Length penalty: very short sentences (< 5 words) lack substance; very long ones get a slight discount
    let lengthModifier = 0;
    if (words.length < 5) lengthModifier = -3.0;
    if (contentWordCount === 0) lengthModifier = -10.0;

    // Total Composite Score
    const totalScore = Math.max(0, frequencyScore + positionBonus + titleBonus + cueScore + lengthModifier);

    return {
      ...s,
      wordCount: words.length,
      contentWordCount,
      contentWords: contentWords.map(cw => cw.word),
      scores: {
        frequencyScore: parseFloat(frequencyScore.toFixed(2)),
        positionBonus: parseFloat(positionBonus.toFixed(2)),
        titleBonus: parseFloat(titleBonus.toFixed(2)),
        cueScore: parseFloat(cueScore.toFixed(2)),
        lengthModifier: parseFloat(lengthModifier.toFixed(2)),
        totalScore: parseFloat(totalScore.toFixed(2))
      }
    };
  });

  // Extract top keywords for document properties
  const sortedKeywords = Array.from(freqTable.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, freq]) => ({ word, freq }));

  const totalWords = scoredSentences.reduce((acc, s) => acc + s.wordCount, 0);

  return {
    sentences: scoredSentences,
    keywords: sortedKeywords,
    stats: {
      totalWords,
      totalSentences: scoredSentences.length,
      totalParagraphs: paragraphs.length
    }
  };
}

/**
 * Filter sentences based on requested summary mode and target length
 * Length options:
 * - { type: 'percent', value: 25 } (default)
 * - { type: 'sentences', value: 10 }
 * - { type: 'words', value: 100 }
 */
function extractSummary(scoredResult, lengthOption = { type: 'percent', value: 25 }) {
  const { sentences, stats } = scoredResult;
  if (!sentences || sentences.length === 0) return { selectedSentences: [], summaryStats: {} };

  // Sort by score descending to pick the best sentences
  const ranked = [...sentences].sort((a, b) => b.scores.totalScore - a.scores.totalScore);
  const selected = new Set();

  if (lengthOption.type === 'percent') {
    const pct = Math.max(1, Math.min(100, lengthOption.value));
    const targetCount = Math.max(1, Math.round((sentences.length * pct) / 100));
    for (let i = 0; i < targetCount && i < ranked.length; i++) {
      selected.add(ranked[i].id);
    }
  } else if (lengthOption.type === 'sentences') {
    const targetCount = Math.max(1, Math.min(sentences.length, lengthOption.value));
    for (let i = 0; i < targetCount && i < ranked.length; i++) {
      selected.add(ranked[i].id);
    }
  } else if (lengthOption.type === 'words') {
    const targetWords = lengthOption.value;
    let accumulatedWords = 0;
    for (let i = 0; i < ranked.length; i++) {
      if (accumulatedWords + ranked[i].wordCount <= targetWords || selected.size === 0) {
        selected.add(ranked[i].id);
        accumulatedWords += ranked[i].wordCount;
      }
    }
  }

  // Crucial step in classic extractive summarization:
  // Re-sort selected sentences by their original chronological document order
  const summarySentences = sentences.filter(s => selected.has(s.id));
  const summaryWords = summarySentences.reduce((acc, s) => acc + s.wordCount, 0);
  const summaryPercent = stats.totalWords > 0 ? Math.round((summaryWords / stats.totalWords) * 100) : 0;

  return {
    selectedIds: selected,
    summarySentences,
    summaryStats: {
      summaryWords,
      originalWords: stats.totalWords,
      summarySentencesCount: summarySentences.length,
      originalSentencesCount: stats.totalSentences,
      actualPercent: summaryPercent
    }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    tokenizeSentences,
    scoreDocument,
    extractSummary,
    STOP_WORDS,
    BONUS_CUES,
    STIGMA_CUES
  };
}
