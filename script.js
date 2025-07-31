// Global variables
let activeResourceFields = [];

class ResourceField {

    constructor(type, appearTime, avgTime, devTime, tier) {
        this.type = type;
        this.min = 1;
        this.max = 1;
        this.appearTime = appearTime;
        this.endTime = 99999;
        this.numberOfItems = 0;  // Initialize numberOfItems, but it will be changed at runtime
        this.maxTime = avgTime + devTime;
        this.minTime = avgTime - devTime;
        this.timeToNext = 0;
        this.getNewTime();
        this.tier = tier;
    }

    // Function to add items based on normal distribution
    addItems() {
        // Generate a normally distributed number of items between min and max
        const mean = (this.min + this.max) / 2;
        const stdDev = (this.max - this.min) / 2;  // Standard deviation (spread)

        // Box-Muller transform to generate normally distributed numbers
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

        // Apply the distribution and round the result to the nearest integer
        let numItems = Math.round(mean + z0 * stdDev);

        // Ensure the number of items is between min and max
        numItems = Math.max(this.min, Math.min(this.max, numItems));

        // Add the calculated number of items to the field
        this.numberOfItems += numItems;
    }

    nextMinute(){
        this.timeToNext--;
        if(this.timeToNext == 0){
            this.numberOfItems++;
            this.getNewTime();
        }
    }

    getNewTime(){
        const mean = (this.minTime + this.maxTime) / 2;
        const stdDev = (this.maxTime - this.minTime) / 2;  // Standard deviation (spread)

        // Box-Muller transform to generate normally distributed numbers
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

        // Apply the distribution and round the result to the nearest integer
        let time = Math.round(mean + z0 * stdDev);

        // Ensure the number of items is between min and max
        time = Math.max(this.minTime, Math.min(this.maxTime, time));

        // Add the calculated number of items to the field
        this.timeToNext = time;
    }
}



//       Button functions
//---------------------------------------------
function startTime() {
    const input = document.getElementById("startTime");
    startTimeValue = input.value;
}

function siteNumber() {
    const input = document.getElementById("siteNumber");
    siteNumberValue = input.value;
}

function resourceType() {
    const input = document.getElementById("resourceType");
    resourceTypeValue = input.value;
}

function avgItems() {
    const input = document.getElementById("AvgItems");
    minTimeValue = input.value;
}

function devTime() {
    const input = document.getElementById("maxTime");
    maxTimeValue = input.value;
}

document.getElementById('addButton').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the form from submitting
    submit(); // Call your submit function
});

function submit() {
    // Retrieve the input values
    const resourceTypeValue = document.getElementById('resourceType').value;
    const avgTime = parseInt(document.getElementById('AvgTime').value, 10);
    const devTime = parseInt(document.getElementById('DevTime').value, 10);
    const tier = parseInt(document.getElementById('Tier').value, 10);
    

    // Create a new ResourceField using the form values
    const newResource = new ResourceField(resourceTypeValue, 0,avgTime,devTime,tier);

    // Add the new resource to the active fields array
    activeResourceFields.push(newResource);

    // Call the render function to update the display
    renderResources();
}

// Function to handle 'Start' button click
function Start() {
    const siteNumberValue =  1;
    const startTimeValue = document.getElementById('startTime').value;

    // Get the appropriate resource array based on site number
    const stationIndex = siteNumberValue - 1; // Adjust index for 0-based array
    const resourceArray = FieldLibrary[stationIndex];

    const now = new Date();
    const start = getDateFromTime(startTimeValue);

    // Calculate the time until the next whole minute
    const msUntilNextMinute = start-now;

    // Wait until the next minute to begin calling getCurrentFields
    setTimeout(() => {
        getCurrentFields(resourceArray); // First call immediately after timeout
        setInterval(() => {
            getCurrentFields(resourceArray); // Subsequent calls every minute
        }, 1000);
    }, msUntilNextMinute);
    alert("Start!");
}

//       General functions
//---------------------------------------------

function getGameTime() {
    // Get the value from the input field with ID 'startTime'
    const startTimeValue = document.getElementById('startTime').value;

    // Create Date objects for the start time and the current time
    const start = getDateFromTime(startTimeValue);
    const now = new Date();

    // Calculate the time difference in milliseconds
    const diffMs = now - start;

    // Convert milliseconds to minutes and round down
    return Math.floor(diffMs / 60000);
}

function getCurrentFields(array) {
    const currentTime = getGameTime();
    if (currentTime === null) return;

    // Remove fields that are no longer active
    activeResourceFields = activeResourceFields.filter(resource =>
        resource.appearTime <= currentTime &&
        (!resource.endTime || resource.endTime > currentTime)
    );

    // Find new resources to add
    const newResources = array.filter(resource =>
        resource.appearTime <= currentTime &&
        (!resource.endTime || resource.endTime > currentTime) &&
        !activeResourceFields.includes(resource)
    );

    // Add new active resources
    newResources.forEach(resource => {
        activeResourceFields.push(resource);
        resource.nextMinute(); // Only add items when newly activated
    });

    // Add items to existing active resources (excluding just-added)
    activeResourceFields.forEach(resource => {
        if (!newResources.includes(resource)) {
            resource.nextMinute();
        }
    });

    
    // Trigger rendering of updated resources
    renderResources();
}

function renderResources() {
    const container = document.getElementById('game-container');
    container.innerHTML = ''; // Clear previous content

    activeResourceFields.forEach(resource => {
        // Construct image path based on resource type
        const imageSrc = `images/${resource.type}.png`;

        // Create a container <div> for this resource field
        const resourceDiv = document.createElement('div');
        resourceDiv.className = `resource-field ${resource.type.toLowerCase()}`;

        // Add a <p> element showing the resource type (name)
        const nameElement = document.createElement('p');
        nameElement.textContent = resource.type +': '+resource.numberOfItems+", tier: "+resource.tier;
        resourceDiv.appendChild(nameElement);

        // Create and configure the canvas
        const canvas = document.createElement('canvas');
        const itemSize = 32;
        const canvasWidth = 320;
        const canvasHeight = 200;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = imageSrc;

        // Draw the image randomly for each item once the image loads
        img.onload = () => {
            for (let i = 0; i < resource.numberOfItems; i++) {
                const x = Math.random() * (canvasWidth - itemSize);
                const y = Math.random() * (canvasHeight - itemSize);
                ctx.drawImage(img, x, y, itemSize, itemSize);
            }
        };

        resourceDiv.appendChild(canvas);

        // Create Collect button
        const collectBtn = document.createElement('button');
        collectBtn.textContent = 'Collect';
        collectBtn.onclick = () => {
            alert(resource.numberOfItems + " surovin posbíráno");
            resource.numberOfItems = 0;
            renderResources(); // Refresh UI
        };
        resourceDiv.appendChild(collectBtn);

        // Create Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => {
            resource.endTime = 0;
            if(activeResourceFields.length == 1){
                activeResourceFields = [];
            }
            else{
                activeResourceFields = activeResourceFields.filter(r => r !== resource);
            }
            renderResources(); // Refresh UI
        };
        resourceDiv.appendChild(cancelBtn);

                // Create Cancel button
        const oneBtn = document.createElement('button');
        oneBtn.textContent = '+1';
        oneBtn.onclick = () => {
            resource.numberOfItems++;
            renderResources(); // Refresh UI
        };
        resourceDiv.appendChild(oneBtn);

        container.appendChild(resourceDiv);
    });
}

function getDateFromTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);

    const now = new Date();
    now.setHours(hours);
    now.setMinutes(minutes);
    now.setSeconds(0);
    now.setMilliseconds(0);

    return now;
}

// Library
//---------------------------------------------
// ResourceField(type, min, max, appearTime, endTime)
// - type:         The name of the resource (must match image file name)
// - min:          Minimum number of items to generate per interval
// - max:          Maximum number of items to generate per interval
// - appearTime:   Game time (in minutes) when the resource appears
// - endTime:      Game time (in minutes) when the resource disappears

const FieldLibrary = [
    [],                                         // Station 1
    [],                                       // Station 2
    []                                        // Station 3
];