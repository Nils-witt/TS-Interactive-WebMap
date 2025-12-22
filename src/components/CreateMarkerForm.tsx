import React from "react";
import {ApiProvider} from "../dataProviders/ApiProvider.ts";


interface CreateMarkerFormProps {
    latitude?: number;
    longitude?: number;
    isOpen: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
}

export function CreateMarkerForm(props: CreateMarkerFormProps): React.JSX.Element {

    const [name, setName] = React.useState<string>('');
    const [latitude, setLatitude] = React.useState<number | undefined>(props.latitude);
    const [longitude, setLongitude] = React.useState<number | undefined>(props.longitude);


    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission logic here

        void ApiProvider.getInstance().createMapItem({
            name: name,
            latitude: latitude || 0,
            longitude: longitude || 0,
        }).then((response) => {
            console.log(response);
            props.isOpen[1](false);

        });
    }

    return (
        <div>
            <h2>Create Marker Form</h2>
            <div>
                <label>Name:</label>
                <input type="text" defaultValue={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
                <label>latitude:</label>
                <input type="text" defaultValue={latitude} onChange={(e) => setLatitude(parseInt(e.target.value))} />
            </div>
            <div>
                <label>longitude:</label>
                <input type="text" defaultValue={longitude} onChange={(e) => setLongitude(parseInt(e.target.value))} />
            </div>

            <button type={"submit"} onClick={onSubmit}>Save</button>
        </div>
    );
}