const express = require("express");
const axios = require("axios");
const useragent = require("useragent");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/api/deviceinfo", async (req, res) => {
  const { userAgent, model, ip } = req.query;
  const output = { success: true, message: {}, author: "Bokkor" };

  // 🟢 UserAgent Info
  if (userAgent) {
    const agent = useragent.parse(userAgent);
    output.message.userAgentInfo = {
      userAgent,
      platform: agent.os.toString(),
      os: agent.os.family,
      deviceType: agent.device.family.includes("Mobile") ? "Mobile" : "Desktop",
      browser: agent.family,
      browserVersion: agent.toVersion(),
      isMobile: agent.device.family.includes("Mobile"),
      isTablet: agent.device.family.includes("Tablet"),
    };
  }

  // 🟢 Phone Model Info (Live API from MobileSpecs)
  if (model) {
    try {
      const encodedModel = encodeURIComponent(model);
      const searchUrl = `https://api-mobilespecs.azharimm.dev/v2/search?query=${encodedModel}`;
      const searchRes = await axios.get(searchUrl);
      const phones = searchRes.data.data.phones;

      if (!phones || phones.length === 0) {
        output.message.phoneInfo = "No phone found for this model.";
      } else {
        const detailSlug = phones[0].slug;
        const detailUrl = `https://api-mobilespecs.azharimm.dev/v2/${detailSlug}`;
        const detailRes = await axios.get(detailUrl);
        output.message.phoneInfo = detailRes.data.data;
      }
    } catch (err) {
      output.message.phoneInfo = "Error fetching phone info.";
    }
  }

  // 🟢 IP Info
  if (ip) {
    try {
      const ipres = await axios.get(`https://ipapi.co/${ip}/json/`);
      const { city, region, country_name, org, postal, timezone } = ipres.data;
      output.message.ipInfo = {
        ip,
        city,
        region,
        country: country_name,
        isp: org,
        postal,
        timezone
      };
    } catch (e) {
      output.message.ipInfo = "IP info fetch failed.";
    }
  }

  return res.json(output);
});

// 🔥 Render-ready
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 API running on http://localhost:${PORT}/api/deviceinfo`);
});
