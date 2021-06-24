const socket = io();

const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// qs parse - no ? option
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// auto scroll
const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // get margin bottom
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  // Height of the new message = offset + margin
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
  // Visible height - what we see
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container - includes all messages
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled ?
  // scrollTop : FROM top TO top of scrollbar
  const scrollOffSet = $messages.scrollTop + visibleHeight;

  // before adding new message
  if (containerHeight - newMessageHeight <= scrollOffSet) {
    // currently at the bottom
    // auto scroll : push to the bottom
    $messages.scrollTop = $messages.scrollHeight;
  }
  // if not at the bottom then not scrolling
};

socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm A"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (message) => {
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm A"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  // create html from Mustache template
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  // put template into HTML section
  document.querySelector("#sidebar").innerHTML = html;
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  $messageFormButton.setAttribute("disabled", "disabled");

  const msg = e.target.elements.message.value;

  socket.emit("sendMessage", msg, (error) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }

    console.log("Message delivered!");
  });
});

$sendLocationButton.addEventListener("click", (e) => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  $sendLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $sendLocationButton.removeAttribute("disabled");
        console.log("Location shared!");
      }
    );
  });
});

// join room emit
socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
