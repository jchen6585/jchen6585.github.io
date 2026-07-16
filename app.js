const svg = d3.select("#chart");

const eras = ["Early", "Mid", "Curry", "All"];
let index = 0;
let data;
const width = window.innerWidth;
const height = window.innerHeight-20;
const paddingTop = 10;
const padding = 50;

const tooltip = d3.select("body")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("pointer-events", "none")

d3.select("#era-selection").on("change", function() {
    const value = this.value;
    index = eras.indexOf(value);
    render();
});

d3.select("#back-btn").on("click", function() {
    if (index > 0) {
        index--;
        updateDropdown();
        render();
    }
});

d3.select("#next-btn").on("click", function() {
    if (index < eras.length-1) {
        index++;
        updateDropdown();
        render();
    }
});

function updateDropdown() {
    document.getElementById("era-selection").value = eras[index];

}

async function initData() {
    try{
        const wholeData = await d3.csv("team_stats_per_game.csv");
        data = wholeData.filter(function(d) {
            return d.lg == "NBA" && 
            !isNaN(parseFloat(d.pts_per_game)) &&
            d.x3pa_per_game != "NA";
        })

        updateDropdown();
        render()
    } catch (err) {
        console.log(err);
    }

}

function render() {
    svg.selectAll("*").remove()

    svg.attr("width", width)
        .attr("height", height);

    const min3PA = d3.min(data, d => d.x3pa_per_game == "NA" ? 0 : parseFloat(d.x3pa_per_game));
    const max3PA = d3.max(data, d => d.x3pa_per_game == "NA" ? 0 : parseFloat(d.x3pa_per_game));
    const minPoints = d3.min(data, d => parseFloat(d.pts_per_game));
    const maxPoints = d3.max(data, d => parseFloat(d.pts_per_game));

    const x = d3.scaleLinear().domain([min3PA,max3PA]).range([padding,width-padding]);
    const y = d3.scaleLinear().domain([minPoints,maxPoints]).range([height-padding,paddingTop]);

    console.log(x.domain());
    console.log(y.domain());

    svg.append("g")
        .attr("transform", "translate(0," + (height - padding) + ")")
        .call(d3.axisBottom(x))
        .append("text")
        .attr("fill", "black")
        .attr("x", width / 2)
        .attr("y", 30)
        .style("font-size", "12px")
        .text("3-Point Field Goal Attempts Per Game")

    svg.append("g")
        .attr("transform", "translate(" + padding + ",0)")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("x", -height / 2)
        .attr("y", -30)
        .attr("transform", "rotate(-90)")
        .attr("fill", "black")
        .style("font-size", "12px")
        .text("Points Per Game")

    const circles = svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            return x(parseFloat(d.x3pa_per_game));
        })
        .attr("cy", function(d) {
            return y(parseFloat(d.pts_per_game))
        })
        .attr("r", 5)
        .attr("fill", function(d) {
            const year = parseInt(d.season)

            if (year < 2000) {
                return "red";
            } else if (year >= 2000 && year < 2013) {
                return "blue";
            }
            return "green";
        })
        .attr("opacity", function(d) {
            const year = parseInt(d.season)
            const activeEra = eras[index];
            if (activeEra == "All") {
                return 0.8;
            } else if (activeEra == "Early") {
                return (year < 2000) ? 0.8 : 0.1
            } else if (activeEra == "Mid") {
                return (year >= 2000 && year < 2013) ? 0.8 : 0.1
            } else {
                return (year >= 2013) ? 0.8 : 0.1
            }
        })

        circles.on("mouseover", function(event, d) {
            if (eras[index] != "All") return;
            tooltip.style("opacity", 1)
            d3.select(this)
                .style("stroke", "black")
                .style("opacity", 1)
        })
        .on("mousemove", function(event, d) {
            if (eras[index] != "All") return;
            tooltip.html(`<strong>${d.team}</strong> (${d.season})<br/>
                3-Point Attempts: ${d.x3pa_per_game}<br/>
                Total Points: ${d.pts_per_game}`)
            .style("left", (event.pageX+15)+ "px")
            .style("top", (event.pageY-15)+ "px")
        })
        .on("mouseleave", function(event, d) {
            if (eras[index] != "All") return;
            tooltip.style("opacity",0);
            d3.select(this)
                .style("stroke", "none")
                .style("opacity", 0.8)
        });
        
        let annotationData = [];

        if (eras[index] == "Early") {
            annotationData = [{
                note: {
                    title: "The Early Years (1980-1999)",
                    label: "Despite it's introduction, the 3-pointer was ignored early on. Teams shot at most roughly 20 per game. Due to lack of proper defensive tactics however, points per game were still relatively high.",
                    wrap: "300"
                },
                x: x(10),
                y: y(105),
                dx: width*0.25,
                dy: -height*0.25,
                color: "#000000"
            }];
        } else if (eras[index] == "Mid") {
            annotationData = [{
                note: {
                    title: "Growth Years (2000-2012)",
                    label: "The shot volume of the 3-pointer slowly increased. Due to increase in defensive tactics, points per game were somewhat lower than the previous early era.",
                    wrap: "300"
                },
                x: x(17),
                y: y(97),
                dx: width*0.15,
                dy: -height*0.45,
                color: "#000000"
            }];
        } else if (eras[index] == "Curry") {
            annotationData = [{
                note: {
                    title: "Curry Era (2013-Present)",
                    label: "Stephen Curry completely changed the game. He changed the game by proving how efficient shooting 3-pointers are if you can make them. The total points per game went up due to more teams making 3-pointers.",
                    wrap: "300"
                },
                x: x(34),
                y: y(113),
                dx: width*-0.2,
                dy: -height*0.1,
                color: "#000000"
            }];
        } else {
            annotationData = [{
                note: {
                    title: "Explore the data",
                    label: "You have finished the slideshow! Feel free to hover over each datapoint to view team specific data per season!",
                    wrap: "300"
                },
                x: width / 2.25,
                y: height / 9,
                dx: 0,
                dy: 0,
                color: "#000000"
            }];
        }

        if (annotationData.length > 0) {
            const makeAnnotations = d3.annotation()
                .notePadding(15)
                .type(d3.annotationLabel)
                .annotations(annotationData);

            svg.append("g")
                .attr("class", "annotation-group")
                .style("pointer-events", "none")
                .call(makeAnnotations)
        }
        
}


initData()