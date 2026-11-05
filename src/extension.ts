import * as vscode from "vscode";
import { TwitchChatClient } from "./twitchChat";
import path from "path";
import fs from "fs";

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
    const webviewFolderUri = vscode.Uri.file(path.join(context.extensionPath, "out"));
    const panel = vscode.window.createWebviewPanel(
      "twitchChat",
      "Twitch Chat",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [webviewFolderUri],
      },
    );

    const scriptUri = panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, "out", "index.js")),
    );
    const cssUri = panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, "out", "index.css")),
    );
    panel.webview.html = getWebviewHtml(
      context,
      scriptUri.toString(),
      cssUri.toString(),
      panel.webview.cspSource,
    );

    const chat = new TwitchChatClient(
      channelName,
      (type: string, user: string, color: string, message: string, otherData: {}) => {
        panel.webview.postMessage({
          type,
          user,
          color,
          message,
          otherData,
        });
      },
    );

    chat.connect();

    panel.onDidDispose(() => {
      chat.disconnect();
    });
  });
  context.subscriptions.push(disposable);
}

function getWebviewHtml(
  context: vscode.ExtensionContext,
  scriptUri: string,
  cssUri: string,
  cspSource: string,
) {
  let htmlcontent = fs.readFileSync(
    vscode.Uri.file(path.join(context.extensionPath, "out", "index.html")).fsPath,
    "utf8",
  );
  return htmlcontent
    .replaceAll("{{cspSource}}", cspSource)
    .replaceAll("index.js", scriptUri)
    .replaceAll("index.css", cssUri);
}

export function deactivate() {}
