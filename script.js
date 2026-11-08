const input = document.getElementById('inpt');
const input2 = document.getElementById('inpt2');

let isAnimating = false;
let currentStep = 0;
let currentSimulation = null;

const resultsTableHeader = document.getElementById('resultsTableHeader');
const resultsTableBody = document.getElementById('resultsTableBody');

const results = document.getElementById('results');
const resultsTable = document.getElementById('simulation_results');
const stats = document.getElementById('statistics');
const emptyState = document.getElementById('emptyState');

const simulateBtn = document.querySelector('.simulatebtn');
const resetBtn = document.querySelector('.reset');

const topics = document.querySelectorAll('.topics');

const simulate = document.querySelector('.simulate');

const aboutSection = document.getElementById('aboutSection');

const simulationTopic = document.getElementById('simulationTopic');
// const aboutTopic = document.getElementById('aboutTopic');
// const contiguousTopic = document.getElementById('contiguousTopic');
// const nonContiguousTopic = document.getElementById('nonContiguousTopic');
const aboutTopic = document.getElementById('aboutTopic');
// const contiguousTopic = document.getElementById('contiguousTopic');
// const nonContiguousTopic = document.getElementById('nonContiguousTopic');

topics.forEach(topic => {

    topic.addEventListener('click', function () {

        // Remove active class from all sidebar options
        topics.forEach(item => {
            item.classList.remove('active_topic');
        });

        // Add active class to clicked option
        this.classList.add('active_topic');

        // Simulation section
        if (this === simulationTopic) {

            simulate.style.display = 'block';
            aboutSection.style.display = 'none';

        }

        else if(this === aboutTopic){
            simulate.style.display = 'none';
            aboutSection.style.display = 'block';
        }

        // // Other sections currently have no content
        // else {

        //     simulate.style.display = 'none';
        //     aboutSection.style.display = 'none';
        // }

    });

});

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getReferenceString() {

    const arr = input.value
        .trim()
        .split(/[,\s]+/)
        .filter(x => x !== "")
        .map(Number);

    return arr;
}

function generateVirtualMemory(referenceString) {

    const diskBlocks = document.querySelectorAll('.disk_block');

    const maxPage = Math.max(...referenceString);

    diskBlocks.forEach((block, index) => {

        if (index <= maxPage) {
            block.textContent = `P${index}`;
            block.style.display = "flex";
            block.dataset.page = index;
        }
        else {
            block.textContent = "";
            block.style.display = "none";
            block.dataset.page = "";
        }

    });
}

function highlightCurrentPage(page) {

    const logicalPages =
        document.querySelectorAll('.logical_page');

    const diskBlocks =
        document.querySelectorAll('.disk_block');

    // Remove previous highlights
    logicalPages.forEach(element => {
        element.classList.remove('active_page');
    });

    diskBlocks.forEach(element => {
        element.classList.remove('active_page');
    });

    // Highlight logical page
    if (logicalPages[page]) {
        logicalPages[page].classList.add('active_page');
    }

    // Highlight virtual memory page
    diskBlocks.forEach(block => {

        if (Number(block.dataset.page) === page) {
            block.classList.add('active_page');
        }

    });
}

function generateLogicalMemory(referenceString) {

    const logicalMemory = document.getElementById('logicalMemory');

    logicalMemory.innerHTML = "";

    const maxPage = Math.max(...referenceString);

    const numberOfPages = maxPage + 1;

    for (let i = 0; i < numberOfPages; i++) {

        const page = document.createElement('div');

        page.className = 'logical_page';

        page.textContent = `Page ${i}`;

        logicalMemory.appendChild(page);
    }
}

function generatePageTable(referenceString) {

    const pageTableBody = document.getElementById('pageTableBody');

    pageTableBody.innerHTML = "";

    const maxPage = Math.max(...referenceString);

    const numberOfPages = maxPage + 1;

    for (let i = 0; i < numberOfPages; i++) {

        const row = document.createElement('div');

        row.className = 'page_table_row';

        row.innerHTML = `
            <div>${i}</div>
            <div>-</div>
        `;

        pageTableBody.appendChild(row);
    }
}

function generatePhysicalMemory(numberOfFrames) {

    const physicalMemory = document.getElementById('physicalMemory');

    physicalMemory.innerHTML = "";

    for (let i = 0; i < numberOfFrames; i++) {

        const frame = document.createElement('div');

        frame.className = 'physical_frame';

        frame.innerHTML = `
            <span>Frame ${i}</span>
            <div>-</div>
        `;

        physicalMemory.appendChild(frame);
    }
}

function updatePhysicalMemory(frames) {

    const physicalFrames =
        document.querySelectorAll('.physical_frame div');

    physicalFrames.forEach((frameElement, index) => {

        if (frames[index] === -1) {
            frameElement.textContent = "-";
        }
        else {
            frameElement.textContent = `Page ${frames[index]}`;
        }

    });
}

function simulateFIFO(referenceString, frameCount) {

    const frames = new Array(frameCount).fill(-1);

    let fifoPointer = 0;

    let pageFaults = 0;
    let pageHits = 0;

    const simulation = [];


    referenceString.forEach((page) => {

        let status;

        if (frames.includes(page)) {

            pageHits++;

            status = "Page Hit";

        }
        else {

            pageFaults++;

            status = "Page Fault";

            frames[fifoPointer] = page;

            fifoPointer =
                (fifoPointer + 1) % frameCount;
        }


        simulation.push({
            page: page,
            frames: [...frames],
            status: status
        });

    });


    return {
        simulation,
        pageFaults,
        pageHits
    };
}

function simulateLRU(referenceString, frameCount) {

    const frames = new Array(frameCount).fill(-1);

    const lastUsed = new Map();

    let pageFaults = 0;
    let pageHits = 0;

    const simulation = [];


    referenceString.forEach((page, index) => {

        let status;

        if (frames.includes(page)) {

            pageHits++;

            status = "Page Hit";

            // Page was just used
            lastUsed.set(page, index);

        }

        else {

            pageFaults++;

            status = "Page Fault";


            // Look for empty frame
            const emptyFrameIndex = frames.indexOf(-1);


            if (emptyFrameIndex !== -1) {

                // Empty frame exists
                frames[emptyFrameIndex] = page;

            }

            else {

                // Find least recently used frame

                let lruFrameIndex = 0;

                let oldestTime = Infinity;


                for (let i = 0; i < frameCount; i++) {

                    const pageInFrame = frames[i];

                    const usedTime =
                        lastUsed.get(pageInFrame);


                    if (usedTime < oldestTime) {

                        oldestTime = usedTime;

                        lruFrameIndex = i;
                    }
                }


                // Replace LRU page
                frames[lruFrameIndex] = page;
            }


            // Record usage time
            lastUsed.set(page, index);
        }


        simulation.push({
            page: page,
            frames: [...frames],
            status: status
        });

    });


    return {
        simulation,
        pageFaults,
        pageHits
    };
}

function simulateOptimal(referenceString, frameCount) {

    const frames = new Array(frameCount).fill(-1);

    let pageFaults = 0;
    let pageHits = 0;

    const simulation = [];


    // Process every page
    referenceString.forEach((page, index) => {

        let status;

        if (frames.includes(page)) {

            pageHits++;

            status = "Page Hit";

        }

        else {

            pageFaults++;

            status = "Page Fault";


            // Find an empty frame
            const emptyFrameIndex = frames.indexOf(-1);

            if (emptyFrameIndex !== -1) {

                frames[emptyFrameIndex] = page;

            }

            else {

                let pageToReplaceIndex = -1;

                let farthestUse = -1;


                // Check every page currently in memory
                for (let i = 0; i < frameCount; i++) {

                    const currentPage = frames[i];

                    let nextUse = -1;

                    for (
                        let j = index + 1;
                        j < referenceString.length;
                        j++
                    ) {

                        if (referenceString[j] === currentPage) {

                            nextUse = j;

                            break;
                        }
                    }

                    if (nextUse === -1) {

                        pageToReplaceIndex = i;

                        break;
                    }

                    if (nextUse > farthestUse) {

                        farthestUse = nextUse;

                        pageToReplaceIndex = i;
                    }
                }


                // Replace selected page
                frames[pageToReplaceIndex] = page;
            }
        }

        simulation.push({
            page: page,
            frames: [...frames],
            status: status
        });

    });


    return {
        simulation,
        pageFaults,
        pageHits
    };
}

function updatePageTable(frames) {

    const rows =
        document.querySelectorAll('.page_table_row');

    // First make every page invalid
    rows.forEach(row => {
        row.children[1].textContent = "-";
    });

    // Put each page in its current frame
    frames.forEach((page, frameIndex) => {

        if (page !== -1 && rows[page]) {
            rows[page].children[1].textContent =
                `Frame ${frameIndex}`;
        }

    });
}

function generateResultsTable(referenceString, frameCount, simulationResult) {

    resultsTableHeader.innerHTML = "";
    resultsTableBody.innerHTML = "";

    const stepHeader = document.createElement("th");
    stepHeader.textContent = "Step";
    resultsTableHeader.appendChild(stepHeader);


    const pageHeader = document.createElement("th");
    pageHeader.textContent = "Page";
    resultsTableHeader.appendChild(pageHeader);


    for (let i = 1; i <= frameCount; i++) {

        const frameHeader = document.createElement("th");

        frameHeader.textContent = `Frame ${i}`;

        resultsTableHeader.appendChild(frameHeader);
    }


    const statusHeader = document.createElement("th");

    statusHeader.textContent = "Page Status";

    resultsTableHeader.appendChild(statusHeader);

    simulationResult.simulation.forEach((step, index) => {

        const row = document.createElement("tr");


        // Step
        const stepCell = document.createElement("td");

        stepCell.textContent = index + 1;

        row.appendChild(stepCell);


        // Page
        const pageCell = document.createElement("td");

        pageCell.textContent = step.page;

        row.appendChild(pageCell);


        // Frames
        step.frames.forEach((frame) => {

            const frameCell = document.createElement("td");

            frameCell.textContent =
                frame === -1 ? "-" : frame;

            row.appendChild(frameCell);
        });


        // Status
        const statusCell = document.createElement("td");

        statusCell.textContent = step.status;


        if (step.status === "Page Fault") {

            statusCell.classList.add("page_fault");

        }
        else {

            statusCell.classList.add("page_hit");

        }


        row.appendChild(statusCell);


        resultsTableBody.appendChild(row);

    });

    const pageFaults = simulationResult.pageFaults;

    const pageHits = simulationResult.pageHits;

    const totalReferences = referenceString.length;


    document.getElementById("pageFaults").textContent =
        pageFaults;

    document.getElementById("totalReferences").textContent =
        totalReferences;


    const hitRatio =
        totalReferences === 0
            ? 0
            : (pageHits / totalReferences) * 100;


    document.getElementById("hitRatio").textContent =
        hitRatio.toFixed(2) + "%";
}

function generateResultsTableHeader(frameCount) {

    resultsTableHeader.innerHTML = "";
    resultsTableBody.innerHTML = "";

    const stepHeader = document.createElement("th");
    stepHeader.textContent = "Step";
    resultsTableHeader.appendChild(stepHeader);

    const pageHeader = document.createElement("th");
    pageHeader.textContent = "Page";
    resultsTableHeader.appendChild(pageHeader);

    for (let i = 1; i <= frameCount; i++) {

        const frameHeader = document.createElement("th");

        frameHeader.textContent = `Frame ${i}`;

        resultsTableHeader.appendChild(frameHeader);
    }

    const statusHeader = document.createElement("th");

    statusHeader.textContent = "Page Status";

    resultsTableHeader.appendChild(statusHeader);
}

function addResultRow(stepNumber, step) {

    const row = document.createElement("tr");

    // Step
    const stepCell = document.createElement("td");

    stepCell.textContent = stepNumber;

    row.appendChild(stepCell);


    // Page
    const pageCell = document.createElement("td");

    pageCell.textContent = step.page;

    row.appendChild(pageCell);


    // Frames
    step.frames.forEach(frame => {

        const frameCell = document.createElement("td");

        frameCell.textContent =
            frame === -1 ? "-" : frame;

        row.appendChild(frameCell);

    });


    // Status
    const statusCell = document.createElement("td");

    statusCell.textContent = step.status;

    if (step.status === "Page Fault") {

        statusCell.classList.add("page_fault");

    }
    else {

        statusCell.classList.add("page_hit");

    }

    row.appendChild(statusCell);

    resultsTableBody.appendChild(row);
}

async function animateSimulation(
    referenceString,
    frameCount,
    simulationResult
) {

    isAnimating = true;

    for (
        let i = 0;
        i < simulationResult.simulation.length;
        i++
    ) {

        const step =
            simulationResult.simulation[i];

        currentStep = i;

        // Highlight current page
        highlightCurrentPage(step.page);

        // Wait so user can see the selected page
        await delay(700);

        // Update physical memory
        updatePhysicalMemory(step.frames);

        // Update page table
        updatePageTable(step.frames);

        // Add this step to result table
        addResultRow(i + 1, step);

        // Wait before next reference
        await delay(800);
    }

    isAnimating = false;

    // Remove page highlighting
    document
        .querySelectorAll('.active_page')
        .forEach(element => {
            element.classList.remove('active_page');
        });

    // Show statistics only after simulation is complete
    stats.style.display = 'block';
}

function updateStatistics(
    simulationResult,
    totalReferences
) {

    const pageFaults =
        simulationResult.pageFaults;

    const pageHits =
        simulationResult.pageHits;

    document.getElementById("pageFaults").textContent =
        pageFaults;

    document.getElementById("totalReferences").textContent =
        totalReferences;

    const hitRatio =
        totalReferences === 0
            ? 0
            : (pageHits / totalReferences) * 100;

    document.getElementById("hitRatio").textContent =
        hitRatio.toFixed(2) + "%";
}

function validateInputs() {
    const refInput = document.getElementById("inpt").value.trim();
    const frameInput = document.getElementById("inpt2").value.trim();

    if (refInput === "") {
        alert("Please enter a reference string.");
        return false;
    }

    const values = refInput.split(/\s+/);

    const referenceString = values.map(Number);

    if (!referenceString.every(num =>
        Number.isSafeInteger(num) && num >= 0
    )) {
        alert("Reference string must contain only non-negative integers.");
        return false;
    }

    const frameCount = Number(frameInput);

    if (frameInput === "" ||
        !Number.isSafeInteger(frameCount) ||
        frameCount <= 0) {
        alert("Please enter a valid positive number of frames.");
        return false;
    }

    return {
        referenceString,
        frameCount
    };
}

simulateBtn.addEventListener('click', function () {
    const input = validateInputs();

    if (!input) return;

    const referenceString = getReferenceString();

    const numberOfFrames = Number(input2.value);

    if (
        referenceString.length === 0 ||
        input2.value === "" ||
        numberOfFrames <= 0
    ) {

        results.style.display = 'none';
        resultsTable.style.display = 'none';
        stats.style.display = 'none';

        emptyState.style.display = 'flex';

        return;
    }


    emptyState.style.display = 'none';

    results.style.display = 'block';
    resultsTable.style.display = 'block';
    stats.style.display = 'none';


    // Generate memory structures

    generateLogicalMemory(referenceString);

    generatePageTable(referenceString);

    generatePhysicalMemory(numberOfFrames);

    generateVirtualMemory(referenceString);

    const selectedAlgorithm =
        document.getElementById("algo").value;


    let simulationResult;


    if (selectedAlgorithm === "fifo") {

        simulationResult =
            simulateFIFO(referenceString, numberOfFrames);

    }

    else if (selectedAlgorithm === "lru") {

        simulationResult =
            simulateLRU(referenceString, numberOfFrames);

    }

    else if (selectedAlgorithm === "optimal") {

        simulationResult =
            simulateOptimal(referenceString, numberOfFrames);

    }

    generateResultsTableHeader(numberOfFrames);

    updateStatistics(
        simulationResult,
        referenceString.length
    );

    animateSimulation(
        referenceString,
        numberOfFrames,
        simulationResult
    );

});

resetBtn.addEventListener('click', function () {

    input.value = "";
    input2.value = "";

    results.style.display = 'none';
    emptyState.style.display = 'flex';
    resultsTable.style.display = 'none';
    stats.style.display = 'none';
});
