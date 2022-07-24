import { parse } from "./csv-parser/index.js";

const reader = new FileReader();
const TITLE=1, AUTHOR=2, RATING=8, NUMPAGES=11, YEARPUBLISHED=12, DATEADDED=15, SHELVES=16;

document.getElementById("submitButton").addEventListener("click", generate, false);

// Change button text when a selection from the dropdown menu is made
$(function(){
    $(".dropdown-menu li a").click(function(){
        var myButton = $(this).parents(".dropdown").find('.btn');
        myButton.html($(this).text());
        myButton.val($(this).data('value'));
    });
});

function processCSV(){
    
    var booksCSV_string = reader.result;
    var parsedCSV = parse(booksCSV_string);
    console.log(parsedCSV);

}

function generate(){
    
    let booksCSV = document.getElementById("csv").files[0]; // Input file

    // Initialize criteria
    let criteriaForm = document.forms["criteria"];
    let numBooks = criteriaForm["numBooks"].value; 
    let timePeriod = document.getElementById("recency").innerHTML; 
    let rating = document.getElementById("rating").innerHTML;
    console.log("You passed: " + numBooks + ", " + timePeriod + ", " + rating + ", " + booksCSV.name);

    // Parse the input file
    if(booksCSV){
        reader.addEventListener("load", processCSV, false);
        reader.readAsText(booksCSV);
    }

}