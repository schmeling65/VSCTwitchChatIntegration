import WebSocket from "ws";
import * as vscode from "vscode";

export class TwitchChatClient {
  private ws?: WebSocket;
  private messageTypes: string[] = ["PRIVMSG", "PING", "RECONNECT", "USERNOTICE"];
  private msgid: string[] = ["viewermilestone"];

  constructor(
    private channel: string,
    private onMessage: (
      user: string,
      color: string,
      message: string,
      firstMessage: boolean,
    ) => void,
  ) {}

  connect() {
    this.ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

    this.ws.on("open", () => {
      vscode.window.showInformationMessage("Connecting to Twitch IRC...");

      this.ws?.send("CAP REQ :twitch.tv/tags", () => {
        vscode.window.showInformationMessage("Data of Chatters requested.");
      });
      this.ws?.send("CAP REQ :twitch.tv/commands", () => {
        vscode.window.showInformationMessage("Commands requested.");
      });
      this.ws?.send("CAP REQ :twitch.tv/membership", () => {
        vscode.window.showInformationMessage("Commands requested.");
      });

      this.ws?.send("PASS SCHMOOPIIE", () => {
        vscode.window.showInformationMessage("Authentication passed.");
      });
      this.ws?.send("NICK justinfan12345", () => {
        vscode.window.showInformationMessage("Connection nick set.");
      });

      this.ws?.send(`JOIN #${this.channel}`, () => {
        vscode.window.showInformationMessage("Channel joined.");
      });
    });

    this.ws.on("message", (data) => {
      const raw = data.toString();

      const lines = raw.split("\r\n");

      for (const line of lines) {
        console.log("IRC:", line);
        let foundMessageType = null;
        for (const messageType in this.messageTypes) {
          if (line.includes(messageType)) {
            foundMessageType = messageType;
            break;
          }
        }
        if (!foundMessageType) {
          continue;
        }

        switch (foundMessageType) {
          case "PING":
            this.ws?.send("PONG :tmi.twitch.tv");
            break;
          case "RECONNECT":
            this.disconnect();
            this.connect();
            break;
          case "PRIVMSG":
          case "USERNOTICE":
            //msg-id=viewermilestone msg-param-value=145 -> Zuschauerserie von 145
            //msg-id=announcement
            //msg-id=resub msg-param-cumulative-months=43 (streak) msg-param-multimonth-duration=6 (im vorraus) msg-param-sub-plan=2000 (sub stufe in 1000, Prime when prime) nach USERNOTICE -> msg
            const tags: Record<string, string> = {};
            const message = this.parseString(line, tags, foundMessageType);

            if (tags["display-name"] && message) {
              let firstMessage = tags["first-msg"] == "0" ? false : true;
              this.onMessage(tags["display-name"], tags["color"], message, firstMessage);
            }
            break;
          default:
        }
      }
    });

    this.ws.on("error", console.error);
  }

  disconnect() {
    if (this.ws) {
      this.ws?.removeAllListeners();
      this.ws?.close();
      this.ws = undefined;
    }
  }

  parseString(line: string, tags: Record<string, string>, messageType: string) {
    const parts = line.split(";");
    this.createTagsTable(parts, tags);
    return this.isolateMessage(parts, messageType);
  }

  createTagsTable(parts: string[], tags: Record<string, string>) {
    for (let i = 0; i < parts.length - 2; i++) {
      const part = parts[i];
      const eqIndex = part.indexOf("=");
      if (eqIndex !== -1) {
        const key = part.substring(0, eqIndex);
        const value = part.substring(eqIndex + 1);
        tags[key] = value;
      }
    }
  }

  isolateMessage(parts: string[], messageType: string) {
    const privmsgPositionInString = parts[parts.length - 1].indexOf(messageType);
    const messageString = parts[parts.length - 1].substring(privmsgPositionInString);
    const messagePosition = messageString.indexOf(":");
    return messageString.substring(messagePosition + 1);
  }
}
