const axios = require('axios');

const MYMEMORY_MAX_BYTES = 450;

const splitIntoChunks = (text) => {
  const chunks = [];
  let chunk = '';
  const units = text.match(/\S+\s*|\s+/gu) || [text];

  for (const unit of units) {
    const characters = Array.from(unit);
    let remaining = '';

    for (const character of characters) {
      if (Buffer.byteLength(remaining + character, 'utf8') > MYMEMORY_MAX_BYTES) {
        if (chunk) chunks.push(chunk);
        if (remaining) chunks.push(remaining);
        chunk = '';
        remaining = '';
      }

      remaining += character;
    }

    if (Buffer.byteLength(chunk + remaining, 'utf8') > MYMEMORY_MAX_BYTES) {
      if (chunk) chunks.push(chunk);
      chunk = remaining;
    } else {
      chunk += remaining;
    }
  }

  if (chunk) chunks.push(chunk);
  return chunks;
};

const translateWithMyMemory = async (text, sourceLang, targetLang) => {
  const chunks = splitIntoChunks(text);
  const translatedChunks = await Promise.all(chunks.map(async (chunk) => {
    const response = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: chunk,
        langpair: `${sourceLang}|${targetLang}`,
        mt: 1
      },
      timeout: 15000
    });

    const data = response.data;
    if (data?.responseStatus !== 200) {
      throw new Error(data?.responseDetails || 'Translation provider rejected the request');
    }

    const candidates = [
      data.responseData?.translatedText,
      ...(data.matches || [])
        .sort((left, right) => (right.match || 0) - (left.match || 0))
        .map((match) => match.translation)
    ];
    const normalizedSource = chunk.trim().toLocaleLowerCase();
    const translation = candidates.find(
      (candidate) => typeof candidate === 'string' && candidate.trim() &&
        candidate.trim().toLocaleLowerCase() !== normalizedSource
    ) || candidates.find((candidate) => typeof candidate === 'string' && candidate.trim());

    if (!translation) {
      throw new Error('Translation provider returned an empty result');
    }

    return translation;
  }));

  return translatedChunks.join('');
};

const translateTextAPI = async (text, sourceLang, targetLang) => {
  try {
    const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
      params: { client: 'gtx', sl: sourceLang, tl: targetLang, dt: 't', q: text },
      timeout: 10000
    });
    const translatedText = response.data?.[0]?.map((item) => item?.[0] || '').join('');

    if (!translatedText) {
      throw new Error('Google translation returned an empty result');
    }

    return translatedText;
  } catch (googleError) {
    console.warn(`Google translation unavailable; trying MyMemory: ${googleError.message}`);

    try {
      return await translateWithMyMemory(text, sourceLang, targetLang);
    } catch (fallbackError) {
      console.error(`MyMemory translation failed: ${fallbackError.message}`);
      throw new Error('Failed to translate text');
    }
  }
};

module.exports = { translateTextAPI };