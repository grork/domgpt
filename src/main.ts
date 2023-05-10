interface IMessageElement {
    el: string;
    href?: string;
    content: String | IMessageElement[];
}

interface ITutorial {
    examples: string[],
    capabilities: string[],
    limitations: string[]
}

interface IResponse {
    keywords: string[];
    messages: IMessageElement[]
}

interface IPersona {
    questions: IQuestion[];
    tutorial: ITutorial;
    responses: IResponse[]
}

interface IQuestion {
    id: string;
    text: string;
}

let responses: { [details: string]: IMessageElement[]; } = {};

let persona: IPersona = {
    questions: [],
    tutorial: {
        examples: [],
        capabilities: [],
        limitations: []
    },
    responses: []
}

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

        await delay(50);
    }

    blockCursor.remove();
}

async function renderMessagePartToContainer(container: HTMLElement, messageToPrint: IMessageElement) {
    const cannedResponseContainer = messageToPrint.el ? document.createElement(messageToPrint.el) : container;
    if (container !== cannedResponseContainer) {
        container.appendChild(cannedResponseContainer);
    }

    if (messageToPrint.href) {
        cannedResponseContainer.setAttribute("target", "_blank");
        cannedResponseContainer.setAttribute("href", messageToPrint.href);
    }

    if (typeof messageToPrint.content === "string") {
        if (messageToPrint.el === "img") {
            (<HTMLImageElement>cannedResponseContainer).src = messageToPrint.content;
        } else {
            // Actual content wrapper
            const text = document.createElement("span");
            cannedResponseContainer.appendChild(text);
            await renderTextResponse(text, messageToPrint.content.split(" "));
        }
    } else if (messageToPrint.content instanceof Array) {
        for (const child of messageToPrint.content) {
            await renderMessagePartToContainer(cannedResponseContainer, child);
        }
    }
}

async function renderAnswerResponse(container: HTMLElement, messagesToPrint: IMessageElement[]) {
    const answerParts: { response: HTMLDivElement } = cloneIntoWithPartsFromName("response-template", container);

    for (const messageToPrint of messagesToPrint) {
        await renderMessagePartToContainer(answerParts.response, messageToPrint);
    }
}

function findFirstMatchinResponse(question: string): IMessageElement[] {
    question = question.replace(/[^\w\s]/i, "").toLocaleLowerCase();
    const parts = question.split(" ");

    for (const p of parts) {
        const response = responses[p];
        if (response) {
            return response;
        }
    }

    return [
        {
            el: "p",
            content: "I dunno mate. Did you try turning it on and off again?"
        }
    ]
}

function renderQuestion(container: HTMLElement, question: string) {
    const questionWrapper: { question: HTMLDivElement } = cloneIntoWithPartsFromName("question-template", container);

    questionWrapper.question.textContent = question;
}

function submitQuestion(question: string) {
    if (chatResponse.firstElementChild?.hasAttribute("data-placeholder")) {
        chatResponse.innerHTML = "";
    }

    renderQuestion(chatResponse, question);

    const response = findFirstMatchinResponse(question);

    renderAnswerResponse(chatResponse, response);
}

function renderHistoryItem(container: HTMLDivElement, question: string) {
    const stuff = cloneIntoWithPartsFromName<{ question: HTMLDivElement; interactive: HTMLAnchorElement }>("history-template", container);
    stuff.question.textContent = question;
    stuff.interactive.addEventListener("click", () => {
        submitQuestion(question);
    });
}

function getAndClearQuestion(): string {
    var question = entryInput.value;
    entryInput.value = "";
    return question;
}

function renderExamples(container: HTMLDivElement) {
    function getExampleElement(text: string): HTMLElement {
        const itemElement = document.createElement("div");
        itemElement.classList.toggle("chat-example-item", true);
        itemElement.textContent = text;

        return itemElement;
    }

    container.innerHTML = "";
    const parts: {
        examples: HTMLDivElement,
        capabilities: HTMLDivElement,
        limitations: HTMLDivElement
    } = cloneIntoWithPartsFromName("examples-template", container);

    for (const item of persona.tutorial.examples) {
        parts.examples.appendChild(getExampleElement(item));
    }
    for (const item of persona.tutorial.capabilities) {
        parts.capabilities.appendChild(getExampleElement(item));
    }
    for (const item of persona.tutorial.limitations) {
        parts.limitations.appendChild(getExampleElement(item));
    }
}

const entryForm = document.querySelector("form[data-id='entry-form'") as HTMLFormElement;
const newChat = document.querySelector("a[data-id='new-chat']") as HTMLAnchorElement;
const entryInput = document.querySelector("input[data-id='question-input']") as HTMLInputElement;
const chatResponse = document.querySelector(".chat-response > .chat-scroller") as HTMLDivElement;
const chatHistory = document.querySelector(".chat-history") as HTMLDivElement;

entryForm.addEventListener("submit", (e: SubmitEvent) => {
    e.preventDefault();

    submitQuestion(getAndClearQuestion());

    return false;
});

entryInput.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key !== "Enter") {
        return;
    }

    e.preventDefault();
    submitQuestion(getAndClearQuestion());
});

newChat.addEventListener("click", () => {
    renderExamples(chatResponse);
    entryInput.value = "";
});


const params = new URLSearchParams(window.location.search);
let personaFile = params.get("persona");
if (!personaFile) {
    personaFile = "example";
}

try {
    let request = await fetch(`/personas/${personaFile}.json`);
    persona = await request.json();
} catch (e) { }

for (const q of persona.questions) {
    renderHistoryItem(chatHistory, q.text);
}

for (const r of persona.responses) {
    for (const k of r.keywords) {
        responses[k] = r.messages;
    }
}

const requestedQuestion = params.get("q");
const cannedQuestion = persona.questions.find((q) => q.id === requestedQuestion)

if (cannedQuestion) {
    submitQuestion(cannedQuestion.text);
} else {
    renderExamples(chatResponse);
}