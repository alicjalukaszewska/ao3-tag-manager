// Inform the background page that
// this tab should have a page-action.
chrome.runtime.sendMessage({
  from: "content",
  subject: "showPageAction",
});

const dummyIframeName = "dummy-iframe";
let clickedButton = "post_button";

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

const manageTargetToForm = (addTarget = false) => {
  const form = document.getElementById("work-form");
  if (addTarget) form.target = dummyIframeName;
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
    const removeButtons = tagsOfListParent.querySelectorAll("span.delete a");
    if (removeButtons && removeButtons.length) {
      [...removeButtons].forEach((btn) => {
        btn.click();
      });
    }
  });
  saveWithoutReload();
};

const addTagsFromPlugin = (popupTags) => {
  Object.keys(popupTags).forEach((key) => {
    const listInput = document.getElementById(`work_${key}_autocomplete`);
    const tags = popupTags[key];
    tags.forEach((tag) => {
      listInput.value = tag;
      listInput.focus();
      listInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      listInput.blur();
    });
  });
};

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  if (msg.from === "popup" && msg.subject === "DOMInfo") {
    const domInfo = {
      relationship: document.getElementById("work_relationship").value,
      character: document.getElementById("work_character").value,
      freeform: document.getElementById("work_freeform").value,
    };

    response(domInfo);
  }

  if (msg.from === "popup" && msg.subject === "saveModifiedTags") {
    manageDummyIframe();

    removeCurrentTags();
    addTagsFromPlugin(msg.tags);

    //timeout to make sure this action takes place after the action for deleting old tags
    setTimeout(() => {
      saveWithoutReload();
    }, 1000);
  }
});
