import WebSocket from "ws";

export class TwitchChatClient {
  private ws?: WebSocket;

  constructor(
    private channel: string,
    private onMessage: (user: string, color: string, message: string) => void,
  ) {}

  connect() {
    this.ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

    this.ws.on("open", () => {
      console.log("Connected to Twitch IRC");

      this.ws?.send("CAP REQ :twitch.tv/tags");
      this.ws?.send("CAP REQ :twitch.tv/commands", () => {
        console.log("tags and command sent");
      });

      this.ws?.send("PASS SCHMOOPIIE", () => {
        console.log("passed");
      });
      this.ws?.send("NICK justinfan12345", () => {
        console.log("nicked");
      });

      this.ws?.send(`JOIN #${this.channel}`, () => {
        console.log("joined");
      });
    });

    this.ws.on("message", (data) => {
      const raw = data.toString();

      const lines = raw.split("\r\n");

      for (const line of lines) {
        console.log("IRC:", line);
        const pingmatch = line.includes("PING");
        if (pingmatch) {
          this.ws?.send("PONG :tmi.twitch.tv", () => console.log("pong sent"));
          continue;
        }
        const parts = line.split(";");
        let privmessagespot = null;
        parts.forEach((part, index) => {
          if (part.includes("PRIVMSG")) {
            privmessagespot = index;
          }
        });
        if (privmessagespot === null) {
          continue;
        }
        const tags: Record<string, string> = {};
        for (let i = 0; i < parts.length - 2; i++) {
          const part = parts[i];
          const eqIndex = part.indexOf("=");
          if (eqIndex !== -1) {
            const key = part.substring(0, eqIndex);
            const value = part.substring(eqIndex + 1);
            tags[key] = value;
          }
        }
        const privmsgPositionInString = parts[parts.length-1].indexOf("PRIVMSG")
        const messageString = parts[parts.length-1].substring(privmsgPositionInString)
        const messagePosition = messageString.indexOf(":")
        const message = messageString.substring(messagePosition+1)

        if (tags["display-name"] && message) {
          this.onMessage(tags["display-name"], tags["color"], message);
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
}
