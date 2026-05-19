// BloxTip Configuration
// Edit this file to customize your donation page.

window.BloxTipConfig = {
  // Main headings
  Title: "BloxTip",
  Username: "", // The username displayed under card. Leave blank to automatically fetch Roblox Creator/Group name!
  CardIconUrl: "", // Optional: Custom image URL to replace the icon. Used if IconType is "custom".

  // Icon Type Configuration:
  //   - "custom" : Uses the image provided in CardIconUrl.
  //   - "group"  : Displays the Group Icon (or User Avatar if owned by a User).
  //   - "owner"  : Always displays the User Avatar headshot (even if Group owned, it fetches the Group Owner!).
  IconType: "group", // "custom", "group", or "owner"

  // Theme
  AccentColor: "#00b060ff", // Default green color used throughout the UI

  // Donation Settings
  DefaultCoverTax: true,
  MinRobux: 1,
  MaxRobux: 1000000000,

  // Quick amounts to display as buttons
  QuickAmounts: [10, 50, 100, 500, 1000, 10000],

  // Footer & Links
  ShowCredits: true, // Toggle the "Made with ❤️ by Viswa" footer credit
  ShowGithub: true // Toggle the GitHub corner link in the top right
};
