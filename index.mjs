import axios from "axios";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const START_DATE = "2024-01-18";
// 환경 설정
const propertyId = "423712890";
const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
const credentialsFilePath = "credentials.json";
const tmpCredentialsPath = "/tmp/credentials.json";

const analyticsDataClient = new BetaAnalyticsDataClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyCredentialsFile() {
  const sourcePath = path.join(__dirname, credentialsFilePath);
  fs.copyFileSync(sourcePath, tmpCredentialsPath);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpCredentialsPath;
}

async function runAnalyticsReport(startDate, endDate, metricName) {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: metricName }],
    });
    return response.rows?.[0]?.metricValues?.[0]?.value || 0;
  } catch (error) {
    console.error(`Error fetching ${metricName}:`, error);
    throw error;
  }
}

export const handler = async (event) => {
  copyCredentialsFile();

  try {
    const totalUsers = await runAnalyticsReport(START_DATE, "today", "totalUsers");
    const todayUsers = await runAnalyticsReport("today", "today", "totalUsers");

    await axios.post(webhookUrl, {
      content: `🎉 오늘은 ${todayUsers}명이 모디를 사용했어요, 총 사용자 ${totalUsers}명에 달성했습니다!`,
    });
    console.info("디스코드 웹훅 성공");
  } catch (error) {
    console.error("작업 중 에러 발생:", error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify("Hello from Lambda!"),
  };
};
