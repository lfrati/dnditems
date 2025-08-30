const STORAGE_NAME = "qb41tc90zEkiDiOh6UcjD0ChhuSmRyfk";
const ITEMS_NAMES = Object.keys(ITEMS_DATA);

let undo = () => {};

function get_card_names() {
  let state = Array.from(
    document.querySelectorAll("#cards-container .card")
  ).map((card) => card.dataset.title);
  return state;
}

/* There are 3 where we can undo:
- remove_card
- remove_all
- add_card
*/
function make_undo(callback) {
  // Get the button element
  const button = document.getElementById("undo-button");
  // Disable the button
  button.disabled = false;
  undo = () => {
    callback();
    sort_cards();
    serialize();
    undo = () => {};
    button.disabled = true;
  };
}

function remove_card(name, undoable) {
  const cards = document.querySelectorAll(".card");

  cards.forEach((card) => {
    if (card.dataset.title === name) {
      card.remove();
    }
  });
  // sort_cards(); // no need to sort on remove
  serialize();

  if (undoable) {
    make_undo(() => {
      console.log("Undoing remove", name);
      add_card(name, false);
    });
  }
}

function remove_all(undoable) {
  const names = get_card_names();
  if (names.length == 0) {
    return;
  }
  let div = document.getElementById("cards-container");
  div.innerHTML = "";
  // sort_cards(); // no need to sort on remove
  serialize();

  if (undoable) {
    make_undo(() => {
      console.log("Undoing remove_all", names);
      names.forEach((name) => {
        add_card(name, false);
      });
    });
  }
}

function add_card(name, undoable) {
  let item = ITEMS_DATA[name];
  const container = document.getElementById("cards-container");

  const card = document.createElement("div");
  card.className = "card";
  card.dataset.title = name;

  card.onclick = function (event) {
    event.preventDefault();
    remove_card(name, true);
  };

  card.innerHTML = `<h1 id="itemname">${name}</h1>${item}`;
  container.appendChild(card);

  sort_cards();
  serialize();

  if (undoable) {
    make_undo(() => {
      console.log("Undoing add", name);
      remove_card(name, false);
    });
  }
}

function sort_cards() {
  let cards = Array.from(document.querySelectorAll(".card"));
  cards = cards.sort((a, b) => {
    return a.dataset.title.localeCompare(b.dataset.title);
  });
  let container = document.getElementById("cards-container");
  container.innerHTML = "";
  // Re-append the sorted div elements to the container
  cards.forEach((card) => container.appendChild(card));
}

function serialize() {
  const state = get_card_names();
  const serializedState = JSON.stringify(state);
  localStorage.setItem(STORAGE_NAME, serializedState);
  console.log("Data stored: ", serializedState);
}

function restore() {
  const serializedState = localStorage.getItem(STORAGE_NAME);
  if (serializedState) {
    const state = JSON.parse(serializedState);
    console.log("Data retrieved:", state);
    for (let name of state) {
      add_card(name, false);
    }
    sort_cards();
  }
}

document.addEventListener("click", function (event) {
  const suggestions = document.getElementById("suggestions");
  const searchInput = document.getElementById("searchInput");
  if (!suggestions.contains(event.target) && event.target !== searchInput) {
    clear_suggestions();
  }
});

function clear_suggestions() {
  const suggestions = document.getElementById("suggestions");
  const searchInput = document.getElementById("searchInput");
  suggestions.innerHTML = ""; // Clear suggestions if clicked outside
  searchInput.value = ""; // also clear input field
}

document.querySelector("#searchInput").addEventListener("input", function () {
  const input = this.value;
  const suggestions = document.getElementById("suggestions");
  suggestions.innerHTML = ""; // Clear previous suggestions

  const cards = get_card_names();

  if (input.length > 0) {
    const filteredKeys = ITEMS_NAMES.filter(
      (key) =>
        key.toLowerCase().includes(input.toLowerCase()) && !cards.includes(key)
    );

    filteredKeys.forEach((key) => {
      const li = document.createElement("li");
      let item = ITEMS_DATA[key];
      li.innerHTML = `<strong>${key}</strong>`;
      li.onclick = function () {
        add_card(key, item, true);
        clear_suggestions();
      };
      suggestions.appendChild(li);
    });
  }
});

document.getElementById("save-button").addEventListener("click", function () {
  const data = get_card_names();
  const encoded = encodeURIComponent(JSON.stringify(data));
  const dataStr = `data:text/json;charset=utf-8,${encoded}`;
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "items.json");
  document.body.appendChild(downloadAnchorNode); // Required for Firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
});

document
  .getElementById("load-items")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];

    if (!file || file.type !== "application/json") {
      console.error("Please select a valid JSON file.");
      event.target.value = ""; // Reset the file input value
      return;
    }
    const reader = new FileReader();

    reader.onload = function (e) {
      let jsonContent;
      const content = e.target.result;
      try {
        jsonContent = Array.from(JSON.parse(content));
      } catch (err) {
        console.error("Error parsing JSON:", err);
        return;
      }

      remove_all();
      jsonContent.forEach((name) => {
        if (ITEMS_DATA[name]) {
          console.log("Adding", name);
          add_card(name, false);
        }
      });
      sort_cards();
    };
    reader.readAsText(file);
    // Reset the file input value so that the change event can be triggered again
    event.target.value = "";
  });

restore();
