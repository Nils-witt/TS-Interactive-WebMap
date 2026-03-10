import { DisplayMapComponent } from "../components/DisplayMapComponent";
import { EventList, type ActionEvent } from "../components/EventList";
import { Unit } from "../enitities/Unit";

import "./css/displayPage.scss";

const unit = new Unit({
    id: 'unit1',
    name: 'Unit 1',
    position: { latitude: 0, longitude: 0, timestamp: new Date().toISOString(), accuracy: 0 },
    unit_status: 6
});

const demoEvents: ActionEvent[] = [
    {
        unit: unit,
        timestamp: new Date(),
        text: "New Status: 6"
    },
    {
        unit: unit,
        timestamp: new Date(),
        text: "New Status: 2"
    },
    {
        unit: unit,
        timestamp: new Date(),
        text: "New Status: 1"
    }
];
export function DisplayPage() {

    return (
        <div className="display-page" >
            <DisplayMapComponent />

            <EventList events={demoEvents} />
        </div>
    );
}