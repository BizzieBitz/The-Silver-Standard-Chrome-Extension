// Function to convert the prices
function convertPrices() {
    var pattern = /^\$(\d{1,3},?)+(\.\d{1,2})?$/;
    var elements = document.querySelectorAll("*");
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        if(pattern.test(element.textContent)){
            var originalText = element.textContent;
            var price = parseFloat(element.textContent.replace('$','').replace(',',''));
            var silverPrice = price * exchangeRate;
            element.textContent = silverPrice.toFixed(2) + " oz";
            element.setAttribute("data-original", originalText);
            element.setAttribute("data-silver", silverPrice.toFixed(2) + " oz");
            element.addEventListener("mouseover", function(event) {
                event.target.textContent = event.target.getAttribute("data-original");
            });
            element.addEventListener("mouseout", function(event) {
                event.target.textContent = event.target.getAttribute("data-silver");
            });
        }
    }
}

// API key from Open Exchange Rates
var app_id = 'YOUR_API_KEY';

// Check for stored exchange rate in chrome.storage.local
chrome.storage.local.get(['exchangeRate', 'exchangeRateTimestamp'], function(result) {
    var currentTimestamp = Date.now();
    if (result.exchangeRate && currentTimestamp - result.exchangeRateTimestamp < 3600*1000) {
        // Use stored exchange rate
        exchangeRate = result.exchangeRate;
        convertPrices();
    } else {
        // Fetch exchange rate from API
        fetch(`https://openexchangerates.org/api/latest.json?app_id=${app_id}&base=USD`)
            .then(response => response.json())
            .then(data => {
                if (data && data.rates && data.rates.XAG) {
                    // Store exchange rate and timestamp in chrome.storage.local
                    chrome.storage.local.set({'exchangeRate': data.rates.XAG, 'exchangeRateTimestamp': currentTimestamp});
                    exchangeRate = data.rates.XAG;
                    convertPrices();
                } else {
                    console.error("Error: Exchange rate data not found in API response");
                }
            })
            .catch(error => console.error(error));
    }
});

// Schedule to update the exchange rate every hour
setInterval(function() {
    chrome.storage.local.get(['exchangeRate', 'exchangeRateTimestamp'], function(result) {
        var currentTimestamp = Date.now();
        if (currentTimestamp - result.exchangeRateTimestamp >= 3600*1000) { // 3600*1000 is the number of milliseconds in 1 hour
            // Fetch exchange rate from API
            fetch(`https://openexchangerates.org/api/latest.json?app_id=${app_id}&base=USD`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.rates && data.rates.XAG) {
                        // Store exchange rate and timestamp in chrome.storage.local
                        chrome.storage.local.set({'exchangeRate': data.rates.XAG, 'exchangeRateTimestamp': currentTimestamp});
                        exchangeRate = data.rates.XAG;
                        convertPrices();
                    } else {
                        console.error("Error: Exchange rate data not found in API response");
                    }
                })
                .catch(error => console.error(error));
        }
    });
}, 3600*1000);

