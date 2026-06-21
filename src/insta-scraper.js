/**
 * insta-scraper.js — Module quét dữ liệu Instagram Stories qua RapidAPI (instagram120)
 */

const { logInfo, logError, delay } = require('./utils');

/**
 * Fetch danh sách Stories của một user thông qua RapidAPI
 * 
 * @param {string} username - Tên tài khoản Instagram (VD: "locketcamera")
 * @param {string} rapidApiKey - API Key của RapidAPI
 * @returns {Promise<Array<any>>} Danh sách các story objects
 */
async function fetchInstagramStories(username, rapidApiKey) {
  if (!rapidApiKey) {
    throw new Error('Thiếu RAPIDAPI_KEY');
  }

  logInfo(`Đang quét Instagram Stories của @${username} qua RapidAPI...`);
  
  const url = 'https://instagram120.p.rapidapi.com/api/instagram/stories';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': 'instagram120.p.rapidapi.com',
      'x-rapidapi-key': rapidApiKey
    },
    body: JSON.stringify({ username, maxId: '' })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lỗi RapidAPI ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  
  if (data && data.result && Array.isArray(data.result)) {
    logInfo(`→ Tìm thấy ${data.result.length} stories hiện tại.`);
    return data.result;
  }
  
  logInfo('→ Không tìm thấy story nào hoặc cấu trúc dữ liệu trống.');
  return [];
}

module.exports = {
  fetchInstagramStories,
};
