const vscode = acquireVsCodeApi()

const chat = document.getElementById("chat");

window.addEventListener("message", event => {
    console.log(event)
    const data = event.data;

    if(data.type !== "chat")
        return;

    const div = document.createElement("div");
    div.className = "message"
    div.appendChild(createUserSpan(data.user, data.color));
    if (data.type === "usernotice") {
      div.className = " " + data.msgType
      switch (data.msgType) {
        case "viewermilestone":
          div.appendChild(createUserSpan(data.user, data.color));

          const text1 = document.createTextNode(" is on a " + data.msgData.streak + " watchstreak!\n");
          div.appendChild(text1);

          const msgSpan = document.createElement("span");
          msgSpan.textContent = data.message;
          div.appendChild(msgSpan);
    
          //div.innerHTML = "<span class='user' style='color: " + data.color + "'>" + data.user + "</span> is on a " + data.msgData.streak + " watchstreak!\n<span>"+ data.message +"</span>";
          break;
        case "announcement":
          div.appendChild(createUserSpan(data.user, data.color));
          div.appendChild(document.createTextNode("\n" + data.message));
          //div.innerHTML = "<span class='user' style='color: " + data.color + "'>" + data.user + "</span>\n" + data.message
          break;
        case "resub":
          div.appendChild(createUserSpan(data.user, data.color));
    
          let text = " subscribed again for the " + data.msgData.numberOfTotalMonths + " with a tier " + data.tier + " sub .";
          if (data.msgData.wantsToShare === "true") {
            text += " The current sub-streak is " + data.msgData.consecutiveMonths + ".";
          }
          div.appendChild(document.createTextNode(text));
          //div.innerHTML = "<span class='user' style='color: " + data.color + "'>" + data.user + "</span> subscribed again for the " + data.msgData.numberOfTotalMonths + "with a tier " + data.tier + " sub ." + (data.msgData.wantsToShare === "true" && " The current sub-streak is " + data.msgData.consecutiveMonths + ".")
          break;
        case "sub":
          div.appendChild(createUserSpan(data.user, data.color));
    
          let subtext = " subscribed with a tier " + data.tier + " sub.";
          if (subMonths > 0) {
            subtext += " Sub-streak: " + data.msgData.numberOfTotalMonths;
          }
          div.appendChild(document.createTextNode(subtext));
          //div.innerHTML = "<span class='user' style='color: " + data.color + "'>" + data.user + "</span> subscribed with a tier " + data.tier + " sub." + (msg-param-cumulative-months > 0 && " Sub-streak: " + data.msgData.numberOfTotalMonths0)
          break;
        case "subgift":
          div.appendChild(createUserSpan(data.user, data.color));
          div.appendChild(document.createTextNode(" gifted a tier " + data.msgData.tier + " sub to " + data.msgData.reciever + "."));
          //div.innerHTML = "<span class'user' style:'color: " + data.color + "'>"+ data.user  +  "</span> gifted a tier " + data.msgData.tier + " sub to " + data.msgData.reciever+ "."
          break;
        case "raid":
          div.appendChild(createUserSpan(data.user, data.color));
          div.appendChild(document.createTextNode(" " + data.message));
          //div.innerHTML = "<span class='user' style='color: " + data.color +"'>" + data.user +  "</span> " + data.message
          break;
        default:
          div.appendChild(createUserSpan(data.user, data.color));
          div.appendChild(document.createTextNode(" " + data.message));
          //div.innerHTML = "<span class='user' style='color: " + data.color + "'>" + data.user + "</span> " + data.message
      }
    }
    else {
      if (data.firstMessage) {
         div.classList.add("firstMsg");
      }
      div.className += (data.firstMessage ? " firstMsg" : "");
      div.appendChild(createUserSpan(data.user, data.color));
      div.appendChild(document.createTextNode(": " + data.message));
      //div.innerHTML = "<span class='user' style='color: " + data.color + "'>" + data.user + "</span>: " + data.message;
    }

    chat.appendChild(div);

    if (chat.children.length > 100) {
        chat.removeChild(chat.firstChild);
    }

    window.scrollTo(0, document.body.scrollHeight);
});

function createUserSpan(name, color) {
  const span = document.createElement('span');
  span.className = 'user';
  span.style.color = color;
  span.textContent = name;
  return span;
}
