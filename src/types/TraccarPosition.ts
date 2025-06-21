export type TraccarPosition = {

    "id": number,
    "attributes": {
        "motion": boolean,
        "odometer": number,
        "activity": string,
        "batteryLevel": number,
        "distance": number,
        "totalDistance": number
    },
    "deviceId": number,
    "protocol": string,
    "serverTime": string,
    "deviceTime": string,
    "fixTime": string,
    "outdated": boolean,
    "valid": boolean,
    "latitude": number,
    "longitude": number,
    "altitude": number,
    "speed": number,
    "course": number,
    "address": null,
    "accuracy": number,
    "network": null,
    "geofenceIds": null
}