import * as vscode from "vscode";
import { TwitchChatClient } from "./twitchChat";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand("twitch-chat.open", () => {
    const channelName = "schmeling65";
    const panel = vscode.window.createWebviewPanel(
      "twitchChat",
      "Twitch Chat",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      },
    );
    panel.webview.html = getWebviewHtml();

    const chat = new TwitchChatClient("schmeling65", (user, color, message) => {
      panel.webview.postMessage({
        type: "chat",
        user,
        color,
        message,
      });
    });
    chat.connect();

    panel.onDidDispose(() => {
        chat.disconnect()
    })
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

    window.scrollTo(0, document.body.scrollHeight);
});

</script>

</body>
</html>
`;
}

export function deactivate() {
}
/*
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('twitch-chat.open', function() {
        const channelName = "schmeling65"
        const panel = vscode.window.createWebviewPanel(
            "twitchChatView",
            `Twitch Chat`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        )
        panel.webview.html = getWebviewContent(channelName)
    })
    context.subscriptions.push(disposable)
}

function getWebviewContent(channel: string) {
    return `<!DOCTYPE html>
<html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="
            default-src 'none';
            frame-src https://*.twitch.tv https://twitch.tv;
            script-src 'unsafe-inline' 'unsafe-eval' https://*.twitch.tv;
            style-src 'unsafe-inline' https://*.twitch.tv;
            connect-src https://*.twitch.tv wss://*.twitch.tv;
            img-src https://*.twitch.tv data:;
        ">
        <title>Twitch Chat</title>
        <style>
            html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                background-color: #18181b;
            }
            iframe {
                width: 100%;
                height: 100%;
                border: none;
            }
        </style>
    </head>
    <body>
        <iframe src="https://www.twitch.tv/popout/${channel}/chat?popout=" sandbox="allow-scripts allow-same-origin allow-modals" migration="true"></iframe>
    </body>
</html>`
}


export function deactivate() {
}
*/
