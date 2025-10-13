import type {Route} from "./+types/home";
import {MapComponent} from "../components/MapComponent";
import {useNavigate} from "react-router";
import {useEffect} from "react";
import {GlobalEventHandler} from "../dataProviders/GlobalEventHandler";
import {ApiProviderEventTypes} from "../dataProviders/ApiProvider";

export function meta({}: Route.MetaArgs) {
    return [
        {title: "New React Router App"},
        {name: "description", content: "Welcome to React Router!"},
    ];
}

export default function Home() {
    let navigate = useNavigate();

    useEffect(() => {
        GlobalEventHandler.getInstance().on(ApiProviderEventTypes.UNAUTHORIZED, () => {
            navigate("/login");
        })
    },[]);

    return <MapComponent/>;
}
