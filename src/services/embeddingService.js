// Client-side embedding service for semantic search

import { saveEmbedding, getEmbeddingsByChat } from './indexedDBService.js';

/**
 * Simple client-side text embedding using TF-IDF-like approach
 * This is a lightweight alternative to server-side embeddings
 */
class SimpleEmbeddingService {
  constructor() {
    this.vocabulary = new Map();
    this.idfScores = new Map();
    this.documentCount = 0;
  }

  /**
   * Tokenize text into words
   * @param {string} text - Text to tokenize
   * @returns {Array} Array of tokens
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  /**
   * Calculate term frequency for a document
   * @param {Array} tokens - Array of tokens
   * @returns {Map} Term frequency map
   */
  calculateTF(tokens) {
    const tf = new Map();
    const totalTokens = tokens.length;

    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }

    // Normalize by document length
    for (const [token, count] of tf) {
      tf.set(token, count / totalTokens);
    }

    return tf;
  }

  /**
   * Update IDF scores with new document
   * @param {Array} tokens - Unique tokens in the document
   */
  updateIDF(tokens) {
    const uniqueTokens = new Set(tokens);
    
    for (const token of uniqueTokens) {
      if (!this.vocabulary.has(token)) {
        this.vocabulary.set(token, 0);
      }
      this.vocabulary.set(token, this.vocabulary.get(token) + 1);
    }

    this.documentCount++;

    // Recalculate IDF scores
    for (const [token, docCount] of this.vocabulary) {
      this.idfScores.set(token, Math.log(this.documentCount / docCount));
    }
  }

  /**
   * Generate embedding vector for text
   * @param {string} text - Text to embed
   * @returns {Array} Embedding vector
   */
  generateEmbedding(text) {
    const tokens = this.tokenize(text);
    const tf = this.calculateTF(tokens);
    const embedding = [];

    // Create a fixed-size vector based on top vocabulary
    const topTokens = Array.from(this.vocabulary.keys()).slice(0, 100);
    
    for (const token of topTokens) {
      const tfScore = tf.get(token) || 0;
      const idfScore = this.idfScores.get(token) || 0;
      embedding.push(tfScore * idfScore);
    }

    // Pad or truncate to fixed size
    while (embedding.length < 100) {
      embedding.push(0);
    }

    return embedding.slice(0, 100);
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array} vec1 - First vector
   * @param {Array} vec2 - Second vector
   * @returns {number} Similarity score (0-1)
   */
  cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}

// Global instance
const embeddingService = new SimpleEmbeddingService();

/**
 * Process and store embeddings for a chat session
 * @param {Object} chatSession - Chat session object
 * @returns {Promise<void>}
 */
export const processChatEmbeddings = async (chatSession) => {
  try {
    for (const message of chatSession.messages) {
      if (message.text && message.text.length > 10) {
        // Update vocabulary with this message
        const tokens = embeddingService.tokenize(message.text);
        embeddingService.updateIDF(tokens);

        // Generate embedding
        const embedding = embeddingService.generateEmbedding(message.text);

        // Store embedding
        await saveEmbedding({
          id: `${chatSession.id}-${message.id}`,
          chatId: chatSession.id,
          messageId: message.id,
          text: message.text,
          embedding: embedding,
          timestamp: message.timestamp
        });
      }
    }
  } catch (error) {
    console.error('Error processing chat embeddings:', error);
  }
};

/**
 * Search for similar messages using semantic similarity
 * @param {string} query - Search query
 * @param {string} chatId - Optional chat ID to limit search
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Array of similar messages with scores
 */
export const semanticSearch = async (query, chatId = null, limit = 10) => {
  try {
    if (!query || query.length < 3) return [];

    // Generate embedding for query
    const queryEmbedding = embeddingService.generateEmbedding(query);

    // Get embeddings to search
    let embeddings;
    if (chatId) {
      embeddings = await getEmbeddingsByChat(chatId);
    } else {
      // This would require a more complex query across all chats
      // For now, we'll implement a simpler version
      embeddings = [];
    }

    // Calculate similarities
    const results = embeddings.map(embedding => ({
      ...embedding,
      similarity: embeddingService.cosineSimilarity(queryEmbedding, embedding.embedding)
    }));

    // Sort by similarity and return top results
    return results
      .filter(result => result.similarity > 0.1) // Minimum similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

  } catch (error) {
    console.error('Error in semantic search:', error);
    return [];
  }
};

/**
 * Get related messages for a given message
 * @param {string} messageText - Text of the message
 * @param {string} chatId - Chat ID to search within
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Array of related messages
 */
export const getRelatedMessages = async (messageText, chatId, limit = 5) => {
  try {
    const messageEmbedding = embeddingService.generateEmbedding(messageText);
    const chatEmbeddings = await getEmbeddingsByChat(chatId);

    const results = chatEmbeddings
      .map(embedding => ({
        ...embedding,
        similarity: embeddingService.cosineSimilarity(messageEmbedding, embedding.embedding)
      }))
      .filter(result => result.similarity > 0.2 && result.text !== messageText)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error('Error getting related messages:', error);
    return [];
  }
};

/**
 * Analyze sentiment of text (simple rule-based approach)
 * @param {string} text - Text to analyze
 * @returns {Object} Sentiment analysis result
 */
export const analyzeSentiment = (text) => {
  const positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
    'love', 'like', 'enjoy', 'happy', 'pleased', 'satisfied', 'perfect',
    'brilliant', 'outstanding', 'superb', 'marvelous', 'terrific'
  ];

  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'angry',
    'frustrated', 'disappointed', 'sad', 'upset', 'annoyed', 'irritated',
    'disgusted', 'furious', 'miserable', 'depressed', 'worried', 'concerned'
  ];

  const words = text.toLowerCase().split(/\s+/);
  let positiveScore = 0;
  let negativeScore = 0;

  for (const word of words) {
    if (positiveWords.includes(word)) {
      positiveScore++;
    } else if (negativeWords.includes(word)) {
      negativeScore++;
    }
  }

  const totalScore = positiveScore - negativeScore;
  let sentiment = 'neutral';
  let confidence = 0.5;

  if (totalScore > 0) {
    sentiment = 'positive';
    confidence = Math.min(0.9, 0.5 + (totalScore * 0.1));
  } else if (totalScore < 0) {
    sentiment = 'negative';
    confidence = Math.min(0.9, 0.5 + (Math.abs(totalScore) * 0.1));
  }

  return {
    sentiment,
    confidence,
    positiveScore,
    negativeScore,
    totalScore
  };
};

/**
 * Extract key topics from text using simple frequency analysis
 * @param {string} text - Text to analyze
 * @param {number} topN - Number of top topics to return
 * @returns {Array} Array of topics with scores
 */
export const extractTopics = (text) => {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i',
    'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
  ]);

  const tokens = embeddingService.tokenize(text);
  const frequency = new Map();

  for (const token of tokens) {
    if (!stopWords.has(token) && token.length > 3) {
      frequency.set(token, (frequency.get(token) || 0) + 1);
    }
  }

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({
      topic,
      score: count / tokens.length,
      frequency: count
    }));
};

export default embeddingService;

