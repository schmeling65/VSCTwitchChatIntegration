import WebSocket from "ws";
import * as vscode from "vscode";
import { NumberToOrdinal } from "./formatOrdinalNumber";

export class TwitchChatClient {
  private ws?: WebSocket;
  private messageTypes: string[] = ["PRIVMSG", "PING", "RECONNECT", "USERNOTICE", "CLEARMSG"];

  constructor(
    private channel: string,
    private onMessage: (type: string, {}) => void,
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
        for (const messageType of this.messageTypes) {
          if (line.includes(messageType)) {
            foundMessageType = messageType;
            break;
          }
        }
        if (!foundMessageType) {
          continue;
        }
        console.log(foundMessageType);
        switch (foundMessageType) {
          case "PING":
            this.ws?.send("PONG :tmi.twitch.tv");
            break;
          case "RECONNECT":
            this.disconnect();
            this.connect();
            break;
          case "PRIVMSG":
            const tags: Record<string, string> = {};
            const message = this.parseString(line, tags, foundMessageType);

            if (tags["display-name"] && message) {
              const firstMessage = tags["first-msg"] == "0" ? false : true;
              const bits = tags["bits"] ?? false;
              this.onMessage("chat", {
                user: tags["display-name"],
                color: tags["color"],
                message: message,
                firstMessage: firstMessage,
                id: tags["id"],
                bits: bits,
              });
            }
            break;
          case "USERNOTICE":
            //msg-id=viewermilestone msg-param-value=145 -> Zuschauerserie von 145
            //msg-id=announcement
            //msg-id=resub msg-param-cumulative-months=43 (streak) msg-param-multimonth-duration=6 (im vorraus) msg-param-sub-plan=2000 (sub stufe in 1000, Prime when prime) nach USERNOTICE -> msg
            //msg-id=raid msg-param-viewerCount=1

            const tagslist: Record<string, string> = {};
            const usernoticeMessage = this.parseString(line, tagslist, foundMessageType);
            switch (tagslist["msg-id"]) {
              case "viewermilestone":
                this.onMessage("usernotice", {
                  user: tagslist["display-name"],
                  color: tagslist["color"],
                  message: usernoticeMessage,
                  msgType: "viewermilestone",
                  streak: tagslist["msg-param-value"],
                });
                break;
              case "announcement":
                this.onMessage("usernotice", {
                  user: tagslist["display-name"],
                  color: tagslist["color"],
                  message: usernoticeMessage,
                  msgType: "announcement",
                });
                break;
              case "resub":
                this.onMessage("usernotice", {
                  user: tagslist["display-name"],
                  color: tagslist["color"],
                  message: usernoticeMessage,
                  msgType: "resub",
                  tier: tagslist["msg-param-sub-plan"],
                  numberOfTotalMonths: tagslist["msg-param-cumulative-months"] + NumberToOrdinal(
                    parseInt(tagslist["msg-param-cumulative-months"]),
                  ),
                  wantsToShare: tagslist["msg-param-should-share-streak"],
                  consecutiveMonths: tagslist["msg-param-streak-months"],
                });
                break;
              case "sub":
                this.onMessage("usernotice", {
                  user: tagslist["display-name"],
                  color: tagslist["color"],
                  message: usernoticeMessage,
                  msgType: "sub",
                  tier: tagslist["msg-param-sub-plan"],
                  numberOfTotalMonths: tagslist["msg-param-cumulative-months"],
                });
                break;
              case "subgift":
                this.onMessage("usernotice", {
                  user: tagslist["display-name"],
                  color: tagslist["color"],
                  message: usernoticeMessage,
                  msgType: "sub",
                  tier: tagslist["msg-param-sub-plan"],
                  reciever: tagslist["msg-param-recipient-name"],
                });
                break;
              case "raid":
                this.onMessage("usernotice", {
                  user: tagslist["display-name"],
                  color: tagslist["color"],
                  message: "is raiding with " + tagslist["msg-param-viewerCount"] + " viewers.",
                  msgType: "raid",
                });
                break;
              default:
            }
            break;
          case "CLEARMSG":
            const match = line.match(/target-msg-id=([^;]+)/);
            const targetMsgId: string = match![1];
            this.onMessage("clearmsg", { id: targetMsgId });
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

  
  /*IRC: @badge-info=subscriber/4;badges=vip/1,subscriber/3003,subtember-2025/1;color=#D2691E;display-name=smookysdooky;emotes=;flags=;id=fa68fe5a-4251-4c1f-89e4-12458f53e65e;login=smookysdooky;mod=0;msg-id=subgift;msg-param-community-gift-id=2102739982094155998;msg-param-gift-months=1;msg-param-months=1;msg-param-origin-id=2102739982094155998;msg-param-recipient-display-name=Mimyk0ktapus;msg-param-recipient-id=183884032;msg-param-recipient-user-name=mimyk0ktapus;msg-param-sender-count=0;msg-param-sub-plan-name=Subscription\s(linalachesis);msg-param-sub-plan=1000;room-id=996322312;subscriber=1;system-msg=smookysdooky\sgifted\sa\sTier\s1\ssub\sto\sMimyk0ktapus!;tmi-sent-ts=1793987868201;user-id=260886010;user-type=;vip=1 :tmi.twitch.tv USERNOTICE #linalachesis
  Bug bei keiner Message im Watchstreak*/
  isolateMessage(parts: string[], messageType: string) {
    const privmsgPositionInString = parts[parts.length - 1].indexOf(messageType);
    const messageString = parts[parts.length - 1].substring(privmsgPositionInString);
    const messagePosition = messageString.indexOf(":");
    return messageString.substring(messagePosition + 1);
  }
}
