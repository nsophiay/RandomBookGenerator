import { parse } from "./csv-parser/index.js";

const reader = new FileReader();
const ID=0, TITLE=1, AUTHOR=2, RATING=8, NUMPAGES=11, YEARPUBLISHED=12, READ=14, DATEADDED=15, SHELVES=16;
var parsedCSV;
var numBooks, timePeriod, rating;
var numPagesMin, numPagesMax;
var optionalShelves = [], mandatoryShelves = [], shelves = [];

document.getElementById("csv").addEventListener("input", () => {
            reader.addEventListener("load", processCSV, false);
            reader.readAsText(document.getElementById("csv").files[0]);
}, false);

document.getElementById("submitButton").addEventListener("click", getCriteria, false);

// Enable tooltips
$(document).ready(function() {
    $("body").tooltip({ selector: '[data-toggle=tooltip]' });
});

// Change button text when a selection from the dropdown menu is made
$(function(){
    $(".dropdown-menu li a").click(function(){
        var myButton = $(this).parents(".dropdown").find('.btn');
        myButton.html($(this).text());
        myButton.val($(this).data('value'));
    });
});

function pickRandomNumber(lowerBound, upperBound){
   return Math.floor((Math.random() * upperBound) + lowerBound)
}

function determineTimePeriod(selectedPeriod) {

    var today = new Date();
    
    switch (selectedPeriod) {
        case "Past month":
            today.setMonth(today.getMonth() - 1);
            break;
        case "Past 3 months":
            today.setMonth(today.getMonth() - 3);
            break;
        case "Past 6 months":
            today.setMonth(today.getMonth() - 6);
            break;
        case "Past year":
            today.setFullYear(today.getFullYear() - 1);
            break;
        default:
            return new Date(1970, 0, 1); // January 1, 1970
    }

    console.log("Searching for books after " + today.toDateString());
    return new Date(today);
}

function determineRating(ratingCriteria){

    var rating;
    switch(ratingCriteria){

        case "3+ stars":
            rating = 3;
            break;
        case "4+ stars":
            rating = 4;
            break;
        default:
            rating = 0;
            break;
    }

    return rating;

}

function printBookInfo(books){

    return books[TITLE] + " by " + books[AUTHOR];

}


// Taken from https://archive.ph/uCvft
function createList(array) {

    var url = "https://www.goodreads.com/book/show/";

    // Create the list element
    let list = document.createElement('ol');

    for (let i = 0; i < array.length; i++) {

        let book = array[i];
        let auth = " by " + book[AUTHOR];
        let fullURL = url + book[ID];

        // Create the list item
        let item = document.createElement('li');

        // Create the link item
        let link = document.createElement('a');
        link.setAttribute("href", fullURL);
        link.setAttribute("target", "_blank");
        // Set up tooltip
        link.setAttribute("data-toggle", "tooltip");
        link.setAttribute("data-placement", "top");
        link.setAttribute("data-html", true);
        link.setAttribute("title", book[TITLE]);
        link.innerHTML = book[TITLE];

        item.appendChild(link);
        item.appendChild(document.createTextNode(auth));

        // Add it to the list:
        list.appendChild(item);
    }

    // Finally, return the constructed list:
    return list;
}

function createCheckboxes(formGroupID, array, identifier) {

    // Remove explanatory message if it exists
    const firstTime = document.getElementById("message") != null;
    if(firstTime){
        document.getElementById("message").remove();
    }
    
    // Create table
    var table = document.createElement('table');
    table.setAttribute("class", "shelfTables");
    var row;

    for (let i = 0; i < array.length; i++) {

        // Create a new row if the row is already full with 2 cells
        if(i%2==0){
            row = document.createElement('tr');
        }

        var cell = document.createElement('td');

        // Create the input element
        let input = document.createElement('input');
        input.setAttribute('type', 'checkbox');
        input.setAttribute('name', identifier);
        input.setAttribute('value', array[i]);

        // Create the label
        let label = document.createElement('label');
        label.setAttribute('for', array[i]);

        // Set its contents
        label.appendChild(document.createTextNode(array[i]));

        // Add it to the form group
        cell.appendChild(input);
        cell.appendChild(label);
        cell.appendChild(document.createElement('br'));

        row.appendChild(cell);
        if(i%2==0){
            table.appendChild(row);
        }
    }

    formGroupID.appendChild(table);

}

function createError(message){

    let errorDiv = document.createElement('div');
    errorDiv.setAttribute("class", "alert alert-danger alert-dismissible fade show");
    errorDiv.setAttribute("role", "alert");
    errorDiv.innerHTML = message;

    let closeButton = document.createElement('button');
    closeButton.setAttribute("type", "button");
    closeButton.setAttribute("class", "btn-close");
    closeButton.setAttribute("data-bs-dismiss", "alert");
    closeButton.setAttribute("aria-label", "Close");

    errorDiv.appendChild(closeButton);
    document.getElementById("errorSpot").appendChild(errorDiv);

}

function processCSV(){
    
    // Parse CSV
    var booksCSV_string = reader.result;
    parsedCSV = parse(booksCSV_string);

    var encounteredShelf = new Map();
    encounteredShelf.set("Bookshelves", true);
    encounteredShelf.set("to-read", true);
    encounteredShelf.set("currently-reading", true);
    encounteredShelf.set("abandoned", true);
    encounteredShelf.set("to-buy", true);
    encounteredShelf.set("books-to-re-read", true);
    encounteredShelf.set("have-re-read", true);

    shelves = []; // Make sure array is empty

    // Get list of distinct shelves
    for(var i = 0; i < parsedCSV.length; i++){

        let book = parsedCSV[i];
        let bookShelves = book[SHELVES].split(", ");

        // Loop through shelves the current book is in
        // Add the shelf to the array if we haven't seen it before
        for(var j = 0; j < bookShelves.length; j++){
            let shelf = bookShelves[j];
            if(!encounteredShelf.get(shelf) && shelf != ''){
                shelves.push(shelf);
                encounteredShelf.set(shelf, true);
            }
        }

    }

    console.log(shelves.toString());
    createCheckboxes(document.getElementById("shelfChoicesMandatory"), shelves, 'shelfCheckboxesM');
    createCheckboxes(document.getElementById("shelfChoices"), shelves, 'shelfCheckboxes');

}

function validateInputs(){

    var errorMessage;
    var noError = true;
    
    if(mandatoryShelves.some(elem => optionalShelves.includes(elem))){
        errorMessage = "A shelf that you specified in the ALL form has also been specified in the ANY form. Please fix this and try again.";
        noError = false;
    }
    else if((mandatoryShelves.includes("fiction") || optionalShelves.includes("fiction")) && mandatoryShelves.includes("non-fiction")){
        errorMessage = "You have specified two mutually exclusive shelves (fiction and non-fiction). Please fix this and try again.";
        noError = false;
    }
    else if((mandatoryShelves.includes("non-fiction") || optionalShelves.includes("non-fiction")) && mandatoryShelves.includes("fiction")){
        errorMessage = "You have specified two mutually exclusive shelves (fiction and non-fiction). Please fix this and try again.";
        noError = false;
    }

    if(!noError){
        createError(errorMessage);
    }
    
    return noError;

}

// This function will generate a list of books based on the specified criteria
function generateBooks(){

    var bookArray = [];
    var encounteredNumbers = new Map();
    let iteration = 0;

    while(bookArray.length < numBooks && iteration < parsedCSV.length){

        iteration++;

        // Pick a new random number within the range of books
        let randomNumber = pickRandomNumber(1, parsedCSV.length-1);
        if(encounteredNumbers.get(randomNumber)){
            randomNumber = Math.floor((Math.random() * (parsedCSV.length-1)) + 1);
        }
        encounteredNumbers.set(randomNumber, true);

        var selectedBook = parsedCSV[randomNumber]; // Get random book

        // Check if book meets specified criteria

        // Right date?
        var dateString = selectedBook[DATEADDED].split('/');
        var dateAdded = new Date(dateString[0], dateString[1] - 1, dateString[2]);
        var dateLimit = determineTimePeriod(timePeriod);
        const withinDateRange = dateAdded > dateLimit;
    
        // Already read?
        const read = selectedBook[READ] !== "";

        // Right rating?
        const withinRating = selectedBook[RATING] >= determineRating(rating);

        // Right number of pages?
        const withinPages = (selectedBook[NUMPAGES] >= numPagesMin) && (selectedBook[NUMPAGES] <= numPagesMax);

        // Right shelves?
        let bookShelves = selectedBook[SHELVES].split(", ");
        var checkMandatoryShelves = true, checkShelves = true;

        if(mandatoryShelves.length > 0){
            // Is the book in every shelf marked as mandatory?
            checkMandatoryShelves = mandatoryShelves.every(elem => bookShelves.includes(elem));
        }
        if(optionalShelves.length > 0){
            // Is the book in any of the shelves marked as optional?
            checkShelves = optionalShelves.some(elem => bookShelves.includes(elem));
        }
        const withinShelves = checkMandatoryShelves && checkShelves;
        
        const meetsCriteria = withinDateRange && (!read) && withinRating && withinPages && withinShelves;

        // Check if the book is within the specified criteria
        if(meetsCriteria && !bookArray.includes(selectedBook)){
            bookArray.push(selectedBook);
        }

    }

    console.log(bookArray);

    // Add list to HTML
    var listDiv = document.getElementById("bookList");
    listDiv.innerHTML = "";

    if(bookArray.length < numBooks){
        listDiv.innerHTML = "No books match this criteria. Please loosen your criteria and try again.";
    } else{
        listDiv.appendChild(createList(bookArray));
    }

}

// This function is called when you click the 'Generate books' button
// If a GoodReads input file has been uploaded, it will extract the criteria specified in the form
// and call a function that generates a list of random books based on that criteria
function getCriteria(){

    if(parsedCSV == null){
        createError("Please upload a GoodReads library in order to generate a list of books.");
        return;
    }

    // Initialize criteria

    let criteriaForm = document.forms["criteria"];
    numBooks = parseInt(criteriaForm["numBooks"].value); 
    timePeriod = document.getElementById("recency").innerHTML; 
    rating = document.getElementById("rating").innerHTML;

    numPagesMin = parseInt(document.getElementById("slider-1").value);
    numPagesMax = parseInt(document.getElementById("slider-2").value);

    let mandatoryShelvesNodeList = document.querySelectorAll('input[name=shelfCheckboxesM]:checked');
    mandatoryShelves = [];
    for (const value of mandatoryShelvesNodeList.values()) {
        mandatoryShelves.push(value.getAttribute("value"));
    }

    let optionalShelvesNodeList = document.querySelectorAll('input[name=shelfCheckboxes]:checked');
    optionalShelves = [];
    for (const value of optionalShelvesNodeList.values()) {
        optionalShelves.push(value.getAttribute("value"));
    }

    if(validateInputs()){
        console.log("You passed: " + numBooks + ", " + timePeriod + ", " + rating + ", " + optionalShelves.toString() + ", num pages: " + numPagesMin + "-" + numPagesMax);
        generateBooks();
    }

}
