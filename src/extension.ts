import * as vscode from "vscode";
import { TwitchChatClient } from "./twitchChat";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand("twitch-chat.open", async () => {
    const channelName = await vscode.window.showInputBox({
      prompt: "Enter the name of the channel whose chat you want to see.",
      placeHolder: "z.B. TwitchUserName",
      validateInput: (text) => {
        return text.trim() === "" ? "Channelname is not allowed to be empty" : null;
      },
    });
    if (channelName === undefined) {
      vscode.window.showWarningMessage("Action canceled.");
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "twitchChat",
      "Twitch Chat",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true 
      },
    );
    panel.webview.html = getWebviewHtml();

    const chat = new TwitchChatClient(channelName, (user, color, message) => {
      panel.webview.postMessage({
        type: "chat",
        user,
        color,
        message,
      });
    });
    chat.connect();

    panel.onDidDispose(() => {
      chat.disconnect();
    });
  });
  context.subscriptions.push(disposable);
}

function getWebviewHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<style>
body {
    background: #1e1e1e;
    color: white;
    font-family: sans-serif;
    margin: 0;
}

#chat {
    padding: 10px;
}

.message {
    margin: 4px 0;
}

.user {
    color: #9147ff;
    font-weight: bold;
}
</style>

</head>
<body>

<div id="chat"></div>

<script>

const chat = document.getElementById("chat");

window.addEventListener("message", event => {
    const data = event.data;

    if(data.type !== "chat")
        return;

    const div = document.createElement("div");

    div.className = "message";

    div.innerHTML =
        "<span class='user' style='color: " + data.color + "'>" +
        data.user +
        "</span>: " +
        data.message;

    chat.appendChild(div);

    if (chat.children.length > 100) {
        chat.removeChild(chat.firstChild);
    }

    window.scrollTo(0, document.body.scrollHeight);
});

</script>

</body>
</html>
`;
}

export function deactivate() {}