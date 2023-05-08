interface IMessageElement {
    el: string;
    content: String | IMessageElement[];
}

const message = [
    [
        {
            el: "p",
            content: "lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Nisi vitae suscipit tellus mauris. Est lorem ipsum dolor sit amet consectetur. Feugiat sed lectus vestibulum mattis ullamcorper velit sed ullamcorper morbi. Lectus mauris ultrices eros in cursus turpis massa. Duis ut diam quam nulla porttitor massa id neque aliquam. Dolor sit amet consectetur adipiscing elit pellentesque habitant. Ut eu sem integer vitae justo eget magna fermentum. Vel elit scelerisque mauris pellentesque pulvinar pellentesque habitant. Convallis convallis tellus id interdum velit. Cras sed felis eget velit. Mattis aliquam faucibus purus in massa tempor nec."
        }
    ],
    [
        {
            el: "p",
            content: "The quick brown fox jumped over the lazy fox"
        },
        {
            el: "ul",
            content: [
                {
                    el: "li",
                    content: "1 lb of Carrots"
                },
                {
                    el: "li",
                    content: "2lb of apples"
                }
            ]
        }
    ]
];

function renderTextResponse(container: HTMLElement, words: string[]) {
    let blockCursor = container.nextElementSibling;
    if (!blockCursor) {
        // Faux cursor that goes at the end
        blockCursor = document.createElement("span");
        blockCursor.classList.toggle("chat-block-cursor", true);
        blockCursor.textContent = "";
        container.parentElement?.appendChild(blockCursor);
    }

    const word = words.shift();
    container.textContent += ` ${word}`;
    container.parentElement?.parentElement?.parentElement?.scrollIntoView(false);

    if (words.length > 0) {
        setTimeout(() => renderTextResponse(container, words), 74);
    } else {
        blockCursor.remove();
    }
}

function renderAnswerMessage(container: HTMLElement, messageToPrint: IMessageElement) {

    // Main answer element
    const answerContainer = document.createElement("div");
    answerContainer.classList.toggle("chat-answer", true);

    // Wrapper that centres the message, and has the avatar + text container
    const answerWrapper = answerContainer.appendChild(document.createElement("div"));
    const avatar = document.createElement("div");

    // Avatar
    avatar.classList.toggle("chat-avatar-bot", true);
    answerWrapper.appendChild(avatar);

    // Text Response Container
    const textContainer = document.createElement(messageToPrint.el);
    textContainer.classList.toggle("chat-text", true);

    // Actual content wrapper
    const text = document.createElement("span");
    textContainer.appendChild(text);

    container.appendChild(answerContainer);
    if (typeof messageToPrint.content === "string") {
        answerWrapper.appendChild(textContainer);
        renderTextResponse(text, messageToPrint.content.split(" "));
    } else if (messageToPrint.content instanceof Array) {
        text.textContent = "Not Supported";
    }
}

const addButton = document.querySelector("button[data-id='add-answer']") as HTMLButtonElement;
const chatResponse = document.querySelector(".chat-response") as HTMLDivElement;
addButton!.addEventListener("click", () => {
    renderAnswerMessage(chatResponse, message[0][0]);
});