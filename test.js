const { remote } = require("webdriverio");
const fs = require("fs");

const options = {
  hostname: "127.0.0.1",
  port: 4723,
  logLevel: "info",
  capabilities: {
    platformName: "Android",
    "appium:automationName": "UiAutomator2",

    //Android Emulator
    "appium:deviceName": "Android Emulator",
    "appium:udid": process.env.ANDROID_DEVICE || "emulator-5554",

    //HCJ Application
    "appium:appPackage": "app.honour.jobs",
    "appium:appActivity": "app.honour.jobs.MainActivity",
    "appium:appWaitPackage": "app.honour.jobs",
    "appium:appWaitActivity": "*",
    "appium:forceAppLaunch": true,

    //Keep existing App data
    "appium:noReset": true,

    // Give Appium enough time
    "appium:adbExecTimeout": 120000,
    "appium:uiautomator2ServerInstallTimeout": 120000,
    "appium:allowInsecure": ["adb_shell"],
  },
};

async function screenshot(driver, name) {
  try {
    const data = await driver.takeScreenshot();
    fs.writeFileSync(`${name}.png`, data, "base64");
    console.log(`📸 Saved ${name}.png`);
  } catch (e) {
    console.log(`Screenshot failed: ${e.message}`);
  }
}

async function waitForAppToFullyLoad(driver) {
  console.log("Waiting for home heading...");
  const homeHeading = await driver.$(
    '//android.widget.TextView[@text="Trending Jobs & Internships"]',
  );
  await homeHeading.waitForDisplayed({ timeout: 60000, interval: 1000 });
  console.log(
    "Home heading visible. Now waiting for loading spinners to clear...",
  );

  // Poll until no progress bar / spinner is present, up to 20s
  const maxWait = 20000;
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const spinners = await driver.$$("//android.widget.ProgressBar");
    if (spinners.length === 0) {
      console.log("No spinners found — content likely settled.");
      break;
    }
    console.log(`Still ${spinners.length} spinner(s) visible, waiting...`);
    await driver.pause(1000);
  }

  // Extra safety buffer for any late animations/network calls
  await driver.pause(1500);
  console.log("App considered fully loaded.");
}

async function logDiagnostics(driver, label) {
  console.log(`\n----- DIAGNOSTICS: ${label} -----`);
  try {
    const contexts = await driver.getContexts();
    console.log("Available contexts:", contexts);
  } catch (e) {
    console.log("getContexts failed:", e.message);
  }
  try {
    const currentActivity = await driver.getCurrentActivity();
    console.log("Current activity:", currentActivity);
  } catch (e) {
    console.log("getCurrentActivity failed:", e.message);
  }
  try {
    const windowsRaw = await driver.execute("mobile: shell", {
      command: "dumpsys",
      args: ["window", "windows"],
    });
    // Just grab lines mentioning our package, to keep it short
    const relevantLines = windowsRaw
      .split("\n")
      .filter(
        (line) =>
          line.includes("app.honour.jobs") ||
          line.toLowerCase().includes("focused"),
      );
    console.log("Relevant window info:\n", relevantLines.join("\n"));
  } catch (e) {
    console.log("dumpsys window check failed:", e.message);
  }
  console.log(`----- END DIAGNOSTICS: ${label} -----\n`);
}

async function runTest() {
  let driver;
  try {
    console.log("🚀 Starting TC-MOB-002...");

    driver = await remote(options);

    console.log("✅ App launched");

    // Wait for the app to finish loading
    console.log("⏳ Waiting 15 seconds...");
    await driver.pause(10000);

    // Find the hamburger icon
    const hamburger = await driver.$('//android.widget.TextView[@text=""]');

    // Check if it is visible
    await hamburger.waitForDisplayed({
      timeout: 10000,
    });

    console.log("✅ Hamburger is visible");

    // Click it
    await hamburger.click();

    console.log("✅ Hamburger clicked");

    // Wait so you can see what happened
    // -------------------------
    // Close Drawer
    // -------------------------
    const closeDrawer = await driver.$('//android.view.ViewGroup[@content-desc=""]');

    await closeDrawer.waitForDisplayed({
        timeout: 10000
    });

    console.log("✅ Close button visible");

    await closeDrawer.click();

    console.log("✅ Drawer closed");

    // Observe result
    await driver.pause(3000);

    //Opportunities
    const navTabsOpport = await driver.$('//android.widget.Button[@content-desc="Opportunities Tab"]');

    await navTabsOpport.waitForDisplayed({
        timeout: 10000
    })

    await navTabsOpport.click()
    console.log("✅ Opportunities page visible")

    //Eco Link
    const navTabsEcoLink = await driver.$('//android.widget.Button[@content-desc="EcoLink Tab"]');

    await navTabsEcoLink.waitForDisplayed({
        timeout: 10000
    })

    //Profile
    await navTabsEcoLink.click()
    console.log("✅ Eco Link page visible")

    await driver.pause(3000);
    const navTabsProfile = await driver.$('//android.widget.Button[@content-desc="Profile Tab"]');

    await navTabsProfile.waitForDisplayed({
        timeout: 10000
    })

    await navTabsProfile.click()
    console.log("✅ Profile page visible")

    // Observe result
    await driver.pause(3000);    
  } catch (error) {
    console.error("❌ Test Failed");
    console.error(error);
  } finally {
    if (driver) {
      await driver.deleteSession();
      console.log("🔚 Session Closed");
    }
  }
}

runTest();
