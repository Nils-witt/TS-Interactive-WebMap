import { DisplayMapComponent } from "../components/DisplayMapComponent";
import { EventList } from "../components/EventList";

import "./css/displayPage.scss";

export function DisplayPage() {

    return (
        <div className="display-page" >
            <DisplayMapComponent />

            <EventList />
        </div>
    );
}