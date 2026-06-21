/**
 * locket-resolver.js — Module resolve link locket.cam → invite link
 * 
 * Khi truy cập https://locket.cam/{username}, trang trả về HTML tĩnh
 * chứa hàm openDynamicLink() với link invite đầy đủ dạng:
 *   locket.page.link/?link=https%3A%2F%2Flocket.camera%2Finvites%2F{TOKEN}%3Ftype%3DUsernameLink&...
 * 
 * Module này fetch HTML đó rồi parse ra invite URL + metadata.
 */

const { logInfo, logWarning, logError } = require('./utils');

/**
 * Resolve một link locket.cam/{username} thành thông tin đầy đủ.
 * 
 * @param {string} locketCamUrl - VD: "https://locket.cam/cuecamfamily"
 * @returns {Promise<{invite_url: string, display_name: string, slot_limit: number|null, preview_images: string[]}|null>}
 *   Trả về null nếu không resolve được.
 */
async function resolveLocketLink(locketCamUrl) {
  logInfo(`  Đang resolve ${locketCamUrl}...`);

  try {
    const response = await fetch(locketCamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      logWarning(`  Locket page trả về status ${response.status} cho ${locketCamUrl}`);
      return null;
    }

    const html = await response.text();

    // --- Trích xuất invite URL ---
    // Tìm trong hàm openDynamicLink() hoặc copyTextToClipboard()
    // Pattern: locket.camera%2Finvites%2F{TOKEN}%3Ftype%3DUsernameLink
    const inviteMatch = html.match(/locket\.camera%2Finvites%2F([a-zA-Z0-9]+)%3Ftype%3DUsernameLink/);
    let inviteUrl = null;
    if (inviteMatch) {
      const token = inviteMatch[1];
      inviteUrl = `https://locket.camera/invites/${token}?type=UsernameLink`;
    } else {
      // Backup: tìm link dạng đã decode
      const inviteMatch2 = html.match(/locket\.camera\/invites\/([a-zA-Z0-9]+)\?type=UsernameLink/);
      if (inviteMatch2) {
        inviteUrl = `https://locket.camera/invites/${inviteMatch2[1]}?type=UsernameLink`;
      }
    }

    if (!inviteUrl) {
      logWarning(`  Không tìm thấy invite URL trong HTML của ${locketCamUrl}`);
      return null;
    }

    // --- Trích xuất display name từ <title> ---
    // Pattern: "Add Gia đình on Locket 💛"
    let displayName = null;
    const titleMatch = html.match(/<title>Add (.+?) on Locket/);
    if (titleMatch) {
      displayName = titleMatch[1].trim();
    } else {
      // Backup: tìm trong og:title
      const ogTitleMatch = html.match(/og:title" content="Add (.+?) on Locket/);
      if (ogTitleMatch) {
        displayName = ogTitleMatch[1].trim();
      }
    }

    // --- Trích xuất slot limit ---
    // Pattern: "can only add 2,000 friends"
    let slotLimit = null;
    const slotMatch = html.match(/can only add\s*<span[^>]*>([0-9,]+)<\/span>\s*friends/i);
    if (slotMatch) {
      slotLimit = parseInt(slotMatch[1].replace(/,/g, ''), 10);
    }

    // --- Trích xuất preview images ---
    let previewImages = [];
    const imagesMatch = html.match(/celebrityImages\s*=\s*\[([^\]]+)\]/);
    if (imagesMatch) {
      try {
        previewImages = JSON.parse(`[${imagesMatch[1]}]`);
      } catch (e) {
        // Bỏ qua nếu parse thất bại
      }
    }

    logInfo(`  → Invite URL: ${inviteUrl}`);
    logInfo(`  → Display name: ${displayName || '(không rõ)'}`);
    logInfo(`  → Slot limit: ${slotLimit || '(không rõ)'}`);

    return {
      invite_url: inviteUrl,
      display_name: displayName,
      slot_limit: slotLimit,
      preview_images: previewImages,
    };
  } catch (err) {
    logError(`  Lỗi khi resolve ${locketCamUrl}: ${err.message}`);
    return null;
  }
}

module.exports = {
  resolveLocketLink,
};
