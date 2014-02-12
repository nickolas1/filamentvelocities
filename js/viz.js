
/* ========================== */
/* get the size of the skelJS containers and set some other sizes*/
var impanelsize = parseInt(d3.select("#snapshot").style("width"));
var immargin = {top: 0, right: 0, bottom: 0, left: 0}; // image margin
var sppanelw = parseInt(d3.select(".container").style("width")) - impanelsize;
var sppanelh = 0.67 * sppanelw;
var spmargin = {top: 15, right: 5, bottom: 20, left: 0};
if (parseInt(d3.select(".container").style("width")) < 875) { //mobile
    var linewidth = ".5px";
    var ccfs = "9px"; //coordinate clue font size
    sppanelw = impanelsize;
    var sppanelh = 0.3 * sppanelw;
    var spmargin = {top: 15, right: 5, bottom: 20, left: 0};
}
else if (impanelsize > 700){ //normal
    var linewidth = ".75px";
    var ccfs = "11px"; //coordinate clue font size
}
else { //narrow
    var linewidth = ".75px";
    var ccfs = "12px"; //coordinate clue font size  
}
var imsize = impanelsize - immargin.left - immargin.right; //image height and width
var spw = sppanelw - spmargin.left - spmargin.right;
var sph = sppanelh - spmargin.top - spmargin.bottom;
var sinksize = 2;  

var linearRes = 256; // the resolution of the column and spectral data we provide


/* ========================== */
/* set up svg panel to show column density images and sink particles */

var columndensitypanel = d3.select("#snapshot").append("svg")
        .attr("width", impanelsize)
        .attr("height", impanelsize);
                       
/* set up padded image display areas */        
var proj = columndensitypanel.append("g")
        .attr("width", imsize)
        .attr("height", imsize)
        .attr("transform", "translate(" + immargin.left + "," + immargin.top + ")");
        
var projimage = proj.append("image")
        .attr("width", imsize)
        .attr("height", imsize);
var projimageoverlay = proj.append("image")
        .attr("width", imsize)
        .attr("height", imsize);
var projsinkoverlay = proj.append("g")
        .attr("width", imsize)
        .attr("height", imsize);
        
/* ========================== */
/* set up svg panel to show spectra */
var spectrapanel = d3.select("#spectraplot").append("svg")
        .attr("width", sppanelw)
        .attr("height", sppanelh);       
var spectraplot = spectrapanel.append("g")
        .attr("width", spw)
        .attr("height", sph)
        .attr("transform", "translate(" + spmargin.left + "," + spmargin.top + ")");


var showSurfaceDensityImages = function() {
    /* ========================== */
    /* display the base image */
    if (showColumnTotal) {
        projimage.attr("xlink:href", fImageTotal);
        d3.select("#totalColumn")
            .attr("class", "imageselector selected");
        d3.select("#moderateColumn")
            .attr("class", "imageselector"); 
    }
    else if (showColumnModerate) { 
        projimage.attr("xlink:href", fImageC18O); 
        d3.select("#totalColumn")
            .attr("class", "imageselector");
        d3.select("#moderateColumn")
            .attr("class", "imageselector selected");
    }
}; 

var showHighDensityOverlay = function() {
    /* ========================== */
    /* toggle the high density contours */
    if (showContourHigh) {
        projimageoverlay.attr("visibility", "visible");
        d3.select("#highColumn")
            .attr("class", "imageselector selected");
    }
    else {
        projimageoverlay.attr("visibility", "hidden");
        d3.select("#highColumn")
            .attr("class", "imageselector");
    }
}

var showSinkParticles = function() {
    /* ========================== */
    /* toggle the sink particles */
    if (showSinks) {
        projsinkoverlay.selectAll("circle").attr("visibility", "visible");
        d3.select("#sinkParticles")
            .attr("class", "imageselector selected");
    }
    else {
        projsinkoverlay.selectAll("circle").attr("visibility", "hidden");
        d3.select("#sinkParticles")
            .attr("class", "imageselector");
    }
}

var sinkdata = [{}];
var initializeSinkParticles = function() {
    d3.text(fSinks, function(text) {
        if (text!= null) {
            sinkdata = d3.csv.parseRows(text).map(function(row) {
                return {
                    id: +row[0],
                    m: +row[1],
                    x: +row[2],
                    y: +row[3],
                    z: +row[4]
                };
            });
            scatterSinks();
            showSinkParticles();
        }
        else {
            // if no sinks now, clear all sink markers
            proj.selectAll("circle").attr("visibility", "hidden");
        };
    });
    var scatterSinks = function() { 
        var xScaleSink = d3.scale.linear()
            .domain([0, 1])
            .range([0, imsize]);
        var yScaleSink = d3.scale.linear()
            .domain([0, 1])
            .range([imsize, 0]); 
        var sinkColorLo = "hsl(39, 80%, 60%)";
        var sinkColorHi = "hsl(13, 100%, 50%)";
        var sinkMLo = 0.5;
        var sinkMHi = 10;
        var cScaleSink = d3.scale.log() // color scale for sink particles
            .domain([sinkMLo, sinkMHi])
            .range([sinkColorLo, sinkColorHi]).interpolate(d3.interpolateHsl); 
             
        var circles = projsinkoverlay.selectAll("circle")
            .data(sinkdata);
        circles.attr("cx", function(d) { return xScaleSink(d.x) })
            .attr("visibility", "visible")
            .attr("cy", function(d) { return yScaleSink(d.y) })
            .attr("fill", function(d) {return cScaleSink(d.m) });
        // add new sinks
        circles.enter().append("svg:circle")
            .attr("cx", function(d) { return xScaleSink(d.x) })
            .attr("cy", function(d) { return yScaleSink(d.y) })
            .attr("stroke-width", "none")
            .attr("fill", function(d) {return cScaleSink(d.m) })
            .attr("r", sinksize);       
        // destroy merged sinks    
        circles.exit().remove();
     }; 
};


/* ========================== */
/* plotting the chosen spectra */
var specline = d3.svg.line()
    .interpolate("step-before")
    .x(function(d) { return velScale(d[0]); })
    .y(function(d) { return spScale(d[1]); }); 

var setupSpectraPlot = function() {
    var velAxis = d3.svg.axis()
        .scale(velScale)
        .orient("bottom")
        .ticks(4)
        .tickFormat(function(d) { return d + " km/s"});
    var spAxis = d3.svg.axis()
        .scale(spScale)
        .orient("left");
        //.tickValues([0,256,512]);
    spectra = d3.zip(d3.extent(velocities),[0, 0]);
    spectraplot.append("path")
        .attr("class", "spectraline C18O")
        .attr("d", specline(spectra));
    spectraplot.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + sph + ")")
        .call(velAxis);
    /*spectraplot.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + spw + ",0");
        .call(spAxis);  */  
    spectraplot.append("text")
        .attr("x", 0.5*spmargin.right)
        .attr("y", 1.0*spmargin.top)
        .attr("class", "axislabel C18O")
        .text("C18O spectra (arbitrary units)");  
    spectraplot.append("text")
        .attr("x", 0.5*spmargin.right)
        .attr("y", 2.0*spmargin.top)
        .attr("class", "axislabel N2Hplus")
        .text("N2H+"); 
    spectraplot.selectAll("line.horizontalGrid").
        //data(spScale.ticks(4)).enter().append("line")
        data([512/3,2*512/3,511]).enter().append("line")
        .attr("class", "horizontalGrid")
        .attr("x1", spmargin.right)
        .attr("x2", spw)
        .attr("y1", function(d){ return spScale(d);})
        .attr("y2", function(d){ return spScale(d);}); 
}
             
var showSpectra = function(ini, inj) {
    // first N2HPlus
    c = spIndsN2Hplus[linearRes*inj + ini];
    i = 0;
    j = 0;
    vind = 0; 
    if (c < 0) {
        spectra = zeroSpec;
    } else {
        spN2Hplus = spN2Hplusdata[c].s;
        for (i = 0; i < spN2Hplus.length; i++) {
            if (spN2Hplus[i] < 0) {
                for (j = 0; j < -spN2Hplus[i]; j++) {
                    specToPlot[vind] = 0;
                    vind += 1;
                }
            }
            else {
                specToPlot[vind] = spN2Hplus[i];
                vind += 1;
            };
        };
        spectra = d3.zip(velocities,specToPlot);
    }
    d3.select(".spectraline.N2Hplus").remove();
    spectraplot.append("path")
        .attr("class", "spectraline N2Hplus")
        .attr("d", specline(spectra));
    
    // then C18O on top
    var c = spIndsC18O[linearRes*inj + ini];
    // sparse data: a negative number means add that many zeros
    var i = 0;
    var j = 0;
    var vind = 0;
    if (c < 0) {
        spectra = zeroSpec;
    } else {
        spC18O = spC18Odata[c].s;
        for (i = 0; i < spC18O.length; i++) {
            if (spC18O[i] < 0) {
                for (j = 0; j < -spC18O[i]; j++) {
                    specToPlot[vind] = 0;
                    vind += 1;
                }
            }
            else {
                specToPlot[vind] = spC18O[i];
                vind += 1;
            };
        };
        spectra = d3.zip(velocities,specToPlot);
    }
    d3.select(".spectraline.C18O").remove();
    spectraplot.append("path")
        .attr("class", "spectraline C18O")
        .attr("d", specline(spectra));   
};


var selectTotalColumn = function() {
    if (!showColumnTotal) { //only change things if not already selected
        showColumnTotal = true;
        showColumnModerate = false;
        showSurfaceDensityImages();
    };
};

var selectModerateColumn = function() {
    if (!showColumnModerate) { //only change things if not already selected
        showColumnTotal = false;
        showColumnModerate = true;
        showSurfaceDensityImages();
    };
};

var toggleHighDensity = function() {
    showContourHigh = !showContourHigh;
    showHighDensityOverlay();
};  

var toggleSinkParticles = function() {
    showSinks = !showSinks;
    showSinkParticles();
}; 



/* ========================== */
/* start out with moderate density showing and sinks and contours displayed*/
var snap = 18;
var fImageC18O,
    fImageN2Hplus,
    fImageTotal,
    fSinks,
    fSpectraC18O,
    fSpectraN2Hplus,
    fVelocities,
    fColumns;
var showColumnTotal = false;
var showColumnModerate = true;
var showContourHigh = true;
var showSinks = true;
var getFileNames = function(snap) {
    var zeroPad = d3.format("05d");
    snapPad = zeroPad(snap);
    fImageTotal = "data/images/totalcolumn_2_frame_" + snapPad + ".png";
    fImageC18O = "data/images/C18O_2_frame_" + snapPad + ".png";
    fImageN2Hplus = "data/images/N2Hplus_2_frame_" + snapPad + ".png";
    fSinks = "data/sinks/sink_" + snapPad + ".csv";
    fSpectraC18O = "data/spectra/spectra_C18O_" + snapPad + "_sparse.json";
    fSpectraN2Hplus = "data/spectra/spectra_N2Hplus_" + snapPad + "_sparse.json";
    fVelocities = "data/spectra/velocities.json";
    fColumns = "data/columndensities/columndensities_" + snapPad + ".json";
};
var populatePanels = function(snap) {
    getFileNames(snap);
    projimageoverlay.attr("xlink:href", fImageN2Hplus); 
    showSurfaceDensityImages();
    showHighDensityOverlay(); 
    initializeSinkParticles();
};
populatePanels(snap);  


/* ========================== */
/* read the surface density data */
var sddata;
d3.json(fColumns, function(data) { // set this as a filename rather than static link
    sddata = data;
});


/* ========================== */
/* read the spectra data */
var spC18Odata;
var spN2Hplusdata;
var velocities;
var spIndsC18O = Array.apply(null, new Array(linearRes*linearRes)).map(Number.prototype.valueOf,-1);
var spIndsN2Hplus = Array.apply(null, new Array(linearRes*linearRes)).map(Number.prototype.valueOf,-1);
var spScale = d3.scale.linear()
    .domain([0, 512])
    .range([sph, 0]);
d3.json(fSpectraC18O, function(data) { 
    spC18Odata = data;
    // this data array is as sparse as I could make it. 
    // this is probably terrible, but for now make the stupidist
    // hash table in the world
    for (var ind = 0; ind < spC18Odata.length; ind++) {
        spIndsC18O[spC18Odata[ind].c] = ind;
    };
});
d3.json(fSpectraN2Hplus, function(data) { 
    spN2Hplusdata = data;
    for (var ind = 0; ind < spN2Hplusdata.length; ind++) {
        spIndsN2Hplus[spN2Hplusdata[ind].c] = ind;
    };
});
var velScale = d3.scale.linear();
var specToPlot;   
var vellen;  
var zeroSpec;
d3.json(fVelocities, function(data) {  // might as well make the zero spectra array here. 
    velocities = data[0].velocity;
    velScale.domain(d3.extent(velocities))
        .range([0, spw]);
    specToPlot = velocities.slice(); 
    vellen = velocities.length;
    // set up a spectra of zeros
    var zeros= velocities.slice();
    for (var i = 0; i < vellen; i++) {
            zeros[i] = 0;
        };
    zeroSpec = d3.zip(velocities, zeros);
    setupSpectraPlot();
});

      
/* ========================== */
/* set up spectra selection brush */
var imsizeFrac = (linearRes - 1) / linearRes;
var selectionSize = imsize / linearRes;

var linearScaleX = d3.scale.linear()
    .domain([0, linearRes - 1])
    .range([0, imsize])
    .clamp(true);
var linearScaleY = d3.scale.linear()
    .domain([0, linearRes - 1])
    .range([imsize, 0])
    .clamp(true); 
    
var brush = d3.svg.brush()
    .x(linearScaleX)
    .y(linearScaleY)
    .on("brush", brushed2);
    
var spectraSelection = proj.append("svg")
    .attr("width", imsize + immargin.left + immargin.right)
    .attr("height", imsize + immargin.top + immargin.bottom)
    .append("g")
    .attr("transform", "translate(" + immargin.left + "," + immargin.top + ")");

spectraSelection.append("g")
    .attr("class", "linear axis")
    //.attr("transform", "translate(0," + imsize / 2 + ")")
    .select("domain")
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "halo")
        
var slider = spectraSelection.append("g")
    .attr("class", "slider")
    .call(brush);
    
var handlepulse = slider.append("circle")
    .attr("class", "handlepulse")
    .attr("r", 1);

var handle = slider.append("rect")
    .attr("class", "handle")
    .attr("width", selectionSize)
    .attr("height", selectionSize);
    

var myrFormat = d3.format(".2f");
var snapStep =  1;
var snap; // the output number the slider selects
var snapPos = function(num) { // round to a snapshot time
    return Math.floor((num / snapStep) + 0.5) * snapStep;
}
var desiredX,
    desiredY,
    snappedX,
    snappedY,
    currentX,
    currentY;
    
/*slider.call(brush.event)
    .transition()
        .duration(250)
        .call(brush.extent([15, 15]))
        .call(brush.event);*/

function brushed2() {// only allow values with a spectra
  desiredX = brush.extent()[0];
  desiredY = brush.extent()[1];
  currentX = snappedX;
  currentY = snappedY;
  if (d3.event.sourceEvent) { // not a programmatic event
    desiredX = linearScaleX.invert(d3.mouse(this)[0]);
    desiredY = linearScaleY.invert(d3.mouse(this)[1]);
    snappedX = snapPos(desiredX);
    snappedY = snapPos(desiredY);
  };
  if (snappedX != currentX || snappedY != currentY){
      handle.attr("x", linearScaleX(snappedX * imsizeFrac));
      handle.attr("y", linearScaleY((snappedY + 1) * imsizeFrac));
      handlepulse.attr("cx", linearScaleX((snappedX + 0.5) * imsizeFrac));
      handlepulse.attr("cy", linearScaleY((snappedY + 0.5) * imsizeFrac));
      //d3.select("#timenumber").text(myrFormat(snappedTime));
     // populatePanels(snap);
      d3.select("#nTotalVal").html(sddata[snappedX].SD[snappedY]);
      d3.select("#nC18OVal").html(sddata[snappedX].C18O[snappedY]);
      d3.select("#nN2HplusVal").html(sddata[snappedX].N2Hplus[snappedY]);
      showSpectra(snappedX, snappedY);
  };
};

setInterval(function() {  //blinky thing to help identify where we are
    handlepulse.attr("r", 1)
        .attr("opacity", 1)
        .transition()
        .duration(650)
        .attr("r", selectionSize * 6)
        .each("end", function() {
            d3.select(this)
                .transition()
                .duration(300)
                .attr("opacity", 0);
        });
},1200);
