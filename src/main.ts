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
                    content: [
                        {
                            el: "strong",
                            content: "Spicy"
                        },
                        {
                            el: "",
                            content: " peppers"
                        }
                    ]
                }
            ]
        }
    ]
];

const questions = [
    "When is Dominic on Vacation?",
    "Where is Dominic going on Vacation?"
];

function delay(duration: number): Promise<void> {
    return new Promise<void>((r) => {
        setTimeout(r, duration);
    });
}

function cloneIntoWithPartsFromName<T>(templateName: string, target: Element): T {
    const template = document.querySelector<HTMLTemplateElement>(`[data-template='${templateName}']`)!;

    return cloneIntoWithParts(template, target);
}

function cloneIntoWithParts<T>(template: HTMLTemplateElement, target: Element): T {
    const content = document.importNode(template.content, true);

    const parts: T = locatePartsFromDOM(content);

    target.appendChild(content);

    return parts;
}

function locatePartsFromDOM<T>(element: HTMLElement | DocumentFragment): T {
    const query = "[data-part]";
    const elements = Array.from(element.querySelectorAll(query));

    // Make sure that the node we're starting from is included.
    // querySelector only finds descendants of the element, not the element
    // itself.
    if (element.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
        if ((<Element>element).matches(query)) {
            elements.push(<Element>element);
        }
    }

    const parts = elements.reduce<any>(
        (localParts: any, el: Element) => {
            const partName = el.getAttribute("data-part")!;
            el.removeAttribute("data-part");
            localParts[partName] = el;
            return localParts;
        },
        {});
    
    return parts;
}

async function renderTextResponse(container: HTMLElement, words: string[]) {
    let blockCursor = container.nextElementSibling;
    if (!blockCursor) {
        // Faux cursor that goes at the end
        blockCursor = document.createElement("span");
        blockCursor.classList.toggle("chat-block-cursor", true);
        blockCursor.textContent = "";
        container.parentElement?.appendChild(blockCursor);
    }

    while (words.length > 0) {
        const word = words.shift();
        container.textContent += `${word}${words.length > 0 ? ' ' : ''}`;

        container.offsetParent?.scrollTo(0, container.offsetTop + container.offsetHeight);

        await delay(74);        
    }

    blockCursor.remove();
}

async function renderMessagePartToContainer(container: HTMLElement, messageToPrint: IMessageElement) {
    const cannedResponseContainer = messageToPrint.el ? document.createElement(messageToPrint.el) : container;
    if (container !== cannedResponseContainer) {
        container.appendChild(cannedResponseContainer);
    }

    if (typeof messageToPrint.content === "string") {
        // Actual content wrapper
        const text = document.createElement("span");
        cannedResponseContainer.appendChild(text);
        await renderTextResponse(text, messageToPrint.content.split(" "));
    } else if (messageToPrint.content instanceof Array) {
        for (const child of messageToPrint.content) {
            await renderMessagePartToContainer(cannedResponseContainer, child);
        }
    }
}

async function renderAnswerResponse(container: HTMLElement, messagesToPrint: IMessageElement[]) {
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
    var textWrapper = document.createElement("div")
    textWrapper.classList.toggle("chat-text", true);
    answerWrapper.appendChild(textWrapper);

    container.appendChild(answerContainer);
    for (const messageToPrint of messagesToPrint) {
        await renderMessagePartToContainer(textWrapper, messageToPrint);
    }
}

function renderQuestion(container: HTMLElement, question: string) {
    const questionContainer = document.createElement("div");
    questionContainer.classList.toggle("chat-question", true);

    const wrapper = document.createElement("div");
    questionContainer.appendChild(wrapper);
    const avatar = document.createElement("div");

    // Avatar
    avatar.classList.toggle("chat-avatar-asker", true);
    wrapper.appendChild(avatar);

    // Text Response Container
    var textWrapper = document.createElement("div")
    textWrapper.classList.toggle("chat-text", true);
    textWrapper.textContent = question;
    wrapper.appendChild(textWrapper);

    container.appendChild(questionContainer);
}

function submitQuestion(e: Event) {
    const question = entryInput.value;
    entryInput.value = "";
    
    renderQuestion(chatResponse, question);

    renderAnswerResponse(chatResponse, message[1]);
    e.preventDefault();
    return false;
}

function renderHistoryItem(container: HTMLDivElement, question: string) {
    const stuff = cloneIntoWithPartsFromName<{ question: HTMLDivElement; interactive: HTMLAnchorElement }>("history-template", container);
    stuff.question.textContent = question;
    stuff.interactive.addEventListener("click", () => renderQuestion(chatResponse, question));
}

const entryForm = document.querySelector("form[data-id='entry-form'") as HTMLFormElement;
const entryInput = document.querySelector("input[data-id='question-input']") as HTMLInputElement;
const chatResponse = document.querySelector(".chat-response > .chat-scroller") as HTMLDivElement;
const chatHistory = document.querySelector(".chat-history") as HTMLDivElement;

entryForm.addEventListener("submit", submitQuestion);
entryInput.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key !== "Enter") {
        return;
    }
    submitQuestion(e);
});

for (const q of questions) {
    renderHistoryItem(chatHistory, q);
}