import { parse } from "./csv-parser/index.js";

const reader = new FileReader();
const TITLE=1, AUTHOR=2, RATING=8, NUMPAGES=11, YEARPUBLISHED=12, READ=14, DATEADDED=15, SHELVES=16;
var numBooks, timePeriod, rating, shelves;

document.getElementById("submitButton").addEventListener("click", generate, false);

// Change button text when a selection from the dropdown menu is made
$(function(){
    $(".dropdown-menu li a").click(function(){
        var myButton = $(this).parents(".dropdown").find('.btn');
        myButton.html($(this).text());
        myButton.val($(this).data('value'));
    });
});

function determineTimePeriod(str){

    var today = new Date();
    var year = today.getFullYear(), month = today.getMonth(), day = today.getDay();

    switch(str){

        case "Past month":
            if(month == 0){
                year--;
                month = 11;
            } else{
                month--;
            }
            break;
        case "Past 3 months":
            if(month <= 2){
                year--;
                month = 12+(month-3);
            } else{
                month-=3;
            }
            break;
        case "Past 6 months":
            if(month <= 5){
                year--;
                month = 12+(month-6);
            } else{
                month-=6;
            }
            break;
        case "Past year":
            year--;
            break;
        case "All time":
            year = 1970;
            month = 0;
            day = 0;
            break;
    }

    return new Date(year, month, day);

}

function determineRating(str){

    var rating;
    switch(str){

        case "3 stars+":
            rating = 3;
            break;
        case "4 stars+":
            rating = 4;
            break;
        case "5 stars":
            rating = 5;
            break;
        case "Any":
            rating = 0;
            break;
    }

    return rating;


}

function printBookInfo(array){

    var str = array[TITLE] + " by " + array[AUTHOR];
    return str;

}

// Taken from https://archive.ph/uCvft
function createList(array) {

    // Create the list element:
    var list = document.createElement('ol');

    for (var i = 0; i < array.length; i++) {
        // Create the list item:
        var item = document.createElement('li');

        // Set its contents:
        item.appendChild(document.createTextNode(printBookInfo(array[i])));

        // Add it to the list:
        list.appendChild(item);
    }

    // Finally, return the constructed list:
    return list;
}

function processCSV(){
    
    // Parse CSV
    var booksCSV_string = reader.result;
    var parsedCSV = parse(booksCSV_string);

    // Generate list of random books
    var bookArray = [];
    var encounteredNumbers = new Map();

    for(var i = 0; i < numBooks; i++){

        // TODO: Add a check to see if there are enough books within the specified criteria

        // Pick a random number within the range of books
        var randomNumber = Math.floor((Math.random() * (parsedCSV.length-1)) + 1); 
        var selectedBook = parsedCSV[randomNumber]; // Get random book

        // Check if book meets specified criteria
        var dateString = selectedBook[DATEADDED].split('/');
        var dateAdded = new Date(dateString[0], dateString[1], dateString[2]);
        var dateLimit = determineTimePeriod(timePeriod);
        const withinDateRange = dateAdded > dateLimit;
    
        const read = selectedBook[READ] !== "";
        const withinRating = selectedBook[RATING] >= determineRating(rating);

        const outsideOfCriteria = !withinDateRange || read || !withinRating;

        // Make sure we didn't already use this random number
        // and that the book is within the specified criteria
        if(encounteredNumbers.get(randomNumber) || outsideOfCriteria){ 
            i--;
            continue;
        } else {
            bookArray.push(selectedBook); // Add to array of books
            encounteredNumbers.set(randomNumber, true);
        }
    }

    console.log(bookArray);

    // Add list to HTML
    var listDiv = document.getElementById("bookList");
    listDiv.innerHTML = "";
    listDiv.appendChild(createList(bookArray));

}

function generate(){
    
    let booksCSV = document.getElementById("csv").files[0]; // Input file

    // Initialize criteria
    let criteriaForm = document.forms["criteria"];
    numBooks = criteriaForm["numBooks"].value; 
    timePeriod = document.getElementById("recency").innerHTML; 
    rating = document.getElementById("rating").innerHTML;
    shelves = criteriaForm["fiction"].value;

    // TODO: add function to validate inputs

    console.log("You passed: " + numBooks + ", " + timePeriod + ", " + rating + ", " + booksCSV.name);

    // Parse the input file
    if(booksCSV){
        reader.addEventListener("load", processCSV, false);
        reader.readAsText(booksCSV);
    }

}