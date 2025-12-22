import React, {useEffect} from "react";
import {ApiProvider} from "../dataProviders/ApiProvider.ts";
import type {NamedGeoReferencedObject} from "../enitities/NamedGeoReferencedObject.ts";
import type {MapGroup} from "../enitities/MapGroup.ts";
import {DataProvider, DataProviderEventType} from "../dataProviders/DataProvider.ts";


interface CreateMarkerFormProps {
    entity?: NamedGeoReferencedObject
    data?: {
        latitude?: number;
        longitude?: number;
        zoom?: number;
    }
    isOpen: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
}

export function CreateMarkerForm(props: CreateMarkerFormProps): React.JSX.Element {

    const [name, setName] = React.useState<string>('');
    const [latitude, setLatitude] = React.useState<number | undefined>(0);
    const [longitude, setLongitude] = React.useState<number | undefined>(0);
    const [zoom, setZoom] = React.useState<number | undefined>(15);
    const [groupId, setGroupId] = React.useState<string | undefined>(undefined);
    const [availableGroups, setAvailableGroups] = React.useState<MapGroup[]>([]);

    useEffect(() => {
        if (props.entity) {
            setName(props.entity.getName());
            setLatitude(props.entity.getLatitude());
            setLongitude(props.entity.getLongitude());
            setZoom(props.entity.getZoomLevel());
            setGroupId(props.entity.getGroupId());
        }
        if (props.data) {
            setLatitude(props.data.latitude);
            setLongitude(props.data.longitude);
            setZoom(props.data.zoom);
        }
    }, [props.data, props.entity]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission logic here

        void ApiProvider.getInstance().createMapItem({
            name: name,
            latitude: latitude || 0,
            longitude: longitude || 0,
            zoomLevel: zoom || 15,
        }).then((response) => {
            console.log(response);
            props.isOpen[1](false);

        });
    }

    useEffect(() => {
        DataProvider.getInstance().on(DataProviderEventType.MAP_GROUPS_UPDATED, () => {
            console.log("Map groups updated, refreshing available groups in CreateMarkerForm");
            setAvailableGroups(Array.from(DataProvider.getInstance().getMapGroups().values()))
        });

        setAvailableGroups(Array.from(DataProvider.getInstance().getMapGroups().values()))
        console.log("Available groups set in CreateMarkerForm", DataProvider.getInstance().getMapGroups().values());
    }, []);

    return (
        <div>
            <h2>Edit Marker Form</h2>
            <div>
                <label>Name:</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}/>
            </div>
            <div>
                <label>latitude:</label>
                <input type="text" value={latitude} onChange={(e) => setLatitude(parseInt(e.target.value))}/>
            </div>
            <div>
                <label>longitude:</label>
                <input type="text" value={longitude} onChange={(e) => setLongitude(parseInt(e.target.value))}/>
            </div>
            <div>
                <label>zoom:</label>
                <input type="number" value={zoom} onChange={(e) => setZoom(parseInt(e.target.value))}/>
            </div>
            <div>
                <label>Group</label>
                <select>
                    <option value="">None</option>
                    {availableGroups.map((group) => {
                        if (groupId === group.getID()) {
                            return <option key={group.getID()} value={group.getID()} selected>{group.getName()}</option>
                        } else {
                            return <option key={group.getID()} value={group.getID()}>{group.getName()}</option>
                        }
                    })}
                </select>
            </div>
            <button type={"submit"} onClick={onSubmit}>Save</button>
        </div>
    );
}