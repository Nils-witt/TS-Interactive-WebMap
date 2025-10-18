import React, {type ReactElement} from "react";
import '../css/settingsControl.scss'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faX} from '@fortawesome/free-solid-svg-icons'
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import {Utilities} from "../Utilities";


type MapSettingsProps = {
    isOpen: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
}

export function MapSettings(props: MapSettingsProps): ReactElement {

    const closeMenu = () => {
        props.isOpen[1](false);
    }

    return (<div className={'settings-container-background'}>
        <div className={'settings-container'}>
            <div>
                <div onClick={closeMenu}>
                    <FontAwesomeIcon icon={faX}/>
                </div>
            </div>

            <div>
                <Button variant={'outlined'} size={'small'} onClick={Utilities.logout}>Logout</Button>
            </div>
            <div>
                <ButtonGroup variant={'outlined'} color={'warning'}>
                    <Button size={'small'} onClick={Utilities.clearMapCache}>Clear Map Cache</Button>
                    <Button size={'small'} onClick={Utilities.clearCache}>Clear full Cache</Button>
                </ButtonGroup>
            </div>
        </div>
    </div>)

}