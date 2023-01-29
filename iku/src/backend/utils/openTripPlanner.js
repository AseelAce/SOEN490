import axios from "axios";

const url = "http://localhost:8080/otp/routers/default/plan";

let otpParameterKeys = [
    'maxPreTransitTime', 
    'maxTransfers', 
    'maxWalkDistance', 
    'minTransferTime', 
    'nonpreferredTransferPenalty', 
    'numItineraries', 
    'optimize', 
    'otherThanPreferredRoutesPenalty', 
    'preferredAgencies',
    'preferredRoutes',
    'reverseOptimizeOnTheFly',
    'showIntermediateStops',
    'startTransitStopId',
    'startTransitTripId',
    'transferPenalty',
    'triangleSafetyFactor',
    'triangleSlopeFactor',
    'triangleTimeFactor',
    'unpreferredAgencies',
    'unpreferredRoutes',
    'waitAtBeginningFactor',
    'waitReluctance',
    'walkBoardCost',
    'walkSpeed'
];

export function validateOptionalParams(optionalParams){
    for(let key in optionalParams){

        // Remove invalid OTP params
        if(!otpParameterKeys.includes(key)){
            delete optionalParams[key];
        }
    }
}

async function handleGetAllRoutesOTP(originCoordinates, destinationCoordinates, date, time, isArriveBy, isWheelchair, mode, optionalParams){

    // Mandatory parameters for API call
    let mandatoryParams = {
        fromPlace: originCoordinates,
        toPlace: destinationCoordinates,
        date: date,
        time: time,
        arriveBy: isArriveBy,
        wheelchair: isWheelchair,
        mode: mode, //"TRANSIT,WALK" to generate transit routes
        debugItineraryFilter: "false",
        showIntermediateStops: "true",
        baseLayer: "OSM Standard Tiles",
        locale: "en"
    };

    let queryString = null;

    validateOptionalParams(optionalParams);

    // Combine mandatory and optional params
    if(optionalParams !== null){
        queryString = Object.assign(mandatoryParams, optionalParams);
    }
    else{
        queryString = mandatoryParams;
    }


    //Make API call to OTP
    await axios.get(url, {params: queryString})
    .then((response) => {
        console.log(JSON.stringify(response.data.plan.itineraries));
        return response.data.plan.itineraries;
    })
    .catch(error => {
        console.log(error);
        return {};
    })
    
}

//METHOD CALLED IN FRONTEND FOR TESTING PURPOSES
export const getAllRoutesOTP = (req, res) => {
    console.log("INSIDE GETALLROUTESOTP BACKEND");
    let optionalParams = {
        waitReluctance: 5,
        walkReluctance: 5, 
        transferPenalty: 5,
        hello: 12345
    }
    handleGetAllRoutesOTP("45.50083137628949,-73.63675475120546", "45.49718414083273,-73.57888340950014", "11-25-2022", "8:00pm", false, false, "TRANSIT,WALK", optionalParams);
    res.json({"hello":"world"});
} 


export const getWalkWaitComponents = (route) => {
    let duration = route.duration;
    let walkTime = route.walkTime; // Get walktime
    let walkComponents = [];
    let waitTime = 0;
    let waitComponents = [];

    const legs = route.legs;

    for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        if(leg.mode == 'WALK') { // Get walk components 
            walkComponents.push(leg);
        } else if ( i != 0 && (leg.from.departure - leg.from.arrival) > 0) {
            // Get wait component and compute wait time
            waitComponents.push(leg);
            waitTime += (leg.from.departure - leg.from.arrival) / 1000;
        }
    }

    return {
        duration: duration,
        walk: {
            time: walkTime,
            components: walkComponents
        },
        wait: {
            time: waitTime,
            components: waitComponents
        }
    }

}

export const getDurationMetrics = (routes) => {
    let durationTimes = [];
    for(let i = 0; i < routes.length; i++){
        durationTimes.push(routes[i].duration);
    }

    let minDurationTime = Math.min(...durationTimes);
    let maxDurationTime = Math.max(...durationTimes);
    let averageDurationTime = durationTimes.reduce((a, b) => a + b) / durationTimes.length;
    let standardDeviationDurationTime = Math.sqrt(durationTimes.map(x => Math.pow(x - averageDurationTime, 2)).reduce((a,b) => a+b)/durationTimes.length);

    return {
        minDurationTime: minDurationTime,
        maxDurationTime: maxDurationTime,
        averageDurationTime: averageDurationTime,
        standardDeviationDurationTime: standardDeviationDurationTime
    }
}

/**
 * Function that computes the minimum, maximum, average and standard deviation of the routes walk times
 * @param {*} routes 
 */
export const getWalkTimeMetrics = (routes) => {
    let walkTimes = [];
    for(let i = 0; i < routes.length; i++){
        walkTimes.push(routes[i].walkTime);
    }

    let minWalkTime = Math.min(...walkTimes);
    let maxWalkTime = Math.max(...walkTimes);
    let averageWalkTime = walkTimes.reduce((a, b) => a + b) / walkTimes.length;
    let standardDeviationWalkTime = Math.sqrt(walkTimes.map(x => Math.pow(x - averageWalkTime, 2)).reduce((a,b) => a+b)/walkTimes.length);

    return {
        minWalkTime: minWalkTime,
        maxWalkTime: maxWalkTime,
        averageWalkTime: averageWalkTime,
        standardDeviationWalkTime: standardDeviationWalkTime
    }
}

/**
 * Function that computes the minimum, maximum, average and standard deviation of the routes waiting times
 * @param {*} routes 
 */
export const getWaitTimeMetrics = (routes) => {
    let waitTimes = [];
    for(let i = 0; i < routes.length; i++){
        waitTimes.push(routes[i].waitingTime);
    }

    let minWaitTime = Math.min(...waitTimes);
    let maxWaitTime = Math.max(...waitTimes);
    let averageWaitTime = waitTimes.reduce((a, b) => a + b) / waitTimes.length;
    let standardDeviationWaitTime = Math.sqrt(waitTimes.map(x => Math.pow(x - averageWaitTime, 2)).reduce((a,b) => a+b)/waitTimes.length);

    return {
        minWaitTime: minWaitTime,
        maxWaitTime: maxWaitTime,
        averageWaitTime: averageWaitTime,
        standardDeviationWaitTime: standardDeviationWaitTime
    }
}

export const getFrequencyMetrics = (routes) => {
    let frequencyList = [];
    let gap = 0;

    for(let i = 0; i < routes.length-1; i++){
        gap = routes[i+1].startTime - routes[i].startTime;

        if (gap != 0 && !(frequencyList.includes[gap])){
            frequencyList.push(gap);
        }
    }

    let minGap = 99999; 
    let maxGap = 99999; 
    let averageGap = 99999;
    let standardDeviationGap = 99999;
    
    minGap = Math.min(...frequencyList);
    maxGap = Math.max(...waitTimes);
    averageGap = frequencyList.reduce((a, b) => a + b) / waitTimes.length;
    standardDeviationGap = Math.sqrt(frequencyList.map(x => Math.pow(x - averageGap, 2)).reduce((a,b) => a+b)/frequencyList.length);

    return {
        minGap: minGap,
        maxGap: maxGap,
        averageGap: averageGap,
        standardDeviationGap: standardDeviationGap
    }
}

export const sliceRoutesList = (routes, startTime, endTime, mode) =>{
    let list = [];
    switch (mode){
        case "END_MODE":
            for(let i=0; i<routes.length;i++){
                if(isInRange(routes[i].endTime,startTime,endTime)){ //verification if end time is in specific range
                    list.push(routes[i]);
                }
            }
            return list;
        case "START_MODE":
            for(let i=0; i<routes.length;i++){
                if(isInRange(routes[i].startTime,startTime,endTime)){ //verificatiopn if start time is in specific range
                    list.push(routes[i]);
                }
            }
            return list;
        case "WHOLE_ROUTE_MODE":
            for(let i=0; i<routes.length;i++){
                if(isInRange(routes[i].endTime,startTime,endTime) &&
                    isInRange(routes[i].startTime,startTime,endTime)){ //verification if both start and end time are in specific range
                    list.push(routes[i]);
                }
            }
            return list;
        default:
            throw new Error("INVALIDE MODE. Mode must be 'START_MODE', 'END_MODE', or 'WHOLE_ROUTE_MODE'");
    }

};

/**
 * Function to clean up routes by removing unwanted, undesirable, or redundant routes.
 * @param routes
 * @returns {*}
 */
export const removeBadRoutes = (routes) => {
    let currentLength = routes.length
    let removed = routes.length+1
    for (let i=0; i<currentLength; i++) {
        for (let j=0; j<currentLength; j++) {
            // Remove route j if j starts or ends at the same time as route i, and is a longer route.
            if (routes[i].startTime >= routes[j].startTime && routes[i].endTime < routes[j].endTime
                || routes[i].startTime > routes[j].startTime && routes[i].endTime <= routes[j].endTime) {
                routes.splice(j, 1);
                removed = j;
            }
            // If both routes start at the same time, remove the "worse" route.
            else if (routes[i].startTime === routes[j].startTime && routes[i].endTime === routes[j].endTime) {
                // Remove the route with the most transfers
                if (routes[i].transfers < routes[j].transfers) {
                    routes.splice(j, 1);
                    removed = j;
                }
                else if (routes[i].transfers > routes[j].transfers) {
                    routes.splice(i, 1);
                    removed = i;
                }
                else {
                    // If both routes have the same num of transfers, remove the one with the most walking.
                    if (routes[i].walkTime < routes[j].walkTime) {
                        routes.splice(j, 1);
                        removed = j;
                    }
                    else if (routes[i].walkTime > routes[j].walkTime) {
                        routes.splice(i, 1);
                        removed = i;
                    }
                    // If num of transfers and walk time is the same, remove an arbitrary route (as they're redundant).
                    else {
                        routes.splice(j, 1);
                        removed = j;
                    }
                }
            }
            // If we removed an element earlier than the current index then we need to decrement our index to prevent
            // accidentally skipping an element
            if (removed < i) {
                i--;
            }
            // reset currentLength and removed
            currentLength = routes.length;
            removed = routes.length+1
        }
    }
    return routes;
}

/**
 * Function that verifies if input time is in the specific start and end time range
 * @param {} time 
 * @param {*} startTime 
 * @param {*} endTime 
 * @returns 
 */
const isInRange = (time, startTime, endTime) =>{
    if(time >= startTime && time <= endTime){
        return true;
    }
    return false;
};