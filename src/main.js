import "@logseq/libs";
import timeflowSvgContent from "./timeflow.svg";

const timeflowSvgString = timeflowSvgContent.content;

/** settings **/
const settingsSchema = [
  {
    key: "hotkey",
    type: "string",
    title: "Toggle Typewriter Mode Hotkey (Default hotkey: mod + y)",
    description: "Set a hotkey to toggle typewriter mode",
    default: "mod+y",
  },
];

/**
 * User model
 */
const model = {
  togglePluginState(e) {
    pluginState.sendMessage();
    if (pluginState.istimeflowEnabled) {
      pluginState.startTimeflow();
    } else {
      pluginState.stopTimeflow();
    }
  },
};

const pluginState = {
  istimeflowEnabled: false,
  previousBlockUuid: null,

  async addTimestamp(e) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      return;
    }

    const cursor = await logseq.Editor.getCurrentBlock();

    const currentBlockId = cursor.uuid;
    if (pluginState.previousBlockUuid != currentBlockId) {
      const now = new Date();
      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };

      const currentBlockContent = cursor.content;
      if (cursor.content.startsWith("**")) {
        return;
      }
      const timestamp = new Intl.DateTimeFormat("en-US", options).format(now);
      const toUpdateCursor =
        "**" + timestamp + "**" + "  " + currentBlockContent;

      await logseq.Editor.updateBlock(currentBlockId, toUpdateCursor);
      pluginState.previousBlockUuid = currentBlockId;
    }
  },

  startTimeflow() {
    top.document.addEventListener("keydown", this.addTimestamp);
  },

  stopTimeflow() {
    top.document.removeEventListener("keydown", this.addTimestamp);
  },

  sendMessage() {
    this.istimeflowEnabled = !this.istimeflowEnabled;
    const message = this.istimeflowEnabled
      ? "timeflow Mode ENABLED"
      : "timeflow Mode DISABLED";
    logseq.UI.showMsg(message);
  },
};

/**
 * App entry
 */
function main() {
  logseq.setMainUIInlineStyle({
    position: "fixed",
    zIndex: 11,
  });

  const key = logseq.baseInfo.id;
  logseq.provideModel(model);

  logseq.provideStyle(`
    div[data-injected-ui=timeflow-${key}] {
      display: flex;
      align-items: center;
      font-weight: 500;
      position: relative;，
    }
  `);

  // External buttons
  logseq.App.registerUIItem("toolbar", {
    key: "timeflow",
    template: `
      <a class="button" id="timeflow-button"
      data-on-click="togglePluginState"
      data-rect>
        ${timeflowSvgString}
      </a>
    `,
  });

  if (logseq.settings.hotkey) {
    logseq.App.registerCommandShortcut(
      {
        binding: logseq.settings.hotkey,
      },
      async () => {
        model.togglePluginState();
      }
    );
  }
}

// Bootstrap
logseq.useSettingsSchema(settingsSchema).ready(main).catch(console.error);
