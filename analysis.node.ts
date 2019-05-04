const express = require('express');
const app = express();
var cors = require('cors');
const fs = require('fs');
const metaDataById = require('./src/assets/metadata.json');
//const filePath = 'src/assets/interactionlogs.json';
const filePath = 'data/2017-09-17T02-40-04Z_superzoom-mturk-a455a_data.json';
app.use(cors());

process.stdout.write("loading data");
var stream = fs.createReadStream(filePath, {flags: 'r', encoding: 'utf-8'});
var buf = '';
var lastXCharacters = '';
var overlap = 100;
var bufLength = 65536 + overlap;
var withinInteractionLogs = false;
//"interactionlogs"

//console.log(metaDataById);
// order: bugreports, eventlogs, interactionlogs, metadata, settings.

stream.on('data', function(d) {
    buf += d.toString(); // when data is read, stash it in a string buffer
    //console.log(d.toString().length);
    pump(); // then process the buffer
});
function onDoneParsing()
{
    parseInteractionLogs(logs);
    
    console.log('ready.');

    app.get('/', function (req, res)
    {
        /*verticalVsHorizontalData = {};
        datesVsNumbersData = {};
        runComparison = {};*/
        //parseInteractionLogs(logs);
        /*res.render('./analysis.twig', {
            verticalVsHorizontalData : verticalVsHorizontalData,
            datesVsNumbersData: datesVsNumbersData,
            dists: [0, 10, 20, 40, 100, 1000, 100000, 5000000]
        });*/
        res.send({
            verticalVsHorizontalData : verticalVsHorizontalData,
            datesVsNumbersData: datesVsNumbersData,
            taskDurations: taskDurations,
            targetIndexes: targetIndexes,
            distributionsByStudy: distributionsByStudy,
            interactionComparisonData: interactionComparisonData
            /*,
            distributionsByStudyRun: distributionsByStudyRun*/
        })
    });
    
    app.get('/timelines', function (req, res)
    {
        /*verticalVsHorizontalData = {};
        datesVsNumbersData = {};
        runComparison = {};*/
        
        /*res.render('./analysis.twig', {
            verticalVsHorizontalData : verticalVsHorizontalData,
            datesVsNumbersData: datesVsNumbersData,
            dists: [0, 10, 20, 40, 100, 1000, 100000, 5000000]
        });*/
        res.send({
            /*verticalVsHorizontalData : verticalVsHorizontalData,
            datesVsNumbersData: datesVsNumbersData,*/
            taskDurations: taskDurations,
            /*targetIndexes: targetIndexes,
            distributionsByStudy: distributionsByStudy,
            interactionComparisonData: interactionComparisonData,*/
            statusTimelines: statusTimelines,
            scaleTimelines: scaleTimelines
            /*,
            distributionsByStudyRun: distributionsByStudyRun*/
        })
    });
    
    app.get('/timelines-study1', function (req, res)
    {
        /*verticalVsHorizontalData = {};
        datesVsNumbersData = {};
        runComparison = {};*/
        
        /*res.render('./analysis.twig', {
            verticalVsHorizontalData : verticalVsHorizontalData,
            datesVsNumbersData: datesVsNumbersData,
            dists: [0, 10, 20, 40, 100, 1000, 100000, 5000000]
        });*/
        res.send({
            /*verticalVsHorizontalData : verticalVsHorizontalData,
            datesVsNumbersData: datesVsNumbersData,*/
            taskDurations: taskDurations,
            /*targetIndexes: targetIndexes,
            distributionsByStudy: distributionsByStudy,
            interactionComparisonData: interactionComparisonData,*/
            statusTimelines: statusTimelinesStudy1,
            scaleTimelines: scaleTimelinesStudy1
            /*,
            distributionsByStudyRun: distributionsByStudyRun*/
        })
    });
}

function pump()
{
    if(buf.length > bufLength)
    {
        buf = buf.substr(buf.length - bufLength);
    }
    
    let interactionLogsPos = buf.indexOf('"interactionlogs":{');
    let metadataLocation = buf.indexOf('"metadata":{');
    
    if(interactionLogsPos !== -1)
    {
        console.log('found interactionlogs. starting parsing.');
        withinInteractionLogs = true;
        buf = buf.substr(interactionLogsPos + '"interactionlogs":{'.length);
        processInteractionlogChunk(buf);
    }
    else if(metadataLocation !== -1)
    {
        console.log('found metadata. stopping parsing and buffer.');
        buf = buf.substr(overlap, metadataLocation - 2 - overlap);
        processInteractionlogChunk(buf);
        stream.destroy();
        
        console.log('stopped parsing the interaction logs.');
        onDoneParsing();
    }
    else if(withinInteractionLogs)
    {
        //console.log('added:' + buf.substr(overlap, 40));
        //console.log('sending another chunk');
        processInteractionlogChunk(buf.substr(overlap));
    }
}

let currentLogString = '';
let currentLogExperimentId = '';

function processInteractionlogChunk(chunk) {
    
    let countLogs = 0;
    let logStart = 0;
    let nothingAdded = true;
    let addedBeginning = '"SZ00M-BYoELC":'.length;
    while(logStart !== -1)
    {
        logStart = chunk.indexOf('"SZ0');
        
        if(logStart !== -1)
        {
            let secondLogIndex = chunk.indexOf('"SZ0', logStart + 10);
            let logLength = secondLogIndex === -1 ? null : secondLogIndex - logStart - 20 - addedBeginning;
            
            if(currentLogString.length)
            {
                // finish previous log
                currentLogString += chunk.substr(0, logStart - 1);
    
                /*if(currentLogExperimentId == 'SZ00M-lqtZxs')
                {
                    console.log('finished the thing with '+currentLogString.length + ' length');
                }
                */
                processInteractionlog(currentLogString);
            }
            
            // start new log
            if(!logLength)
            {
                currentLogString = chunk.substr(logStart + addedBeginning);
            }
            else
            {
                currentLogString = chunk.substr(logStart + addedBeginning, logLength);
            }
            
            currentLogExperimentId = chunk.substr(logStart + 1, addedBeginning - 3);
            nothingAdded = false;
            if(!logLength)
            {
                chunk = chunk.substr(logStart + 100);
            }
            else
            {
                chunk = chunk.substr(secondLogIndex - 20);
                //console.log('beginning of second chunk: ' + chunk.substr(0, 30));
            }
    
            /*if(currentLogExperimentId == 'SZ00M-lqtZxs')
            {
                console.log('started the thing with '+currentLogString.length + ' length');
            }*/
        }
        else if(nothingAdded)
        {
            //console.log('added ' + chunk.substr(0, 60));
            currentLogString += chunk;
            nothingAdded = false;
            chunk = '';
            /*if(currentLogExperimentId == 'SZ00M-lqtZxs')
            {
                console.log('added whole chunk')
            }*/
        }
        //logStart = nextLogStart;
        //chunk = chunk.substr(nextLogStart);
        //chunk = chunk.substr(logStart + 100);
        
    }
    
    if(countLogs !== 0)
    {
        process.stdout.write(countLogs + ",");
    }
    
    //console.log(countLogs);
}


let countProcessedLogs = 0;
function processInteractionlog(log)
{
    let index = log.indexOf('"SZ0');
    if(index !== -1)
    {
        console.error(index);
    }
    
    try
    {
        //console.log(currentLogExperimentId)
        logs[currentLogExperimentId] = JSON.parse(log);
        //console.log(currentLogExperimentId + ':' + Object.keys(data));
    }
    catch(e)
    {
        console.log(currentLogExperimentId);
        console.log('interaction log length: ' + log.length);
        console.log('start:');
        console.log(log.substr(0, 100));
        console.log('end:');
        console.log(log.substr(log.length - 100));
        
        /*console.log('pos 10300-10380:');
        console.log(log.substr(10300, 80));*/
        console.error(e);
    
        process.exit();
    }
}



var logs = {};

const significantZoomInTime = 1000;
var dataById = {};
var interactionLogs;
var distributionsByStudy;
var distributionsByStudyRun;
var scaleTimelines = {};
var statusTimelines = {};
var scaleTimelinesStudy1 = {};
var statusTimelinesStudy1 = {};
var datesVsNumbersData = {};
var verticalVsHorizontalData = {};
var verticalVsHorizontalDataByRun = {};
var interactionComparisonData = {};
var runComparison = {};
var taskDurations = {};
var targetIndexes = {};

const parseInteractionLogs = (logs) =>
{
    const logKeys = Object.keys(logs);
    //console.log(logKeys);
    logKeys.forEach(key =>
    {
        const log = logs[key];
        log['$key'] = key;
        
        const settings = Object.keys(log);
        const runsBySetting = {};
        settings.forEach(setting => runsBySetting[setting] = Object.keys(log[setting]));
        
        dataById[key] = {
            log: log,
            settings: settings,
            runsBySetting: runsBySetting
        };
    });
    
    const values = logKeys.map(key => logs[key]);
    
    interactionLogs = values.filter(log =>
    {
        return metaDataById[log.$key] && metaDataById[log.$key].mturkId;
    });
    
    prepareDistributions();
    getDatesVsNumbersData();
    getVerticalVsHorizontalData();
    //getRunComparisonData();
    //getInteractionComparision();
};

function prepareDistributions()
{
    distributionsByStudy = {};
    distributionsByStudyRun = {};
    
    for (const interactionLog of interactionLogs)
    {
        const key = interactionLog.$key;
        taskDurations[key] = {};
        targetIndexes[key] = {};
        scaleTimelines[key] = {};
        statusTimelines[key] = {};
        scaleTimelinesStudy1[key] = {};
        statusTimelinesStudy1[key] = {};
        const study = key.substr(0, 5);
    
        let skip = false;
        for (const setting in interactionLog)
        {
            if (interactionLog.hasOwnProperty(setting) && setting.substr(0, 1) !== '$')
            {
                const settingData = interactionLog[setting];
                
                for (const run in settingData)
                {
                    if (settingData.hasOwnProperty(run) && run.substr(0, 4) !== 'test' && run.substr(0, 1) !== '$')
                    {
                        const dists = study.substr(0,4) === 'SZ00' ? [0, 10, 21, 39, 98, 997, 98972, 4987901] : [0, 10, 20, 40, 100, 1000, 100000, 5000000];
                        for (const dist of dists)
                        {
                            if (!settingData[run].hasOwnProperty('dist-' + dist))
                            {
                                skip = true;
                                //console.log('skipping ' + key + '/' + setting + '/' + run + '/dist-' + dist)
                            }
                        }
                    }
                }
            }
        }
    
        if (skip)
        {
            continue;
        }
    
        if (!distributionsByStudy[study])
        {
            distributionsByStudy[study] = {};
            distributionsByStudyRun[study] = {};
        }
        
        for (const setting in interactionLog)
        {
            if (interactionLog.hasOwnProperty(setting) && setting.substr(0, 1) !== '$')
            {
                if (!distributionsByStudy[study][setting])
                {
                    distributionsByStudy[study][setting] = {};
                    distributionsByStudyRun[study][setting] = {};
                }
                taskDurations[key][setting] = {};
                targetIndexes[key][setting] = {};
                scaleTimelines[key][setting] = {};
                statusTimelines[key][setting] = {};
                scaleTimelinesStudy1[key][setting] = {};
                statusTimelinesStudy1[key][setting] = {};
                
                const settingData = interactionLog[setting];
                
                for (const run in settingData)
                {
                    if (settingData.hasOwnProperty(run) && run.substr(0, 1) !== '$')
                    {
                        const isTestRun = run.substr(0, 4) === 'test';
                        const runData = settingData[run];
                        taskDurations[key][setting][run] = {};
                        targetIndexes[key][setting][run] = {};
                        scaleTimelines[key][setting][run] = {};
                        statusTimelines[key][setting][run] = {};
                        scaleTimelinesStudy1[key][setting][run] = {};
                        statusTimelinesStudy1[key][setting][run] = {};
                        
                        for (const dist in runData)
                        {
                            if (runData.hasOwnProperty(dist) && dist.substr(0, 1) !== '$' && runData[dist].statusTimeline)
                            {
                                const approxDist = getApproxDist(dist);
                                const distData = runData[dist];
                                const taskTime = distData.taskTime;
                                //const taskTime = distData.totalZoomOutTime + distData.totalZoomInTime + distData.totalIdleTime + distData.totalPanTime;
                                
                                if(!isTestRun)
                                {
                                    if (!distributionsByStudy[study][setting][approxDist])
                                    {
                                        distributionsByStudy[study][setting][approxDist] = {
                                            idleTimeTotal: 0,
                                            panTimeTotal: 0,
                                            zoomInTimeTotal: 0,
                                            zoomOutTimeTotal: 0,
                                            taskTimeTotal: 0,
                                            idleTimes: [],
                                            panTimes: [],
                                            zoomInTimes: [],
                                            zoomOutTimes: [],
                                            taskTimes: [],
                                            zoomOutDurationsAfterZoomIn: [],
                                            maxRanges: [],
                                            countTasks: 0
                                        }
                                    }
    
                                    distributionsByStudy[study][setting][approxDist].zoomOutTimeTotal += distData.totalZoomOutTime;
                                    distributionsByStudy[study][setting][approxDist].zoomInTimeTotal += distData.totalZoomInTime;
                                    distributionsByStudy[study][setting][approxDist].idleTimeTotal += distData.totalIdleTime;
                                    distributionsByStudy[study][setting][approxDist].panTimeTotal += distData.totalPanTime;
                                    distributionsByStudy[study][setting][approxDist].taskTimeTotal += taskTime;
    
                                    distributionsByStudy[study][setting][approxDist].zoomOutTimes.push(distData.totalZoomOutTime);
                                    distributionsByStudy[study][setting][approxDist].zoomInTimes.push(distData.totalZoomInTime);
                                    distributionsByStudy[study][setting][approxDist].idleTimes.push(distData.totalIdleTime);
                                    distributionsByStudy[study][setting][approxDist].panTimes.push(distData.totalPanTime);
                                    distributionsByStudy[study][setting][approxDist].taskTimes.push(taskTime);
    
                                    distributionsByStudy[study][setting][approxDist].countTasks += 1;
                                    
                                    if(study.substr(0,4) === 'SZ02' || study.substr(0,4) === 'SZ03')
                                    {
                                        scaleTimelines[key][setting][run][dist] = distData.scaleTimeline;
                                        statusTimelines[key][setting][run][dist] = distData.statusTimeline;
                                    }
    
                                    if(study.substr(0,4) === 'SZ01')
                                    {
                                        scaleTimelinesStudy1[key][setting][run][dist] = distData.scaleTimeline;
                                        statusTimelinesStudy1[key][setting][run][dist] = distData.statusTimeline;
                                    }
                                }
    
    
                                if (!distributionsByStudyRun[study][setting][approxDist])
                                {
                                    distributionsByStudyRun[study][setting][approxDist] = {};
                                }
                                if (!distributionsByStudyRun[study][setting][approxDist][run])
                                {
                                    distributionsByStudyRun[study][setting][approxDist][run] = {
                                        idleTimeTotal: 0,
                                        panTimeTotal: 0,
                                        zoomInTimeTotal: 0,
                                        zoomOutTimeTotal: 0,
                                        taskTimeTotal: 0,
                                        idleTimes: [],
                                        panTimes: [],
                                        zoomInTimes: [],
                                        zoomOutTimes: [],
                                        taskTimes: [],
                                        zoomOutDurationsAfterZoomIn: [],
                                        maxRanges: [],
                                        countTasks: 0
                                    }
                                }
                                
                                distributionsByStudyRun[study][setting][approxDist][run].zoomOutTimeTotal += distData.totalZoomOutTime;
                                distributionsByStudyRun[study][setting][approxDist][run].zoomInTimeTotal += distData.totalZoomInTime;
                                distributionsByStudyRun[study][setting][approxDist][run].idleTimeTotal += distData.totalIdleTime;
                                distributionsByStudyRun[study][setting][approxDist][run].panTimeTotal += distData.totalPanTime;
                                distributionsByStudyRun[study][setting][approxDist][run].taskTimeTotal += taskTime;
    
                                distributionsByStudyRun[study][setting][approxDist][run].zoomOutTimes.push(distData.totalZoomOutTime);
                                distributionsByStudyRun[study][setting][approxDist][run].zoomInTimes.push(distData.totalZoomInTime);
                                distributionsByStudyRun[study][setting][approxDist][run].idleTimes.push(distData.totalIdleTime);
                                distributionsByStudyRun[study][setting][approxDist][run].panTimes.push(distData.totalPanTime);
                                distributionsByStudyRun[study][setting][approxDist][run].taskTimes.push(taskTime);
    
                                distributionsByStudyRun[study][setting][approxDist][run].countTasks += 1;
    
                                const settingFirstTargetCount = Object.keys(settingData['testrun-1']['dist-0'].previousTargets).length;
                                const currentTargetCount = Object.keys(distData.previousTargets).length;
                                taskDurations[key][setting][run][dist] = taskTime;
                                targetIndexes[key][setting][run][dist] = currentTargetCount - settingFirstTargetCount;
    
                                let zoomOutDurationAfterZoomIn = 0;
                                
                                const statusTimeline = Object.keys(distData.statusTimeline).map(statusKey => distData.statusTimeline[statusKey]);
                                let zoomInTime = 0;
                                for (const status of statusTimeline)
                                {
                                    if (status.state === 'ZOOM_IN')
                                    {
                                        zoomInTime += status.duration;
                                    }
                                    if (status.state === 'ZOOM_OUT' && zoomInTime >= significantZoomInTime)
                                    {
                                        zoomOutDurationAfterZoomIn += status.duration;
                                    }
                                }
                                
                                if(!isTestRun)
                                {
                                    distributionsByStudy[study][setting][approxDist].zoomOutDurationsAfterZoomIn.push(zoomOutDurationAfterZoomIn);
                                }
                                distributionsByStudyRun[study][setting][approxDist][run].zoomOutDurationsAfterZoomIn.push(zoomOutDurationAfterZoomIn);
                                
                                const scaleTimeline = Object.keys(distData.scaleTimeline).map(key => distData.scaleTimeline[key]);
                                const ranges = scaleTimeline.map(scaleObject => scaleObject.end - scaleObject.start);
                                
                                let maxRange = 0;
                                for (let i = 0; i < ranges.length; i++)
                                {
                                    const range = ranges[i];
                                    if (range > maxRange)
                                    {
                                        maxRange = range;
                                    }
                                }
                                if(!isTestRun)
                                {
                                    distributionsByStudy[study][setting][approxDist].maxRanges.push(maxRange);
                                }
                                distributionsByStudyRun[study][setting][approxDist][run].maxRanges.push(maxRange);
                            }
                        }
                    }
                }
            }
        }
    }
    filterDistributions();
    // console.log(distributionsByStudy);
}

function filterDistributions()
{
    const cutoffDurationFactor = 2.5;
    
    for (const study in distributionsByStudy)
    {
        if (distributionsByStudy.hasOwnProperty(study))
        {
            for (const setting in distributionsByStudy[study])
            {
                if (distributionsByStudy[study].hasOwnProperty(setting))
                {
                    for (const dist in distributionsByStudy[study][setting])
                    {
                        if (distributionsByStudy[study][setting].hasOwnProperty(dist))
                        {
                            filterDistributionRun(study, setting, dist, cutoffDurationFactor);
                        }
                    }
                }
            }
        }
        
    }
}

function filterDistributionRun(study, setting, dist, cutoffDurationFactor)
{
    const taskTimes = distributionsByStudy[study][setting][dist].taskTimes.slice();
    const avg = taskTimes.reduce((a, b) => a + b) / taskTimes.length;
    
    for (let i = 0; i < taskTimes.length; i++)
    {
        const taskTime = taskTimes[i];
        
        if (taskTime / avg >= cutoffDurationFactor)
        {
            // console.log('deleting task time ' + taskTime + ' because it is factor ', taskTime / avg , 'bigger than average task duration');
            
            const index = distributionsByStudy[study][setting][dist].taskTimes.indexOf(taskTime);
            
            distributionsByStudy[study][setting][dist].zoomOutTimes.splice(index, 1);
            distributionsByStudy[study][setting][dist].zoomInTimes.splice(index, 1);
            distributionsByStudy[study][setting][dist].panTimes.splice(index, 1);
            distributionsByStudy[study][setting][dist].idleTimes.splice(index, 1);
            distributionsByStudy[study][setting][dist].taskTimes.splice(index, 1);
            distributionsByStudy[study][setting][dist].zoomOutDurationsAfterZoomIn.splice(index, 1);
        }
    }
}

function loopOverDistributionRunData(studies, each)
{
    for (const study of studies)
    {
        const data = distributionsByStudyRun[study];
        
        for (const setting in data)
        {
            if (data.hasOwnProperty(setting))
            {
                const settingData = data[setting];
                
                for (const dist in settingData)
                {
                    if (settingData.hasOwnProperty(dist))
                    {
                        const distData = settingData[dist];
    
                        for (const run in distData)
                        {
                            if (distData.hasOwnProperty(run))
                            {
                                const runData = distData[run];
            
                                each(runData, study, setting, dist, run);
                            }
                        }
                    }
                }
            }
        }
    }
}

function mergeData(object, keys, distData)
{
    let thisData = object;
    
    for(let key of keys)
    {
        if (!thisData[key])
        {
            thisData[key] = key === keys[keys.length - 1] ? {
                idleTimeTotal: 0,
                panTimeTotal: 0,
                zoomInTimeTotal: 0,
                zoomOutTimeTotal: 0,
                taskTimeTotal: 0,
                idleTimes: [],
                panTimes: [],
                zoomInTimes: [],
                zoomOutTimes: [],
                taskTimes: [],
                zoomOutDurationsAfterZoomIn: [],
                maxRanges: [],
                countTasks: 0
            } : {};
        }
        thisData = thisData[key];
    }
    
    thisData.idleTimeTotal += distData.idleTimeTotal;
    thisData.panTimeTotal += distData.panTimeTotal;
    thisData.zoomInTimeTotal += distData.zoomInTimeTotal;
    thisData.zoomOutTimeTotal += distData.zoomOutTimeTotal;
    thisData.taskTimeTotal += distData.taskTimeTotal;
    thisData.idleTimes = thisData.idleTimes.concat(distData.idleTimes);
    thisData.panTimes = thisData.panTimes.concat(distData.panTimes);
    thisData.zoomInTimes = thisData.zoomInTimes.concat(distData.zoomInTimes);
    thisData.zoomOutTimes = thisData.zoomOutTimes.concat(distData.zoomOutTimes);
    thisData.taskTimes = thisData.taskTimes.concat(distData.taskTimes);
    thisData.zoomOutDurationsAfterZoomIn = thisData.zoomOutDurationsAfterZoomIn.concat(distData.zoomOutDurationsAfterZoomIn);
    thisData.maxRanges = thisData.maxRanges.concat(distData.maxRanges);
    thisData.countTasks += distData.countTasks;
}

function getRunComparisonData()
{
    runComparison = {};
    
    const studies = ['SZ01P', 'SZ01M'];
    
    loopOverDistributionRunData(studies, (distData, study, setting, dist, run) =>
    {
        const platform = study.substr(4);
        
        if (distData.hasOwnProperty(run))
        {
            mergeData(runComparison, [platform, setting, dist, run], distData);
        }
    });
}

function getDatesVsNumbersData()
{
    datesVsNumbersData = {};
    
    const studies = ['SZ00P', 'SZ00M'];
    const dateSettings = ['horizontal-dates-normalpan-pinchzoom', 'horizontal-dates-normalpan-wheelzoom'];
    
    loopOverDistributionRunData(studies, (distData, study, setting, dist, run) =>
    {
        const platform = study.substr(4);
        const datesOrNumbersKey = dateSettings.indexOf(setting) === -1 ? 'numbers' : 'dates';
        
        mergeData(datesVsNumbersData, [platform, dist, datesOrNumbersKey], distData);
    });
}

function getVerticalVsHorizontalData()
{
    verticalVsHorizontalData = {};
    
    const studies = ['SZ01P', 'SZ01M'];
    
    loopOverDistributionRunData(studies, (distData, study, setting, dist, run) =>
    {
        const platform = study.substr(4);
        mergeData(verticalVsHorizontalData, [platform, dist, setting], distData);
    });
    //console.log(verticalVsHorizontalData);
}

function getInteractionComparision()
{
    interactionComparisonData = {};
    
    const studies = ['SZ02P', 'SZ02M'];
    
    loopOverDistributionRunData(studies, (distData, study, setting, dist, run) =>
    {
        const platform = study.substr(4);
        mergeData(interactionComparisonData, [platform, dist, setting], distData);
    });
}

function getApproxDist(dist)
{
    const approxDistances = [10, 20, 40, 100, 1000, 10000, 100000, 5000000];
    const distNumber = parseInt(dist.substr('dist-'.length), 10);
    
    if (distNumber === 0)
    {
        return 'dist-0';
    }
    
    let bestRatio = 1000000;
    let bestDistNumber = 0;
    for (const approxDist of approxDistances)
    {
        const ratio = distNumber / approxDist;
        if (Math.abs(1 - ratio) <= Math.abs(1 - bestRatio))
        {
            bestRatio = ratio;
            bestDistNumber = approxDist;
        }
    }
    
    return 'dist-' + bestDistNumber;
}




app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
});
