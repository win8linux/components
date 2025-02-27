
export class ZenThemeMarketplaceChild extends JSWindowActorChild {
  constructor() {
    super();
  }

  handleEvent(event) {
    switch (event.type) {
      case "DOMContentLoaded":
        this.initiateThemeMarketplace();
        break;
      default:
    }
  }

  initiateThemeMarketplace() {
    this.contentWindow.setTimeout(() => {
      this.addIntallButtons();
    }, 0);
  }

  get actionButton() {
    return this.contentWindow.document.getElementById("install-theme");
  }

  get actionButtonUnnstall() {
    return this.contentWindow.document.getElementById("install-theme-uninstall");
  }

  async receiveMessage(message) {
    switch (message.name) {
      case "ZenThemeMarketplace:ThemeChanged": {
        const themeId = message.data.themeId;
        const actionButton = this.actionButton;
        const actionButtonInstalled = this.actionButtonUnnstall;
        if (actionButton && actionButtonInstalled) {
          actionButton.disabled = false;
          actionButtonInstalled.disabled = false;
          if (await this.isThemeInstalled(themeId)) {
            actionButton.classList.add("hidden");
            actionButtonInstalled.classList.remove("hidden");
          } else {
            actionButton.classList.remove("hidden");
            actionButtonInstalled.classList.add("hidden");
          }
        }
        break;
      }
    }
  }

  async addIntallButtons() {
    const actionButton = this.actionButton;
    const actionButtonUnnstall = this.actionButtonUnnstall;
    const errorMessage = this.contentWindow.document.getElementById("install-theme-error");
    if (!actionButton || !actionButtonUnnstall) {
      return;
    }

    errorMessage.classList.add("hidden");
    
    const themeId = actionButton.getAttribute("zen-theme-id");
    if (await this.isThemeInstalled(themeId)) {
      actionButtonUnnstall.classList.remove("hidden");
    } else {
      actionButton.classList.remove("hidden");
    }

    actionButton.addEventListener("click", this.installTheme.bind(this));
    actionButtonUnnstall.addEventListener("click", this.uninstallTheme.bind(this));
  }

  async isThemeInstalled(themeId) {
    return await this.sendQuery("ZenThemeMarketplace:IsThemeInstalled", { themeId });
  }

  addTheme(theme) {
    this.sendAsyncMessage("ZenThemeMarketplace:InstallTheme", { theme });
  }

  async getThemeInfo(themeId) {
    const url = `https://zen-browser.app/api/get-theme?id=${themeId}`;
    console.info("ZTM: Fetching theme info from: ", url);
    const data = await fetch(url, {
      mode: "no-cors",
    });

    if (data.ok) {
      try {
        const obj = await data.json();
        return obj;
      } catch (e) {
        console.error("ZTM: Error parsing theme info: ", e);
      }
    }
    return null; 
  }

  async uninstallTheme(event) {
    const button = event.target;
    button.disabled = true;
    const themeId = button.getAttribute("zen-theme-id");
    console.info("ZTM: Uninstalling theme with id: ", themeId);
    this.sendAsyncMessage("ZenThemeMarketplace:UninstallTheme", { themeId });
  }

  async installTheme(event) {
    const button = event.target;
    button.disabled = true;
    const themeId = button.getAttribute("zen-theme-id");
    console.info("ZTM: Installing theme with id: ", themeId);

    const theme = await this.getThemeInfo(themeId);
    if (!theme) {
      console.error("ZTM: Error fetching theme info");
      return;
    }
    this.addTheme(theme);
  }
};