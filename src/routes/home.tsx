import type {Route} from "./+types/home";
import {MapComponent} from "../components/MapComponent";
import {useNavigate} from "react-router";
import {useEffect} from "react";
import {GlobalEventHandler} from "../dataProviders/GlobalEventHandler";
import {ApiProvider, ApiProviderEventTypes} from "../dataProviders/ApiProvider";

export function meta({}: Route.MetaArgs) {
    return [
        {title: "Map"},
        {name: "description", content: "Welcome to React Router!"},
    ];
}

export default function Home() {
    let navigate = useNavigate();

    useEffect(() => {
        GlobalEventHandler.getInstance().on(ApiProviderEventTypes.UNAUTHORIZED, () => {
            navigate("/login");
        });

        ApiProvider.getInstance().getMapItems()
    },[]);

    return <MapComponent/>;
}
