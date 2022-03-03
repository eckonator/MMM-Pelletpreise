/* global Module */

/* Magic Mirror
 * Module: MMM-Pelletpreise
 *
 * By Markus Eckert https://github.com/eckonator/
 * MIT Licensed.
 */

Module.register("MMM-Pelletpreise", {

    jsonData: [],

    apiUrl: '',

    defaults: {
        country        : 'DE',  // DE | AT | CH
        updateInterval : 86400000, // 1 day in milliseconds
        width          : 1200,   // width in pixel
        height         : 800    // height in pixel
    },

    getScripts: function() {
		return ["modules/" + this.name + "/node_modules/chart.js/dist/chart.min.js"];
	},

	start: function() {
        this.getJson();
        setTimeout(function () {
            this.getJson();
        }, 60000);
        this.scheduleUpdate();
        this.config = Object.assign({}, this.defaults, this.config);
		Log.info("Starting module: " + this.name);
	},

    scheduleUpdate: function () {
        var self = this;
        setInterval(function () {
            self.getJson();
        }, this.config.updateInterval);
    },

    // Request node_helper to get json from url
    getJson: function () {
        switch (this.config.country) {
            case "DE":
                var countryID = 1;
                break;
            case "AT":
                var countryID = 2;
                break;
            case "CH":
                var countryID = 3;
                break;
            default:
                var countryID = 1;
        }
        this.apiUrl = 'https://www.heizpellets24.de/ChartHandler.ashx?ProductId=1&CountryId=' + countryID + '&chartMode=3&defaultRange=false';
        this.sendSocketNotification("MMM-Pelletpreise_GET_JSON", this.apiUrl);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "MMM-Pelletpreise_JSON_RESULT") {
            // Only continue if the notification came from the request we made
            // This way we can load the module more than once
            this.updateDom();
            if (payload.url === this.apiUrl) {
                this.jsonData = payload.data;
                this.updateDom(this.config.updateInterval);
            }
        }
    },

	getDom: function() {
        // Create wrapper element
        const wrapperEl = document.createElement("div");
        wrapperEl.setAttribute("style", "position: relative; display: inline-block;");

        var currentYearData = [];
        var currentTime = new Date();
        var currentYear = currentTime.getFullYear()

        var days = [];
        var euros = [];

        //console.log(this.jsonData);

        for (var i = 0; i < this.jsonData.length; i++){
            var obj = this.jsonData[i];
            for (var key in obj){
                var date = new Date(obj['date']);
                if(date.getFullYear() === currentYear) {
                    currentYearData.push(obj);
                }
            }
        }

        //console.log(currentYearData);

        for (var i = 0; i < currentYearData.length; i++){
            var obj = currentYearData[i];
            for (var key in obj){
                var value = obj[key];
                //console.log(key + ": " + value);
                if(key === 'date') {
                    //console.log(key + ": " + value);
                    var date = new Date(value);

                    var month = date.getMonth() + 1;
                    var day = date.getDate();

                    month = (month < 10 ? "0" : "") + month;
                    day = (day < 10 ? "0" : "") + day;

                    //days.push(day + "." + month + "." + date.getFullYear());
                    days.push(day + "." + month);
                }
                if(key === 'value') {
                    euros.push(value);
                }
            }
        }

        var chartConfig = {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Euro / To.',
                    data: euros,
                    fill: true,
                    backgroundColor: 'rgb(255, 255, 255, .3)',
                    borderColor: 'rgb(255, 255, 255)'
                }]
            },
            options: {
                responsive: true,
                plugins: {  // 'legend' now within object 'plugins {}'
                    legend: {
                        labels: {
                            color: "white"
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: "white"
                        }
                    },
                    y: {
                        ticks: {
                            color: "white",
                            // Include a dollar sign in the ticks
                            callback: function(value, index, ticks) {
                                return value + '€';
                            }
                        }
                    }
                }
            }
        }

        // Create chart canvas
        const chartEl  = document.createElement("canvas");        

        // Init chart.js
        this.chart = new Chart(chartEl.getContext("2d"), chartConfig);
		
        // Set the size
        chartEl.width  = this.config.width;
        chartEl.height = this.config.height;
        chartEl.setAttribute("style", "display: block;");

        // Append chart
        wrapperEl.appendChild(chartEl);

		return wrapperEl;
	}
});
