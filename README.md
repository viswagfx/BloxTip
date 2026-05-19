# <img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Robux_2019_Logo_gold.svg" width="28" height="28" valign="middle" style="margin-bottom: 4px;" /> BloxTip

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fviswagfx%2FBloxTip%2Ftree%2Fmain&env=ROBLOX_API_KEY,UNIVERSE_ID,PRODUCT_NAME_TEMPLATE,PRODUCT_DESCRIPTION_TEMPLATE&envDefaults=%7B%22PRODUCT_NAME_TEMPLATE%22%3A%22Donate%20%7Breceiving%7D%20Robux%22%2C%22PRODUCT_DESCRIPTION_TEMPLATE%22%3A%22Donated%20%7Breceiving%7D%20Robux%20via%20BloxTip.%22%7D)

A super clean, customizable web donation page for Roblox creators. It uses the **Roblox Open Cloud Developer Products API** to generate developer products on-the-fly, so your players can donate any custom amount of Robux they want.

## 🚀 Features

* **Dynamic Products:** No need to pre-create dozens of developer products in Roblox. It makes them on-the-fly as people donate.
* **Fully Customizable:** Customize the entire page from `config.js` without touching HTML or CSS.
* **Smart Icons:** Automatically fetches your Roblox avatar headshot or group icon. If it's a group game, you can even configure it to fetch the group owner's headshot instead!
* **Tax Cover Calculator:** A toggle that lets players cover the 30% Roblox marketplace tax so you get the exact amount they entered.
* **Preset Buttons:** Quick buttons for easy donation amounts.
* **Theme Colors:** Change the look and feel instantly by changing the accent color in the config.

---

## ⚙️ Configuration (`public/config.js`)

Just edit the variables inside `public/config.js`:

```javascript
window.BloxTipConfig = {
  Title: "Support Viswa",
  Username: "Viswa99", // Displays under the title. Leave empty to auto-fetch Roblox name
  CardIconUrl: "", // Put a custom image URL here if you want

  // Icon type:
  // "custom" -> Uses CardIconUrl
  // "group"  -> Uses Group Icon (or User Avatar if user-owned)
  // "owner"  -> Always gets the User headshot (even if Group owned, it gets the Group Owner's face!)
  IconType: "owner", 

  AccentColor: "#c52222ff", // The theme color for buttons, borders, and glows

  DefaultCoverTax: true, // "Cover Tax" checked by default
  MinRobux: 1,           // Min donation
  MaxRobux: 1000000000,  // Max donation

  QuickAmounts: [10, 50, 100, 500, 1000, 10000], // Preset button values

  ShowCredits: true, // Toggle the "Made with ❤️ by Viswa" footer credit
  ShowGithub: true // Toggle the GitHub link in the footer
};
```

---

## 🛠️ How to Deploy

### 1. Create your Roblox API Key
1. Go to **[create.roblox.com](https://create.roblox.com)**.
2. Click on **All Tools** > click on **API Keys**.
3. Click **Create API Key** and give it a name.
4. Under **Access Permissions**, choose **Developer Products**.
5. Turn on **Restrict by Experience** and choose the game you want to use (either owned by you or your group).
6. Add **Read and Write** permissions.
7. Save, generate the key, and make sure to copy and save the key somewhere safe.
8. Go to your game's settings page on the Creator Dashboard, click the 3 dots, and click **Copy Universe ID**.

### 2. Fork on GitHub
1. Fork this GitHub repository to your own account.
2. Customize `public/config.js` to change the theme, accent color, text, and titles to whatever you want.

### 3. Vercel Setup
1. Create a free account on **[Vercel](https://vercel.com/)** and import your forked repository.
2. Add these two **Environment Variables** in your Vercel project settings:
   * `ROBLOX_API_KEY`: The API key you generated in Step 1.
   * `UNIVERSE_ID`: Your Roblox game's Universe ID.
3. Click **Deploy** and you're ready to go! Vercel will host your donation page completely free.
