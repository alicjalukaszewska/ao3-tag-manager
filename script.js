// Inform the background page that
// this tab should have a page-action.
chrome.runtime.sendMessage({
  from: "content",
  subject: "showPageAction",
});

const dummyIframeName = "dummy-iframe";
let clickedButton = "preview_button";

const manageDummyIframe = () => {
  //prevent from creating more than one iframe
  if (document.querySelector(`iframe#${dummyIframeName}`)) return;

  const iframe = document.createElement("iframe");
  iframe.name = dummyIframeName;
  iframe.id = dummyIframeName;
  iframe.style.display = "none";
  const body = document.querySelector("body");
  body.appendChild(iframe);
};

const manageTargetToForm = (add = false) => {
  const form = document.getElementById("work-form");
  if (add) form.target = dummyIframeName;
  else form.removeAttribute("target");
};

const clickBtn = () => {
  const btnElement = document.getElementsByName(clickedButton)[0];

  if (btnElement) {
    btnElement.removeAttribute("data-disable-with");
    btnElement.click();
  }
};

const saveWithoutReload = () => {
  manageTargetToForm(true);
  clickBtn();
  manageTargetToForm();
};

const removeCurrentTags = () => {
  const listTypes = ["relationship", "character", "freeform"];

  listTypes.forEach((listType) => {
    const tagsOfListParent = document.querySelector(`dd.${listType}`);
    const removeBtns = tagsOfListParent.querySelectorAll("span.delete a");
    if (removeBtns && removeBtns.length) {
      [...removeBtns].forEach((btn) => {
        btn.click();
      });
    }
  });
  manageDummyIframe();
  saveWithoutReload();
};

const addTagsFromPlugin = (msg) => {
  Object.keys(msg.tags).forEach((key) => {
    const listInput = document.getElementById(`work_${key}_autocomplete`);
    const tags = msg.tags[key];
    tags.forEach((tag) => {
      listInput.value = tag;
      listInput.focus();
      listInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      listInput.blur();
    });
  });
};

// Listen for messages from the popup.
chrome.runtime.onMessage.addListener((msg, sender, response) => {
  // First, validate the message's structure.
  if (msg.from === "popup" && msg.subject === "DOMInfo") {
    const domInfo = {
      relationship: document.getElementById("work_relationship").value,
      character: document.getElementById("work_character").value,
      freeform: document.getElementById("work_freeform").value,
    };

    // Directly respond to the sender (popup),
    // through the specified callback.
    response(domInfo);
  }

  if (msg.from === "popup" && msg.subject === "removeTags") {
    clickedButton = msg.saveType;

    removeCurrentTags();

    const res = "remove";
    response(res);
  }

  if (msg.from === "popup" && msg.subject === "updateInfo") {
    addTagsFromPlugin(msg);

    const res = "add";
    response(res);
  }
  if (msg.from === "popup" && msg.subject === "finishedUpdate") {
    clickedButton = msg.saveType;

    if (msg.saveType === "post_button") saveWithoutReload();
    else {
      clickBtn();
    }

    const res = "finished";
    response(res);
  }
});

function generateTagList(id) {
  const tagsInput = document.getElementById(id);

  chrome.runtime.sendMessage({
    from: "content",
    subject: tagsInput.value,
  });
}

function getTags() {
  const inputsIds = ["work_relationship", "work_character", "work_freeform"];

  inputsIds.forEach((id) => generateTagList(id));
}

// getTags();