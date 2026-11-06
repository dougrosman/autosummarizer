/**
 * Curated sample documents for the AutoSummarize demonstration
 */

const SAMPLE_DOCUMENTS = {
  office97: {
    title: "Microsoft Office 97 Press Release (December 1996)",
    description: "The historical press release unveiling Office 97 and its groundbreaking AutoSummarize technology.",
    text: `Microsoft Corporation Unveils Microsoft Office 97

REDMOND, Wash. — Dec. 16, 1996 — Microsoft Corporation today announced the release of Microsoft Office 97, the newest and most comprehensive suite of business applications designed to make everyday computing tasks faster, easier, and more intuitive for millions of users worldwide.

Microsoft Office 97 integrates desktop power with the communications capabilities of the Internet and company intranets. Central to the new release is Microsoft Word 97, which introduces dozens of breakthrough productivity features engineered by Microsoft Research, including the innovative AutoSummarize tool.

The AutoSummarize feature automatically analyzes an entire document to identify its core themes and key points. Using advanced statistical language processing and keyword frequency algorithms, AutoSummarize determines which sentences convey the highest informational value. Users can choose to highlight key sentences in yellow, generate an executive summary at the top of the page, create a separate condensed document, or hide non-essential background text entirely.

"Office 97 represents a quantum leap forward in personal productivity," said Pete Higgins, group vice president of applications and Internet client group at Microsoft. "Features like AutoSummarize allow busy executives and professionals to digest lengthy reports, proposals, and memos in a fraction of the usual time."

In addition to word frequency analysis, Word 97 evaluates the structural position of sentences within paragraphs, paying special attention to introductory and concluding remarks. The software also detects transitional cue phrases to ensure that extracted thoughts can stand on their own.

Microsoft Office 97 is scheduled for retail availability in January 1997. In conclusion, Office 97 delivers the tools modern knowledge workers need to transform information into business success.`
  },

  stevejobs: {
    title: "Steve Jobs - 2005 Stanford Commencement Address",
    description: "Selected excerpts from Steve Jobs' famous address on connecting the dots and doing what you love.",
    text: `Stay Hungry. Stay Foolish.

I am honored to be with you today at your commencement from one of the finest universities in the world. I never graduated from college. Truth be told, this is the closest I've ever gotten to a college graduation. Today I want to tell you three stories from my life. That's it. No big deal. Just three stories.

The first story is about connecting the dots. I dropped out of Reed College after the first six months, but then stayed around as a drop-in for another 18 months or so before I really quit. You can't connect the dots looking forward; you can only connect them looking backwards. So you have to trust that the dots will somehow connect in your future. You have to trust in something — your gut, destiny, life, karma, whatever. This approach has never let me down, and it has made all the difference in my life.

My second story is about love and loss. I was lucky — I found what I loved to do early in life. Woz and I started Apple in my parents' garage when I was 20. In 10 years Apple had grown from just the two of us into a \$2 billion company with over 4,000 employees. And then I got fired. How can you get fired from a company you started? Well, as Apple grew we hired someone who I thought was very talented to run the company with me, and for the first year or so things went well. But then our visions of the future began to diverge and eventually we had a falling out. When we did, our Board of Directors sided with him. So at 30 I was out.

The heaviness of being successful was replaced by the lightness of being a beginner again, less sure about everything. It freed me to enter one of the most creative periods of my life. During the next five years, I started a company named NeXT, another company named Pixar, and fell in love with an amazing woman who would become my wife. Pixar went on to create the world's first computer animated feature film, Toy Story, and is now the most successful animation studio in the world. In a remarkable turn of events, Apple bought NeXT, I returned to Apple, and the technology we developed at NeXT is at the heart of Apple's current renaissance.

My third story is about death. When I was 17, I read a quote that went something like: "If you live each day as if it was your last, someday you'll most certainly be right." It made an impression on me, and since then, for the past 33 years, I have looked in the mirror every morning and asked myself: "If today were the last day of my life, would I want to do what I am about to do today?" And whenever the answer has been "No" for too many days in a row, I know I need to change something.

Remembering that you are going to die is the best way I know to avoid the trap of thinking you have something to lose. You are already naked. There is no reason not to follow your heart.

Your time is limited, so don't waste it living someone else's life. Don't be trapped by dogma — which is living with the results of other people's thinking. Don't let the noise of others' opinions drown out your own inner voice. And most important, have the courage to follow your heart and intuition. They somehow already know what you truly want to become. Everything else is secondary.`
  },

  gettysburg: {
    title: "Abraham Lincoln - The Gettysburg Address (1863)",
    description: "One of the most famous short speeches in American history, delivered during the American Civil War.",
    text: `The Gettysburg Address

Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.

Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this.

But, in a larger sense, we can not dedicate — we can not consecrate — we can not hallow — this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here.

It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. It is rather for us to be here dedicated to the great task remaining before us — that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion — that we here highly resolve that these dead shall not have died in vain — that this nation, under God, shall have a new birth of freedom — and that government of the people, by the people, for the people, shall not perish from the earth.`
  },

  nlpEvolution: {
    title: "From Word Frequency to Transformers: The Evolution of Summarization",
    description: "An explanatory essay contrasting classical extractive methods with modern LLMs.",
    text: `From Word Counts to Neural Synthesis: The Evolution of Text Summarization

For the first four decades of computer science, automatic text summarization was strictly an extractive discipline. In 1958, IBM researcher Hans Peter Luhn introduced the foundational principle of statistical text summarization: that the frequency of content words in a document reflects their relative importance. Luhn posited that sentences packed with frequent, topic-specific vocabulary represent the most informative nuggets of a text.

A decade later, in 1969, Harold P. Edmundson dramatically expanded Luhn's paradigm by introducing structural and linguistic heuristics. Edmundson recognized that where a sentence appears in a text often matters as much as the words it contains. Paragraph-initial topic sentences and document-level introductions typically bear disproportionate informational weight. Furthermore, Edmundson observed that authors consistently use pragmatic cue phrases — such as "in summary", "significantly", or "we conclude" — to flag critical takeaways for their readers.

In 1997, Microsoft brought these classical NLP concepts directly into consumer word processing through Word 97's famous AutoSummarize feature. Built upon U.S. Patent 5,924,108, AutoSummarize parsed documents into sentences, filtered common stop words, tracked collocations, and scored each sentence using a weighted linear combination of word frequency, paragraph position, heading overlap, and cue phrases. Users were granted unprecedented control via an interactive slider, allowing them to dynamically condense documents from 1% to 100% of their original length.

Despite its technical ingenuity, extractive summarization suffered from fundamental limitations. Extractive algorithms cannot synthesize new phrasing, combine disparate thoughts across paragraphs, or resolve ambiguous pronouns. A sentence extracted in isolation often appeared jarring or grammatically orphaned without its surrounding narrative context. Consequently, Microsoft discontinued the AutoSummarize interface in Microsoft Word 2010.

Today, Large Language Models (LLMs) have completely rewritten the summarization landscape. Modern neural architectures perform abstractive summarization: they comprehend document semantics across vast attention windows and generate fluent, novel prose that captures high-level meaning. Yet, studying classic extractive models reminds us of the power of transparent, deterministic heuristics in computational linguistics.`
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SAMPLE_DOCUMENTS };
}
