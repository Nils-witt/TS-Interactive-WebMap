/*
 * GroupDisplay.tsx
 * ----------------
 * Renders all MapItems belonging to a specific group as markers on the map.
 * When the user clicks a marker a popup with the item's name is shown.
 * Subscribes to DataProvider events so it stays in sync with data changes.
 */

import React, { useEffect, useState } from 'react';
import { Marker, Popup } from '@vis.gl/react-maplibre';
import { DataProvider, DataProviderEventType } from '../dataProviders/DataProvider.ts';
import type { MapItem } from '../enitities/MapItem.ts';

interface GroupDisplayProps {
    /** The ID of the group whose items should be shown, or null to show nothing. */
    groupId: string | null;
}

export function GroupDisplay({ groupId }: GroupDisplayProps): React.JSX.Element {
    const [items, setItems] = useState<MapItem[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    /** (Re)compute the filtered item list whenever the groupId or data changes. */
    const refreshItems = () => {
        if (!groupId) {
            setItems([]);
            return;
        }
        const all = DataProvider.getInstance().getAllMapItems();
        setItems(Array.from(all.values()).filter(i => i.getGroupId() === groupId));
    };

    useEffect(() => {
        refreshItems();

        const onChange = () => refreshItems();

        const dp = DataProvider.getInstance();
        dp.on(DataProviderEventType.MAP_ITEM_CREATED, onChange);
        dp.on(DataProviderEventType.MAP_ITEM_UPDATED, onChange);
        dp.on(DataProviderEventType.MAP_ITEM_DELETED, onChange);

        return () => {
            dp.off(DataProviderEventType.MAP_ITEM_CREATED, onChange);
            dp.off(DataProviderEventType.MAP_ITEM_UPDATED, onChange);
            dp.off(DataProviderEventType.MAP_ITEM_DELETED, onChange);
        };
    }, [groupId]);

    return (
        <>
            {items.map(item => (
                <React.Fragment key={item.getId()}>
                    <Marker
                        longitude={item.getLongitude()}
                        latitude={item.getLatitude()}
                        onClick={() => setSelectedId(item.getId())}
                    />
                    <Popup
                        longitude={item.getLongitude()}
                        latitude={item.getLatitude()}
                        anchor="bottom"
                        offset={[0, -35] as [number, number]}
                        closeOnClick={false}
                        closeButton={false}
                    >
                        {item.getName()}
                    </Popup>

                </React.Fragment>
            ))}
        </>
    );
}
