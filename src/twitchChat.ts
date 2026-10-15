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
      this.ws?.send("CAP REQ :twitch.tv/commands", () => {      console.log("tags and command sent")});

      this.ws?.send("PASS SCHMOOPIIE", () => {console.log("passed")});
      this.ws?.send("NICK justinfan12345",() => { console.log("nicked")} );

      this.ws?.send(`JOIN #${this.channel}`, () =>  {console.log("joined")});
    });

    this.ws.on("message", (data) => {
    const raw = data.toString();

    const lines = raw.split("\r\n");

    for (const line of lines) {
        console.log("IRC:", line);
        const pingmatch = line.includes("PING")
        if (pingmatch) {
          this.ws?.send("PONG :tmi.twitch.tv",() => console.log("pong sent"))
          continue
        }
        const match = line.match(
            /(?:.*color=(?<color>#[0-9A-Fa-f]{6})[^/]*)?.*?:(?<user>[^!]+)!.* PRIVMSG #[^ ]+ :(?<message>.*)/
        );

        if (match) {
            const [, color, user, message] = match;
            this.onMessage(user, color, message);
        }
    }
});

    this.ws.on("error", console.error);
}

  disconnect() {
    if (this.ws) {
    this.ws?.removeAllListeners()
    this.ws?.close();
    this.ws = undefined
    }
  }
}
