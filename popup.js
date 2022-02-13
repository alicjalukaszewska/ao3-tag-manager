const listTypes = ["relationship", "character", "freeform"];
let clickedButton = "preview_button";

const saveSuccess = (info) => {
  console.log("saved successfully!", info);
};

const saveNewTags = () => {
  setTimeout(() => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      (tabs) => {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            from: "popup",
            subject: "finishedUpdate",
            saveType: clickedButton,
          },
          saveSuccess
        );
      }
    );
  }, 1000);
};

const setNewTags = () => {
  const tagLists = listTypes.map((type) => {
    const list = document.getElementById(`${type}-list`);
    const listItems = list.getElementsByTagName("span");
    if (!listItems) return;

    const items = [...listItems].map((item) => item.innerText);
    return { [type]: items };
  });
  const tagListsObj = Object.assign({}, ...tagLists);
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          from: "popup",
          subject: "updateInfo",
          tags: tagListsObj,
        },
        saveNewTags
      );
    }
  );
};

const saveEdits = (saveType) => {
  clickedButton = saveType;
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          from: "popup",
          subject: "removeTags",
          saveType,
        },
        setNewTags
      );
    }
  );
};

const manageNewTagInputs = () => {
  listTypes.forEach((type) => {
    const list = document.getElementById(`${type}-list`);
    const input = document.getElementById(`${type}-input`);
    input.addEventListener("keyup", (e) => {
      if (e.code === "Comma" || e.code === "Enter") {
        const valueWithoutComma = input.value.trim().replace(/[,]+/, "");
        const tagElement = generateListElement(valueWithoutComma);
        list.appendChild(tagElement);
        input.value = "";
      }
    });
  });
};

const activateSortList = (target) => {
  const listItems = target.getElementsByTagName("li");
  let current = null;

  if (!listItems) return;

  [...listItems].forEach((item) => {
    item.ondragover = (evt) => {
      evt.preventDefault();
    };

    item.ondragstart = () => {
      current = item;
      [...listItems].forEach((listItem) => {
        if (listItem.id !== current.id) {
          listItem.classList.add("hint");
        }
      });
    };

    item.ondragenter = () => {
      if (item.id !== current.id) {
        item.classList.add("active");
      }
    };

    item.ondragleave = () => {
      item.classList.remove("active");
    };

    item.ondragend = () => {
      [...listItems].forEach((listItem) => {
        listItem.classList.remove("hint");
        listItem.classList.remove("active");
        item.classList.add("ready");
        setTimeout(() => {
          item.classList.remove("ready");
        }, 1000);
      });
    };

    item.ondrop = (evt) => {
      evt.preventDefault();
      if (item.id !== current.id) {
        const currentPosition = [...listItems].indexOf(current);
        const droppedPosition = [...listItems].indexOf(item);
        if (currentPosition < droppedPosition) {
          item.parentNode.insertBefore(current, item.nextSibling);
        } else {
          item.parentNode.insertBefore(current, item);
        }
      }
    };
  });
};

const addSortingToListElement = () => {
  listTypes.forEach((type) => {
    activateSortList(document.getElementById(`${type}-list`));
  });
};

const removeTag = (e) => {
  const listElement = e.srcElement.parentNode;
  listElement.remove();
};

const generateListElement = (tag) => {
  const tagElement = document.createElement("li");
  const tagSpanElement = document.createElement("span");
  tagSpanElement.innerHTML = tag.trim();
  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.innerHTML = "&#10005;";
  removeBtn.title = "Delete tag";
  tagElement.id = tag.trim();
  tagElement.class = "list-element";
  tagElement.draggable = true;
  tagElement.appendChild(tagSpanElement);
  tagElement.appendChild(removeBtn);
  removeBtn.addEventListener("click", removeTag);
  return tagElement;
};

const generateListElements = (info) => {
  if (!info) return;
  Object.keys(info).forEach((tagType) => {
    const list = document.getElementById(`${tagType}-list`);
    const tags = info[tagType].split(",");
    tags.forEach((tag) => {
      const tagElement = generateListElement(tag);
      list.appendChild(tagElement);
    });
  });
  addSortingToListElement();
};

window.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { from: "popup", subject: "DOMInfo" },
        generateListElements
      );
    }
  );
  const postBtn = document.getElementById("post-btn");
  if (postBtn)
    postBtn.addEventListener("click", () => saveEdits("post_button"));
  const previewBtn = document.getElementById("preview-btn");
  if (previewBtn)
    previewBtn.addEventListener("click", () => saveEdits("preview_button"));

  manageNewTagInputs();
});
