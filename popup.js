const listTypes = ["relationship", "character", "freeform"];
let currentDraggedItem = null;

const getUpdatedTags = () => {
  const tagLists = listTypes.map((type) => {
    const list = document.getElementById(`${type}-list`);
    const listItems = list.getElementsByTagName("span");
    if (!listItems) return;

    const items = [...listItems].map((item) => item.innerText);
    return { [type]: items };
  });
  return Object.assign({}, ...tagLists);
};

const saveEdits = () => {
  saveAllNewTagsInputs();

  const tagListsObj = getUpdatedTags();

  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        from: "popup",
        subject: "saveModifiedTags",
        tags: tagListsObj,
      });
    }
  );
};

const saveNewInputTag = (input, list) => {
  const valueWithoutComma = input.value.trim().replace(/[,]+/, "");
  const tagElement = generateTagListElement(valueWithoutComma);
  list.appendChild(tagElement);
  const listItems = list.getElementsByTagName("li");
  addDragEventsToListItem(tagElement, listItems);
  input.value = "";
};

const saveAllNewTagsInputs = () => {
  listTypes.forEach((type) => {
    const input = document.getElementById(`${type}-input`);
    const list = document.getElementById(`${type}-list`);
    if (input.value.trim()) saveNewInputTag(input, list);
  });
};

const manageNewTagInputs = () => {
  listTypes.forEach((type) => {
    const input = document.getElementById(`${type}-input`);
    const list = document.getElementById(`${type}-list`);
    input.addEventListener("keyup", (e) => {
      if (e.code === "Comma" || e.code === "Enter") {
        saveNewInputTag(input, list);
      }
    });
  });
};

const addDragEventsToListItem = (item, listItems) => {
  item.ondragover = (evt) => {
    evt.preventDefault();
  };

  item.ondragstart = () => {
    currentDraggedItem = item;

    [...listItems].forEach((listItem) => {
      if (listItem.id !== currentDraggedItem.id) {
        listItem.classList.add("hint");
      }
    });
  };

  item.ondragenter = () => {
    if (item.id !== currentDraggedItem.id) {
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
    if (item.id !== currentDraggedItem.id) {
      const currentPosition = [...listItems].indexOf(currentDraggedItem);
      const droppedPosition = [...listItems].indexOf(item);
      if (currentPosition < droppedPosition) {
        item.parentNode.insertBefore(currentDraggedItem, item.nextSibling);
      } else {
        item.parentNode.insertBefore(currentDraggedItem, item);
      }
    }
  };
};

const activateSortList = (target) => {
  const listItems = target.getElementsByTagName("li");
  if (!listItems) return;

  [...listItems].forEach((item) => {
    addDragEventsToListItem(item, listItems);
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

const generateTagListElement = (tag) => {
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

const generateListOfTags = (info) => {
  if (!info) return;
  Object.keys(info).forEach((tagType) => {
    const list = document.getElementById(`${tagType}-list`);
    const tags = info[tagType].split(",");
    tags.forEach((tag) => {
      if (!tag) return;
      const tagElement = generateTagListElement(tag);
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
        generateListOfTags
      );
    }
  );
  //add event listeners to new tags inputs
  manageNewTagInputs();

  const postBtn = document.getElementById("post-btn");
  if (postBtn) postBtn.addEventListener("click", () => saveEdits());
});
