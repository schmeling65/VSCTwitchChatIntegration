const vscode = acquireVsCodeApi();

const chat = document.getElementById("chat");
const msgtypes = ["chat","usernotice","clearmsg"]

window.addEventListener("message", (event) => {
  console.log(event);
  const generaldata = event.data;

  if (!msgtypes.includes(generaldata.type)) return;
  let div;
  console.log(generaldata.type)
  switch (generaldata.type) {
    case "chat":
      div = postChatMessage(generaldata.data);
      break;
    case "usernotice":
      div = postUserNotice(generaldata.data);
      break;
    case "clearmsg":
      console.log("clearmsg got in frontend")
      deleteChatMEssage(generaldata.data.id);
      break;
    default:
  }
  if (div !== null) chat.appendChild(div);

  if (chat.children.length > 100) {
    chat.removeChild(chat.firstChild);
  }

  window.scrollTo(0, document.body.scrollHeight);
});

function deleteChatMEssage(id) {
  let div = document.getElementById(id);
  div.remove();
}

function createUserSpan(name, color) {
  const span = document.createElement("span");
  span.className = "user";
  span.style.color = color;
  span.textContent = name;
  return span;
}

function postChatMessage(data) {
  let div = createMessageDiv(data);
  if (data.firstMessage) {
    div.classList.add("firstMsg");
  }
  div.id = data.id;
  div.className += data.firstMessage ? " firstMsg" : "";
  div.appendChild(document.createTextNode(": " + data.message));
  return div
}

function postUserNotice(data) {
  let div = createMessageDiv(data);
  div.className = " " + data.msgType;
  switch (data.msgType) {
    case "viewermilestone":
      div.appendChild(createUserSpan(data.user, data.color));
      const text1 = document.createTextNode(" is on a " + data.msgData.streak + " watchstreak!\n");
      div.appendChild(text1);
      const msgSpan = document.createElement("span");
      msgSpan.textContent = data.message;
      div.appendChild(msgSpan);
      break;
    case "announcement":
      div.appendChild(createUserSpan(data.user, data.color));
      div.appendChild(document.createTextNode("\n" + data.message));
      break;
    case "resub":
      div.appendChild(createUserSpan(data.user, data.color));
      let text =
        " subscribed again for the " +
        data.msgData.numberOfTotalMonths +
        " with a tier " +
        data.tier +
        " sub .";
      if (data.msgData.wantsToShare === "true") {
        text += " The current sub-streak is " + data.msgData.consecutiveMonths + ".";
      }
      div.appendChild(document.createTextNode(text));
      break;
    case "sub":
      div.appendChild(createUserSpan(data.user, data.color));
      let subtext = " subscribed with a tier " + data.tier + " sub.";
      if (subMonths > 0) {
        subtext += " Sub-streak: " + data.msgData.numberOfTotalMonths;
      }
      div.appendChild(document.createTextNode(subtext));
      break;
    case "subgift":
      div.appendChild(createUserSpan(data.user, data.color));
      div.appendChild(
        document.createTextNode(
          " gifted a tier " + data.msgData.tier + " sub to " + data.msgData.reciever + ".",
        ),
      );
      break;
    case "raid":
      div.appendChild(createUserSpan(data.user, data.color));
      div.appendChild(document.createTextNode(" " + data.message));
      break;
    default:
      div.appendChild(createUserSpan(data.user, data.color));
      div.appendChild(document.createTextNode(" " + data.message));
  }
  return div
}

function createMessageDiv(data) {
  const div = document.createElement("div");
  div.className = "message";
  div.appendChild(createUserSpan(data.user, data.color));
  return div;
}
