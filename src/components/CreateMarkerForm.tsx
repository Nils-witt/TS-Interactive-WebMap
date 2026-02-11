import React, {useEffect} from "react";
import {ApiProvider} from "../dataProviders/ApiProvider.ts";
import type {MapItem} from "../enitities/MapItem.ts";
import type {MapGroup} from "../enitities/MapGroup.ts";
import {DataProvider, DataProviderEventType} from "../dataProviders/DataProvider.ts";
import {DatabaseProvider} from "../dataProviders/DatabaseProvider.ts";

import './css/markerform.scss'

interface CreateMarkerFormProps {
    entity?: MapItem
    data?: {
        latitude: number;
        longitude: number;
        zoom: number;
    }
}

export function CreateMarkerForm(props: CreateMarkerFormProps): React.JSX.Element {

    const [name, setName] = React.useState<string>('');
    const [latitude, setLatitude] = React.useState<number>(0);
    const [longitude, setLongitude] = React.useState<number>(0);
    const [zoom, setZoom] = React.useState<number>(14);
    const [groupId, setGroupId] = React.useState<string | null>(null);
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
        const api = ApiProvider.getInstance();
        e.preventDefault();

        if (props.entity) {
            const entity = props.entity;
            entity.setName(name);
            entity.setLatitude(latitude || 0);
            entity.setLongitude(longitude || 0);
            entity.setZoomLevel(zoom || 15);
            entity.setGroupId(groupId);
            void api.saveMapItem(entity).then((result) => {
                if (result) {
                    DataProvider.getInstance().addMapItem(result);
                    void DatabaseProvider.getInstance().then(instance => {
                        void instance.saveNamedGeoReferencedObject(result);
                    });
                }
            });
        } else {
            void ApiProvider.getInstance().createMapItem({
                name: name,
                latitude: latitude || 0,
                longitude: longitude || 0,
                zoomLevel: zoom || 15,
            }).then((response) => {
                if (response) {
                    DataProvider.getInstance().addMapItem(response)
                    void DatabaseProvider.getInstance().then(instance => {
                        void instance.saveNamedGeoReferencedObject(response);
                    });
                }
            });
        }
    }

    useEffect(() => {
        DataProvider.getInstance().on(DataProviderEventType.MAP_GROUPS_UPDATED, () => {
            setAvailableGroups(Array.from(DataProvider.getInstance().getMapGroups().values()))
        });
        setAvailableGroups(Array.from(DataProvider.getInstance().getMapGroups().values()))
    }, []);

    return (
        <div className={'marker-form-root'}>
            <div>
                <h2>Edit Marker Form</h2>

                <table>
                    <tbody>
                    <tr>
                        <td>
                            <label>Name:</label>
                        </td>
                        <td>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)}/>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label>latitude:</label>
                        </td>
                        <td>
                            <input type="text" value={latitude}
                                   onChange={(e) => setLatitude(parseFloat(e.target.value))}/>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label>longitude:</label>
                        </td>
                        <td>
                            <input type="text" value={longitude}
                                   onChange={(e) => setLongitude(parseFloat(e.target.value))}/>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label>zoom:</label>
                        </td>
                        <td>
                            <input type="number" value={zoom} onChange={(e) => setZoom(parseInt(e.target.value))}/>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label>Group</label>
                        </td>
                        <td>
                            <select onChange={(e) => setGroupId(e.target.value)}>
                                <option value="">None</option>
                                {availableGroups.map((group) => {
                                    if (groupId === group.getID()) {
                                        return <option key={group.getID()} value={group.getID()}
                                                       selected>{group.getName()}</option>
                                    } else {
                                        return <option key={group.getID()}
                                                       value={group.getID()}>{group.getName()}</option>
                                    }
                                })}
                            </select>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
            <button type={"submit"} onClick={onSubmit}>Save</button>
        </div>
    );
}